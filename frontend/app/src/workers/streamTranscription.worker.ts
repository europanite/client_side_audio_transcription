/// <reference lib="webworker" />

import { env, pipeline } from "@huggingface/transformers";

type InitMessage = {
  type: "init";
  requestId: number;
  modelId: string;
};

type TranscribeMessage = {
  type: "transcribe";
  sessionId: number;
  chunkId: number;
  pcm: ArrayBuffer;
  language?: string;
};

type CancelSessionMessage = {
  type: "cancel-session";
  sessionId: number;
};

type IncomingMessage = InitMessage | TranscribeMessage | CancelSessionMessage;

let asr: any | null = null;
let loadedModelId: string | null = null;
let workQueue: Promise<void> = Promise.resolve();
const cancelledSessions = new Set<number>();

function extractText(result: unknown): string {
  if (typeof result === "string") return result.trim();
  if (
    result &&
    typeof result === "object" &&
    "text" in result &&
    typeof (result as { text?: unknown }).text === "string"
  ) {
    return (result as { text: string }).text.trim();
  }
  return "";
}

async function ensureModel(modelId: string) {
  if (asr && loadedModelId === modelId) return asr;

  env.allowRemoteModels = true;
  if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.numThreads = 1;
  }

  if (asr && typeof asr.dispose === "function") {
    await asr.dispose();
  }

  asr = await pipeline("automatic-speech-recognition", modelId);
  loadedModelId = modelId;
  return asr;
}

function enqueue(task: () => Promise<void>) {
  workQueue = workQueue.then(task, task).catch((error) => {
    console.error("Stream transcription worker queue failed", error);
  });
}

self.onmessage = (event: MessageEvent<IncomingMessage>) => {
  const message = event.data;

  if (message.type === "cancel-session") {
    cancelledSessions.add(message.sessionId);
    return;
  }

  if (message.type === "init") {
    enqueue(async () => {
      try {
        await ensureModel(message.modelId);
        self.postMessage({
          type: "model-ready",
          requestId: message.requestId,
          modelId: message.modelId,
        });
      } catch (error) {
        self.postMessage({
          type: "model-error",
          requestId: message.requestId,
          modelId: message.modelId,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load Whisper in the worker.",
        });
      }
    });
    return;
  }

  enqueue(async () => {
    if (cancelledSessions.has(message.sessionId)) return;
    if (!asr) {
      self.postMessage({
        type: "chunk-error",
        sessionId: message.sessionId,
        chunkId: message.chunkId,
        error: "Whisper worker is not ready.",
      });
      return;
    }

    try {
      const options: { task: "transcribe"; language?: string } = {
        task: "transcribe",
      };
      if (message.language) options.language = message.language;

      const result = await asr(new Float32Array(message.pcm), options);
      if (cancelledSessions.has(message.sessionId)) return;

      self.postMessage({
        type: "transcript",
        sessionId: message.sessionId,
        chunkId: message.chunkId,
        text: extractText(result),
      });
    } catch (error) {
      self.postMessage({
        type: "chunk-error",
        sessionId: message.sessionId,
        chunkId: message.chunkId,
        error:
          error instanceof Error
            ? error.message
            : "Failed to transcribe live audio in the worker.",
      });
    }
  });
};
