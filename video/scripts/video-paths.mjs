import {join} from 'node:path';
export function videoPaths(output) {
  const intermediate = join(output, 'intermediate');
  return Object.freeze({
    intermediate,
    finalVideo: join(output,'video.mp4'),
    finalPreview: join(output,'preview.png'),
    evidence: join(output,'evidence.json'),
    browserRecording: join(intermediate,'browser-ui.webm'),
    narration: join(intermediate,'narration.wav'),
    narratedFallback: join(intermediate,'narrated-without-avatar.mp4'),
    avatarRecording: join(intermediate,'avatar-green-screen.webm'),
    avatarPreview: join(intermediate,'avatar-green-screen-preview.png'),
  });
}
