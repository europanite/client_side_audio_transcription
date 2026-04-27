# [クライアントサイド音声文字起こし](https://github.com/europanite/client_side_audio_transcription "Client-Side Audio Transcription")

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


Whisper と Transformers.js を利用した、ブラウザベースの AI 文字起こしプレイグラウンドです。
インストール、登録、支払いは不要です。

---

## 🚀 概要

このプロジェクトは、React、TypeScript、Vite で構築されたクライアントサイド文字起こし Web アプリです。
`@huggingface/transformers` を通じて Whisper をブラウザ内で直接実行するため、メディアファイルは文字起こしのためにバックエンドへアップロードされず、ローカルで処理されます。

現在の実装では、UI 上で Whisper モデルを選択し、ローカルのメディアファイルを選び、選択したモデルを必要なタイミングで読み込み、認識されたテキストを読み取り専用の文字起こしエリアに表示できます。

## ✨ 機能

- **クライアントサイドの speech-to-text**  
  React アプリは、`@huggingface/transformers` の `automatic-speech-recognition` パイプラインをブラウザ内で直接呼び出すため、文字起こしは完全にクライアント上で実行されます。

- **シンプルな 3 ステップのワークフロー**  
  UI は次の流れを案内します。
  1. Whisper モデルを読み込む。
  2. モデルの状態を確認する。
  3. 音声をアップロードして文字起こしを実行し、各ステップで明確なステータスメッセージを表示する。

- `@huggingface/transformers` による**ブラウザ内文字起こし**
- UI 上での**多言語 Whisper モデル選択**
- サポートされる組み込みモデルオプション:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- `AudioContext` による 16 kHz へのクライアントサイド音声デコード
- 推論前のステレオからモノラルへのミキシング
- 長いメディア向けのチャンク分割文字起こし設定:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- ファイル入力で受け付ける形式:
  - `audio/*`
  - `video/mp4`
  - `video/webm`
  - `video/ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 技術スタック

- Frontend: React + TypeScript + Vite
- ML runtime: `@huggingface/transformers`
- Inference task: `automatic-speech-recognition`
- Browser audio handling: Web Audio API (`AudioContext`)
- Testing: Jest + Testing Library
- Container tooling: Docker + Docker Compose

---


## 仕組み

### 1. アプリのレイアウト

`App.tsx` は、アプリのシェル、タイトル、サブタイトル、`SettingsBar`、`HomeScreen` をレンダリングします。

現在、設定バーにはランタイムの概要が表示されます。

- `Transformers.js + Whisper`

### 2. モデルとファイルの選択

`HomeScreen.tsx` は 3 ステップの UI を提供します。

1. モデルとメディアファイルを選択する
2. モデルの状態を確認する
3. 文字起こし結果を読む

画面には次の要素が含まれます。

- Whisper モデルのドロップダウン
- ボタンで起動する非表示のファイル入力
- 処理中のステータステキストとスピナー
- 文字起こし用テキストエリア
- Clear ボタン

### 3. 文字起こしフック

`useTranscription.ts` が中核となる実装です。

公開する値と関数は次のとおりです。

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `reset()`

動作:

- 選択された Whisper モデルは初回利用時に遅延読み込みされます
- 同じモデルが選択されたままの場合、パイプラインインスタンスはキャッシュされ再利用されます
- モデル読み込み前に、ブラウザ向けの ONNX WASM 設定が適用されます
- 選択されたファイルは `ArrayBuffer` として読み込まれます
- 音声は `AudioContext({ sampleRate: 16000 })` でデコードされます
- マルチチャンネル音声はモノラルにミックスダウンされます
- `language` は意図的に未設定のため、Whisper は自動言語検出で実行されます
- 認識されたテキストは transcript state に書き込まれます

### 4. ステータスメッセージ

現在の UI は、次のようなユーザー向け状態を表示します。

- idle: モデルとファイルを選択する
- loading: 初回のモデル読み込みには時間がかかる場合がある
- ready: モデルが読み込まれ準備完了
- transcribing: ローカルブラウザ文字起こしを実行中
- done: 文字起こし完了
- error: ステータスブロックの下に失敗メッセージを表示

## サポートされるメディアに関する注意

UI テキストでは、ユーザーが音声または動画ファイルを選択でき、Whisper がブラウザ内で MP3 や MP4 などのサポート対象メディアから音声を検出できると説明しています。

ただし、実際の実装では、選択されたファイルを `AudioContext.decodeAudioData()` でデコードします。実用上、デコードの成否はブラウザのコーデックサポートに依存します。つまり、サポートされる動作は最終的に、ユーザーのブラウザが選択されたメディアファイルをデコードできるかどうかに制約されます。

---

## 🚀 はじめに

## ローカル開発

### 前提条件

- Node.js 20+ 推奨
- npm

### npm でローカル実行

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

### Docker Compose でローカル実行

```bash
docker compose build
docker compose up
```

これによりフロントエンドコンテナが起動し、Vite アプリがポート `5173` で配信されます。

## テスト

### ローカルでテストを実行

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose 開発

### 前提条件
- [Docker Compose](https://docs.docker.com/compose/)

### すべてのサービスをビルドして起動:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### テスト:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## 注意事項と制限

- モデル読み込みはブラウザ内で行われるため、初回利用時に時間がかかる場合があります
- 大きなモデルはより多くのメモリを使用します
- 文字起こし速度はブラウザとデバイスに依存します
- メディアのデコード対応はブラウザのコーデックサポートに依存します
- 現在のアプリにはバックエンド文字起こしサービスはありません。文字起こしはクライアントサイドで実行されます

---

# ライセンス
- Apache License 2.0
