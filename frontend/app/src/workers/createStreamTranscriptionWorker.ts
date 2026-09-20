export function createStreamTranscriptionWorker(): Worker {
  return new Worker(
    new URL("./streamTranscription.worker.ts", import.meta.url),
    { type: "module" }
  );
}
