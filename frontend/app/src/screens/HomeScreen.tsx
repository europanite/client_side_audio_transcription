import { useMemo, useRef, useState } from "react";
import { useTranscription } from "../hooks/useTranscription";

const HomeScreen = () => {
  const {
    status,
    error,
    transcript,
    availableModels,
    selectedModelId,
    setSelectedModelId,
    transcribeFile,
    reset,
  } = useTranscription();
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedModel = useMemo(
    () =>
      availableModels.find((model) => model.id === selectedModelId) ??
      availableModels[0],
    [availableModels, selectedModelId]
  );

  const handleFileChange = async (event: unknown) => {
    const file = (event as any).target?.files?.[0] as File | undefined;

    if (!file) {
      setSelectedFileName("");
      return;
    }

    setSelectedFileName(file.name);
    await transcribeFile(file);
  };

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearClick = () => {
    reset();
    setSelectedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isBusy = status === "loading-model" || status === "transcribing";

  const statusLabel = (() => {
    switch (status) {
      case "idle":
        return "Idle - choose a model and an audio file.";
      case "loading-model":
        return `Loading ${selectedModel.label} Whisper into this browser (first load can be slow)...`;
      case "ready":
        return `${selectedModel.label} model loaded. Ready to transcribe.`;
      case "transcribing":
        return "Transcribing audio locally in your browser with automatic language detection...";
      case "done":
        return "Transcription finished.";
      case "error":
        return "Error - see message below.";
      default:
        return "";
    }
  })();

  return (
    <main className="home">
      {/* Step 1 */}
      <section className="section">
        <h2 className="section-title">Step 1 - Choose a model and audio file</h2>
        <p className="section-description">
          Pick a multilingual Whisper model, then select your audio file.
          Whisper will automatically detect whether the MP3 is Japanese or English.
        </p>

        <div className="field-group">
          <label className="field-label" htmlFor="whisper-model-select">
            Whisper model
          </label>
          <select
            id="whisper-model-select"
            className="select-input"
            value={selectedModelId}
            onChange={(event) => setSelectedModelId(event.target.value)}
            disabled={isBusy}
          >
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label} - {model.id}
              </option>
            ))}
          </select>
          <p className="helper-text">{selectedModel.description}</p>
        </div>

        <div className="button-row">
          <button
            type="button"
            className="btn primary"
            onClick={handleChooseFileClick}
            disabled={isBusy}
          >
            {isBusy ? "Processing..." : "Choose an audio file"}
          </button>
          <span className="file-name">
            {selectedFileName || "No file selected yet."}
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/mp3"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </section>

      {/* Step 2 */}
      <section className="section">
        <h2 className="section-title">Step 2 - Model status</h2>
        <div className="status-row">
          {(status === "loading-model" || status === "transcribing") && (
            <span className="spinner" aria-hidden="true" />
          )}
          <span className="status-text">{statusLabel}</span>
        </div>
        {error && <p className="error-text">{error}</p>}
      </section>

      {/* Step 3 */}
      <section className="section">
        <h2 className="section-title">Step 3 - Transcription</h2>
        <p className="section-description">
          The recognized text will appear below.
        </p>

        <textarea
          className="transcript-box"
          value={transcript}
          readOnly
          placeholder={
            status === "idle"
              ? "The transcript will appear here after you select an audio file."
              : transcript
              ? ""
              : "Transcription result is empty."
          }
        />

        <div className="button-row right">
          <button
            type="button"
            className="btn secondary"
            onClick={handleClearClick}
            disabled={!transcript && !error && !selectedFileName}
          >
            Clear
          </button>
        </div>

        <p className="footer-note">
          Note: The selected Whisper model runs entirely in your browser using
          Transformers.js. Larger models may take more time and memory.
        </p>
      </section>
    </main>
  );
};

export default HomeScreen;
