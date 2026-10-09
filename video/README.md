# Reusable narrated demo-video pipeline

Ported for **client_side_audio_transcription**, without changing the React app or its main Docker tests. This is an *offline video-production pipeline*, not an extra service needed by end users. Its output is not rendered in the browser app.

## First run — real UI + TTS + subtitles + QR (no GPU)

From the **repository root**:

```bash
mkdir -p video/output
# Playwright records actual UI actions; Piper downloads its English voice once.
docker compose -f docker-compose.video.yml \
  up --build --abort-on-container-exit --exit-code-from video
```

Result: `video/output/video.mp4`, `video/output/preview.png`, `video/output/evidence.json`, plus original screen/audio recordings under `video/output/intermediate/`.

**What is shown:** Whisper model selection, language selection, microphone control, real audio-file upload, model status, and the transcript panel. A short synthetic speech sample made from the local voice-over is uploaded and processed by the actual app. No prerecorded transcript is fabricated. Downloading and running Whisper for the first time may exceed 40 seconds, in which case the video correctly shows a loading/transcribing state rather than a fake result. For a video showing a real completed transcript, prewarm the browser's model cache, use a smaller model, or record a longer customized timeline.

`video/scripts/scenes.mjs` is the per-project narration and timing configuration; `video/scripts/capture-actions.mjs` maps its scene IDs to Playwright UI interactions. These are the two files to change when porting the framework to **another** React/Vite project.

## Optional VRM 1.0 avatar (procedural gestures)

Provide a **legally licensed** VRM 1.0 asset at `video/avatar/avatar.vrm` locally (not shipped, not committed):

```bash
VIDEO_AVATAR_ENABLED=1 docker compose -f docker-compose.video.yml \
  up --build --abort-on-container-exit --exit-code-from video
```

The avatar lip-sync uses the real synthesized audio and hand gestures follow scene cue timings. **No VRM asset is included** because the previous example model has redistribution restrictions. Review the license and any required credits before publishing the video. If you don't have a distributable model, use the avatar-free mode.

## Optional EMAGE motion (Docker Compose only)

First produce a normal narrated video using the earlier command. Next generate motion **from the exact WAV actually used in the video**, convert it for the VRM renderer, and replace the avatar composite:

```bash
LOCAL_UID="$(id -u)" LOCAL_GID="$(id -g)" \
  docker compose -f docker-compose.video.emage.yml \
  up --build --abort-on-container-failure
```

If NVIDIA Container Toolkit is available, add `-f docker-compose.video.emage.gpu.yml` after the first `-f`. Docker Compose starts these in dependency order:

1. `emage-infer`: builds isolated PantoMatrix/PyTorch image, fetches weights, outputs `intermediate/emage/narration_output.npz`.
2. `emage-convert`: generates `intermediate/emage-vrm-motion.json`.
3. `emage-apply`: composites the existing UI+voice video with the VRM avatar. **No browser re-recording or re-synthesis happens in this step.**

The model and dependencies are large, and this project's EMAGE inference has **not been end-to-end validated** on your machine; an upstream dependency/weight change may require fixes. The included retargeter (`vrm1-emage-retarget-v2`) is still a **heuristic SMPL-X→VRM conversion**, not calibrated anatomical motion transfer. Different VRM rigs may require joint-axis adjustment. `video/output` is a bind mount; model-weight cache is a Docker volume.

EMAGE-generated gestures are combined with simple scene-authored movement, so this is not a pure evaluation of generated motion. When comparing methods scientifically, disable authored motion in the VRM renderer.

## Reusability and limitations

- `video/scripts/scenes.mjs`: change voice-over, cue times and destination URL.
- `video/scripts/capture-actions.mjs`: replace app-specific Playwright selectors/actions.
- `video/scripts/make-video.mjs`: generic recording/TTS/caption/mux stages.
- `video/avatar`: optional VRM browser renderer (normalized VRM 1.0 bones; no bundled model).
- `video/emage`: optional model and approximate remapping, isolated from main app.
- `docker-compose.video.yml`: regular CPU pipeline; `docker-compose.video.emage*.yml`: separate heavyweight stage.

This uses no hosted speech or motion API, but the Piper and PantoMatrix pretrained model downloads require network access on first use. This video **should not** claim that all browser-based programs are guaranteed "completely safe". Audio sample for this demo is synthetically generated, not a third-party recording.

## Tests and troubleshooting

```bash
node --test video/scripts/*.test.mjs video/avatar/*.test.mjs
python3 video/emage/tests/test_converter.py  # requires NumPy; or run in emage-convert image
```

If the app isn't ready, check `docker compose -f docker-compose.video.yml logs video-frontend`. If the model download takes too long, do not interpret an empty transcript as failure of the video recorder. If `emage-apply` says JSON is missing, inspect the prior `emage-infer`/`emage-convert` logs before retrying.
