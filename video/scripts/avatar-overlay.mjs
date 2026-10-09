/** Record the actual .vrm on a local Chromium green-screen canvas, then overlay on real UI. */
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { rm, rename } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { videoPaths } from './video-paths.mjs';
import { execFile } from 'node:child_process';
import { recordFixedFps } from './avatar-fixed-fps.mjs';
import { randomUUID, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import { envelopeFromNarration } from './avatar-audio.mjs';
import { inspectVRM } from './verify-vrm.mjs';
import { probeDuration } from './render-continuous.mjs';
import { VIDEO_SECONDS, FRAME_RATE } from './timeline.mjs';
import { avatarCompositeArgs, assertAvatarOutputDuration } from './avatar-composite.mjs';
import { validateEmageMotion } from '../avatar/emage-motion.mjs';

const exec = promisify(execFile);
const AVATAR_PATH = resolve(process.env.VIDEO_AVATAR_PATH || '/video/avatars-data/avatar.vrm');
const ASSET_ROOT = resolve('avatar');
const AVATAR_W = 480, AVATAR_H = 600;

async function startPrivateServer() {
  const mime = {'/':'text/html; charset=utf-8','/bundle.js':'text/javascript; charset=utf-8','/avatar.vrm':'model/gltf-binary'};
  const server = createServer((req, res) => {
    const path = req.url?.split('?')[0];
    const file = path === '/' ? join(ASSET_ROOT, 'index.html') :
      path === '/bundle.js' ? join(ASSET_ROOT, 'bundle.js') :
      path === '/avatar.vrm' ? AVATAR_PATH : null;
    if (!file || !existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
    res.setHeader('Content-Type', mime[path]);
    createReadStream(file).on('error', () => res.destroy()).pipe(res);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}


export async function overlayTalkingAvatar(videoPath, narrationWav, outputDir, cues) {
  if (!existsSync(AVATAR_PATH)) throw new Error(`VRM missing: ${AVATAR_PATH}. Copy your file to video/avatar/avatar.vrm`);
  const meta = inspectVRM(AVATAR_PATH);
  console.log(`Avatar VRM: ${meta.name}; authors=${meta.authors.join(', ')}; redistribution=${meta.redistributionAllowed}`);
  if (!existsSync(join(ASSET_ROOT,'bundle.js'))) throw new Error('Avatar browser bundle missing; rebuild video Docker image');
  if (!existsSync(narrationWav)) throw new Error(`Narration missing: ${narrationWav}`);
  // Do not render 40 seconds of a talking avatar over a silent WAV.
  await exec('python3',['scripts/mix_narration.py','--check',narrationWav]);
  const levels = envelopeFromNarration(narrationWav);
  let emageMotion = null;
  if (process.env.VIDEO_MOTION_MODE === 'emage') {
    const motionPath = resolve(outputDir, 'intermediate/emage-vrm-motion.json');
    if (!existsSync(motionPath)) throw new Error(`EMAGE motion missing: ${motionPath}. Run emage-convert first.`);
    emageMotion = validateEmageMotion(JSON.parse(readFileSync(motionPath, 'utf8')), VIDEO_SECONDS);
    const actualHash = createHash('sha256').update(readFileSync(narrationWav)).digest('hex');
    if (emageMotion.audioSha256 !== actualHash) {
      throw new Error('EMAGE motion was generated for a different narration WAV. Re-run EMAGE inference and conversion.');
    }
    console.log(`External EMAGE motion: ${emageMotion.frames} frames`);
  } else if (process.env.VIDEO_MOTION_MODE && process.env.VIDEO_MOTION_MODE !== 'procedural') {
    throw new Error(`Unknown VIDEO_MOTION_MODE: ${process.env.VIDEO_MOTION_MODE}`);
  }
  const paths = videoPaths(outputDir);
  const raw = paths.avatarRecording;
  const debug = paths.avatarPreview; // raw green-screen diagnostic
  const compositePreview = paths.finalPreview; // actual finished video
  const stage = `${videoPath}.${randomUUID()}.tmp.mp4`;
  await rm(raw,{force:true}); await rm(debug,{force:true}); await rm(compositePreview,{force:true});
  const {server,url} = await startPrivateServer();
  let browser;
  try {
    browser = await chromium.launch({headless:true,args:[
      '--disable-dev-shm-usage','--no-sandbox',
      '--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
    ]});
    const page = await browser.newPage({viewport:{width:AVATAR_W,height:AVATAR_H}});
    page.on('pageerror', error => console.error('Avatar page:', error.message));
    await page.goto(url,{waitUntil:'load'});
    await page.waitForFunction(() => window.__avatarState?.ready || window.__avatarState?.error, null, { timeout: 120000 });
    const state = await page.evaluate(() => window.__avatarState);
    if (!state.ready) throw new Error(`VRM load failed: ${state.error}`);
    await page.screenshot({path:debug});
    if (emageMotion) await page.evaluate(motion => window.__setEmageMotion(motion), emageMotion);
    const captureMode = process.env.VIDEO_AVATAR_CAPTURE_MODE || 'deterministic';
    if (captureMode === 'deterministic') {
      // Every output frame has a known time. SwiftShader CPU speed can no longer
      // produce repeated frames followed by abrupt pose jumps.
      await recordFixedFps({ page, raw, levels, cues, seconds: VIDEO_SECONDS, fps: FRAME_RATE });
    } else if (captureMode === 'realtime') {
      // Retain the previous recorder only for A/B diagnosis.
      const downloadEvent = page.waitForEvent('download',{timeout:100000});
      const recording = page.evaluate(({wave, duration, cues}) => window.__recordAvatar(wave, duration, cues), {wave:levels, duration: VIDEO_SECONDS, cues});
      const download = await downloadEvent;
      await recording;
      await download.saveAs(raw);
    } else {
      throw new Error(`Unknown VIDEO_AVATAR_CAPTURE_MODE: ${captureMode}`);
    }
    const duration = await probeDuration(raw);
    if (duration < VIDEO_SECONDS - 2 || duration > VIDEO_SECONDS + 3) throw new Error(`Unreasonable avatar recording length: ${duration}`);
    console.log(`VRM rendered (${captureMode}): ${basename(raw)} (${duration.toFixed(2)} s)`);
    try {
      await exec('ffmpeg',avatarCompositeArgs(videoPath,raw,narrationWav,stage),{maxBuffer:8*1024*1024});
    } catch (error) {
      throw new Error(`FFmpeg avatar composite failed.\n${error.stderr || error.message}`, {cause:error});
    }
    const outSeconds=await probeDuration(stage);
    assertAvatarOutputDuration(outSeconds);
    await exec('python3',['scripts/mix_narration.py','--check',stage]);
    console.log(`Avatar composite encoded: ${basename(stage)} (${outSeconds.toFixed(3)}s)`);
    // Show the *actual* completed composite, not the intentional green-screen raw preview.
    try {
      await exec('ffmpeg', ['-hide_banner','-loglevel','error','-y','-ss',String(VIDEO_SECONDS - 7),
        '-i',stage,'-frames:v','1','-update','1',compositePreview],
      {maxBuffer:2*1024*1024});
    } catch (error) {
      throw new Error(`Unable to create final avatar preview.\n${error.stderr || error.message}`, {cause:error});
    }
    // Same-mount rename, avoiding EXDEV seen with /tmp -> /out.
    await rename(stage,videoPath);
    console.log(`Avatar composite saved: ${videoPath}`);
    return {enabled:true,source:basename(AVATAR_PATH),render:basename(raw),
      rawPreview:basename(debug),preview:basename(compositePreview),
      creator:meta.authors.join(', '), metadata:meta, synchronization: emageMotion ? 'Piper WAV + experimental EMAGE motion' : 'Piper WAV per-frame RMS + exact seven scene cue times'};
  } finally {
    if (browser) await browser.close().catch(()=>{});
    await new Promise(resolve => server.close(resolve));
    await rm(stage,{force:true});
  }
}
