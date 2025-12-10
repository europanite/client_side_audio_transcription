// frontend/app/src/screens/HomeScreen.tsx
import { useRef, useState } from "react";
import { useTranscription } from "../hooks/useTranscription";

const HomeScreen = () => {
  const { status, error, transcript, transcribeFile, reset } =
    useTranscription();
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (event: unknown) => {
    // event は React.ChangeEvent<HTMLInputElement> だが、型は推論に任せる
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
        return "Idle - waiting for an audio file.";
      case "loading-model":
        return "Loading Whisper model into this browser (first load can be slow).";
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

  const hasClearableContent = Boolean(
    transcript?.trim() || error || selectedFileName
  );

  return (
    <main className="home">
      {/* Step 1 */}
      <section className="section">
        <h2 className="section-title">Step 1 - Select an audio file</h2>
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
          <p className="status-text">{statusLabel}</p>
        </div>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </section>

      {/* Step 3 */}
      <section className="section">
        <h2 className="section-title">Step 3 - Transcription</h2>
        <p className="section-description">
          Once the model finishes running in your browser, the transcribed text
          will appear below. You can copy it into your notes or another tool.
        </p>

        <div className="transcription-toolbar">
          <button
            type="button"
            className="btn secondary"
            onClick={handleClearClick}
            disabled={!hasClearableContent}
          >
            Clear
          </button>
        </div>

        <div className="transcription-output">
          {transcript ? (
            <pre className="transcription-text">{transcript}</pre>
          ) : (
            <p className="muted-text">
              No transcript yet. Upload an audio file to get started.
            </p>
          )}
        </div>
      </section>
    </main>
  );
};

export default HomeScreen;
