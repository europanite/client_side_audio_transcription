import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from sys import path

import numpy as np
path.insert(0, str(Path(__file__).resolve().parents[1]))
from convert_npz import convert


class ConverterTests(unittest.TestCase):
    def test_convert_and_hash(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            audio = base / 'narration.wav'
            audio.write_bytes(b'RIFFsynthetic-test-data')
            poses = np.zeros((1200, 165), dtype=np.float32)
            poses[50:200, 16 * 3] = 0.5
            poses[50:200, 16 * 3 + 1] = -0.35
            inp = base / 'narration_output.npz'
            np.savez(inp, poses=poses, mocap_frame_rate=30)
            dest = base / 'motion.json'
            convert(inp, audio, dest)
            data = json.loads(dest.read_text())
            self.assertEqual(data['fps'], 30)
            self.assertEqual(len(data['bones']['leftUpperArm']), 1200)
            self.assertEqual(data['audioSha256'], hashlib.sha256(audio.read_bytes()).hexdigest())
            self.assertGreater(abs(data['bones']['leftUpperArm'][70][0]), 0.05)
            self.assertGreater(abs(data['bones']['leftUpperArm'][70][2]), 0.05)
            self.assertEqual(data['bones']['leftUpperArm'][0], [0, 0, 0])

    def test_rejects_wrong_pose_layout(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            audio = base / 'narration.wav'
            audio.write_bytes(b'RIFFfake')
            inp = base / 'motion.npz'
            np.savez(inp, poses=np.zeros((100, 100)))
            with self.assertRaisesRegex(ValueError, '165'):
                convert(inp, audio, base / 'motion.json')


if __name__ == '__main__':
    unittest.main()
