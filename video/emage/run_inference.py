#!/usr/bin/env python3
"""Docker entry point for PantoMatrix EMAGE audio-only inference.

Loads only the upstream EMAGE model and VQ decoders, avoiding their optional
SMPL-X/OpenGL video renderers. Saves compatible 30-fps SMPL-X pose NPZ for
convert_npz.py. No fake motion or procedural fallback is generated here.
"""
from __future__ import annotations

import hashlib
import os
from pathlib import Path
import sys
import wave

AUDIO = Path('/out/intermediate/narration.wav')
OUT = Path('/out/intermediate/emage/narration_output.npz')
MARKER = OUT.with_suffix('.audio.sha256')
FPS = 30


def audio_fingerprint(audio: Path) -> str:
    if not audio.is_file() or audio.stat().st_size < 44:
        raise FileNotFoundError(f'Missing narration WAV: {audio}. Generate the 40-second video first.')
    return hashlib.sha256(audio.read_bytes()).hexdigest()


def audio_duration(audio: Path) -> float:
    with wave.open(str(audio), 'rb') as wav:
        return wav.getnframes() / wav.getframerate()


def output_frames(duration: float) -> int:
    frames = round(duration * FPS)
    if frames < 60 or frames > FPS * 120:
        raise ValueError(f'Unexpected narration duration {duration:.2f}s')
    return frames


def resample_frames(data, target_count):
    """Interpolate a model-time sequence onto the final 30-fps video timeline."""
    import numpy as np
    values = np.asarray(data, dtype=np.float32)
    if values.ndim != 2 or len(values) == 0 or not np.isfinite(values).all():
        raise ValueError(f'Bad EMAGE frame array shape/content: {values.shape}')
    if abs(len(values) / target_count - 1) > 0.55:
        raise ValueError(f'EMAGE returned {len(values)} frames for target {target_count}: unexpected sampling rate')
    if len(values) == 1:
        return np.repeat(values, target_count, axis=0)
    old = np.linspace(0, 1, num=len(values), dtype=np.float64)
    new = np.linspace(0, 1, num=target_count, dtype=np.float64)
    return np.column_stack([np.interp(new, old, values[:, k]) for k in range(values.shape[1])]).astype(np.float32)


def infer(audio: Path, dest: Path, target_count: int):
    import librosa
    import numpy as np
    import torch
    from models.emage_audio import EmageAudioModel, EmageVQVAEConv, EmageVAEConv, EmageVQModel

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'EMAGE inference device={device}; loading H-Liu1997/emage_audio weights (cached after first run)', flush=True)
    source = 'H-Liu1997/emage_audio'
    components = {
        name: EmageVQVAEConv.from_pretrained(source, subfolder=f'emage_vq/{name}').to(device).eval()
        for name in ('face', 'upper', 'lower', 'hands')
    }
    global_model = EmageVAEConv.from_pretrained(source, subfolder='emage_vq/global').to(device).eval()
    decoder = EmageVQModel(
        face_model=components['face'], upper_model=components['upper'],
        lower_model=components['lower'], hands_model=components['hands'],
        global_model=global_model,
    ).to(device).eval()
    model = EmageAudioModel.from_pretrained(source).to(device).eval()

    samples, _ = librosa.load(str(audio), sr=model.cfg.audio_sr, mono=True)
    if len(samples) < model.cfg.audio_sr:
        raise ValueError('Audio must contain at least 1s of samples')
    signal = torch.from_numpy(samples).to(device).unsqueeze(0)
    speaker = torch.zeros((1, 1), dtype=torch.long, device=device)
    with torch.inference_mode():
        latent = model.inference(signal, speaker, decoder, masked_motion=None, mask=None)
        face = latent['rec_face'] if model.cfg.lf > 0 and model.cfg.cf == 0 else None
        upper = latent['rec_upper'] if model.cfg.lu > 0 and model.cfg.cu == 0 else None
        hands = latent['rec_hands'] if model.cfg.lh > 0 and model.cfg.ch == 0 else None
        lower = latent['rec_lower'] if model.cfg.ll > 0 and model.cfg.cl == 0 else None
        def indices(name, flag):
            return torch.argmax(latent[f'cls_{name}'], dim=2) if flag > 0 else None
        decoded = decoder.decode(
            face_latent=face, upper_latent=upper, hands_latent=hands, lower_latent=lower,
            face_index=indices('face', model.cfg.cf),
            upper_index=indices('upper', model.cfg.cu),
            hands_index=indices('hands', model.cfg.ch),
            lower_index=indices('lower', model.cfg.cl),
            get_global_motion=False,
        )
        poses = decoded['motion_axis_angle'].cpu().numpy().reshape(-1, 165)
        expressions = decoded['expression'].cpu().numpy().reshape(-1, 100)

    # The official script upsamples from cfg.pose_fps to 30 fps. Do not assume
    # that the model output is already aligned to the final video frame count.
    if model.cfg.pose_fps != FPS:
        print(f'EMAGE native pose rate={model.cfg.pose_fps}; resampling to {FPS} fps', flush=True)
    poses = resample_frames(poses, target_count)
    expressions = resample_frames(expressions, target_count)
    dest.parent.mkdir(parents=True, exist_ok=True)
    temp = dest.with_suffix('.tmp.npz')
    try:
        with temp.open('wb') as stream:
            np.savez_compressed(stream, poses=poses, expressions=expressions,
                                mocap_frame_rate=np.int32(FPS),
                                trans=np.zeros((target_count, 3), np.float32))
        os.replace(temp, dest)
    finally:
        temp.unlink(missing_ok=True)
    print(f'Saved {target_count} frames to {dest}', flush=True)


def main():
    audio = AUDIO
    if not audio.is_file():
        raise FileNotFoundError(f'Missing {audio}; first build the narrated demo with docker compose')
    fingerprint = audio_fingerprint(audio)
    frames = output_frames(audio_duration(audio))
    if OUT.is_file() and OUT.stat().st_size > 0 and MARKER.is_file() and MARKER.read_text().strip() == fingerprint:
        print(f'EMAGE NPZ already matches narration SHA-256; reusing {OUT}', flush=True)
        return
    infer(audio, OUT, frames)
    MARKER.write_text(fingerprint + '\n')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f'EMAGE inference failed: {exc}', file=sys.stderr, flush=True)
        raise
