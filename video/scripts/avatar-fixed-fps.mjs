/**
 * Offline fixed-timestep VRM capture.
 * Screenshot/encode speed is irrelevant to timeline: time always advances 1/fps.
 * This avoids duplicated/stale frames from a slow headless SwiftShader +
 * canvas.captureStream(30) + MediaRecorder realtime recording.
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';

export function fixedFpsArgs(raw, fps, frames) {
  if (!Number.isInteger(fps) || fps < 1 || !Number.isInteger(frames) || frames < 1) {
    throw new Error('Invalid fixed-FPS capture settings');
  }
  return [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'png', '-i', 'pipe:0',
    '-an', '-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '5',
    '-b:v', '5M', '-pix_fmt', 'yuv420p', '-frames:v', String(frames), raw,
  ];
}

export async function recordFixedFps({ page, raw, levels, cues, seconds = 40, fps = 30 }) {
  const frames = Math.round(seconds * fps);
  if (Math.abs(frames / fps - seconds) > 1e-7) throw new Error('Non-integral number of frames');
  await page.evaluate(({ wave, cues, duration }) =>
    window.__startDeterministicAvatar(wave, cues, duration),
  { wave: levels, cues, duration: seconds });
  const ffmpeg = spawn('ffmpeg', fixedFpsArgs(raw, fps, frames), {
    stdio: ['pipe', 'ignore', 'pipe'],
  });
  let stderr = '';
  let inputFailure = null;
  let finished = false;
  let lastPng = null;
  let duplicatePngFrames = 0;
  ffmpeg.stderr.setEncoding('utf8');
  ffmpeg.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-8000); });
  ffmpeg.stdin.on('error', error => { inputFailure = error; });
  const completion = new Promise((resolve, reject) => {
    ffmpeg.once('error', reject);
    ffmpeg.once('close', code => {
      finished = true;
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg fixed FPS capture failed (${code}): ${stderr}`));
    });
  });
  // Await the child on *all* exit paths to avoid releasing the video before encode.
  try {
    for (let frame = 0; frame < frames; frame++) {
      if (inputFailure || finished) throw inputFailure || new Error(`Encoder quit at frame ${frame}`);
      const base64 = await page.evaluate(seconds => window.__renderAvatarFramePng(seconds), frame / fps);
      const png = Buffer.from(base64, 'base64');
      if (lastPng && lastPng.equals(png)) duplicatePngFrames++;
      lastPng = png;
      if (!ffmpeg.stdin.write(png)) {
        await Promise.race([
          once(ffmpeg.stdin, 'drain'),
          completion.then(() => { throw new Error(`Encoder stopped before frame ${frame + 1}`); }),
        ]);
      }
      if ((frame + 1) % 150 === 0 || frame === frames - 1) {
        console.log(`VRM fixed-FPS capture: ${frame + 1}/${frames} frames`);
      }
    }
    ffmpeg.stdin.end();
    await completion;
    console.log(`VRM fixed-FPS capture complete: ${frames} scheduled frames at ${fps} fps, ${duplicatePngFrames} identical adjacent PNG frames`);
    if (duplicatePngFrames > frames * 0.5) {
      console.warn('VRM capture warning: >50% adjacent frames were identical BEFORE encoding; inspect EMAGE source motion and retargeter.');
    }
  } catch (error) {
    ffmpeg.kill('SIGKILL');
    await completion.catch(() => {});
    throw error;
  } finally {
    await page.evaluate(() => window.__finishDeterministicAvatar()).catch(() => {});
  }
}
