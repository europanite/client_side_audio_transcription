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

Un environnement de transcription IA dans le navigateur, basé sur Whisper et Transformers.js.
Aucune installation, inscription ou paiement n’est requis.

---

## 🚀 Vue d’ensemble

Ce projet est une application web de transcription côté client construite avec React, TypeScript et Vite.
Whisper s’exécute directement dans le navigateur via `@huggingface/transformers`, ce qui permet de traiter les fichiers multimédias localement au lieu de les envoyer à un backend pour transcription.

L’implémentation actuelle permet de sélectionner un modèle Whisper dans l’interface, de choisir un fichier multimédia local, de charger le modèle sélectionné à la demande et d’afficher le texte reconnu dans une zone de transcription en lecture seule.

## ✨ Fonctionnalités

- **Reconnaissance vocale côté client**  
  L’application React appelle directement dans le navigateur le pipeline `automatic-speech-recognition` de `@huggingface/transformers`, de sorte que la transcription s’exécute entièrement côté client.

- **Flux de travail simple en 3 étapes**  
  L’interface vous guide à travers les étapes suivantes :
  1. Charger le modèle Whisper.
  2. Vérifier l’état du modèle.
  3. Importer l’audio et lancer la transcription, avec des messages d’état clairs à chaque étape.

- **Transcription dans le navigateur** avec `@huggingface/transformers`
- **Sélection de modèles Whisper multilingues** dans l’interface
- Options de modèles intégrés prises en charge :
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Décodage audio côté client en 16 kHz via `AudioContext`
- Conversion du stéréo en mono avant l’inférence
- Paramètres de transcription segmentée pour les médias plus longs :
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- Entrées acceptées :
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Stack technique

- Frontend : React + TypeScript + Vite
- Runtime ML : `@huggingface/transformers`
- Tâche d’inférence : `automatic-speech-recognition`
- Gestion audio dans le navigateur : Web Audio API (`AudioContext`)
- Tests : Jest + Testing Library
- Outils de conteneurisation : Docker + Docker Compose

---


## Fonctionnement

### 1. Mise en page de l’application

`App.tsx` affiche la structure de l’application, le titre, le sous-titre, `SettingsBar` et `HomeScreen`.

La barre de paramètres affiche actuellement un résumé du runtime :

- `Transformers.js + Whisper`

### 2. Sélection du modèle et du fichier

`HomeScreen.tsx` fournit une interface en 3 étapes :

1. Choisir un modèle et un fichier multimédia
2. Vérifier l’état du modèle
3. Lire le résultat de la transcription

L’écran comprend :

- Une liste déroulante de modèles Whisper
- Une entrée de fichier masquée déclenchée par un bouton
- Un texte d’état et un spinner pendant le traitement
- Une zone de texte pour la transcription
- Un bouton Clear

### 3. Hook de transcription

`useTranscription.ts` contient l’implémentation principale.

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

- Le modèle Whisper sélectionné est chargé à la demande lors de la première utilisation
- L’instance du pipeline est mise en cache et réutilisée si le même modèle reste sélectionné
- Des paramètres ONNX WASM adaptés au navigateur sont appliqués avant le chargement du modèle
- Le fichier sélectionné est lu sous forme d’`ArrayBuffer`
- L’audio est décodé avec `AudioContext({ sampleRate: 16000 })`
- L’audio multicanal est converti en mono
- Whisper utilise la détection automatique de la langue, car `language` est volontairement laissé non défini
- Le texte reconnu est écrit dans l’état de transcription

### 4. Messages d’état

L’interface actuelle indique à l’utilisateur des états tels que :

- idle : choisissez un modèle et un fichier
- loading : le premier chargement du modèle peut être lent
- ready : modèle chargé et prêt
- transcribing : la transcription locale dans le navigateur est en cours
- done : transcription terminée
- error : le message d’échec s’affiche sous le bloc d’état

## Remarques sur les médias pris en charge

Le texte de l’interface indique que les utilisateurs peuvent sélectionner des fichiers audio ou vidéo et que Whisper peut détecter la parole dans des médias pris en charge comme MP3 ou MP4 directement dans le navigateur.

Cependant, l’implémentation réelle décode le fichier sélectionné avec `AudioContext.decodeAudioData()`. En pratique, la réussite du décodage dépend de la prise en charge des codecs par le navigateur. Le comportement pris en charge est donc finalement limité à ce que le navigateur de l’utilisateur peut décoder dans le fichier multimédia sélectionné.

---

## 🚀 Prise en main

## npm

### Prérequis

- Node.js 20+ recommandé
- npm

### Exécuter

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Cela démarre le service sur le port `5173`.

## Tests

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### Prérequis

- [Docker Compose](https://docs.docker.com/compose/)

### Exécuter

```bash
docker compose build
docker compose up
```

Cela démarre le service sur le port `5173`.

## Tests

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## Remarques et limitations

- Le chargement du modèle s’effectue dans le navigateur et peut prendre du temps lors de la première utilisation
- Les modèles plus volumineux utilisent davantage de mémoire
- La vitesse de transcription dépend du navigateur et de l’appareil
- La prise en charge du décodage multimédia dépend des codecs pris en charge par le navigateur
- L’application actuelle ne dispose d’aucun service backend de transcription ; la transcription est effectuée côté client

---

# Licence
- Apache License 2.0
