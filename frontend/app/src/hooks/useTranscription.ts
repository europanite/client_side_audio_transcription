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

  const transcribeFile = useCallback(
    async (file: File) => {
      if (!file) return;

      setError(null);
      setTranscript("");

      try {
        const asr = await loadModel(selectedModelIdState);
        setStatus("transcribing");

        // --- Decode MP3 -> mono Float32Array on the client ---
        // 1) Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // 2) Decode and (effectively) resample to 16 kHz
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(
          arrayBuffer.slice(0)
        );

        // 3) Mix all channels down to mono instead of fixing to channel 0
        const channelData = mixToMono(audioBuffer);

        // 4) Run Whisper on the PCM data
        const result = await asr(channelData, {
          // Safer settings for reasonably long audio.
          // Leave `language` unset so Whisper can auto-detect Japanese vs English.
          task: "transcribe",
          chunk_length_s: 20,
          stride_length_s: 5,
        });

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
    [loadModel, selectedModelIdState]
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
    transcribeFile,
    reset,
  };
}
