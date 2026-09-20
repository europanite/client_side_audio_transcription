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

Whisper और Transformers.js द्वारा संचालित, ब्राउज़र-आधारित AI ट्रांसक्रिप्शन प्लेग्राउंड।
किसी इंस्टॉलेशन, पंजीकरण या भुगतान की आवश्यकता नहीं है।

---

## 🚀 अवलोकन

यह प्रोजेक्ट React, TypeScript और Vite से बनाया गया एक क्लाइंट-साइड ट्रांसक्रिप्शन वेब ऐप है।
यह `@huggingface/transformers` के माध्यम से Whisper को सीधे ब्राउज़र में चलाता है, इसलिए ट्रांसक्रिप्शन के लिए मीडिया फ़ाइलों को बैकएंड पर अपलोड करने के बजाय स्थानीय रूप से प्रोसेस किया जाता है।

वर्तमान इम्प्लीमेंटेशन UI में Whisper मॉडल चुनने, स्थानीय मीडिया फ़ाइल चुनने, चयनित मॉडल को आवश्यकता पड़ने पर लोड करने और पहचाने गए टेक्स्ट को केवल-पढ़ने योग्य ट्रांसक्रिप्ट क्षेत्र में दिखाने का समर्थन करता है।

## ✨ विशेषताएँ

- **क्लाइंट-साइड speech-to-text**  
  React ऐप `@huggingface/transformers` की `automatic-speech-recognition` पाइपलाइन को सीधे ब्राउज़र में कॉल करता है, इसलिए ट्रांसक्रिप्शन पूरी तरह क्लाइंट पर चलता है।

- **सरल 3-चरणीय वर्कफ़्लो**  
  UI आपको इन चरणों से मार्गदर्शन करता है:
  1. Whisper मॉडल लोड करना।
  2. मॉडल की स्थिति जाँचना।
  3. ऑडियो अपलोड करना और ट्रांसक्रिप्शन चलाना, प्रत्येक चरण के लिए स्पष्ट स्थिति संदेशों के साथ।

- `@huggingface/transformers` के साथ **ब्राउज़र में ट्रांसक्रिप्शन**
- UI में **बहुभाषी Whisper मॉडल चयन**
- समर्थित बिल्ट-इन मॉडल विकल्प:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- `AudioContext` के माध्यम से क्लाइंट-साइड ऑडियो डिकोडिंग को 16 kHz पर करना
- इन्फ़रेंस से पहले स्टीरियो को मोनो में मिलाना
- लंबे मीडिया के लिए chunked ट्रांसक्रिप्शन सेटिंग्स:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- स्वीकार्य इनपुट:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 टेक स्टैक

- Frontend: React + TypeScript + Vite
- ML runtime: `@huggingface/transformers`
- Inference task: `automatic-speech-recognition`
- ब्राउज़र ऑडियो हैंडलिंग: Web Audio API (`AudioContext`)
- टेस्टिंग: Jest + Testing Library
- कंटेनर टूलिंग: Docker + Docker Compose

---


## यह कैसे काम करता है

### 1. ऐप लेआउट

`App.tsx` ऐप shell, title, subtitle, `SettingsBar` और `HomeScreen` को render करता है।

settings bar वर्तमान में runtime सारांश दिखाता है:

- `Transformers.js + Whisper`

### 2. मॉडल और फ़ाइल चयन

`HomeScreen.tsx` 3-चरणीय UI प्रदान करता है:

1. मॉडल और मीडिया फ़ाइल चुनें
2. मॉडल की स्थिति जाँचें
3. ट्रांसक्रिप्शन परिणाम पढ़ें

स्क्रीन में शामिल हैं:

- Whisper मॉडल dropdown
- एक hidden file input, जिसे button से trigger किया जाता है
- प्रोसेसिंग के दौरान status text और spinner
- एक transcript textarea
- Clear button

### 3. ट्रांसक्रिप्शन hook

`useTranscription.ts` मुख्य इम्प्लीमेंटेशन है।

यह निम्नलिखित उपलब्ध कराता है:

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `reset()`

व्यवहार:

- चयनित Whisper मॉडल पहली बार उपयोग पर lazy-load होता है
- यदि वही मॉडल चयनित रहता है, तो pipeline instance cache होकर दोबारा उपयोग होता है
- मॉडल लोड करने से पहले ब्राउज़र-अनुकूल ONNX WASM settings लागू की जाती हैं
- चयनित फ़ाइल को `ArrayBuffer` के रूप में पढ़ा जाता है
- ऑडियो को `AudioContext({ sampleRate: 16000 })` से decode किया जाता है
- multi-channel ऑडियो को mono में mix down किया जाता है
- Whisper automatic language detection के साथ चलता है क्योंकि `language` जानबूझकर unset छोड़ा गया है
- पहचाना गया टेक्स्ट transcript state में लिखा जाता है

### 4. स्थिति संदेश

वर्तमान UI उपयोगकर्ता को निम्न स्थितियाँ दिखाता है:

- idle: मॉडल और फ़ाइल चुनें
- loading: मॉडल का पहला load धीमा हो सकता है
- ready: मॉडल लोड होकर तैयार है
- transcribing: स्थानीय ब्राउज़र ट्रांसक्रिप्शन चल रहा है
- done: ट्रांसक्रिप्शन पूरा हुआ
- error: failure message status block के नीचे दिखाया जाता है

## समर्थित मीडिया संबंधी नोट्स

UI टेक्स्ट बताता है कि उपयोगकर्ता ऑडियो या वीडियो फ़ाइलें चुन सकते हैं और Whisper ब्राउज़र में MP3 या MP4 जैसे समर्थित मीडिया से speech पहचान सकता है।

हालाँकि, वास्तविक इम्प्लीमेंटेशन चयनित फ़ाइल को `AudioContext.decodeAudioData()` से decode करता है। व्यवहार में सफल decoding ब्राउज़र codec support पर निर्भर करती है। इसका अर्थ है कि समर्थित व्यवहार अंततः इस बात से सीमित है कि उपयोगकर्ता का ब्राउज़र चयनित मीडिया फ़ाइल को decode कर सकता है या नहीं।

---

## 🚀 शुरू करना

## npm

### आवश्यकताएँ

- Node.js 20+ अनुशंसित
- npm

### चलाएँ

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

इससे सेवा port `5173` पर शुरू होती है।

## टेस्ट

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### आवश्यकताएँ

- [Docker Compose](https://docs.docker.com/compose/)

### चलाएँ

```bash
docker compose build
docker compose up
```

इससे सेवा port `5173` पर शुरू होती है।

## टेस्ट

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## नोट्स और सीमाएँ

- मॉडल loading ब्राउज़र में होती है और पहली बार उपयोग पर समय ले सकती है
- बड़े मॉडल अधिक memory उपयोग करते हैं
- ट्रांसक्रिप्शन की गति ब्राउज़र और device पर निर्भर करती है
- मीडिया decoding support ब्राउज़र codec support पर निर्भर करती है
- वर्तमान ऐप में कोई backend transcription service नहीं है; ट्रांसक्रिप्शन client-side पर किया जाता है

---

# लाइसेंस
- Apache License 2.0
