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

Um playground de transcrição com IA no navegador, desenvolvido com Whisper e Transformers.js.
Não requer instalação, cadastro nem pagamento.

---

## 🚀 Visão geral

Este projeto é um aplicativo web de transcrição client-side criado com React, TypeScript e Vite.
Ele executa o Whisper diretamente no navegador por meio de `@huggingface/transformers`, portanto os arquivos de mídia são processados localmente em vez de serem enviados a um backend para transcrição.

A implementação atual permite selecionar um modelo Whisper na interface, escolher um arquivo de mídia local, carregar o modelo selecionado sob demanda e exibir o texto reconhecido em uma área de transcrição somente leitura.

## ✨ Recursos

- **Speech-to-text client-side**  
  O aplicativo React chama diretamente no navegador o pipeline `automatic-speech-recognition` de `@huggingface/transformers`, portanto a transcrição é executada inteiramente no cliente.

- **Fluxo simples em 3 etapas**  
  A interface orienta você pelas etapas:
  1. Carregar o modelo Whisper.
  2. Verificar o status do modelo.
  3. Enviar áudio e executar a transcrição, com mensagens de status claras em cada etapa.

- **Transcrição no navegador** com `@huggingface/transformers`
- **Seleção de modelos Whisper multilíngues** na interface
- Opções de modelos integrados compatíveis:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Decodificação de áudio client-side para 16 kHz via `AudioContext`
- Conversão de estéreo para mono antes da inferência
- Configurações de transcrição em blocos para mídias mais longas:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- Entradas aceitas:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Stack tecnológico

- Frontend: React + TypeScript + Vite
- Runtime de ML: `@huggingface/transformers`
- Tarefa de inferência: `automatic-speech-recognition`
- Processamento de áudio no navegador: Web Audio API (`AudioContext`)
- Testes: Jest + Testing Library
- Ferramentas de contêiner: Docker + Docker Compose

---


## Como funciona

### 1. Layout do aplicativo

`App.tsx` renderiza a estrutura do aplicativo, o título, o subtítulo, `SettingsBar` e `HomeScreen`.

A barra de configurações exibe atualmente o resumo do runtime:

- `Transformers.js + Whisper`

### 2. Seleção de modelo e arquivo

`HomeScreen.tsx` fornece uma interface em 3 etapas:

1. Escolher um modelo e um arquivo de mídia
2. Verificar o status do modelo
3. Ler o resultado da transcrição

A tela inclui:

- Um menu suspenso de modelos Whisper
- Uma entrada de arquivo oculta acionada por um botão
- Texto de status e spinner durante o processamento
- Uma área de texto para a transcrição
- Um botão Clear

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
- Configurações de ONNX WASM adequadas ao navegador são aplicadas antes do carregamento do modelo
- O arquivo selecionado é lido como um `ArrayBuffer`
- O áudio é decodificado com `AudioContext({ sampleRate: 16000 })`
- O áudio multicanal é convertido para mono
- O Whisper usa detecção automática de idioma porque `language` é deixado intencionalmente sem definição
- O texto reconhecido é gravado no estado da transcrição

### 4. Mensagens de status

A interface atual exibe estados voltados ao usuário, como:

- idle: escolha um modelo e um arquivo
- loading: o primeiro carregamento do modelo pode ser lento
- ready: modelo carregado e pronto
- transcribing: a transcrição local no navegador está em execução
- done: transcrição concluída
- error: a mensagem de falha é exibida abaixo do bloco de status

## Observações sobre mídia compatível

O texto da interface informa que os usuários podem selecionar arquivos de áudio ou vídeo e que o Whisper pode detectar fala em mídias compatíveis, como MP3 ou MP4, no navegador.

No entanto, a implementação real decodifica o arquivo selecionado usando `AudioContext.decodeAudioData()`. Na prática, a decodificação bem-sucedida depende do suporte a codecs do navegador. Isso significa que o comportamento suportado é limitado, em última análise, ao que o navegador do usuário consegue decodificar no arquivo de mídia selecionado.

---

## 🚀 Primeiros passos

## npm

### Pré-requisitos

- Node.js 20+ recomendado
- npm

### Executar

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Isso inicia o serviço na port `5173`.

## Testes

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### Pré-requisitos

- [Docker Compose](https://docs.docker.com/compose/)

### Executar

```bash
docker compose build
docker compose up
```

Isso inicia o serviço na port `5173`.

## Testes

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## Observações e limitações

- O carregamento do modelo acontece no navegador e pode levar algum tempo no primeiro uso
- Modelos maiores usam mais memória
- A velocidade da transcrição depende do navegador e do dispositivo
- O suporte à decodificação de mídia depende do suporte a codecs do navegador
- O aplicativo atual não possui serviço de transcrição backend; a transcrição é realizada no client-side

---

# Licença
- Apache License 2.0
