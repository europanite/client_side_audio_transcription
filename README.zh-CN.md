# [客户端音频转写](https://github.com/europanite/client_side_audio_transcription "Client-Side Audio Transcription")

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


由 Whisper 和 Transformers.js 驱动的浏览器端 AI 转写 playground。
无需安装、注册或付费。

---

## 🚀 概述

本项目是一个使用 React、TypeScript 和 Vite 构建的客户端转写 Web 应用。
它通过 `@huggingface/transformers` 在浏览器中直接运行 Whisper，因此媒体文件会在本地处理，而不是上传到后端进行转写。

当前实现支持在 UI 中选择 Whisper 模型、选择本地媒体文件、按需加载所选模型，并在只读转写区域中显示识别出的文本。

## ✨ 功能

- **客户端 speech-to-text**  
  React 应用直接在浏览器中调用 `@huggingface/transformers` 的 `automatic-speech-recognition` pipeline，因此转写完全在客户端运行。

- **简单的 3 步工作流**  
  UI 会引导你完成：
  1. 加载 Whisper 模型。
  2. 检查模型状态。
  3. 上传音频并运行转写，同时为每个步骤显示清晰的状态消息。

- 使用 `@huggingface/transformers` 进行**浏览器内转写**
- UI 中的**多语言 Whisper 模型选择**
- 支持的内置模型选项:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- 通过 `AudioContext` 在客户端将音频解码为 16 kHz
- 推理前进行立体声到单声道混音
- 面向较长媒体的分块转写设置:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- 文件输入接受:
  - `audio/*`
  - `video/mp4`
  - `video/webm`
  - `video/ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 技术栈

- Frontend: React + TypeScript + Vite
- ML runtime: `@huggingface/transformers`
- Inference task: `automatic-speech-recognition`
- Browser audio handling: Web Audio API (`AudioContext`)
- Testing: Jest + Testing Library
- Container tooling: Docker + Docker Compose

---


## 工作原理

### 1. 应用布局

`App.tsx` 渲染 app shell、标题、副标题、`SettingsBar` 和 `HomeScreen`。

设置栏当前显示运行时摘要：

- `Transformers.js + Whisper`

### 2. 模型和文件选择

`HomeScreen.tsx` 提供 3 步 UI：

1. 选择模型和媒体文件
2. 检查模型状态
3. 读取转写结果

该页面包含：

- Whisper model dropdown
- A hidden file input triggered by a button
- Status text and spinner while processing
- A transcript textarea
- A Clear button

### 3. 转写 hook

`useTranscription.ts` 是核心实现。

它暴露：

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `reset()`

行为：

- 所选 Whisper 模型会在首次使用时延迟加载
- 如果仍然选择同一模型，pipeline 实例会被缓存并复用
- 模型加载前会应用适合浏览器的 ONNX WASM 设置
- 所选文件会作为 `ArrayBuffer` 读取
- 音频使用 `AudioContext({ sampleRate: 16000 })` 解码
- 多声道音频会混合为单声道
- 由于 `language` 被有意保持未设置，Whisper 会使用自动语言检测运行
- 识别出的文本会写入 transcript state

### 4. 状态消息

当前 UI 会报告面向用户的状态，例如：

- idle: choose a model and a file
- loading: first model load may be slow
- ready: model loaded and ready
- transcribing: local browser transcription is running
- done: transcription finished
- error: failure message shown below the status block

## 支持的媒体说明

UI 文本说明用户可以选择音频或视频文件，并且 Whisper 可以在浏览器中从 MP3 或 MP4 等受支持媒体中检测语音。

不过，实际实现会使用 `AudioContext.decodeAudioData()` 解码所选文件。实践中，是否能成功解码取决于浏览器的 codec 支持。这意味着支持的行为最终受限于用户浏览器能否解码所选媒体文件。

---

## 🚀 入门

## 本地开发

### 前提条件

- Node.js 20+ recommended
- npm

### 使用 npm 本地运行

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

### 使用 Docker Compose 本地运行

```bash
docker compose build
docker compose up
```

这会启动 frontend container，并在端口 `5173` 上提供 Vite app。

## 测试

### 在本地运行测试

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose 开发

### 前提条件
- [Docker Compose](https://docs.docker.com/compose/)

### 构建并启动所有服务:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 测试:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## 注意事项和限制

- 模型加载发生在浏览器中，首次使用时可能需要一些时间
- 较大的模型会使用更多内存
- 转写速度取决于浏览器和设备
- 媒体解码支持取决于浏览器 codec 支持
- 当前应用没有后端转写服务；转写在客户端执行

---

# 许可证
- Apache License 2.0
