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

一个基于浏览器、由 Whisper 和 Transformers.js 驱动的 AI 转写体验工具。
无需安装、注册或付费。

---

## 🚀 概述

本项目是一个使用 React、TypeScript 和 Vite 构建的客户端转写 Web 应用。
它通过 `@huggingface/transformers` 直接在浏览器中运行 Whisper，因此媒体文件会在本地处理，而不是上传到后端进行转写。

当前实现支持在 UI 中选择 Whisper 模型、选择本地媒体文件、按需加载所选模型，并在只读的转写区域中显示识别出的文本。

## ✨ 功能

- **客户端语音转文字**  
  React 应用直接在浏览器中调用 `@huggingface/transformers` 的 `automatic-speech-recognition` pipeline，因此转写完全在客户端执行。

- **简单的三步工作流**  
  UI 会引导你完成以下步骤：
  1. 加载 Whisper 模型。
  2. 检查模型状态。
  3. 上传音频并执行转写，每一步都会显示清晰的状态信息。

- 使用 `@huggingface/transformers` 进行 **浏览器内转写**
- 在 UI 中进行 **多语言 Whisper 模型选择**
- 内置支持的模型选项：
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- 通过 `AudioContext` 在客户端将音频解码为 16 kHz
- 推理前将立体声音频混合为单声道
- 针对较长媒体的分块转写设置：
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- 可接受的输入：
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 技术栈

- 前端：React + TypeScript + Vite
- ML 运行时：`@huggingface/transformers`
- 推理任务：`automatic-speech-recognition`
- 浏览器音频处理：Web Audio API (`AudioContext`)
- 测试：Jest + Testing Library
- 容器工具：Docker + Docker Compose

---


## 工作原理

### 1. 应用布局

`App.tsx` 会渲染应用外壳、标题、副标题、`SettingsBar` 和 `HomeScreen`。

设置栏当前会显示运行时摘要：

- `Transformers.js + Whisper`

### 2. 模型和文件选择

`HomeScreen.tsx` 提供三步式 UI：

1. 选择模型和媒体文件
2. 检查模型状态
3. 查看转写结果

界面包括：

- Whisper 模型下拉菜单
- 由按钮触发的隐藏文件输入框
- 处理过程中显示的状态文本和 spinner
- 转写文本区域
- Clear 按钮

### 3. 转写 hook

`useTranscription.ts` 是核心实现。

它暴露以下内容：

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `reset()`

行为：

- 所选 Whisper 模型在首次使用时延迟加载
- 如果仍选择同一个模型，则会缓存并复用 pipeline 实例
- 加载模型前会应用适合浏览器的 ONNX WASM 设置
- 所选文件会作为 `ArrayBuffer` 读取
- 使用 `AudioContext({ sampleRate: 16000 })` 解码音频
- 多声道音频会混合为单声道
- 由于有意不设置 `language`，Whisper 会自动检测语言
- 识别出的文本会写入 transcript state

### 4. 状态消息

当前 UI 会向用户显示以下状态：

- idle：选择模型和文件
- loading：首次加载模型可能较慢
- ready：模型已加载并可用
- transcribing：正在浏览器本地执行转写
- done：转写完成
- error：在状态区域下方显示失败信息

## 支持的媒体说明

UI 文本说明，用户可以选择音频或视频文件，并且 Whisper 可以在浏览器中从 MP3、MP4 等受支持的媒体中检测语音。

不过，实际实现使用 `AudioContext.decodeAudioData()` 解码所选文件。在实际使用中，能否成功解码取决于浏览器的 codec 支持。因此，最终支持范围受限于用户浏览器能否解码所选媒体文件。

---

## 🚀 开始使用

## npm

### 前置条件

- 建议使用 Node.js 20+
- npm

### 运行

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

这会在 port `5173` 上启动服务。

## 测试

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### 前置条件

- [Docker Compose](https://docs.docker.com/compose/)

### 运行

```bash
docker compose build
docker compose up
```

这会在 port `5173` 上启动服务。

## 测试

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## 注意事项与限制

- 模型会在浏览器中加载，首次使用时可能需要一些时间
- 较大的模型会占用更多内存
- 转写速度取决于浏览器和设备
- 媒体解码支持取决于浏览器的 codec 支持
- 当前应用没有后端转写服务；转写完全在客户端执行

---

# 许可证
- Apache License 2.0
