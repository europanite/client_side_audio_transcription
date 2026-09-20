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

Eine browserbasierte KI-Transkriptionsumgebung auf Basis von Whisper und Transformers.js.
Keine Installation, Registrierung oder Zahlung erforderlich.

---

## 🚀 Überblick

Dieses Projekt ist eine clientseitige Web-App für Transkription, die mit React, TypeScript und Vite erstellt wurde.
Whisper läuft über `@huggingface/transformers` direkt im Browser. Mediendateien werden daher lokal verarbeitet, anstatt zur Transkription an ein Backend hochgeladen zu werden.

Die aktuelle Implementierung unterstützt die Auswahl eines Whisper-Modells in der Benutzeroberfläche, die Auswahl einer lokalen Mediendatei, das bedarfsgesteuerte Laden des ausgewählten Modells und die Anzeige des erkannten Textes in einem schreibgeschützten Transkriptionsbereich.

## ✨ Funktionen

- **Clientseitige Spracherkennung**  
  Die React-App ruft die Pipeline `automatic-speech-recognition` aus `@huggingface/transformers` direkt im Browser auf, sodass die Transkription vollständig auf dem Client ausgeführt wird.

- **Einfacher Workflow in 3 Schritten**  
  Die Benutzeroberfläche führt durch folgende Schritte:
  1. Das Whisper-Modell laden.
  2. Den Modellstatus prüfen.
  3. Audio hochladen und die Transkription starten; für jeden Schritt werden klare Statusmeldungen angezeigt.

- **Transkription im Browser** mit `@huggingface/transformers`
- **Auswahl mehrsprachiger Whisper-Modelle** in der Benutzeroberfläche
- Unterstützte integrierte Modelloptionen:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Clientseitige Audiodekodierung auf 16 kHz über `AudioContext`
- Mischen von Stereo zu Mono vor der Inferenz
- Einstellungen für segmentierte Transkription längerer Medien:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- Akzeptierte Eingaben:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Technologie-Stack

- Frontend: React + TypeScript + Vite
- ML-Runtime: `@huggingface/transformers`
- Inferenzaufgabe: `automatic-speech-recognition`
- Audioverarbeitung im Browser: Web Audio API (`AudioContext`)
- Tests: Jest + Testing Library
- Container-Tools: Docker + Docker Compose

---


## Funktionsweise

### 1. App-Layout

`App.tsx` rendert die App-Shell, den Titel, den Untertitel, `SettingsBar` und `HomeScreen`.

Die Einstellungsleiste zeigt derzeit die Runtime-Zusammenfassung:

- `Transformers.js + Whisper`

### 2. Modell- und Dateiauswahl

`HomeScreen.tsx` stellt eine Benutzeroberfläche in 3 Schritten bereit:

1. Ein Modell und eine Mediendatei auswählen
2. Den Modellstatus prüfen
3. Das Transkriptionsergebnis lesen

Der Bildschirm enthält:

- Ein Dropdown-Menü für Whisper-Modelle
- Eine ausgeblendete Dateieingabe, die über eine Schaltfläche ausgelöst wird
- Statustext und Spinner während der Verarbeitung
- Ein Textfeld für das Transkript
- Eine Clear-Schaltfläche

### 3. Transkriptions-Hook

`useTranscription.ts` enthält die Kernimplementierung.

Es stellt Folgendes bereit:

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `reset()`

Verhalten:

- Das ausgewählte Whisper-Modell wird bei der ersten Verwendung verzögert geladen
- Die Pipeline-Instanz wird zwischengespeichert und wiederverwendet, solange dasselbe Modell ausgewählt bleibt
- Vor dem Laden des Modells werden browserfreundliche ONNX-WASM-Einstellungen angewendet
- Die ausgewählte Datei wird als `ArrayBuffer` eingelesen
- Das Audio wird mit `AudioContext({ sampleRate: 16000 })` dekodiert
- Mehrkanal-Audio wird auf Mono heruntergemischt
- Whisper verwendet die automatische Spracherkennung, da `language` absichtlich nicht gesetzt wird
- Der erkannte Text wird in den Transkriptionszustand geschrieben

### 4. Statusmeldungen

Die aktuelle Benutzeroberfläche meldet Zustände wie:

- idle: Modell und Datei auswählen
- loading: Das erstmalige Laden des Modells kann langsam sein
- ready: Modell geladen und einsatzbereit
- transcribing: Lokale Transkription im Browser läuft
- done: Transkription abgeschlossen
- error: Fehlermeldung wird unterhalb des Statusblocks angezeigt

## Hinweise zu unterstützten Medien

Der UI-Text weist darauf hin, dass Benutzer Audio- oder Videodateien auswählen können und Whisper im Browser Sprache aus unterstützten Medien wie MP3 oder MP4 erkennen kann.

Die tatsächliche Implementierung dekodiert die ausgewählte Datei jedoch mit `AudioContext.decodeAudioData()`. In der Praxis hängt eine erfolgreiche Dekodierung von der Codec-Unterstützung des Browsers ab. Das unterstützte Verhalten wird daher letztlich dadurch begrenzt, welche Inhalte der Browser des Benutzers aus der ausgewählten Mediendatei dekodieren kann.

---

## 🚀 Erste Schritte

## npm

### Voraussetzungen

- Node.js 20+ empfohlen
- npm

### Ausführen

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Dadurch wird der Dienst auf port `5173` gestartet.

## Tests

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### Voraussetzungen

- [Docker Compose](https://docs.docker.com/compose/)

### Ausführen

```bash
docker compose build
docker compose up
```

Dadurch wird der Dienst auf port `5173` gestartet.

## Tests

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## Hinweise und Einschränkungen

- Das Modell wird im Browser geladen und kann beim ersten Aufruf etwas Zeit benötigen
- Größere Modelle benötigen mehr Arbeitsspeicher
- Die Transkriptionsgeschwindigkeit hängt vom Browser und vom Gerät ab
- Die Unterstützung für Mediendekodierung hängt von der Codec-Unterstützung des Browsers ab
- Die aktuelle App besitzt keinen Backend-Transkriptionsdienst; die Transkription erfolgt clientseitig

---

# Lizenz
- Apache License 2.0
