# [Client-seitige Audiotranskription](https://github.com/europanite/client_side_audio_transcription "Client-Side Audio Transcription")

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


Ein browserbasiertes KI-Transkriptions-Playground, betrieben mit Whisper und Transformers.js.
Keine Installation, Registrierung oder Zahlung erforderlich.

---

## 🚀 Überblick

Dieses Projekt ist eine client-seitige Transkriptions-Web-App, gebaut mit React, TypeScript und Vite.
Sie führt Whisper über `@huggingface/transformers` direkt im Browser aus, sodass Mediendateien lokal verarbeitet werden, statt zur Transkription an ein Backend hochgeladen zu werden.

Die aktuelle Implementierung unterstützt die Auswahl eines Whisper-Modells in der UI, die Auswahl einer lokalen Mediendatei, das bedarfsgesteuerte Laden des gewählten Modells und die Anzeige des erkannten Textes in einem schreibgeschützten Transkriptbereich.

## ✨ Funktionen

- **Client-seitiges speech-to-text**  
  Die React-App ruft die `automatic-speech-recognition` pipeline von `@huggingface/transformers` direkt im Browser auf, sodass die Transkription vollständig auf dem Client läuft.

- **Einfacher 3-Schritte-Workflow**  
  Die UI führt dich durch:
  1. Laden des Whisper-Modells.
  2. Prüfen des Modellstatus.
  3. Hochladen von Audio und Ausführen der Transkription, mit klaren Statusmeldungen für jeden Schritt.

- **Transkription im Browser** mit `@huggingface/transformers`
- **Auswahl mehrsprachiger Whisper-Modelle** in der UI
- Unterstützte eingebaute Modelloptionen:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Client-seitiges Audio-Decoding auf 16 kHz über `AudioContext`
- Stereo-zu-Mono-Mixing vor der Inferenz
- Chunked-Transkriptionseinstellungen für längere Medien:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- Die Dateieingabe akzeptiert:
  - `audio/*`
  - `video/mp4`
  - `video/webm`
  - `video/ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Tech-Stack

- Frontend: React + TypeScript + Vite
- ML runtime: `@huggingface/transformers`
- Inference task: `automatic-speech-recognition`
- Browser audio handling: Web Audio API (`AudioContext`)
- Testing: Jest + Testing Library
- Container tooling: Docker + Docker Compose

---


## Funktionsweise

### 1. App-Layout

`App.tsx` rendert die App-Shell, den Titel, den Untertitel, `SettingsBar` und `HomeScreen`.

Die Einstellungsleiste zeigt derzeit die Runtime-Zusammenfassung:

- `Transformers.js + Whisper`

### 2. Modell- und Dateiauswahl

`HomeScreen.tsx` stellt eine 3-Schritte-UI bereit:

1. Modell und Mediendatei auswählen
2. Modellstatus prüfen
3. Transkriptionsergebnis lesen

Der Bildschirm enthält:

- Whisper model dropdown
- A hidden file input triggered by a button
- Status text and spinner while processing
- A transcript textarea
- A Clear button

### 3. Transkriptions-Hook

`useTranscription.ts` ist die Kernimplementierung.

Er stellt bereit:

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `reset()`

Verhalten:

- Das ausgewählte Whisper-Modell wird beim ersten Einsatz lazy geladen
- Die Pipeline-Instanz wird zwischengespeichert und wiederverwendet, solange dasselbe Modell ausgewählt bleibt
- Vor dem Laden des Modells werden browserfreundliche ONNX-WASM-Einstellungen angewendet
- Die ausgewählte Datei wird als `ArrayBuffer` gelesen
- Audio wird mit `AudioContext({ sampleRate: 16000 })` decodiert
- Mehrkanal-Audio wird auf Mono heruntergemischt
- Whisper läuft mit automatischer Spracherkennung, weil `language` absichtlich nicht gesetzt wird
- Der erkannte Text wird in den transcript state geschrieben

### 4. Statusmeldungen

Die aktuelle UI meldet nutzerorientierte Zustände wie:

- idle: choose a model and a file
- loading: first model load may be slow
- ready: model loaded and ready
- transcribing: local browser transcription is running
- done: transcription finished
- error: failure message shown below the status block

## Hinweise zu unterstützten Medien

Der UI-Text besagt, dass Nutzer Audio- oder Videodateien auswählen können und dass Whisper im Browser Sprache aus unterstützten Medien wie MP3 oder MP4 erkennen kann.

Die tatsächliche Implementierung decodiert die ausgewählte Datei jedoch mit `AudioContext.decodeAudioData()`. In der Praxis hängt erfolgreiches Decoding von der Codec-Unterstützung des Browsers ab. Das bedeutet, dass das unterstützte Verhalten letztlich dadurch begrenzt wird, was der Browser des Nutzers aus der ausgewählten Mediendatei decodieren kann.

---

## 🚀 Erste Schritte

## Lokale Entwicklung

### Voraussetzungen

- Node.js 20+ recommended
- npm

### Lokal mit npm ausführen

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

### Lokal mit Docker Compose ausführen

```bash
docker compose build
docker compose up
```

Dies startet den frontend container und stellt die Vite-App auf Port `5173` bereit.

## Tests

### Tests lokal ausführen

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose Entwicklung

### Voraussetzungen
- [Docker Compose](https://docs.docker.com/compose/)

### Alle Services bauen und starten:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### Test:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## Hinweise und Einschränkungen

- Das Modell wird im Browser geladen und kann beim ersten Einsatz Zeit benötigen
- Größere Modelle verwenden mehr Speicher
- Die Transkriptionsgeschwindigkeit hängt vom Browser und Gerät ab
- Die Unterstützung für Mediendecoding hängt von der Codec-Unterstützung des Browsers ab
- Die aktuelle App hat keinen Backend-Transkriptionsdienst; die Transkription erfolgt client-seitig

---

# Lizenz
- Apache License 2.0
