# Client-Side Audio Transcription

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![OS](https://img.shields.io/badge/OS-Linux%20%7C%20macOS%20%7C%20Windows-blue)
[![CI](https://github.com/europanite/client_side_audio_transcription/actions/workflows/ci.yml/badge.svg)](https://github.com/europanite/client_side_audio_transcription/actions/workflows/ci.yml)
[![docker](https://github.com/europanite/client_side_audio_transcription/actions/workflows/docker.yml/badge.svg)](https://github.com/europanite/client_side_audio_transcription/actions/workflows/docker.yml)
[![pages](https://github.com/europanite/client_side_audio_transcription/actions/workflows/pages.yml/badge.svg)](https://github.com/europanite/client_side_audio_transcription/actions/workflows/pages.yml)

A browser-based AI transcription playground powered by Whisper and Transformers.js.
No installation, registration, or payment required.

## Overview

This project is a client-side transcription web app built with React, TypeScript, and Vite.
It runs Whisper directly in the browser through `@huggingface/transformers`, so media files are processed locally instead of being uploaded to a backend for transcription.

The current implementation supports selecting a Whisper model in the UI, choosing a local media file, loading the selected model on demand, and displaying the recognized text in a read-only transcript area.

## Current features

- In-browser transcription with `@huggingface/transformers`
- Multilingual Whisper model selection in the UI
- Supported built-in model options:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`
- Default model: `Xenova/whisper-small`
- Automatic language detection during transcription
- Local media file selection from the browser
- File input accepts:
  - `mp3`
  - `wavm`
  - `video/mp4`
  - `video/webm`
  - `video/ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`
- Client-side audio decoding to 16 kHz via `AudioContext`
- Stereo-to-mono mixing before inference
- Chunked transcription settings for longer media:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`
- Read-only transcript output area
- Clear button to reset transcript, file selection, and error state
- Jest test coverage for the transcription hook and UI behavior
- Docker-based dev/test setup
- GitHub Actions for CI, Docker test runs, and GitHub Pages deployment

## Tech stack

- Frontend: React + TypeScript + Vite
- ML runtime: `@huggingface/transformers`
- Inference task: `automatic-speech-recognition`
- Browser audio handling: Web Audio API (`AudioContext`)
- Testing: Jest + Testing Library
- Container tooling: Docker + Docker Compose
- Deployment: GitHub Pages

## How it works

### 1. App layout

`App.tsx` renders the app shell, title, subtitle, `SettingsBar`, and `HomeScreen`.

The settings bar currently displays the runtime summary:

- `Transformers.js + Whisper`

### 2. Model and file selection

`HomeScreen.tsx` provides a 3-step UI:

1. Choose a model and media file
2. Check model status
3. Read the transcription result

The screen includes:

- A Whisper model dropdown
- A hidden file input triggered by a button
- Status text and spinner while processing
- A transcript textarea
- A Clear button

### 3. Transcription hook

`useTranscription.ts` is the core implementation.

It exposes:

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `reset()`

Behavior:

- The selected Whisper model is loaded lazily on first use
- The pipeline instance is cached and reused if the same model remains selected
- Browser-friendly ONNX WASM settings are applied before model loading
- The selected file is read as an `ArrayBuffer`
- Audio is decoded with `AudioContext({ sampleRate: 16000 })`
- Multi-channel audio is mixed down to mono
- Whisper runs with automatic language detection because `language` is intentionally left unset
- The recognized text is written to the transcript state

### 4. Status messages

The current UI reports user-facing states such as:

- idle: choose a model and a file
- loading: first model load may be slow
- ready: model loaded and ready
- transcribing: local browser transcription is running
- done: transcription finished
- error: failure message shown below the status block

## Supported media notes

The UI text says users can select audio or video files and that Whisper can detect speech from supported media such as MP3 or MP4 in the browser.

However, the actual implementation decodes the selected file using `AudioContext.decodeAudioData()`. In practice, successful decoding depends on browser codec support. That means supported behavior is ultimately constrained by what the user’s browser can decode from the selected media file.

## Project structure

```text
.
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── docker.yml
│       └── pages.yml
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.test
│   └── app/
│       ├── public/
│       ├── src/
│       │   ├── __tests__/
│       │   ├── components/
│       │   ├── context/
│       │   ├── hooks/
│       │   └── screens/
│       ├── index.html
│       ├── jest.config.cjs
│       ├── tsconfig.json
│       └── vite.config.ts
├── docker-compose.yml
├── docker-compose.test.yml
└── README.md
```

## Local development

### Prerequisites

- Node.js 20+ recommended
- npm

### Run locally with npm

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

### Run locally with Docker Compose

```bash
docker compose build
docker compose up
```

This starts the frontend container and serves the Vite app on port `5173`.

## Testing

### Run tests locally

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

### Run tests with Docker Compose

```bash
docker compose -f docker-compose.test.yml up --build --exit-code-from frontend_test
```

## CI and deployment

### CI workflow

`.github/workflows/ci.yml` currently does the following:

- Runs Jest on Node 18, 20, and 22
- Runs TypeScript type checking
- Uploads coverage artifacts
- Builds the web app with `npm run build:demo`
- Uploads the build output as an artifact

### Docker workflow

`.github/workflows/docker.yml` runs the test suite through `docker compose -f docker-compose.test.yml`.

### Pages workflow

`.github/workflows/pages.yml` builds the frontend app and deploys `frontend/app/dist` to GitHub Pages.

## GitHub Pages base path

The Vite config sets:

```ts
base: "/client_side_audio_transcription/"
```

So this project is configured to be served from the repository subpath on GitHub Pages rather than from the domain root.

## Notes and limitations

- Model loading happens in the browser and may take time on first use
- Larger models use more memory
- Transcription speed depends on the browser and device
- Media decoding support depends on browser codec support
- The current app has no backend transcription service; transcription is performed client-side
- `Auth.tsx` exists as a small optional auth context utility, but it is not required for the current transcription flow shown in `App.tsx`

## License

Apache License 2.0
