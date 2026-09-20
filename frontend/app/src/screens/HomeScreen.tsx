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
    availableLanguages,
    selectedLanguageId,
    setSelectedLanguageId,
    transcribeFile,
    isStreaming,
    isStreamStarting,
    audioLevel,
    startMicrophone,
    stopStream,
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

  const selectedLanguage = useMemo(
    () =>
      availableLanguages.find((language) => language.id === selectedLanguageId) ??
      availableLanguages[0],
    [availableLanguages, selectedLanguageId]
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

  const handleStartMicrophoneClick = () => {
    setSelectedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Fire-and-forget: the next render can enable Stop immediately while the
    // worker loads Whisper and microphone permission is requested.
    void startMicrophone();
  };

  const handleStopMicrophoneClick = () => {
    // stopStream performs the immediate capture stop synchronously and queues
    // buffered-audio finalization separately.
    stopStream();
  };

  const handleClearClick = () => {
    reset();
    setSelectedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isBusy =
    status === "loading-model" ||
    status === "starting-stream" ||
    status === "transcribing" ||
    status === "streaming" ||
    status === "finalizing-stream";

  const canStopMicrophone = isStreamStarting || isStreaming;

  const statusLabel = (() => {
    switch (status) {
      case "idle":
        return "Idle - choose a model, then select a media file or start the microphone.";
      case "loading-model":
        return `Loading ${selectedModel.label} Whisper into this browser (first load can be slow)...`;
      case "ready":
        return `${selectedModel.label} model loaded. Ready to transcribe.`;
      case "starting-stream":
        return "Waiting for microphone permission and preparing live capture...";
      case "transcribing":
        return selectedLanguageId === "auto"
          ? "Transcribing buffered audio locally with automatic language detection..."
          : `Transcribing buffered audio locally as ${selectedLanguage.label}...`;
      case "streaming":
        return selectedLanguageId === "auto"
          ? "Listening to the live audio stream and transcribing locally..."
          : `Listening to the live audio stream and transcribing locally as ${selectedLanguage.label}...`;
      case "finalizing-stream":
        return "Microphone stopped. Finishing transcription of buffered audio...";
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
        <h2 className="section-title">Step 1 - Choose a model and input</h2>
        <p className="section-description">
          Pick a multilingual Whisper model, then select an audio/video file or
          start live microphone transcription. File and microphone audio are
          processed locally in your browser.
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

        <div className="field-group">
          <label className="field-label" htmlFor="transcription-language-select">
            Transcription language
          </label>
          <select
            id="transcription-language-select"
            className="select-input"
            value={selectedLanguageId}
            onChange={(event) => setSelectedLanguageId(event.target.value)}
            disabled={isBusy}
          >
            {availableLanguages.map((language) => (
              <option key={language.id} value={language.id}>
                {language.label}
              </option>
            ))}
          </select>
          <p className="helper-text">{selectedLanguage.description}</p>
        </div>

        <div className="button-row">
          <button
            type="button"
            className="btn primary"
            onClick={handleChooseFileClick}
            disabled={isBusy}
          >
            {isBusy ? "Processing..." : "Choose a media file"}
          </button>
          <span className="file-name">
            {selectedFileName || "No file selected yet."}
          </span>
        </div>

        <div className="button-row">
          <button
            type="button"
            className="btn primary"
            onClick={handleStartMicrophoneClick}
            disabled={isBusy}
          >
            Start microphone
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={handleStopMicrophoneClick}
            disabled={!canStopMicrophone}
          >
            Stop microphone
          </button>
          <span className="file-name">
            {isStreaming
              ? "Live microphone input is active."
              : isStreamStarting
              ? "Preparing microphone input. You can stop now."
              : status === "finalizing-stream"
              ? "Microphone is stopped. Finalizing buffered audio in the worker."
              : "Microphone is stopped."}
          </span>
        </div>

        <div className="audio-level-row" aria-live="off">
          <span className="audio-level-label">Mic level</span>
          <div
            className="audio-level-meter"
            role="meter"
            aria-label="Microphone input level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(audioLevel * 100)}
          >
            <div
              className="audio-level-fill"
              style={{ width: `${Math.round(audioLevel * 100)}%` }}
            />
          </div>
          <span className="audio-level-value">
            {isStreaming ? `${Math.round(audioLevel * 100)}%` : "--"}
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/mp4,video/webm,video/ogg,video/x-matroska,video/matroska,.mp4,.webm,.ogv,.m4v,.mkv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </section>

      {/* Step 2 */}
      <section className="section">
        <h2 className="section-title">Step 2 - Model status</h2>
        <div className="status-row">
          {(status === "loading-model" ||
            status === "starting-stream" ||
            status === "transcribing" ||
            status === "streaming" ||
            status === "finalizing-stream") && (
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
          The recognized text will appear below. Live input is appended every few
          seconds as Whisper finishes each buffered window.
        </p>

        <textarea
          className="transcript-box"
          value={transcript}
          readOnly
          placeholder={
            status === "idle"
              ? "The transcript will appear here after you select a media file or start the microphone."
              : status === "streaming"
              ? "Listening for speech..."
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
            disabled={
              !transcript &&
              !error &&
              !selectedFileName &&
              !isStreaming &&
              !isStreamStarting
            }
          >
            Clear
          </button>
        </div>

        <p className="footer-note">
          Note: The selected Whisper model runs entirely in your browser using
          Transformers.js. Live audio is buffered into short PCM windows before
          inference, so the transcript has a small delay rather than true
          token-by-token streaming.
        </p>
      </section>
    </main>
  );
};

export default HomeScreen;
