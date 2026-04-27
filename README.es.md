# [Transcripción de audio del lado del cliente](https://github.com/europanite/client_side_audio_transcription "Client-Side Audio Transcription")

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


Un playground de transcripción con IA basado en el navegador, impulsado por Whisper y Transformers.js.
No requiere instalación, registro ni pago.

---

## 🚀 Descripción general

Este proyecto es una aplicación web de transcripción del lado del cliente construida con React, TypeScript y Vite.
Ejecuta Whisper directamente en el navegador mediante `@huggingface/transformers`, por lo que los archivos multimedia se procesan localmente en lugar de subirse a un backend para la transcripción.

La implementación actual permite seleccionar un modelo Whisper en la UI, elegir un archivo multimedia local, cargar el modelo seleccionado bajo demanda y mostrar el texto reconocido en un área de transcripción de solo lectura.

## ✨ Características

- **speech-to-text del lado del cliente**  
  La app React llama directamente en el navegador al pipeline `automatic-speech-recognition` de `@huggingface/transformers`, por lo que la transcripción se ejecuta completamente en el cliente.

- **Flujo simple de 3 pasos**  
  La UI te guía por:
  1. Cargar el modelo Whisper.
  2. Comprobar el estado del modelo.
  3. Subir audio y ejecutar la transcripción, con mensajes de estado claros para cada paso.

- **Transcripción en el navegador** con `@huggingface/transformers`
- **Selección de modelos Whisper multilingües** en la UI
- Opciones de modelos integrados compatibles:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Decodificación de audio del lado del cliente a 16 kHz mediante `AudioContext`
- Mezcla de estéreo a mono antes de la inferencia
- Configuración de transcripción por fragmentos para medios más largos:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- La entrada de archivos acepta:
  - `audio/*`
  - `video/mp4`
  - `video/webm`
  - `video/ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Stack tecnológico

- Frontend: React + TypeScript + Vite
- ML runtime: `@huggingface/transformers`
- Inference task: `automatic-speech-recognition`
- Browser audio handling: Web Audio API (`AudioContext`)
- Testing: Jest + Testing Library
- Container tooling: Docker + Docker Compose

---


## Cómo funciona

### 1. Diseño de la aplicación

`App.tsx` renderiza el shell de la app, el título, el subtítulo, `SettingsBar` y `HomeScreen`.

La barra de configuración muestra actualmente el resumen del runtime:

- `Transformers.js + Whisper`

### 2. Selección de modelo y archivo

`HomeScreen.tsx` proporciona una UI de 3 pasos:

1. Elegir un modelo y un archivo multimedia
2. Comprobar el estado del modelo
3. Leer el resultado de la transcripción

La pantalla incluye:

- Whisper model dropdown
- A hidden file input triggered by a button
- Status text and spinner while processing
- A transcript textarea
- A Clear button

### 3. Hook de transcripción

`useTranscription.ts` es la implementación central.

Expone:

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `reset()`

Comportamiento:

- El modelo Whisper seleccionado se carga de forma diferida en el primer uso
- La instancia del pipeline se almacena en caché y se reutiliza si sigue seleccionado el mismo modelo
- Antes de cargar el modelo se aplican ajustes ONNX WASM adecuados para el navegador
- El archivo seleccionado se lee como `ArrayBuffer`
- El audio se decodifica con `AudioContext({ sampleRate: 16000 })`
- El audio multicanal se mezcla a mono
- Whisper se ejecuta con detección automática de idioma porque `language` se deja intencionalmente sin definir
- El texto reconocido se escribe en el transcript state

### 4. Mensajes de estado

La UI actual informa estados orientados al usuario como:

- idle: choose a model and a file
- loading: first model load may be slow
- ready: model loaded and ready
- transcribing: local browser transcription is running
- done: transcription finished
- error: failure message shown below the status block

## Notas sobre medios compatibles

El texto de la UI indica que los usuarios pueden seleccionar archivos de audio o video y que Whisper puede detectar voz en el navegador desde medios compatibles como MP3 o MP4.

Sin embargo, la implementación real decodifica el archivo seleccionado usando `AudioContext.decodeAudioData()`. En la práctica, el éxito de la decodificación depende del soporte de códecs del navegador. Esto significa que el comportamiento compatible está finalmente limitado por lo que el navegador del usuario pueda decodificar del archivo multimedia seleccionado.

---

## 🚀 Primeros pasos

## Desarrollo local

### Requisitos previos

- Node.js 20+ recommended
- npm

### Ejecutar localmente con npm

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

### Ejecutar localmente con Docker Compose

```bash
docker compose build
docker compose up
```

Esto inicia el contenedor frontend y sirve la app Vite en el puerto `5173`.

## Pruebas

### Ejecutar pruebas localmente

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose desarrollo

### Requisitos previos
- [Docker Compose](https://docs.docker.com/compose/)

### Compilar e iniciar todos los servicios:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### Prueba:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## Notas y limitaciones

- La carga del modelo ocurre en el navegador y puede tardar en el primer uso
- Los modelos más grandes usan más memoria
- La velocidad de transcripción depende del navegador y del dispositivo
- El soporte de decodificación multimedia depende del soporte de códecs del navegador
- La app actual no tiene servicio backend de transcripción; la transcripción se realiza del lado del cliente

---

# Licencia
- Apache License 2.0
