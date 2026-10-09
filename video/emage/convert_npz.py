#!/usr/bin/env python3
"""Approximate EMAGE/SMPL-X to VRM normalized-bone motion conversion.

The earlier proof-of-concept copied tiny per-axis deltas directly and clipped
arm motion so aggressively that the presenter barely moved. This converter is
still approximate, but it now:
- computes joint motion relative to a neutral quaternion pose,
- converts that relative motion into Euler angles,
- remaps SMPL-X local axes into the existing VRM gesture space, and
- preserves a visibly presentational arm range instead of shrinking it away.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np

FORMAT = 'vrm1-emage-retarget-v2'
# SMPL-X: pelvis 0, ..., spine2 6, spine3 9, neck 12, head 15,
# left/right shoulder 16/17, left/right elbow 18/19.
BONE_CONFIG = {
    'spine': {'index': 6, 'map': ((0, 0.32), (1, 0.10), (2, 0.10)), 'limit': (0.16, 0.12, 0.10), 'window': 9},
    'chest': {'index': 9, 'map': ((0, 0.42), (1, 0.14), (2, 0.12)), 'limit': (0.22, 0.16, 0.12), 'window': 9},
    'neck': {'index': 12, 'map': ((0, 0.48), (1, 0.22), (2, 0.10)), 'limit': (0.24, 0.22, 0.12), 'window': 7},
    'head': {'index': 15, 'map': ((0, 0.58), (1, 0.30), (2, 0.10)), 'limit': (0.30, 0.30, 0.14), 'window': 7},
    # Target Euler axes follow the existing handcrafted presenter: X tilt / raise,
    # Y twist, Z spread-bend. Mirror the Z gain between left and right arms.
    'leftUpperArm': {'index': 16, 'map': ((1, -0.92), (2, 0.25), (0, -1.08)), 'limit': (0.72, 0.26, 1.10), 'window': 7},
    'rightUpperArm': {'index': 17, 'map': ((1, -0.92), (2, -0.25), (0, 1.08)), 'limit': (0.72, 0.26, 1.10), 'window': 7},
    'leftLowerArm': {'index': 18, 'map': ((1, -0.12), (2, 0.0), (0, -1.35)), 'limit': (0.18, 0.14, 1.22), 'window': 5},
    'rightLowerArm': {'index': 19, 'map': ((1, -0.12), (2, 0.0), (0, 1.35)), 'limit': (0.18, 0.14, 1.22), 'window': 5},
}


def _normalize_quat(q):
    return q / np.clip(np.linalg.norm(q, axis=-1, keepdims=True), 1e-8, None)


def _axis_angle_to_quat(vectors):
    angles = np.linalg.norm(vectors, axis=-1, keepdims=True)
    half = angles * 0.5
    axis = np.zeros_like(vectors)
    mask = angles[..., 0] > 1e-8
    axis[mask] = vectors[mask] / angles[mask]
    xyz = axis * np.sin(half)
    w = np.cos(half)
    return _normalize_quat(np.concatenate([xyz, w], axis=-1))


def _quat_conjugate(q):
    out = q.copy()
    out[..., :3] *= -1
    return out


def _quat_mul(a, b):
    ax, ay, az, aw = np.moveaxis(a, -1, 0)
    bx, by, bz, bw = np.moveaxis(b, -1, 0)
    return np.stack([
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz,
    ], axis=-1)


def _quat_to_euler_xyz(q):
    x, y, z, w = np.moveaxis(_normalize_quat(q), -1, 0)
    t0 = 2.0 * (w * x + y * z)
    t1 = 1.0 - 2.0 * (x * x + y * y)
    ex = np.arctan2(t0, t1)
    t2 = np.clip(2.0 * (w * y - z * x), -1.0, 1.0)
    ey = np.arcsin(t2)
    t3 = 2.0 * (w * z + x * y)
    t4 = 1.0 - 2.0 * (y * y + z * z)
    ez = np.arctan2(t3, t4)
    return np.stack([ex, ey, ez], axis=-1)


def _moving_average(values, window):
    kernel = np.ones(window, dtype=np.float64) / window
    return np.stack([np.convolve(values[:, c], kernel, mode='same') for c in range(values.shape[1])], axis=1)


def convert(npz_path: Path, audio_path: Path, output_path: Path):
    if not audio_path.is_file():
        raise FileNotFoundError(f'Original narration WAV required: {audio_path}')
    with np.load(npz_path, allow_pickle=False) as motion:
        if 'poses' not in motion:
            raise ValueError('EMAGE NPZ must include poses')
        poses = np.asarray(motion['poses'], dtype=np.float64)
        fps = int(motion['mocap_frame_rate']) if 'mocap_frame_rate' in motion else 30
    if poses.ndim != 2 or poses.shape[1] != 165 or not np.isfinite(poses).all():
        raise ValueError(f'Expected finite SMPL-X poses shaped [frames,165], got {poses.shape}')
    if fps != 30:
        raise ValueError(f'Expected 30 fps output from EMAGE beat_format_save, got {fps}')
    if poses.shape[0] < 30:
        raise ValueError('Need at least 30 motion frames')

    neutral = np.median(poses[:min(24, len(poses))], axis=0)
    result = {}
    for name, config in BONE_CONFIG.items():
        idx = config['index']
        joint = poses[:, idx * 3:idx * 3 + 3]
        neutral_joint = neutral[idx * 3:idx * 3 + 3][None, :]
        q_joint = _axis_angle_to_quat(joint)
        q_neutral = _axis_angle_to_quat(neutral_joint)
        rel = _quat_mul(_quat_conjugate(q_neutral), q_joint)
        euler = _quat_to_euler_xyz(rel)
        remapped = np.stack([euler[:, src] * gain for src, gain in config['map']], axis=1)
        smoothed = _moving_average(remapped, config['window'])
        limit = np.asarray(config['limit'], dtype=np.float64)
        smoothed = np.clip(smoothed, -limit, limit)
        edge = np.minimum(np.arange(len(poses)), len(poses) - 1 - np.arange(len(poses)))
        smoothed *= np.clip(edge / 12, 0, 1)[:, None]
        result[name] = np.round(smoothed, 5).tolist()

    obj = {
        'format': FORMAT,
        'fps': fps,
        'audioSha256': hashlib.sha256(audio_path.read_bytes()).hexdigest(),
        'source': 'PantoMatrix EMAGE SMPL-X relative motion, remapped into VRM normalized-bone space',
        'bones': result,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp = output_path.with_suffix(output_path.suffix + '.tmp')
    try:
        temp.write_text(json.dumps(obj, separators=(',', ':')) + '\n', encoding='utf-8')
        temp.replace(output_path)
    finally:
        temp.unlink(missing_ok=True)
    print(f'Converted {len(poses)} frames at {fps} fps into {output_path}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--npz', type=Path, default=Path('/out/intermediate/emage/narration_output.npz'))
    parser.add_argument('--audio', type=Path, default=Path('/out/intermediate/narration.wav'))
    parser.add_argument('--output', type=Path, default=Path('/out/intermediate/emage-vrm-motion.json'))
    args = parser.parse_args()
    convert(args.npz, args.audio, args.output)
