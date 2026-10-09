/** Dedicated green-screen VRM renderer. Served ONLY on loopback inside the video container. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { sampleAvatarMotion, validateMotionCues } from './motion.mjs';
import { sampleEmageMotion, validateEmageMotion } from './emage-motion.mjs';

const SIZE = { width: 480, height: 600 };
const canvas = document.querySelector('#avatar');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(SIZE.width, SIZE.height, false);
renderer.setClearColor(0x00ff00, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1.5));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(2.5, 4, 4); scene.add(key);
const fill = new THREE.DirectionalLight(0xb7d8ff, 0.9);
fill.position.set(-3, 2, -2); scene.add(fill);
const camera = new THREE.PerspectiveCamera(36, SIZE.width / SIZE.height, 0.1, 100);
let model = null;
let samples = [];
let motionCues = null;
let emageMotion = null;
let recordingFrom = null;
let lastTick = performance.now();
const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

function clamp(v) { return Math.min(1, Math.max(0, v)); }

/** Apply a sampled expressive pose to VRM normalized humanoid bones. */
function applyMotion(vrm, pose) {
  if (!vrm.humanoid) return;
  for (const [name, angles] of Object.entries(pose.bones)) {
    const bone = vrm.humanoid.getNormalizedBoneNode(name);
    if (bone) bone.rotation.set(...angles);
  }
}

function animate(time) {
  requestAnimationFrame(animate);
  const delta = Math.min(0.1, Math.max(0, (time - lastTick) / 1000));
  lastTick = time;
  if (model) {
    const elapsed = recordingFrom === null ? time / 1000 : (time - recordingFrom) / 1000;
    const voice = recordingFrom === null ? 0 : (samples[Math.min(samples.length - 1, Math.max(0, Math.floor(elapsed * 30)))] || 0);
    // Audio amplitude controls opening, with small variations for vowel shapes.
    const amount = clamp(voice * 1.3);
    model.expressionManager?.setValue('aa', clamp(amount * (0.76 + 0.1 * Math.sin(elapsed * 17))));
    model.expressionManager?.setValue('ih', clamp(amount * (0.12 + 0.12 * Math.sin(elapsed * 11 + 1))));
    model.expressionManager?.setValue('ou', clamp(amount * 0.12));
    // Keep authored stage gestures when EMAGE is available; external motion enriches them.
    const pose = sampleAvatarMotion(elapsed, motionCues, voice);
    if (emageMotion && recordingFrom !== null) {
      for (const [name, offset] of Object.entries(sampleEmageMotion(emageMotion, elapsed))) {
        const angles = pose.bones[name];
        if (!angles) continue;
        const gain = /Arm/.test(name) ? 0.95 : 0.75;
        for (let axis = 0; axis < 3; axis++) angles[axis] += offset[axis] * gain;
      }
    }
    model.expressionManager?.setValue('blink', pose.blink);
    // VRM presets are model-dependent. Only set a smile when it exists.
    if (model.expressionManager?.getExpression?.('happy')) {
      model.expressionManager.setValue('happy', pose.smile);
    }
    applyMotion(model, pose);
    model.scene.rotation.y = pose.rootYaw;
    model.update(delta);
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

window.__avatarState = { ready: false, error: null };
loader.load('/avatar.vrm', (gltf) => {
  model = gltf.userData.vrm;
  if (!model) { window.__avatarState.error = 'Not a recognized VRM model'; return; }
  scene.add(model.scene);
  applyMotion(model, sampleAvatarMotion(0));
  model.update(0);
  // Aim at upper-body / face using measured model bounds and head position.
  const bbox = new THREE.Box3().setFromObject(model.scene);
  const height = bbox.max.y - bbox.min.y;
  const head = model.humanoid?.getNormalizedBoneNode('head');
  const headPos = new THREE.Vector3();
  if (head) head.getWorldPosition(headPos);
  const headY = head ? headPos.y : bbox.min.y + height * 0.88;
  const centerY = headY - Math.max(0.30, height * 0.24);
  const centerX = (bbox.min.x + bbox.max.x) / 2;
  const centerZ = (bbox.min.z + bbox.max.z) / 2;
  const distance = Math.max(1.80, height * 1.18);
  camera.position.set(centerX, centerY, centerZ + distance);
  camera.lookAt(centerX, centerY, centerZ);
  camera.updateProjectionMatrix();
  window.__avatarState.ready = true;
}, undefined, error => { window.__avatarState.error = String(error); });

/** Inject checked, per-frame motion from the separate EMAGE conversion stage. */
window.__setEmageMotion = (motion) => {
  emageMotion = validateEmageMotion(motion, 40);
};

/** One real-time recording, 40 s, exactly aligned to the final narration WAV. */
window.__recordAvatar = async (levels, duration = 40, cues) => {
  if (!window.__avatarState.ready) throw new Error(window.__avatarState.error || 'VRM not ready');
  if (!Array.isArray(levels) || !levels.length) throw new Error('Expected sampled audio levels');
  motionCues = validateMotionCues(cues, duration);
  const stream = canvas.captureStream(30);
  const codec = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']
    .find(x => MediaRecorder.isTypeSupported(x));
  if (!codec) throw new Error('MediaRecorder WebM unsupported');
  const recorder = new MediaRecorder(stream, { mimeType: codec, videoBitsPerSecond: 5500000 });
  const parts = [];
  recorder.addEventListener('dataavailable', event => { if (event.data.size) parts.push(event.data); });
  const done = new Promise((resolve, reject) => {
    recorder.addEventListener('stop', resolve, { once: true });
    recorder.addEventListener('error', event => reject(event.error || new Error('MediaRecorder failed')), { once: true });
  });
  samples = levels;
  recordingFrom = performance.now();
  recorder.start(1000);
  await new Promise(resolve => setTimeout(resolve, duration * 1000));
  recorder.stop();
  await done;
  recordingFrom = null;
  motionCues = null;
  emageMotion = null;
  stream.getTracks().forEach(track => track.stop());
  const blob = new Blob(parts, { type: codec });
  if (blob.size < 10000) throw new Error(`Empty VRM recording (${blob.size} bytes)`);
  const objectURL = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = objectURL; link.download = 'avatar_recording.webm';
  document.body.appendChild(link); link.click(); link.remove();
  return { bytes: blob.size, codec };
};
