/** Optional motion offsets translated from EMAGE SMPL-X poses.
 * These are approximate normalized-bone offsets, but they now keep a wider,
 * presenter-like arm range and are blended with authored gestures.
 */
export const EMAGE_FORMAT = 'vrm1-emage-retarget-v2';
export const EMAGE_BONES = Object.freeze([
  'spine', 'chest', 'neck', 'head',
  'leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm',
]);
export const EMAGE_LIMITS = Object.freeze({
  spine:0.18, chest:0.24, neck:0.26, head:0.32,
  leftUpperArm:1.15, rightUpperArm:1.15,
  leftLowerArm:1.25, rightLowerArm:1.25,
});

export function validateEmageMotion(data, expectedSeconds = 40) {
  if (!data || data.format !== EMAGE_FORMAT || data.fps !== 30 ||
      !/^[0-9a-f]{64}$/.test(data.audioSha256 ?? '') ||
      !data.bones || typeof data.bones !== 'object') {
    throw new Error('Invalid EMAGE motion manifest (format, fps or audio fingerprint)');
  }
  const count = data.bones[EMAGE_BONES[0]]?.length;
  if (!Number.isInteger(count) || count < (expectedSeconds - 2) * 30 ||
      count > (expectedSeconds + 3) * 30) {
    throw new Error(`EMAGE frame count must approximately match ${expectedSeconds} seconds`);
  }
  for (const name of EMAGE_BONES) {
    const frames = data.bones[name];
    const limit = EMAGE_LIMITS[name] ?? 0.35;
    if (!Array.isArray(frames) || frames.length !== count ||
        !frames.every(v => Array.isArray(v) && v.length === 3 &&
          v.every(n => Number.isFinite(n) && Math.abs(n) <= limit))) {
      throw new Error(`Invalid EMAGE normalized offsets for ${name}`);
    }
  }
  return data;
}

/** Interpolate pre-converted offsets. These enrich authored gestures. */
export function sampleEmageMotion(data, seconds) {
  const f = Math.max(0, Math.min(data.bones.head.length - 1, seconds * data.fps));
  const a = Math.floor(f), b = Math.min(data.bones.head.length - 1, a + 1);
  const alpha = f - a;
  return Object.fromEntries(EMAGE_BONES.map(name => [name,
    data.bones[name][a].map((v, i) => v + (data.bones[name][b][i] - v) * alpha),
  ]));
}
