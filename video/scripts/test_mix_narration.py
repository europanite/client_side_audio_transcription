"""Offline regression tests: real spoken-signal guard and sample-aligned WAV mix."""
import importlib.util
import math
import tempfile
import unittest
import wave
from array import array
from pathlib import Path
import json
import sys

SCRIPT = Path(__file__).with_name('mix_narration.py')
spec = importlib.util.spec_from_file_location('mix_narration', SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def make_wav(path, tone=True, seconds=0.55):
    hz = 22050
    count = int(hz * seconds)
    samples = array('h', (round(math.sin(2 * math.pi * 440 * i / hz) * 14000) if tone else 0
                          for i in range(count)))
    if sys.byteorder != 'little':
        samples.byteswap()
    with wave.open(str(path), 'wb') as wav:
        wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(hz)
        wav.writeframes(samples.tobytes())


class MixTests(unittest.TestCase):
    def test_mix_places_two_audible_clips_at_independent_cue_times(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            make_wav(root / 'narration_00.wav')
            make_wav(root / 'narration_01.wav')
            cues = [{'startSeconds': 0.5, 'slotSeconds': 0.8, 'id': 'a'},
                    {'startSeconds': 1.5, 'slotSeconds': 0.8, 'id': 'b'}]
            (root / 'cues.json').write_text(json.dumps(cues))
            result = root / 'narration.wav'
            module.mix(root/'cues.json', root, result, 3)
            pcm = module.pcm_from_media(result)
            self.assertEqual(len(pcm), 3 * module.HZ)
            self.assertEqual(max(abs(x) for x in pcm[:int(0.48*module.HZ)]), 0)
            self.assertGreater(max(abs(x) for x in pcm[int(0.55*module.HZ):int(0.9*module.HZ)]), 1500)
            self.assertGreater(max(abs(x) for x in pcm[int(1.55*module.HZ):int(1.9*module.HZ)]), 1500)
            module.check_audible(pcm, 'mixed fixture')

    def test_refuses_silent_piper_clip(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            make_wav(root / 'narration_00.wav', tone=False)
            (root / 'cues.json').write_text(json.dumps([
                {'startSeconds': 0.5, 'slotSeconds': 0.8, 'id': 'silent'}]))
            with self.assertRaisesRegex(ValueError, 'silent or far too quiet'):
                module.mix(root/'cues.json', root, root/'narration.wav', 3)


if __name__ == '__main__':
    unittest.main()
