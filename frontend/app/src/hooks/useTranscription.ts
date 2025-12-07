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

export interface UseTranscriptionResult {
  status: TranscriptionStatus;
  error: string | null;
  transcript: string;
  transcribeFile: (file: File) => Promise<void>;
  reset: () => void;
}

export function useTranscription(): UseTranscriptionResult {
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");

  // Keep the pipeline instance between calls.
  const pipelineRef = useRef<any | null>(null);

  const loadModel = useCallback(async () => {
    if (pipelineRef.current) {
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

      // Load Whisper tiny (English) model.
      const asr = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-tiny.en"
      );

      pipelineRef.current = asr;
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

  const transcribeFile = useCallback(
    async (file: File) => {
      if (!file) return;

      setError(null);
      setTranscript("");

      try {
        const asr = await loadModel();
        setStatus("transcribing");

        // --- Decode MP3 -> mono Float32Array on the client ---
        // 1) Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // 2) Decode and (effectively) resample to 16 kHz
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(
          arrayBuffer.slice(0)
        );

        // 3) Take the first channel (mono)
        const channelData = audioBuffer.getChannelData(0); // Float32Array

        // 4) Run Whisper on the PCM data
        const result = await asr(channelData, {
          // Safer settings for reasonably long audio
          chunk_length_s: 20,
          stride_length_s: 5
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
    [loadModel]
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
    transcribeFile,
    reset
  };
}
