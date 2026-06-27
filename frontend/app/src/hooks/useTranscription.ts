// frontend/app/src/hooks/useTranscription.ts
import { useCallback, useRef, useState } from "react";
import { env, pipeline } from "@huggingface/transformers";

export type TranscriptionStatus =
  | "idle"
  | "loading-model"
  | "ready"
  | "transcribing"
  | "done"
  | "error";

export interface WhisperModelOption {
  id: string;
  label: string;
  description: string;
}

export interface TranscriptionLanguageOption {
  id: string;
  label: string;
  description: string;
  whisperLanguage?: string;
}

export const AUTO_TRANSCRIPTION_LANGUAGE_ID = "auto";
export const DEFAULT_TRANSCRIPTION_LANGUAGE_ID = "english";

export const TRANSCRIPTION_LANGUAGE_OPTIONS: TranscriptionLanguageOption[] = [
  {
    id: AUTO_TRANSCRIPTION_LANGUAGE_ID,
    label: "Auto-detect",
    description: "Let Whisper detect the spoken language automatically.",
  },
  { id: "english", label: "English", description: "Force English transcription.", whisperLanguage: "english" },
  { id: "chinese", label: "Chinese", description: "Force Chinese transcription.", whisperLanguage: "chinese" },
  { id: "german", label: "German", description: "Force German transcription.", whisperLanguage: "german" },
  { id: "spanish", label: "Spanish", description: "Force Spanish transcription.", whisperLanguage: "spanish" },
  { id: "russian", label: "Russian", description: "Force Russian transcription.", whisperLanguage: "russian" },
  { id: "korean", label: "Korean", description: "Force Korean transcription.", whisperLanguage: "korean" },
  { id: "french", label: "French", description: "Force French transcription.", whisperLanguage: "french" },
  { id: "japanese", label: "Japanese", description: "Force Japanese transcription.", whisperLanguage: "japanese" },
  { id: "portuguese", label: "Portuguese", description: "Force Portuguese transcription.", whisperLanguage: "portuguese" },
  { id: "turkish", label: "Turkish", description: "Force Turkish transcription.", whisperLanguage: "turkish" },
  { id: "polish", label: "Polish", description: "Force Polish transcription.", whisperLanguage: "polish" },
  { id: "catalan", label: "Catalan", description: "Force Catalan transcription.", whisperLanguage: "catalan" },
  { id: "dutch", label: "Dutch", description: "Force Dutch transcription.", whisperLanguage: "dutch" },
  { id: "arabic", label: "Arabic", description: "Force Arabic transcription.", whisperLanguage: "arabic" },
  { id: "swedish", label: "Swedish", description: "Force Swedish transcription.", whisperLanguage: "swedish" },
  { id: "italian", label: "Italian", description: "Force Italian transcription.", whisperLanguage: "italian" },
  { id: "indonesian", label: "Indonesian", description: "Force Indonesian transcription.", whisperLanguage: "indonesian" },
  { id: "hindi", label: "Hindi", description: "Force Hindi transcription.", whisperLanguage: "hindi" },
  { id: "finnish", label: "Finnish", description: "Force Finnish transcription.", whisperLanguage: "finnish" },
  { id: "vietnamese", label: "Vietnamese", description: "Force Vietnamese transcription.", whisperLanguage: "vietnamese" },
  { id: "hebrew", label: "Hebrew", description: "Force Hebrew transcription.", whisperLanguage: "hebrew" },
  { id: "ukrainian", label: "Ukrainian", description: "Force Ukrainian transcription.", whisperLanguage: "ukrainian" },
  { id: "greek", label: "Greek", description: "Force Greek transcription.", whisperLanguage: "greek" },
  { id: "malay", label: "Malay", description: "Force Malay transcription.", whisperLanguage: "malay" },
  { id: "czech", label: "Czech", description: "Force Czech transcription.", whisperLanguage: "czech" },
  { id: "romanian", label: "Romanian", description: "Force Romanian transcription.", whisperLanguage: "romanian" },
  { id: "danish", label: "Danish", description: "Force Danish transcription.", whisperLanguage: "danish" },
  { id: "hungarian", label: "Hungarian", description: "Force Hungarian transcription.", whisperLanguage: "hungarian" },
  { id: "tamil", label: "Tamil", description: "Force Tamil transcription.", whisperLanguage: "tamil" },
  { id: "norwegian", label: "Norwegian", description: "Force Norwegian transcription.", whisperLanguage: "norwegian" },
  { id: "thai", label: "Thai", description: "Force Thai transcription.", whisperLanguage: "thai" },
  { id: "urdu", label: "Urdu", description: "Force Urdu transcription.", whisperLanguage: "urdu" },
  { id: "croatian", label: "Croatian", description: "Force Croatian transcription.", whisperLanguage: "croatian" },
  { id: "bulgarian", label: "Bulgarian", description: "Force Bulgarian transcription.", whisperLanguage: "bulgarian" },
  { id: "lithuanian", label: "Lithuanian", description: "Force Lithuanian transcription.", whisperLanguage: "lithuanian" },
  { id: "latin", label: "Latin", description: "Force Latin transcription.", whisperLanguage: "latin" },
  { id: "maori", label: "Maori", description: "Force Maori transcription.", whisperLanguage: "maori" },
  { id: "malayalam", label: "Malayalam", description: "Force Malayalam transcription.", whisperLanguage: "malayalam" },
  { id: "welsh", label: "Welsh", description: "Force Welsh transcription.", whisperLanguage: "welsh" },
  { id: "slovak", label: "Slovak", description: "Force Slovak transcription.", whisperLanguage: "slovak" },
  { id: "telugu", label: "Telugu", description: "Force Telugu transcription.", whisperLanguage: "telugu" },
  { id: "persian", label: "Persian", description: "Force Persian transcription.", whisperLanguage: "persian" },
  { id: "latvian", label: "Latvian", description: "Force Latvian transcription.", whisperLanguage: "latvian" },
  { id: "bengali", label: "Bengali", description: "Force Bengali transcription.", whisperLanguage: "bengali" },
  { id: "serbian", label: "Serbian", description: "Force Serbian transcription.", whisperLanguage: "serbian" },
  { id: "azerbaijani", label: "Azerbaijani", description: "Force Azerbaijani transcription.", whisperLanguage: "azerbaijani" },
  { id: "slovenian", label: "Slovenian", description: "Force Slovenian transcription.", whisperLanguage: "slovenian" },
  { id: "kannada", label: "Kannada", description: "Force Kannada transcription.", whisperLanguage: "kannada" },
  { id: "estonian", label: "Estonian", description: "Force Estonian transcription.", whisperLanguage: "estonian" },
  { id: "macedonian", label: "Macedonian", description: "Force Macedonian transcription.", whisperLanguage: "macedonian" },
  { id: "breton", label: "Breton", description: "Force Breton transcription.", whisperLanguage: "breton" },
  { id: "basque", label: "Basque", description: "Force Basque transcription.", whisperLanguage: "basque" },
  { id: "icelandic", label: "Icelandic", description: "Force Icelandic transcription.", whisperLanguage: "icelandic" },
  { id: "armenian", label: "Armenian", description: "Force Armenian transcription.", whisperLanguage: "armenian" },
  { id: "nepali", label: "Nepali", description: "Force Nepali transcription.", whisperLanguage: "nepali" },
  { id: "mongolian", label: "Mongolian", description: "Force Mongolian transcription.", whisperLanguage: "mongolian" },
  { id: "bosnian", label: "Bosnian", description: "Force Bosnian transcription.", whisperLanguage: "bosnian" },
  { id: "kazakh", label: "Kazakh", description: "Force Kazakh transcription.", whisperLanguage: "kazakh" },
  { id: "albanian", label: "Albanian", description: "Force Albanian transcription.", whisperLanguage: "albanian" },
  { id: "swahili", label: "Swahili", description: "Force Swahili transcription.", whisperLanguage: "swahili" },
  { id: "galician", label: "Galician", description: "Force Galician transcription.", whisperLanguage: "galician" },
  { id: "marathi", label: "Marathi", description: "Force Marathi transcription.", whisperLanguage: "marathi" },
  { id: "punjabi", label: "Punjabi", description: "Force Punjabi transcription.", whisperLanguage: "punjabi" },
  { id: "sinhala", label: "Sinhala", description: "Force Sinhala transcription.", whisperLanguage: "sinhala" },
  { id: "khmer", label: "Khmer", description: "Force Khmer transcription.", whisperLanguage: "khmer" },
  { id: "shona", label: "Shona", description: "Force Shona transcription.", whisperLanguage: "shona" },
  { id: "yoruba", label: "Yoruba", description: "Force Yoruba transcription.", whisperLanguage: "yoruba" },
  { id: "somali", label: "Somali", description: "Force Somali transcription.", whisperLanguage: "somali" },
  { id: "afrikaans", label: "Afrikaans", description: "Force Afrikaans transcription.", whisperLanguage: "afrikaans" },
  { id: "occitan", label: "Occitan", description: "Force Occitan transcription.", whisperLanguage: "occitan" },
  { id: "georgian", label: "Georgian", description: "Force Georgian transcription.", whisperLanguage: "georgian" },
  { id: "belarusian", label: "Belarusian", description: "Force Belarusian transcription.", whisperLanguage: "belarusian" },
  { id: "tajik", label: "Tajik", description: "Force Tajik transcription.", whisperLanguage: "tajik" },
  { id: "sindhi", label: "Sindhi", description: "Force Sindhi transcription.", whisperLanguage: "sindhi" },
  { id: "gujarati", label: "Gujarati", description: "Force Gujarati transcription.", whisperLanguage: "gujarati" },
  { id: "amharic", label: "Amharic", description: "Force Amharic transcription.", whisperLanguage: "amharic" },
  { id: "yiddish", label: "Yiddish", description: "Force Yiddish transcription.", whisperLanguage: "yiddish" },
  { id: "lao", label: "Lao", description: "Force Lao transcription.", whisperLanguage: "lao" },
  { id: "uzbek", label: "Uzbek", description: "Force Uzbek transcription.", whisperLanguage: "uzbek" },
  { id: "faroese", label: "Faroese", description: "Force Faroese transcription.", whisperLanguage: "faroese" },
  { id: "haitian creole", label: "Haitian Creole", description: "Force Haitian Creole transcription.", whisperLanguage: "haitian creole" },
  { id: "pashto", label: "Pashto", description: "Force Pashto transcription.", whisperLanguage: "pashto" },
  { id: "turkmen", label: "Turkmen", description: "Force Turkmen transcription.", whisperLanguage: "turkmen" },
  { id: "nynorsk", label: "Nynorsk", description: "Force Nynorsk transcription.", whisperLanguage: "nynorsk" },
  { id: "maltese", label: "Maltese", description: "Force Maltese transcription.", whisperLanguage: "maltese" },
  { id: "sanskrit", label: "Sanskrit", description: "Force Sanskrit transcription.", whisperLanguage: "sanskrit" },
  { id: "luxembourgish", label: "Luxembourgish", description: "Force Luxembourgish transcription.", whisperLanguage: "luxembourgish" },
  { id: "myanmar", label: "Myanmar", description: "Force Myanmar transcription.", whisperLanguage: "myanmar" },
  { id: "tibetan", label: "Tibetan", description: "Force Tibetan transcription.", whisperLanguage: "tibetan" },
  { id: "tagalog", label: "Tagalog", description: "Force Tagalog transcription.", whisperLanguage: "tagalog" },
  { id: "malagasy", label: "Malagasy", description: "Force Malagasy transcription.", whisperLanguage: "malagasy" },
  { id: "assamese", label: "Assamese", description: "Force Assamese transcription.", whisperLanguage: "assamese" },
  { id: "tatar", label: "Tatar", description: "Force Tatar transcription.", whisperLanguage: "tatar" },
  { id: "hawaiian", label: "Hawaiian", description: "Force Hawaiian transcription.", whisperLanguage: "hawaiian" },
  { id: "lingala", label: "Lingala", description: "Force Lingala transcription.", whisperLanguage: "lingala" },
  { id: "hausa", label: "Hausa", description: "Force Hausa transcription.", whisperLanguage: "hausa" },
  { id: "bashkir", label: "Bashkir", description: "Force Bashkir transcription.", whisperLanguage: "bashkir" },
  { id: "javanese", label: "Javanese", description: "Force Javanese transcription.", whisperLanguage: "javanese" },
  { id: "sundanese", label: "Sundanese", description: "Force Sundanese transcription.", whisperLanguage: "sundanese" },
  { id: "cantonese", label: "Cantonese", description: "Force Cantonese transcription.", whisperLanguage: "cantonese" },
];

export const WHISPER_MODEL_OPTIONS: WhisperModelOption[] = [
  {
    id: "Xenova/whisper-tiny",
    label: "Tiny",
    description: "Fastest multilingual option for quick browser-side transcription checks.",
  },
  {
    id: "Xenova/whisper-base",
    label: "Base",
    description: "Balanced speed and accuracy for multilingual transcription.",
  },
  {
    id: "Xenova/whisper-small",
    label: "Small",
    description: "Higher accuracy multilingual option, but takes more browser memory.",
  },
];

export const DEFAULT_WHISPER_MODEL_ID = "Xenova/whisper-small";

function mixToMono(audioBuffer: AudioBuffer): Float32Array {
  const { length, numberOfChannels } = audioBuffer;

  if (numberOfChannels <= 1) {
    return audioBuffer.getChannelData(0);
  }

  const mono = new Float32Array(length);

  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      mono[i] += channelData[i] / numberOfChannels;
    }
  }

  return mono;
}

export interface UseTranscriptionResult {
  status: TranscriptionStatus;
  error: string | null;
  transcript: string;
  availableModels: WhisperModelOption[];
  selectedModelId: string;
  setSelectedModelId: (modelId: string) => void;
  availableLanguages: TranscriptionLanguageOption[];
  selectedLanguageId: string;
  setSelectedLanguageId: (languageId: string) => void;
  transcribeFile: (file: File) => Promise<void>;
  reset: () => void;
}

export function useTranscription(): UseTranscriptionResult {
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [selectedModelIdState, setSelectedModelIdState] = useState<string>(
    DEFAULT_WHISPER_MODEL_ID
  );
  const [selectedLanguageIdState, setSelectedLanguageIdState] = useState<string>(
    DEFAULT_TRANSCRIPTION_LANGUAGE_ID
  );

  // Keep the pipeline instance between calls.
  const pipelineRef = useRef<any | null>(null);
  const loadedModelIdRef = useRef<string | null>(null);

  const loadModel = useCallback(async (modelId: string) => {
    if (
      pipelineRef.current &&
      loadedModelIdRef.current === modelId
    ) {
      setStatus("ready");
      return pipelineRef.current;
    }

    setStatus("loading-model");
    setError(null);

    try {
      // Browser-friendly configuration
      env.allowRemoteModels = true;
      if (env.backends?.onnx?.wasm) {
        // Lighter WASM config for browsers
        env.backends.onnx.wasm.numThreads = 1;
      }

      // Load a Whisper model.
      const asr = await pipeline("automatic-speech-recognition", modelId);

      pipelineRef.current = asr;
      loadedModelIdRef.current = modelId;
      setStatus("ready");
      return asr;
    } catch (e) {
      console.error(e);
      const message =
        e instanceof Error
          ? e.message
          : "Failed to load Whisper model in this browser.";
      setError(message);
      setStatus("error");
      throw e;
    }
  }, []);

  const setSelectedModelId = useCallback((modelId: string) => {
    if (!WHISPER_MODEL_OPTIONS.some((option) => option.id === modelId)) {
      return;
    }

    setSelectedModelIdState(modelId);
    setTranscript("");
    setError(null);
    setStatus("idle");
  }, []);

  const setSelectedLanguageId = useCallback((languageId: string) => {
    if (!TRANSCRIPTION_LANGUAGE_OPTIONS.some((option) => option.id === languageId)) {
      return;
    }

    setSelectedLanguageIdState(languageId);
    setTranscript("");
    setError(null);
    setStatus("idle");
  }, []);

  const transcribeFile = useCallback(
    async (file: File) => {
      if (!file) return;

      setError(null);
      setTranscript("");

      try {
        const asr = await loadModel(selectedModelIdState);
        setStatus("transcribing");

        // --- Decode browser-supported audio/video -> mono Float32Array on the client ---
        // 1) Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // 2) Decode and (effectively) resample to 16 kHz
        const audioContext = new AudioContext({ sampleRate: 16000 });
        let audioBuffer: AudioBuffer;

        try {
          audioBuffer = await audioContext.decodeAudioData(
            arrayBuffer.slice(0)
          );
        } catch (decodeError) {
          const isMkv =
            file.name.toLowerCase().endsWith(".mkv") ||
            file.type === "video/x-matroska" ||
            file.type === "video/matroska";

          if (isMkv) {
            throw new Error(
              "This browser could not decode the selected MKV file. " +
                "MKV selection is allowed, but transcription still depends on the browser's built-in media decoder. " +
                "Please try Chrome/Edge, or convert/extract the audio to MP3, WAV, M4A, MP4, or WebM."
            );
          }

          throw decodeError;
        }

        // 3) Mix all channels down to mono instead of fixing to channel 0
        const channelData = mixToMono(audioBuffer);

        // 4) Run Whisper on the PCM data
        const selectedLanguage = TRANSCRIPTION_LANGUAGE_OPTIONS.find(
          (option) => option.id === selectedLanguageIdState
        );
        const asrOptions: {
          task: "transcribe";
          chunk_length_s: number;
          stride_length_s: number;
          language?: string;
        } = {
          // Safer settings for reasonably long audio.
          task: "transcribe",
          chunk_length_s: 20,
          stride_length_s: 5,
        };

        // Auto-detect is available, but English is the default because it is
        // the safest common setting for many demo and interview recordings.
        if (selectedLanguage?.whisperLanguage) {
          asrOptions.language = selectedLanguage.whisperLanguage;
        }

        const result = await asr(channelData, asrOptions);

        console.log(result);

        let text = "";
        if (typeof result === "string") {
          text = result;
        } else if (result && typeof result.text === "string") {
          text = result.text;
        }

        setTranscript(text);
        setStatus("done");
      } catch (e) {
        console.error(e);
        const message =
          e instanceof Error ? e.message : "Failed to run transcription.";
        setError(message);
        setStatus("error");
      }
    },
    [loadModel, selectedLanguageIdState, selectedModelIdState]
  );

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
    setStatus("idle");
  }, []);

  return {
    status,
    error,
    transcript,
    availableModels: WHISPER_MODEL_OPTIONS,
    selectedModelId: selectedModelIdState,
    setSelectedModelId,
    availableLanguages: TRANSCRIPTION_LANGUAGE_OPTIONS,
    selectedLanguageId: selectedLanguageIdState,
    setSelectedLanguageId,
    transcribeFile,
    reset,
  };
}
