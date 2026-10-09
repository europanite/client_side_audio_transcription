/** PantoMatrix EMAGE NPZ quaternion interchange; no authored-motion blending. */
export const EMAGE_FORMAT = 'smplx-vrm-retarget-v3';
export const JOINT_COUNT = 55;

export function validateEmageMotion(data, expectedSeconds = 40) {
  if (data?.format !== EMAGE_FORMAT || data?.fps !== 30 ||
      !/^[a-f0-9]{64}$/.test(data?.audioSha256 ?? '') ||
      !Number.isInteger(data?.frames) ||
      data.frames < (expectedSeconds - 2) * 30 ||
      data.frames > (expectedSeconds + 3) * 30 ||
      data.quaternions?.encoding !== 'base64-f32le' ||
      data.quaternions?.layout !== 'frame-joint-xyzw' ||
      data.quaternions?.joints !== JOINT_COUNT ||
      typeof data.quaternions?.data !== 'string') {
    throw new Error('Invalid SMPL-X motion format, duration, or audio fingerprint');
  }
  const expectedBytes = data.frames * JOINT_COUNT * 4 * 4;
  const encoded = data.quaternions.data;
  if (encoded.length !== 4 * Math.ceil(expectedBytes / 3) ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw new Error('Invalid packed SMPL-X quaternion byte length/encoding');
  }
  if (data.translation !== null && data.translation !== undefined &&
      (!Array.isArray(data.translation) || data.translation.length !== data.frames ||
       !data.translation.every(v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)))) {
    throw new Error('Invalid source translation');
  }
  return data;
}

export function unpackEmageMotion(data) {
  const encoded = data.quaternions.data;
  // Decode via Buffer in Node tests, or atob in Chromium.
  const bytes = typeof atob === 'function' ? Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
    : Uint8Array.from(Buffer.from(encoded, 'base64'));
  if (bytes.byteLength !== data.frames * JOINT_COUNT * 4 * 4) throw new Error('Bad quaternion binary size');
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const floats = new Float32Array(bytes.byteLength / 4);
  for (let i = 0; i < floats.length; i++) {
    const x = dv.getFloat32(4 * i, true);
    if (!Number.isFinite(x)) throw new Error('Non-finite EMAGE quaternion');
    floats[i] = x;
  }
  for (let i = 0; i < floats.length; i += 4) {
    const n = Math.hypot(floats[i], floats[i+1], floats[i+2], floats[i+3]);
    if (n < 0.95 || n > 1.05) throw new Error('Non-unit EMAGE quaternion');
  }
  return {frames: data.frames, fps: data.fps, quaternions: floats, translation: data.translation ?? null};
}
