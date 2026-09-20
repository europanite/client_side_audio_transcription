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

Whisper と Transformers.js を利用した、ブラウザベースの AI 文字起こしプレイグラウンドです。
インストール、登録、支払いは不要です。

---

## 🚀 概要

このプロジェクトは、React、TypeScript、Vite で構築されたクライアントサイド文字起こし Web アプリです。
`@huggingface/transformers` を通じて Whisper をブラウザ内で直接実行するため、文字起こしのためにメディアファイルをバックエンドへアップロードせず、ローカルで処理します。

現在の実装では、UI から Whisper モデルを選択し、ローカルのメディアファイルを指定し、必要に応じて選択したモデルを読み込み、認識されたテキストを読み取り専用の文字起こし欄に表示できます。

## ✨ 機能

- **クライアントサイドの音声認識**  
  React アプリは `@huggingface/transformers` の `automatic-speech-recognition` パイプラインをブラウザから直接呼び出すため、文字起こしはすべてクライアント側で実行されます。

- **シンプルな3ステップのワークフロー**  
  UI は次の手順を案内します:
  1. Whisper モデルを読み込む。
  2. モデルの状態を確認する。
  3. 音声をアップロードして文字起こしを実行し、各ステップの状態を明確なメッセージで確認する。

- `@huggingface/transformers` による **ブラウザ内文字起こし**
- UI での **多言語 Whisper モデル選択**
- 組み込みで選択できるモデル:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- `AudioContext` を使い、クライアント側で音声を 16 kHz にデコード
- 推論前にステレオ音声をモノラルへミックス
- 長いメディア向けの分割文字起こし設定:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- 入力として受け付ける形式:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 技術スタック

- フロントエンド: React + TypeScript + Vite
- ML ランタイム: `@huggingface/transformers`
- 推論タスク: `automatic-speech-recognition`
- ブラウザの音声処理: Web Audio API (`AudioContext`)
- テスト: Jest + Testing Library
- コンテナ関連ツール: Docker + Docker Compose

---


## 仕組み

### 1. アプリのレイアウト

`App.tsx` は、アプリのシェル、タイトル、サブタイトル、`SettingsBar`、`HomeScreen` を描画します。

設定バーには現在、ランタイムの概要が表示されます:

- `Transformers.js + Whisper`

### 2. モデルとファイルの選択

`HomeScreen.tsx` は3ステップの UI を提供します:

1. モデルとメディアファイルを選択
2. モデルの状態を確認
3. 文字起こし結果を確認

画面には次の要素があります:

- Whisper モデルのドロップダウン
- ボタンから呼び出される非表示のファイル入力
- 処理中に表示されるステータステキストとスピナー
- 文字起こし用の textarea
- Clear ボタン

### 3. 文字起こし hook

`useTranscription.ts` が中核となる実装です。

次の値と関数を公開します:

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `reset()`

動作:

- 選択した Whisper モデルは初回利用時に遅延読み込みされます
- 同じモデルが選択されたままであれば、パイプラインのインスタンスをキャッシュして再利用します
- モデルを読み込む前に、ブラウザ向けの ONNX WASM 設定を適用します
- 選択したファイルを `ArrayBuffer` として読み込みます
- `AudioContext({ sampleRate: 16000 })` で音声をデコードします
- マルチチャンネル音声をモノラルにミックスダウンします
- `language` を意図的に未指定にしているため、Whisper は言語を自動検出します
- 認識されたテキストを transcript state に書き込みます

### 4. ステータスメッセージ

現在の UI は、ユーザー向けに次のような状態を表示します:

- idle: モデルとファイルを選択
- loading: 初回のモデル読み込みには時間がかかる場合があります
- ready: モデルの読み込みが完了し、使用可能
- transcribing: ブラウザ内でローカル文字起こしを実行中
- done: 文字起こし完了
- error: ステータスブロックの下にエラーメッセージを表示

## 対応メディアに関する注意

UI の説明では、音声または動画ファイルを選択でき、Whisper がブラウザ内で MP3 や MP4 などの対応メディアから音声を検出できるとしています。

ただし、実際の実装では選択したファイルを `AudioContext.decodeAudioData()` でデコードします。実際にデコードできるかどうかはブラウザのコーデック対応状況に依存します。そのため、最終的な対応範囲は、ユーザーのブラウザが選択したメディアファイルをデコードできるかどうかによって決まります。

---

## 🚀 はじめに

## npm

### 前提条件

- Node.js 20+ を推奨
- npm

### 実行

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

サービスが port `5173` で起動します。

## テスト

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### 前提条件

- [Docker Compose](https://docs.docker.com/compose/)

### 実行

```bash
docker compose build
docker compose up
```

サービスが port `5173` で起動します。

## テスト

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## 注意事項と制限

- モデルはブラウザ内で読み込まれるため、初回利用時には時間がかかる場合があります
- 大きなモデルほど多くのメモリを使用します
- 文字起こし速度はブラウザとデバイスに依存します
- メディアのデコード対応はブラウザのコーデック対応状況に依存します
- 現在のアプリにはバックエンドの文字起こしサービスはなく、文字起こしはクライアント側で実行されます

---

# ライセンス
- Apache License 2.0
