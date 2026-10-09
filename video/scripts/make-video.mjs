/** Real browser UI + local Piper narration + synchronized captions/QR/optional VRM. */
import {chromium} from 'playwright';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {SCENES, validateScenes, SITE_URL} from './scenes.mjs';
import {performScene} from './capture-actions.mjs';
import {videoPaths} from './video-paths.mjs';
import {probeDuration} from './render-continuous.mjs';
import {overlayTalkingAvatar} from './avatar-overlay.mjs';
import {FRAME_RATE, VIDEO_SECONDS, FRAME_SIZE} from './timeline.mjs';
const exec = promisify(execFile);
const output = resolve(process.env.OUTPUT_DIR || '/out');
const paths = videoPaths(output);
const appURL = process.env.APP_URL || 'http://video-frontend:5173/client_side_audio_transcription/';
const SITE = process.env.VIDEO_SITE_URL || SITE_URL;

async function command(binary, args, options={}) {
  return exec(binary,args,{maxBuffer:12*1024*1024,...options});
}
function cueTimes() {
  validateScenes(SCENES,VIDEO_SECONDS);
  return SCENES.map((scene,i)=>({...scene, caption:scene.speech, startSeconds:scene.at,
    slotSeconds:(i+1<SCENES.length?SCENES[i+1].at:VIDEO_SECONDS)-scene.at-0.15}));
}
function formatTimestamp(seconds) {
  const ms = Math.round(seconds*1000);
  return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;
}
function writeSrt(cues) {
  const data = cues.map((cue,i)=>`${i+1}\n${formatTimestamp(cue.startSeconds)} --> ${formatTimestamp(cue.startSeconds+cue.slotSeconds)}\n${cue.speech}\n`).join('\n');
  writeFileSync(join(paths.intermediate,'captions.srt'),data);
}
async function synthesize(cues) {
  const clipsDir=join(paths.intermediate,'voice-clips');
  mkdirSync(clipsDir,{recursive:true});
  const manifest=join(paths.intermediate,'cues.json');
  writeFileSync(manifest,JSON.stringify(cues,null,2)+'\n');
  await command('python3',['scripts/synthesize-narration.py','--manifest',manifest,
    '--output-dir',clipsDir,'--model-dir',process.env.VIDEO_VOICE_DIR||'/voices',
    '--voice',process.env.VIDEO_VOICE||'en_US-lessac-medium']);
  // A valid-length WAV can still be completely silent. Decode and validate
  // each Piper clip before mixing, then validate the 40-second result.
  await command('python3',['scripts/mix_narration.py','--manifest',manifest,
    '--clips-dir',clipsDir,'--output',paths.narration,'--seconds',String(VIDEO_SECONDS)]);
  const voiceDuration=await probeDuration(paths.narration);
  if (Math.abs(voiceDuration-VIDEO_SECONDS)>0.10) throw new Error(`Bad narration length ${voiceDuration}s`);
  return readFileSync(join(clipsDir,'narration_00.wav')); // A real recorded sample, never an invented transcript.
}
async function recordUI(cues, demoAudio) {
  // Wait outside the video capture for npm ci and Vite startup.
  let available=false;
  let lastFailure='no response';
  for (let attempt=0;attempt<100;attempt++) {
    try {
      const response=await fetch(appURL,{signal:AbortSignal.timeout(4000)});
      if(response.ok) { available=true; break; }
      const detail=(await response.text()).replace(/\s+/g,' ').slice(0,240);
      lastFailure=`HTTP ${response.status}: ${detail}`;
      // A Vite 403 is usually an unapproved Docker service-name Host header;
      // waiting for another two minutes cannot fix a host-allowlist rejection.
      if(response.status===403) break;
    } catch(error) {
      lastFailure=error instanceof Error ? error.message : String(error);
    }
    await new Promise(resolve=>setTimeout(resolve,1500));
  }
  if(!available) throw new Error(`Vite did not become available at ${appURL}. Last check: ${lastFailure}`+
    (lastFailure.startsWith('HTTP 403')
      ? '. Add __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: video-frontend to the video-frontend service.'
      : ''));
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:FRAME_SIZE,deviceScaleFactor:1,
    recordVideo:{dir:paths.intermediate,size:FRAME_SIZE}});
  const page=await context.newPage();
  const actions=[];
  let start=0;
  const recordingStarted=Date.now();
  let leadSeconds=0;
  try {
    // The dev server installs npm packages on first run, so wait for it.
    let lastError;
    for (let i=0;i<80;i++) {
      try {
        await page.goto(appURL,{waitUntil:'domcontentloaded',timeout:5000});
        await page.getByText('Client-Side Audio Transcription',{exact:true}).first().waitFor({timeout:5000});
        lastError=null;
        break;
      } catch(error) { lastError=error; await page.waitForTimeout(1500); }
    }
    if(lastError) throw new Error(`App did not start at ${appURL}: ${lastError.message}`);
    start=Date.now();
    leadSeconds=(start-recordingStarted)/1000;
    for (const cue of cues) {
      const wait=Math.round(cue.startSeconds*1000)-(Date.now()-start);
      if (wait>0) await page.waitForTimeout(wait);
      const begun=(Date.now()-start)/1000;
      await performScene(page,cue,demoAudio);
      actions.push({id:cue.id,atSeconds:Number(begun.toFixed(3)),
        doneSeconds:Number(((Date.now()-start)/1000).toFixed(3))});
      console.log(`UI step: ${cue.id} (${actions.at(-1).doneSeconds}s)`);
    }
    const remainder=VIDEO_SECONDS*1000-(Date.now()-start);
    if(remainder>0) await page.waitForTimeout(remainder);
    if((Date.now()-start)>VIDEO_SECONDS*1000+1500)
      throw new Error('UI scene timing overran by more than 1.5s. Check browser actions.');
  } catch (err) {
    await page.screenshot({path:join(paths.intermediate,'capture-failure.png')}).catch(()=>{});
    throw err;
  } finally {
    await context.close();
    await browser.close();
  }
  const recording=await page.video()?.path();
  if(!recording || !existsSync(recording)) throw new Error('Playwright produced no real browser recording');
  copyFileSync(recording,paths.browserRecording);
  return {actions, leadSeconds};
}
async function renderScreen(leadSeconds) {
  const panel=join(paths.intermediate,'qr-panel.png');
  await command('python3',['scripts/branding.py'],{env:{...process.env,VIDEO_SITE_URL:SITE,OUTPUT_DIR:output}});
  const srt=join(paths.intermediate,'captions.srt');
  // The subtitle's exact text comes from the same source as Piper synthesis.
  const vf=`[0:v]fps=${FRAME_RATE},scale=1280:720:flags=lanczos,`+
    `tpad=stop_mode=clone:stop_duration=5,trim=duration=${VIDEO_SECONDS},setpts=PTS-STARTPTS,`+
    `subtitles=${srt}:force_style='FontName=DejaVu Sans,FontSize=18,Bold=1,`+
    `PrimaryColour=&H00C4FCE4,OutlineColour=&H00111A29,Outline=2,Shadow=0,MarginV=18'[ui];`+
    `[ui][2:v]overlay=W-w-18:15:format=auto,format=yuv420p[v]`;
  await command('ffmpeg',['-hide_banner','-loglevel','error','-y',
    '-ss',String(leadSeconds),'-i',paths.browserRecording,'-i',paths.narration,'-loop','1','-i',panel,
    '-filter_complex',vf,'-map','[v]','-map','1:a:0',
    '-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p',
    '-r',String(FRAME_RATE),'-c:a','aac','-b:a','160k',
    '-t',String(VIDEO_SECONDS),'-movflags','+faststart',paths.narratedFallback]);
  const duration=await probeDuration(paths.narratedFallback);
  if(Math.abs(duration-VIDEO_SECONDS)>0.12) throw new Error(`Bad rendered video length ${duration}s`);
  await command('python3',['scripts/mix_narration.py','--check',paths.narratedFallback]);
  copyFileSync(paths.narratedFallback,paths.finalVideo);
}
async function preview() {
  await command('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss','36',
    '-i',paths.finalVideo,'-frames:v','1','-update','1',paths.finalPreview]);
}
async function main() {
  mkdirSync(output,{recursive:true});
  mkdirSync(paths.intermediate,{recursive:true});
  const cues=cueTimes();
  writeSrt(cues);
  const demoAudio=await synthesize(cues);
  const {actions,leadSeconds}=await recordUI(cues,demoAudio);
  await renderScreen(leadSeconds);
  const avatarEnabled=process.env.VIDEO_AVATAR_ENABLED==='1';
  if(avatarEnabled) await overlayTalkingAvatar(paths.finalVideo,paths.narration,output,cues);
  await preview();
  writeFileSync(paths.evidence, JSON.stringify({project:'client_side_audio_transcription',
    appURL,siteURL:SITE,outputSeconds:VIDEO_SECONDS,realBrowserUI:true,
    narration:{cues,voice:process.env.VIDEO_VOICE||'en_US-lessac-medium'},
    actions,recordingLeadSeconds:leadSeconds,avatarEnabled,transcriptionMayStillBeLoading:true},null,2)+'\n');
  console.log(`SUCCESS: ${paths.finalVideo}`);
}
await main();
