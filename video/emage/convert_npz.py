#!/usr/bin/env python3
"""Lossless-in-pose EMAGE 55-joint SMPL-X axis-angle -> quaternion bridge.

The output is a transport format, NOT a heuristic VRM pose. There is no
smoothing, amplitude gain, clipping, or neutral-frame subtraction. The VRM
rest-pose/hierarchy correction happens only in the avatar renderer.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import numpy as np

FORMAT = 'smplx-vrm-retarget-v3'
FPS = 30
JOINTS = 55


def axis_angle_to_quaternion(poses):
    """poses: [T,55,3] axis-angle radians; returns unit [T,55,4] xyzw."""
    angles = np.linalg.norm(poses, axis=-1, keepdims=True)
    half = angles / 2.0
    # sin(theta/2)/theta is well-behaved at theta=0.
    factor = np.divide(np.sin(half), angles,
                       out=np.full_like(angles, 0.5), where=angles > 1e-9)
    quaternion = np.concatenate((poses * factor, np.cos(half)), axis=-1)
    quaternion /= np.maximum(np.linalg.norm(quaternion, axis=-1, keepdims=True), 1e-12)
    return quaternion


def convert(npz_path: Path, audio_path: Path, output_path: Path):
    if not audio_path.is_file():
        raise FileNotFoundError(f'Original narration WAV required: {audio_path}')
    with np.load(npz_path, allow_pickle=False) as motion:
        if 'poses' not in motion:
            raise ValueError('EMAGE NPZ missing poses')
        poses = np.asarray(motion['poses'], dtype=np.float64)
        fps = int(motion['mocap_frame_rate']) if 'mocap_frame_rate' in motion else FPS
        translation = np.asarray(motion['trans'], dtype=np.float64) if 'trans' in motion else None
    if poses.ndim != 2 or poses.shape[1] != JOINTS * 3 or not np.isfinite(poses).all():
        raise ValueError(f'Expected finite SMPL-X poses [T,165], got {poses.shape}')
    if fps != FPS or poses.shape[0] < 30:
        raise ValueError(f'Expected >=30 frames at {FPS} fps; got {poses.shape[0]} at {fps}')
    if translation is not None and (translation.shape != (len(poses), 3) or not np.isfinite(translation).all()):
        raise ValueError(f'Invalid SMPL-X translation [T,3]: {translation.shape}')

    quat = axis_angle_to_quaternion(poses.reshape(-1, JOINTS, 3))
    # little-endian float32 is interpreted verbatim by Float32Array in the browser
    raw = quat.astype('<f4', copy=False).tobytes(order='C')
    payload = {
        'format': FORMAT,
        'fps': fps,
        'frames': len(poses),
        'audioSha256': hashlib.sha256(audio_path.read_bytes()).hexdigest(),
        'source': 'PantoMatrix EMAGE SMPL-X 55-joint axis-angle, quaternion xyzw',
        'quaternions': {
            'encoding': 'base64-f32le',
            'layout': 'frame-joint-xyzw',
            'joints': JOINTS,
            'data': base64.b64encode(raw).decode('ascii'),
        },
        # NPZ translations can be zero because the current inference uses
        # get_global_motion=False. Do not invent global locomotion.
        'translation': None if translation is None else np.round(translation, 6).tolist(),
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = output_path.with_suffix(output_path.suffix + '.tmp')
    try:
        temporary.write_text(json.dumps(payload, separators=(',', ':')) + '\n', encoding='utf-8')
        temporary.replace(output_path)
    finally:
        temporary.unlink(missing_ok=True)
    print(f'EMAGE SMPL-X bridge: {len(poses)} frames, {JOINTS} joints, '
          f'{len(raw)} quaternion bytes -> {output_path}', flush=True)
    if translation is not None and np.max(np.abs(translation)) == 0:
        print('EMAGE note: source root translation is zero; no locomotion is available.', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--npz', type=Path, default=Path('/out/intermediate/emage/narration_output.npz'))
    parser.add_argument('--audio', type=Path, default=Path('/out/intermediate/narration.wav'))
    parser.add_argument('--output', type=Path, default=Path('/out/intermediate/emage-vrm-motion.json'))
    args = parser.parse_args()
    convert(args.npz, args.audio, args.output)
