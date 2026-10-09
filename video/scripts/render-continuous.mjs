import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec = promisify(execFile);

/**
 * Read duration from container metadata; for MediaRecorder WebM, which often
 * has no Segment Duration element, derive it from decoded video packet PTS.
 * Do not guess from a fixed expected video length: reject empty/bad recordings.
 */
export async function probeDuration(path) {
  const {stdout} = await exec('ffprobe', ['-v','error','-show_entries','format=duration',
    '-of','default=noprint_wrappers=1:nokey=1',path]);
  const value = Number(stdout.trim());
  if (Number.isFinite(value) && value > 0) return value;

  // Chromium's canvas.captureStream() / MediaRecorder WebM often has valid
  // video timestamps even when format.duration is N/A.
  const packetsOutput = await exec('ffprobe', ['-v','error',
    '-select_streams','v:0','-show_entries','packet=pts_time,duration_time',
    '-of','json',path], {maxBuffer:32*1024*1024});
  const packets = JSON.parse(packetsOutput.stdout).packets ?? [];
  let first = Infinity;
  let last = -Infinity;
  for (const packet of packets) {
    const pts = Number(packet.pts_time);
    if (!Number.isFinite(pts)) continue;
    const duration = Number(packet.duration_time);
    first = Math.min(first,pts);
    last = Math.max(last,pts + (Number.isFinite(duration) && duration > 0 ? duration : 0));
  }
  const inferredDuration = last - first;
  if (Number.isFinite(inferredDuration) && inferredDuration > 0) {
    console.log(`WebM has no duration metadata; measured video packet timestamps: ${inferredDuration.toFixed(3)}s`);
    return inferredDuration;
  }
  throw new Error(`Unknown duration (no valid metadata or video timestamps): ${path}`);
}
