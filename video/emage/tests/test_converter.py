import base64
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from sys import path
import numpy as np
path.insert(0, str(Path(__file__).resolve().parents[1]))
from convert_npz import convert, axis_angle_to_quaternion, FORMAT

class ConverterTests(unittest.TestCase):
    def test_full55_and_hash(self):
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder);wav=p/'narration.wav';wav.write_bytes(b'RIFFtest')
            poses=np.zeros((60,165),np.float32)
            poses[12,16*3]=0.6
            poses[12,39*3+2]=-0.7 # finger rotation, previously discarded
            inp=p/'motion.npz';np.savez(inp,poses=poses,mocap_frame_rate=30,trans=np.zeros((60,3)))
            out=p/'out.json';convert(inp,wav,out)
            data=json.loads(out.read_text())
            self.assertEqual(data['format'],FORMAT)
            self.assertEqual(data['frames'],60)
            self.assertEqual(data['audioSha256'],hashlib.sha256(wav.read_bytes()).hexdigest())
            q=np.frombuffer(base64.b64decode(data['quaternions']['data']),dtype='<f4').reshape(60,55,4)
            self.assertEqual(q.shape,(60,55,4))
            self.assertAlmostEqual(np.linalg.norm(q[12,16]),1,places=5)
            self.assertGreater(abs(q[12,39,2]),0.3)
            self.assertGreater(abs(q[12,16,0]),0.25)
            np.testing.assert_allclose(q[0,16],[0,0,0,1])
    def test_rejects_invalid_input(self):
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder);wav=p/'narration.wav';wav.write_bytes(b'RIFF')
            np.savez(p/'bad.npz',poses=np.zeros((60,100)))
            with self.assertRaisesRegex(ValueError,'165'):convert(p/'bad.npz',wav,p/'out.json')
    def test_axis_angle_pi(self):
        a=np.array([[[0,0,np.pi]]],dtype=np.float64)
        np.testing.assert_allclose(axis_angle_to_quaternion(a)[0,0],[0,0,1,0],atol=1e-8)
if __name__=='__main__': unittest.main()
