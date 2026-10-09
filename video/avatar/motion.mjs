/** VRM 1.0 (+Z-forward) gestures, authored on three-vrm NORMALIZED bones.
 * The normalized rest state is the T-pose: model-left is +X, model-right -X.
 * With THREE.Euler XYZ and arms first lowered about Z:
 *   - upperArm Z lowers/raises arms sideways (left -Z, right +Z);
 *   - upperArm -X brings a lowered arm FORWARD (+Z), not sideways;
 *   - lowerArm Y bends the elbow FORWARD (left -Y, right +Y).
 * The old lowerArm Z rotations merely swept forearms in the body plane.
 * Do not apply these values to getRawBoneNode() (its rest orientation varies).
 */

const REST_POSE = {
  leftUpperArm: [-0.055, 0, -1.31],
  rightUpperArm: [-0.055, 0, 1.31],
  leftLowerArm: [0, -0.22, 0],
  rightLowerArm: [0, 0.22, 0],
  leftHand: [0, -0.045, 0],
  rightHand: [0, 0.045, 0],
  spine: [0, 0, 0],
  chest: [0, 0, 0],
  neck: [0, 0, 0],
  head: [0, 0, 0],
};

// These offsets are additive to the relaxed normalized T-pose rotations above.
// Each gesture has a small shoulder Z lift, significant forward shoulder -X,
// and anatomically mirrored elbow bends on -Y (left) / +Y (right).
// The arm at the viewer's right is the VRM's RIGHT arm (model -X).
export const SCENE_GESTURES = Object.freeze([
  { // Hook: curious head tilt, subtle inviting right hand.
    head: [-0.055, 0.018, -0.070],
    rightUpperArm: [-0.14, 0, -0.10], rightLowerArm: [0, 0.20, 0],
  },
  { // Demonstrate what can be predicted: open right arm toward the viewer.
    chest: [0, 0.035, 0], head: [0, 0.034, 0],
    rightUpperArm: [-0.34, 0, -0.28],
    rightLowerArm: [0, 0.42, 0], rightHand: [0, 0.08, 0],
  },
  { // Indicate the CSV using the other hand, not a sideways elbow swing.
    head: [-0.018, 0.085, 0], chest: [0, 0.03, 0],
    leftUpperArm: [-0.31, 0, 0.28],
    leftLowerArm: [0, -0.38, 0], leftHand: [0, -0.06, 0],
  },
  { // Model choices: open both arms and bend elbows forward.
    head: [0.016, -0.015, 0], chest: [0, 0, -0.01],
    leftUpperArm: [-0.34, 0, 0.29], rightUpperArm: [-0.34, 0, -0.29],
    leftLowerArm: [0, -0.43, 0], rightLowerArm: [0, 0.43, 0],
  },
  { // Local training: short nod, relax the hands.
    head: [0.010, 0, 0], chest: [0.012, 0, 0],
    rightUpperArm: [-0.11, 0, -0.08],
    rightLowerArm: [0, 0.15, 0],
  },
  { // Results: open the right hand to the chart.
    head: [-0.02, 0.085, 0], chest: [0, 0.04, 0],
    rightUpperArm: [-0.38, 0, -0.39],
    rightLowerArm: [0, 0.34, 0], rightHand: [0, 0.10, 0],
  },
  { // QR is above and to viewer's right: reach toward it without shoulder twisting.
    head: [-0.058, 0.13, 0], chest: [0, 0.044, 0],
    rightUpperArm: [-0.27, 0, -0.56],
    rightLowerArm: [0, 0.20, 0], rightHand: [0, 0.08, 0],
  },
]);

const BLINK_TIMES = [1.75, 5.05, 8.48, 12.34, 16.11, 16.43, 20.15, 23.62, 27.74];
const clamp01 = value => Math.max(0, Math.min(1, value));
const smooth = value => { const x = clamp01(value); return x * x * (3 - 2 * x); };

export function validateMotionCues(cues, duration = 40) {
  if (!Array.isArray(cues) || cues.length !== SCENE_GESTURES.length ||
      !Number.isFinite(duration) || duration <= 0) {
    throw new Error('Avatar motion requires seven timed narration cues');
  }
  const starts = cues.map(c => c?.startSeconds);
  if (!starts.every(Number.isFinite) || starts[0] < 1 || starts[0] > 3 ||
      starts.some((start, i) => start >= duration || (i > 0 && start <= starts[i - 1]))) {
    throw new Error('Avatar narration cue times must be ascending within the video');
  }
  return starts;
}

function gestureWeight(time, start, end) {
  // Delayed onset, a short expressive hold, and eased release before the next line.
  if (time < start || time >= end) return 0;
  const rise = smooth((time - start - 0.18) / 0.48);
  const fall = smooth((end - 0.12 - time) / 0.46);
  return rise * fall;
}

/** Sample a complete pose at an absolute video time, independent of frame rate. */
export function sampleAvatarMotion(seconds, cueStarts = null, audioLevel = 0) {
  const t = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const voice = clamp01(Number.isFinite(audioLevel) ? audioLevel : 0);
  const bones = Object.fromEntries(Object.entries(REST_POSE).map(([name, angles]) => [name, [...angles]]));

  // Breathing, postural balance and small eye/head wander even during silence.
  bones.chest[0] += 0.012 * Math.sin(t * 1.65);
  bones.spine[2] += 0.013 * Math.sin(t * 0.72);
  bones.neck[1] += 0.012 * Math.sin(t * 0.51 + 0.6);
  bones.head[0] += 0.013 * Math.sin(t * 0.90 + 0.3) + voice * 0.012;
  bones.head[1] += 0.014 * Math.sin(t * 0.63 + 0.8);
  bones.leftUpperArm[0] += 0.010 * Math.sin(t * 0.76);
  bones.rightUpperArm[0] += 0.010 * Math.sin(t * 0.76 + 0.35);

  let smile = 0.035;
  if (cueStarts) {
    for (let i = 0; i < SCENE_GESTURES.length; i++) {
      const start = cueStarts[i];
      const end = i + 1 < cueStarts.length ? cueStarts[i + 1] : 40;
      const weight = gestureWeight(t, start, end);
      if (weight === 0) continue;
      for (const [name, offsets] of Object.entries(SCENE_GESTURES[i])) {
        for (let axis = 0; axis < 3; axis++) bones[name][axis] += offsets[axis] * weight;
      }
      // Only one purposeful nod, during the training line.
      if (i === 4) {
        const d = (t - start - 1.25) / 0.42;
        bones.head[0] += 0.090 * Math.exp(-d * d) * weight;
      }
      if (i === 0 || i === 6) smile += 0.13 * weight;
    }
  }

  const phase = t % 40;
  let blink = 0;
  for (const blinkAt of BLINK_TIMES) {
    const distance = phase - blinkAt;
    if (distance >= 0 && distance < 0.18) {
      blink = Math.sin(Math.PI * distance / 0.18);
      break;
    }
  }
  return {
    bones,
    blink: clamp01(blink),
    smile: clamp01(smile),
    rootYaw: 0.025 * Math.sin(t * 0.48) + 0.008 * Math.sin(t * 1.04),
  };
}
