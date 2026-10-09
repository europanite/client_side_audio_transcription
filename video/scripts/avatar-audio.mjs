/** Turn the ACTUAL Piper narration into one RMS mouth opening value per output frame. */
import { execFileSync } from 'node:child_process';
import { FRAME_RATE, VIDEO_SECONDS } from './timeline.mjs';
export const AUDIO_HZ = 24000;

export function voiceEnvelope(pcm, rate = AUDIO_HZ, fps = FRAME_RATE, seconds = VIDEO_SECONDS) {
  if (!Buffer.isBuffer(pcm) || pcm.length < 2 || pcm.length % 2 !== 0) {
    throw new Error('Expected little-endian PCM s16le');
  }
  const frameSamples = rate / fps;
  if (!Number.isInteger(frameSamples)) throw new Error('Sample rate must be divisible by FPS');
  const levels = [];
  for (let f = 0; f < seconds * fps; f++) {
    let sum = 0;
    const start = f * frameSamples;
    for (let i = 0; i < frameSamples && start + i < pcm.length / 2; i++) {
      const x = pcm.readInt16LE(2 * (start + i)) / 32768;
      sum += x * x;
    }
    levels.push(Math.sqrt(sum / frameSamples));
  }
  // Normalize against speech's loud sections, not isolated peaks.
  const sorted = levels.filter(x => x > 0.001).sort((a, b) => a - b);
  const reference = sorted.length ? Math.max(0.02, sorted[Math.floor(0.9 * (sorted.length - 1))]) : 0.08;
  let previous = 0;
  return levels.map(level => {
    const target = level < reference * 0.055 ? 0 : Math.min(1, (level / reference) * 0.85);
    // Attack quickly, release smoothly between syllables.
    previous = previous * (target > previous ? 0.28 : 0.62) + target * (target > previous ? 0.72 : 0.38);
    return Number(previous.toFixed(4));
  });
}

export function envelopeFromNarration(wavPath) {
  const pcm = execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', wavPath,
    '-vn', '-ac', '1', '-ar', String(AUDIO_HZ), '-f', 's16le', '-',
  ], { maxBuffer: 10 * 1024 * 1024 });
  return voiceEnvelope(pcm);
}
