// frontend/app/src/screens/HomeScreen.tsx
import React, { ChangeEvent, useRef, useState } from "react";
import { useTranscription } from "../hooks/useTranscription";

const HomeScreen: React.FC = () => {
  const { status, error, transcript, transcribeFile, reset } =
    useTranscription();
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
        return "Idle - waiting for an audio file.";
      case "loading-model":
        return "Loading Whisper model into this browser (first load can be slow)...";
      case "ready":
        return "Model loaded. Ready to transcribe.";
      case "transcribing":
        return "Transcribing audio locally in your browser...";
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
        <h2 className="section-title">Step 1 - Select an audio file</h2>
        <p className="section-description">
          Choose an audio file
        </p>

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
        <h2 className="section-title">Step 3 - English transcription</h2>
        <p className="section-description">
          The recognized English text will appear below. You can copy &amp;
          paste it into other tools.
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
          Note: The Whisper model runs entirely in your browser using Transformers.js. Large files may take time and memory.
        </p>
      </section>
    </main>
  );
};

export default HomeScreen;
