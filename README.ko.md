# [클라이언트 사이드 오디오 전사](https://github.com/europanite/client_side_audio_transcription "Client-Side Audio Transcription")

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


Whisper와 Transformers.js로 구동되는 브라우저 기반 AI 전사 playground입니다.
설치, 가입, 결제가 필요 없습니다.

---

## 🚀 개요

이 프로젝트는 React, TypeScript, Vite로 구축된 클라이언트 사이드 전사 웹 앱입니다.
`@huggingface/transformers`를 통해 Whisper를 브라우저에서 직접 실행하므로, 미디어 파일은 전사를 위해 백엔드로 업로드되지 않고 로컬에서 처리됩니다.

현재 구현은 UI에서 Whisper 모델을 선택하고, 로컬 미디어 파일을 선택하며, 선택한 모델을 필요할 때 로드하고, 인식된 텍스트를 읽기 전용 transcript 영역에 표시하는 기능을 지원합니다.

## ✨ 기능

- **클라이언트 사이드 speech-to-text**  
  React 앱은 브라우저에서 `@huggingface/transformers`의 `automatic-speech-recognition` pipeline을 직접 호출하므로, 전사는 완전히 클라이언트에서 실행됩니다.

- **간단한 3단계 workflow**  
  UI는 다음 과정을 안내합니다:
  1. Whisper 모델 로드.
  2. 모델 상태 확인.
  3. 오디오를 업로드하고 전사를 실행하며, 각 단계마다 명확한 상태 메시지를 표시.

- `@huggingface/transformers`를 사용한 **브라우저 내 전사**
- UI에서 **다국어 Whisper 모델 선택**
- 지원되는 내장 모델 옵션:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- `AudioContext`를 통한 클라이언트 사이드 16 kHz 오디오 디코딩
- 추론 전 stereo-to-mono mixing
- 긴 미디어를 위한 chunked transcription 설정:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- 파일 입력이 허용하는 형식:
  - `audio/*`
  - `video/mp4`
  - `video/webm`
  - `video/ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 기술 스택

- Frontend: React + TypeScript + Vite
- ML runtime: `@huggingface/transformers`
- Inference task: `automatic-speech-recognition`
- Browser audio handling: Web Audio API (`AudioContext`)
- Testing: Jest + Testing Library
- Container tooling: Docker + Docker Compose

---


## 작동 방식

### 1. 앱 레이아웃

`App.tsx`는 app shell, title, subtitle, `SettingsBar`, `HomeScreen`을 렌더링합니다.

설정 바는 현재 runtime summary를 표시합니다:

- `Transformers.js + Whisper`

### 2. 모델 및 파일 선택

`HomeScreen.tsx`는 3단계 UI를 제공합니다:

1. 모델과 미디어 파일 선택
2. 모델 상태 확인
3. 전사 결과 읽기

화면에는 다음이 포함됩니다:

- Whisper model dropdown
- A hidden file input triggered by a button
- Status text and spinner while processing
- A transcript textarea
- A Clear button

### 3. 전사 hook

`useTranscription.ts`가 핵심 구현입니다.

다음을 expose합니다:

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `reset()`

동작:

- 선택한 Whisper 모델은 최초 사용 시 lazy load됩니다
- 같은 모델이 선택된 상태로 유지되면 pipeline instance가 캐시되어 재사용됩니다
- 모델 로딩 전에 브라우저 친화적인 ONNX WASM 설정이 적용됩니다
- 선택한 파일은 `ArrayBuffer`로 읽힙니다
- 오디오는 `AudioContext({ sampleRate: 16000 })`로 디코딩됩니다
- 멀티채널 오디오는 모노로 mix down됩니다
- `language`를 의도적으로 설정하지 않기 때문에 Whisper는 자동 언어 감지로 실행됩니다
- 인식된 텍스트는 transcript state에 기록됩니다

### 4. 상태 메시지

현재 UI는 다음과 같은 사용자 대상 상태를 보고합니다:

- idle: choose a model and a file
- loading: first model load may be slow
- ready: model loaded and ready
- transcribing: local browser transcription is running
- done: transcription finished
- error: failure message shown below the status block

## 지원 미디어 참고 사항

UI 텍스트는 사용자가 오디오 또는 비디오 파일을 선택할 수 있고, Whisper가 브라우저에서 MP3 또는 MP4 같은 지원 미디어의 음성을 감지할 수 있다고 설명합니다.

하지만 실제 구현은 선택한 파일을 `AudioContext.decodeAudioData()`로 디코딩합니다. 실제로 성공적인 디코딩은 브라우저 codec support에 달려 있습니다. 즉 지원 동작은 결국 사용자의 브라우저가 선택한 미디어 파일을 디코딩할 수 있는지에 의해 제한됩니다.

---

## 🚀 시작하기

## 로컬 개발

### 전제 조건

- Node.js 20+ recommended
- npm

### npm으로 로컬 실행

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

### Docker Compose로 로컬 실행

```bash
docker compose build
docker compose up
```

이 명령은 frontend container를 시작하고 Vite app을 port `5173`에서 제공합니다.

## 테스트

### 로컬에서 테스트 실행

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose 개발

### 전제 조건
- [Docker Compose](https://docs.docker.com/compose/)

### 모든 서비스를 build하고 start:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 테스트:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## 참고 및 제한 사항

- 모델 로딩은 브라우저에서 이루어지며 최초 사용 시 시간이 걸릴 수 있습니다
- 더 큰 모델은 더 많은 메모리를 사용합니다
- 전사 속도는 브라우저와 기기에 따라 달라집니다
- 미디어 디코딩 지원은 브라우저 codec support에 따라 달라집니다
- 현재 앱에는 backend transcription service가 없으며, 전사는 client-side에서 수행됩니다

---

# 라이선스
- Apache License 2.0
