# [Transcription audio côté client](https://github.com/europanite/client_side_audio_transcription "Client-Side Audio Transcription")

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


Un playground de transcription IA basé sur le navigateur, propulsé par Whisper et Transformers.js.
Aucune installation, inscription ni paiement requis.

---

## 🚀 Aperçu

Ce projet est une application web de transcription côté client construite avec React, TypeScript et Vite.
Elle exécute Whisper directement dans le navigateur via `@huggingface/transformers`, de sorte que les fichiers média sont traités localement au lieu d’être envoyés à un backend pour transcription.

L’implémentation actuelle permet de sélectionner un modèle Whisper dans l’UI, de choisir un fichier média local, de charger le modèle sélectionné à la demande et d’afficher le texte reconnu dans une zone de transcription en lecture seule.

## ✨ Fonctionnalités

- **speech-to-text côté client**  
  L’app React appelle directement dans le navigateur le pipeline `automatic-speech-recognition` de `@huggingface/transformers`, donc la transcription s’exécute entièrement sur le client.

- **Workflow simple en 3 étapes**  
  L’UI vous guide pour :
  1. Charger le modèle Whisper.
  2. Vérifier l’état du modèle.
  3. Importer l’audio et lancer la transcription, avec des messages d’état clairs pour chaque étape.

- **Transcription dans le navigateur** avec `@huggingface/transformers`
- **Sélection de modèles Whisper multilingues** dans l’UI
- Options de modèles intégrés prises en charge:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Décodage audio côté client en 16 kHz via `AudioContext`
- Mixage stéréo vers mono avant l’inférence
- Paramètres de transcription par segments pour les médias plus longs:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- L’entrée de fichier accepte:
  - `audio/*`
  - `video/mp4`
  - `video/webm`
  - `video/ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Stack technique

- Frontend: React + TypeScript + Vite
- ML runtime: `@huggingface/transformers`
- Inference task: `automatic-speech-recognition`
- Browser audio handling: Web Audio API (`AudioContext`)
- Testing: Jest + Testing Library
- Container tooling: Docker + Docker Compose

---


## Fonctionnement

### 1. Disposition de l’application

`App.tsx` rend le shell de l’app, le titre, le sous-titre, `SettingsBar` et `HomeScreen`.

La barre de paramètres affiche actuellement le résumé du runtime :

- `Transformers.js + Whisper`

### 2. Sélection du modèle et du fichier

`HomeScreen.tsx` fournit une UI en 3 étapes :

1. Choisir un modèle et un fichier média
2. Vérifier l’état du modèle
3. Lire le résultat de la transcription

L’écran inclut :

- Whisper model dropdown
- A hidden file input triggered by a button
- Status text and spinner while processing
- A transcript textarea
- A Clear button

### 3. Hook de transcription

`useTranscription.ts` est l’implémentation centrale.

Il expose :

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `reset()`

Comportement :

- Le modèle Whisper sélectionné est chargé paresseusement lors de la première utilisation
- L’instance du pipeline est mise en cache et réutilisée si le même modèle reste sélectionné
- Des paramètres ONNX WASM adaptés au navigateur sont appliqués avant le chargement du modèle
- Le fichier sélectionné est lu comme un `ArrayBuffer`
- L’audio est décodé avec `AudioContext({ sampleRate: 16000 })`
- L’audio multicanal est mixé en mono
- Whisper s’exécute avec détection automatique de la langue car `language` est volontairement laissé non défini
- Le texte reconnu est écrit dans le transcript state

### 4. Messages d’état

L’UI actuelle signale des états destinés à l’utilisateur, tels que :

- idle: choose a model and a file
- loading: first model load may be slow
- ready: model loaded and ready
- transcribing: local browser transcription is running
- done: transcription finished
- error: failure message shown below the status block

## Notes sur les médias pris en charge

Le texte de l’UI indique que les utilisateurs peuvent sélectionner des fichiers audio ou vidéo et que Whisper peut détecter la parole dans le navigateur à partir de médias pris en charge comme MP3 ou MP4.

Cependant, l’implémentation réelle décode le fichier sélectionné avec `AudioContext.decodeAudioData()`. En pratique, le succès du décodage dépend du support des codecs par le navigateur. Cela signifie que le comportement pris en charge est finalement limité par ce que le navigateur de l’utilisateur peut décoder depuis le fichier média sélectionné.

---

## 🚀 Bien démarrer

## Développement local

### Prérequis

- Node.js 20+ recommended
- npm

### Exécuter localement avec npm

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

### Exécuter localement avec Docker Compose

```bash
docker compose build
docker compose up
```

Cela démarre le frontend container et sert l’app Vite sur le port `5173`.

## Tests

### Exécuter les tests localement

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose développement

### Prérequis
- [Docker Compose](https://docs.docker.com/compose/)

### Construire et démarrer tous les services :

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

## Notes et limites

- Le chargement du modèle se fait dans le navigateur et peut prendre du temps lors de la première utilisation
- Les modèles plus grands utilisent plus de mémoire
- La vitesse de transcription dépend du navigateur et de l’appareil
- La prise en charge du décodage média dépend du support des codecs du navigateur
- L’app actuelle n’a pas de service backend de transcription ; la transcription est effectuée côté client

---

# Licence
- Apache License 2.0
