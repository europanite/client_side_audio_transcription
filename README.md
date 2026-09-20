# [Client-Side Audio Transcription](https://github.com/europanite/client_side_audio_transcription "Client-Side Audio Transcription")

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![OS](https://img.shields.io/badge/OS-Linux%20%7C%20macOS%20%7C%20Windows-blue)
[![CI](https://github.com/europanite/client_side_audio_transcription/actions/workflows/ci.yml/badge.svg)](https://github.com/europanite/client_side_audio_transcription/actions/workflows/ci.yml)
[![docker](https://github.com/europanite/client_side_audio_transcription/actions/workflows/docker.yml/badge.svg)](https://github.com/europanite/client_side_audio_transcription/actions/workflows/docker.yml)
[![pages](https://github.com/europanite/client_side_audio_transcription/actions/workflows/pages.yml/badge.svg)](https://github.com/europanite/client_side_audio_transcription/actions/workflows/pages.yml)

![React](https://img.shields.io/badge/react-%2320232a.svg?logo=react&logoColor=%2361DAFB)
![Jest](https://img.shields.io/badge/-jest-%23C21325?logo=jest&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?logo=vite&logoColor=white)

<p align="right">
  <a href="./README.md">🇺🇸 English</a> |
  <a href="./README.hi.md">🇮🇳 हिंदी</a> |
  <a href="./README.ja.md">🇯🇵 日本語</a> |
  <a href="./README.zh-CN.md">🇨🇳 简体中文</a> |
  <a href="./README.es.md">🇪🇸 Español</a> |
  <a href="./README.pt-BR.md">🇧🇷 Português (Brasil)</a> |
  <a href="./README.ko.md">🇰🇷 한국어</a> |
  <a href="./README.de.md">🇩🇪 Deutsch</a> |
  <a href="./README.fr.md">🇫🇷 Français</a>
</p>

!["web_ui"](./assets/images/web_ui.png)

 [PlayGround](https://europanite.github.io/client_side_audio_transcription/)

A browser-based AI transcription playground powered by Whisper and Transformers.js.
No installation, registration, or payment required.

---

## 🚀 Overview

This project is a client-side transcription web app built with React, TypeScript, and Vite.
It runs Whisper directly in the browser through `@huggingface/transformers`, so media files are processed locally instead of being uploaded to a backend for transcription.

The current implementation supports selecting a Whisper model in the UI, transcribing local media files, streaming live microphone input, loading the selected model on demand, and displaying recognized text in a read-only transcript area.

## ✨ Features

- **Client-side speech-to-text**  
  The React app calls the `automatic-speech-recognition` pipeline from `@huggingface/transformers` directly in the browser, so transcription runs entirely on the client.

- **Simple 3-step workflow**  
  The UI guides you through:
  1. Loading the Whisper model.
  2. Checking model status.
  3. Uploading audio and running transcription, with clear status messages for each step.

- **Live microphone streaming transcription**  
  The app can capture microphone audio directly in the browser and transcribe it continuously without uploading audio to a server.
  - Live PCM audio is captured with the Web Audio API
  - Audio is buffered into short windows before Whisper inference
  - Streaming Whisper inference runs in a Web Worker to keep the UI responsive
  - A live microphone level meter shows whether audio is actually being received
  - `Stop microphone` stops capture immediately, while remaining buffered audio is finalized asynchronously

- **In-browser transcription** with `@huggingface/transformers`
- **Multilingual Whisper model selection** in the UI
- Supported built-in model options:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Client-side audio decoding to 16 kHz via `AudioContext`
- Stereo-to-mono mixing before inference
- Chunked transcription settings for longer media:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- Input accepts:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Tech stack

- Frontend: React + TypeScript + Vite
- ML runtime: `@huggingface/transformers`
- Inference task: `automatic-speech-recognition`
- Browser audio handling: Web Audio API (`AudioContext`)
- Testing: Jest + Testing Library
- Container tooling: Docker + Docker Compose

---


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
- Start/Stop microphone controls
- A live microphone level meter
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
- `startStream(stream)`
- `startMicrophone()`
- `stopStream()`
- `audioLevel`
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

### 4. Live microphone streaming

The app also supports live microphone input in addition to local media files.

When `Start microphone` is pressed:

1. The selected Whisper model is prepared in a Web Worker.
2. The browser requests microphone permission.
3. Microphone audio is captured as mono PCM through the Web Audio API.
4. PCM samples are buffered into short windows and sent to the Worker for transcription.
5. Recognized text is appended to the transcript as each window finishes.

The live input UI includes a microphone level meter based on the incoming PCM signal, so users can confirm that audio is actually being captured even while transcription is still processing.

When `Stop microphone` is pressed, microphone capture and the media tracks are stopped immediately. Any audio that was already buffered is finalized asynchronously in the Worker so the Stop action does not need to wait for Whisper inference to finish.

### 5. Status messages

The current UI reports user-facing states such as:

- idle: choose a model and a file
- loading: first model load may be slow
- ready: model loaded and ready
- starting-stream: preparing the Worker and microphone input
- streaming: live microphone capture is active
- finalizing-stream: microphone capture has stopped and buffered audio is still being transcribed
- transcribing: local browser transcription is running
- done: transcription finished
- error: failure message shown below the status block

## Supported media notes

The UI text says users can select audio or video files and that Whisper can detect speech from supported media such as MP3 or MP4 in the browser.

However, the actual implementation decodes the selected file using `AudioContext.decodeAudioData()`. In practice, successful decoding depends on browser codec support. That means supported behavior is ultimately constrained by what the user’s browser can decode from the selected media file.

---

## 🚀 Getting Started

## npm

### Prerequisites

- Node.js 20+ recommended
- npm

### Run

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

This starts the service on port `5173`.

## Test

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### Prerequisites

- [Docker Compose](https://docs.docker.com/compose/)

### Run

```bash
docker compose build
docker compose up
```

This starts the service on port `5173`.

## Test

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## Notes and limitations

- Model loading happens in the browser and may take time on first use
- Larger models use more memory
- Transcription speed depends on the browser and device
- Media decoding support depends on browser codec support
- Live microphone transcription has a short delay because audio is processed in buffered windows
- Browser microphone permission is required for live streaming
- The current app has no backend transcription service; transcription is performed client-side

---

# License
- Apache License 2.0