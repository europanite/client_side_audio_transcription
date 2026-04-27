# [Transcrição de áudio no lado do cliente](https://github.com/europanite/client_side_audio_transcription "Client-Side Audio Transcription")

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


Um playground de transcrição por IA baseado no navegador, desenvolvido com Whisper e Transformers.js.
Não requer instalação, cadastro nem pagamento.

---

## 🚀 Visão geral

Este projeto é um app web de transcrição no lado do cliente, criado com React, TypeScript e Vite.
Ele executa o Whisper diretamente no navegador por meio de `@huggingface/transformers`, então os arquivos de mídia são processados localmente em vez de serem enviados a um backend para transcrição.

A implementação atual permite selecionar um modelo Whisper na UI, escolher um arquivo de mídia local, carregar o modelo selecionado sob demanda e exibir o texto reconhecido em uma área de transcrição somente leitura.

## ✨ Recursos

- **speech-to-text no lado do cliente**  
  O app React chama diretamente no navegador o pipeline `automatic-speech-recognition` de `@huggingface/transformers`, portanto a transcrição roda totalmente no cliente.

- **Fluxo simples em 3 etapas**  
  A UI orienta você a:
  1. Carregar o modelo Whisper.
  2. Verificar o status do modelo.
  3. Enviar áudio e executar a transcrição, com mensagens de status claras para cada etapa.

- **Transcrição no navegador** com `@huggingface/transformers`
- **Seleção de modelos Whisper multilíngues** na UI
- Opções de modelos integrados compatíveis:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Decodificação de áudio no lado do cliente para 16 kHz via `AudioContext`
- Mixagem de estéreo para mono antes da inferência
- Configurações de transcrição em blocos para mídias mais longas:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- A entrada de arquivo aceita:
  - `audio/*`
  - `video/mp4`
  - `video/webm`
  - `video/ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Stack tecnológica

- Frontend: React + TypeScript + Vite
- ML runtime: `@huggingface/transformers`
- Inference task: `automatic-speech-recognition`
- Browser audio handling: Web Audio API (`AudioContext`)
- Testing: Jest + Testing Library
- Container tooling: Docker + Docker Compose

---


## Como funciona

### 1. Layout do app

`App.tsx` renderiza o shell do app, o título, o subtítulo, `SettingsBar` e `HomeScreen`.

A barra de configurações atualmente exibe o resumo do runtime:

- `Transformers.js + Whisper`

### 2. Seleção de modelo e arquivo

`HomeScreen.tsx` fornece uma UI em 3 etapas:

1. Escolher um modelo e um arquivo de mídia
2. Verificar o status do modelo
3. Ler o resultado da transcrição

A tela inclui:

- Whisper model dropdown
- A hidden file input triggered by a button
- Status text and spinner while processing
- A transcript textarea
- A Clear button

### 3. Hook de transcrição

`useTranscription.ts` é a implementação principal.

Ele expõe:

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `reset()`

Comportamento:

- O modelo Whisper selecionado é carregado de forma lazy no primeiro uso
- A instância do pipeline é armazenada em cache e reutilizada se o mesmo modelo continuar selecionado
- Configurações ONNX WASM adequadas ao navegador são aplicadas antes do carregamento do modelo
- O arquivo selecionado é lido como `ArrayBuffer`
- O áudio é decodificado com `AudioContext({ sampleRate: 16000 })`
- Áudio multicanal é mixado para mono
- O Whisper roda com detecção automática de idioma porque `language` é intencionalmente deixado sem definição
- O texto reconhecido é escrito no transcript state

### 4. Mensagens de status

A UI atual informa estados voltados ao usuário, como:

- idle: choose a model and a file
- loading: first model load may be slow
- ready: model loaded and ready
- transcribing: local browser transcription is running
- done: transcription finished
- error: failure message shown below the status block

## Notas sobre mídias compatíveis

O texto da UI diz que os usuários podem selecionar arquivos de áudio ou vídeo e que o Whisper pode detectar fala no navegador a partir de mídias compatíveis, como MP3 ou MP4.

No entanto, a implementação real decodifica o arquivo selecionado usando `AudioContext.decodeAudioData()`. Na prática, o sucesso da decodificação depende do suporte a codecs do navegador. Isso significa que o comportamento compatível é, no fim, limitado pelo que o navegador do usuário consegue decodificar do arquivo de mídia selecionado.

---

## 🚀 Primeiros passos

## Desenvolvimento local

### Pré-requisitos

- Node.js 20+ recommended
- npm

### Executar localmente com npm

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

### Executar localmente com Docker Compose

```bash
docker compose build
docker compose up
```

Isso inicia o container frontend e serve o app Vite na porta `5173`.

## Testes

### Executar testes localmente

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose desenvolvimento

### Pré-requisitos
- [Docker Compose](https://docs.docker.com/compose/)

### Buildar e iniciar todos os serviços:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### Teste:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## Notas e limitações

- O carregamento do modelo acontece no navegador e pode levar tempo no primeiro uso
- Modelos maiores usam mais memória
- A velocidade de transcrição depende do navegador e do dispositivo
- O suporte à decodificação de mídia depende do suporte a codecs do navegador
- O app atual não tem serviço backend de transcrição; a transcrição é realizada no lado do cliente

---

# Licença
- Apache License 2.0
