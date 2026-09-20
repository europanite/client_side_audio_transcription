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

Un entorno de pruebas de transcripción con IA basado en navegador y desarrollado con Whisper y Transformers.js.
No requiere instalación, registro ni pago.

---

## 🚀 Descripción general

Este proyecto es una aplicación web de transcripción del lado del cliente creada con React, TypeScript y Vite.
Ejecuta Whisper directamente en el navegador mediante `@huggingface/transformers`, por lo que los archivos multimedia se procesan localmente en lugar de subirse a un backend para su transcripción.

La implementación actual permite seleccionar un modelo de Whisper en la interfaz, elegir un archivo multimedia local, cargar el modelo seleccionado bajo demanda y mostrar el texto reconocido en un área de transcripción de solo lectura.

## ✨ Funciones

- **Conversión de voz a texto del lado del cliente**  
  La aplicación React llama directamente en el navegador al pipeline `automatic-speech-recognition` de `@huggingface/transformers`, por lo que la transcripción se ejecuta íntegramente en el cliente.

- **Flujo de trabajo sencillo de 3 pasos**  
  La interfaz te guía por los siguientes pasos:
  1. Cargar el modelo de Whisper.
  2. Comprobar el estado del modelo.
  3. Subir audio y ejecutar la transcripción, con mensajes de estado claros en cada paso.

- **Transcripción en el navegador** con `@huggingface/transformers`
- **Selección de modelos Whisper multilingües** en la interfaz
- Opciones de modelos integrados compatibles:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Decodificación de audio del lado del cliente a 16 kHz mediante `AudioContext`
- Mezcla de estéreo a mono antes de la inferencia
- Configuración de transcripción por fragmentos para medios de mayor duración:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- Entradas aceptadas:
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
- Tarea de inferencia: `automatic-speech-recognition`
- Gestión de audio en el navegador: Web Audio API (`AudioContext`)
- Pruebas: Jest + Testing Library
- Herramientas de contenedores: Docker + Docker Compose

---


## Cómo funciona

### 1. Diseño de la aplicación

`App.tsx` renderiza la estructura de la aplicación, el título, el subtítulo, `SettingsBar` y `HomeScreen`.

La barra de configuración muestra actualmente el resumen del runtime:

- `Transformers.js + Whisper`

### 2. Selección de modelo y archivo

`HomeScreen.tsx` proporciona una interfaz de 3 pasos:

1. Elegir un modelo y un archivo multimedia
2. Comprobar el estado del modelo
3. Leer el resultado de la transcripción

La pantalla incluye:

- Un menú desplegable de modelos Whisper
- Una entrada de archivo oculta activada por un botón
- Texto de estado y spinner durante el procesamiento
- Un área de texto para la transcripción
- Un botón Clear

### 3. Hook de transcripción

`useTranscription.ts` contiene la implementación principal.

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
- Antes de cargar el modelo se aplican ajustes de ONNX WASM adecuados para el navegador
- El archivo seleccionado se lee como un `ArrayBuffer`
- El audio se decodifica con `AudioContext({ sampleRate: 16000 })`
- El audio multicanal se mezcla a mono
- Whisper usa detección automática de idioma porque `language` se deja sin definir intencionadamente
- El texto reconocido se escribe en el estado de la transcripción

### 4. Mensajes de estado

La interfaz actual muestra estados orientados al usuario como:

- idle: elige un modelo y un archivo
- loading: la primera carga del modelo puede ser lenta
- ready: modelo cargado y listo
- transcribing: la transcripción local en el navegador está en ejecución
- done: transcripción finalizada
- error: el mensaje de fallo se muestra debajo del bloque de estado

## Notas sobre los medios compatibles

El texto de la interfaz indica que los usuarios pueden seleccionar archivos de audio o vídeo y que Whisper puede detectar voz en medios compatibles como MP3 o MP4 dentro del navegador.

Sin embargo, la implementación real decodifica el archivo seleccionado mediante `AudioContext.decodeAudioData()`. En la práctica, una decodificación correcta depende de la compatibilidad de códecs del navegador. Por tanto, el comportamiento compatible queda limitado por los formatos que el navegador del usuario pueda decodificar del archivo multimedia seleccionado.

---

## 🚀 Primeros pasos

## npm

### Requisitos previos

- Se recomienda Node.js 20+
- npm

### Ejecutar

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Esto inicia el servicio en el port `5173`.

## Pruebas

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### Requisitos previos

- [Docker Compose](https://docs.docker.com/compose/)

### Ejecutar

```bash
docker compose build
docker compose up
```

Esto inicia el servicio en el port `5173`.

## Pruebas

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## Notas y limitaciones

- La carga del modelo se realiza en el navegador y puede tardar en el primer uso
- Los modelos más grandes utilizan más memoria
- La velocidad de transcripción depende del navegador y del dispositivo
- La compatibilidad de decodificación de medios depende de los códecs compatibles con el navegador
- La aplicación actual no tiene un servicio de transcripción backend; la transcripción se realiza del lado del cliente

---

# Licencia
- Apache License 2.0
