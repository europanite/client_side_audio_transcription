#!/usr/bin/env python3
"""Assemble Piper clips on a sample-accurate timeline with audible-signal checks.

Use `--check audio.wav|video.mp4` to verify any output has genuinely audible
samples.  Never silently manufacture replacement narration when synthesis fails.
"""
import argparse
from array import array
import json
import math
import subprocess
import sys
import wave
from pathlib import Path

HZ = 48000


def pcm_from_media(path, tempo=1.0):
    command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-i', str(path),
               '-vn']
    if abs(tempo - 1.0) > 0.00001:
        command += ['-af', f'atempo={tempo:.6f}']
    command += ['-ac', '1', '-ar', str(HZ), '-c:a', 'pcm_s16le', '-f', 's16le', '-']
    result = subprocess.run(command, check=True, capture_output=True)
    if len(result.stdout) % 2:
        raise ValueError(f'Odd-length decoded PCM for {path}')
    values = array('h'); values.frombytes(result.stdout)
    if sys.byteorder != 'little':
        values.byteswap()
    return values


def stats(samples):
    if not samples:
        return 0.0, 0.0
    peak = max(abs(x) for x in samples) / 32768.0
    rms = math.sqrt(sum(float(x) * x for x in samples) / len(samples)) / 32768.0
    return peak, rms


def check_audible(samples, label, min_peak=0.012, min_rms=0.0025):
    peak, rms = stats(samples)
    print(f'Audio QA {label}: peak={peak:.4f} ({20*math.log10(max(peak,1e-10)):.1f} dBFS), '
          f'rms={rms:.4f} ({20*math.log10(max(rms,1e-10)):.1f} dBFS)', flush=True)
    if peak < min_peak or rms < min_rms:
        raise ValueError(f'{label} is silent or far too quiet; inspect the Piper voice WAVs '
                         'before recording the browser or running EMAGE')


def read_duration(path):
    with wave.open(str(path), 'rb') as wav:
        if wav.getnframes() <= 0:
            raise ValueError(f'Empty Piper WAV: {path}')
        return wav.getnframes() / wav.getframerate()


def mix(manifest, clips_dir, destination, seconds):
    cues = json.loads(Path(manifest).read_text(encoding='utf-8'))
    if not isinstance(cues, list) or not cues:
        raise ValueError('Expected non-empty narration cues')
    total_samples = round(seconds * HZ)
    result = array('f', [0.0]) * total_samples
    for index, cue in enumerate(cues):
        path = Path(clips_dir) / f'narration_{index:02d}.wav'
        if not path.is_file():
            raise FileNotFoundError(f'Piper did not generate {path}')
        start = float(cue['startSeconds'])
        slot = float(cue['slotSeconds'])
        if not 0 <= start < seconds or slot <= 0 or start + slot > seconds + 1e-6:
            raise ValueError(f'Invalid timeline for {cue.get("id", index)}')
        natural_duration = read_duration(path)
        tempo = max(1.0, natural_duration / slot)
        if tempo > 1.65:
            raise ValueError(f'Speech for {cue.get("id",index)} is too long; shorten the text')
        samples = pcm_from_media(path, tempo)
        check_audible(samples, f'Piper clip {index} ({cue.get("id",index)})',
                      min_peak=0.006, min_rms=0.001)
        clip_peak, clip_rms = stats(samples)
        # Moderate normalization improves quiet voices; cap gain to avoid
        # excessively amplifying noise or clipping genuine speech.
        gain = min(5.0, max(0.8, 0.075 / max(clip_rms, 1e-6)))
        gain = min(gain, 0.88 / clip_peak)
        offset = round(start * HZ)
        count = min(len(samples), round(slot * HZ), total_samples - offset)
        for j in range(count):
            result[offset + j] += samples[j] / 32768.0 * gain
        print(f'Audio QA placed clip {index} at {start:.2f}s, '
              f'{count/HZ:.2f}s, gain={gain:.2f}', flush=True)
    peak = max(abs(v) for v in result)
    limiter = min(1.0, 0.90 / peak) if peak > 0 else 1.0
    pcm = array('h', (max(-32768, min(32767, round(v * limiter * 32767))) for v in result))
    check_audible(pcm, 'mixed 40-second narration', min_peak=0.035, min_rms=0.004)
    if sys.byteorder != 'little':
        pcm.byteswap()
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(destination), 'wb') as wav:
        wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(HZ)
        wav.writeframes(pcm.tobytes())
    print(f'Audio QA PASS: {destination}', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--clips-dir', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--seconds', type=float, default=40)
    parser.add_argument('--check', type=Path, help='Check WAV/MP4 audio by decoding to 48 kHz PCM')
    options = parser.parse_args()
    if options.check:
        check_audible(pcm_from_media(options.check), str(options.check),
                      min_peak=0.012, min_rms=0.0025)
        return
    if not options.manifest or not options.clips_dir or not options.output:
        parser.error('--manifest, --clips-dir and --output are required for mixing')
    mix(options.manifest, options.clips_dir, options.output, options.seconds)


if __name__ == '__main__':
    main()
