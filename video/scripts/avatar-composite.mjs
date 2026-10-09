import { FRAME_RATE, VIDEO_SECONDS } from './timeline.mjs';
export function avatarCompositeArgs(video, avatar, narration, output) {
  const graph = [
    `[1:v]fps=${FRAME_RATE},format=rgba,` +
      'colorkey=0x00ff00:0.23:0.10,scale=224:280:flags=lanczos,format=yuva420p,' +
      `tpad=stop_mode=clone:stop_duration=1[character]`,
    `[0:v][character]overlay=8:H-h-40:shortest=0:format=auto:repeatlast=1,` +
      `format=yuv420p[video]`,
  ].join(';');
  return [ '-hide_banner','-loglevel','error','-y',
    '-i',video,'-i',avatar,'-i',narration,'-filter_complex',graph,
    '-map','[video]','-map','2:a:0',
    '-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','160k','-ar','48000','-ac','1',
    '-frames:v',String(FRAME_RATE * VIDEO_SECONDS),
    '-t',String(VIDEO_SECONDS),'-movflags','+faststart',output ];
}

/** Check the completed avatar video using the same timeline as the renderer. */
export function assertAvatarOutputDuration(seconds) {
  if (!Number.isFinite(seconds) || Math.abs(seconds - VIDEO_SECONDS) > 0.06) {
    throw new Error(`Avatar MP4 is ${seconds}s instead of ${VIDEO_SECONDS}s`);
  }
}
