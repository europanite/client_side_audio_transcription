# Diagnosing jerky EMAGE/VRM animation

This capture is now **offline and fixed-timestep by default**. Previously,
`canvas.captureStream(30)` + `MediaRecorder` ran in real time in headless Chromium
with CPU SwiftShader, so rendering slowdowns produced repeated poses and then
sudden jumps. A nominal 30 fps video can still contain mostly frozen frames.

The new renderer asks for each explicit timestamp `frame / 30`, draws the VRM,
reads that frame as PNG, and pipes exactly 1,200 frames into FFmpeg at 30 fps.
It does not need a GPU; CPU rendering can take substantially longer than 40
seconds, but frame times remain deterministic. The final narration AAC is
still taken directly from the verified `narration.wav`.

For an A/B comparison, run the `emage-apply` service with environment variable
`VIDEO_AVATAR_CAPTURE_MODE=realtime` (default: `deterministic`). Real-time mode
retains the previous recording behavior and its possible stutter.

## Is the source motion itself jumpy?

From the repository root (Node.js 22+):

```sh
node video/scripts/inspect-emage-motion.mjs video/output/intermediate/emage-vrm-motion.json
```

The script prints angular changes in **degrees per frame** for SMPL-X local
joint quaternions. If many source rotations change by >15 degrees in one frame,
the jump originates upstream of the renderer. If source changes are gradual
but rendered body poses are wrong, investigate coordinate mapping and the VRM
rest frames.

## Coordinate-frame caveat

`video/avatar/smplx-retarget.mjs` currently assumes the SMPL-X and VRM
normalized humanoid rotation bases are compatible. It builds local rotations
with SMPL-X world quaternions and VRM rest-world quaternions, but does **not**
calibrate bone directions/axes for the specific source SMPL-X skeleton and
this particular VRM. Mapping 55 bone names is **not** proof of correct
source-to-target coordinate alignment. Incorrect arm twists or mirrored poses
can result, even with perfect frame capture.

Do not apply arbitrary sign flips or rotation multipliers to "fix" those poses.
Validate using a source T-pose and one-axis rotation fixtures; ideally compare
both skeletons with FK joint-direction error and hand trajectory error.

Also verify the SHA-256 fingerprint of the EMAGE NPZ's input WAV before mixing
it with a different narration; a new audio stream needs new EMAGE inference.
