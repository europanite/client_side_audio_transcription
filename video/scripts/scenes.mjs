/** Only this file and capture-actions.mjs need changing for another application. */
export const SITE_URL = 'https://europanite.github.io/client_side_audio_transcription/';
export const SCENES = Object.freeze([
  {at:1.8, id:'intro', speech:'Transcribe audio and video in your browser.'},
  {at:6.3, id:'model', speech:'Pick a Whisper model for your device.'},
  {at:11.0, id:'language', speech:'Choose a language, or auto-detect it.'},
  {at:16.5, id:'microphone', speech:'Transcribe live audio from your microphone.'},
  {at:22.0, id:'upload', speech:'Or upload a file to start.'},
  {at:28.0, id:'result', speech:'Your transcript appears here. Your data stays on your device.'},
  {at:34.0, id:'outro', speech:'Free to use. Scan the QR code.'},
]);
export function validateScenes(scenes=SCENES, duration=40) {
  if (!Array.isArray(scenes) || !scenes.length || scenes[0].at < 1.0) throw new Error('Must start with opening silence');
  for (const [i, scene] of scenes.entries()) {
    if (!scene.id || !scene.speech?.trim() || !Number.isFinite(scene.at) || scene.at >= duration - 2 ||
      (i && scene.at <= scenes[i-1].at)) throw new Error(`Invalid narration cue ${i}`);
  }
  return true;
}
