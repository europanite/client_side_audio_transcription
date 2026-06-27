import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import HomeScreen from "../screens/HomeScreen";
import { useTranscription } from "../hooks/useTranscription";

jest.mock("../hooks/useTranscription");

type MockUseTranscriptionReturn = ReturnType<typeof useTranscription>;

const createBaseHookValue = (): MockUseTranscriptionReturn => ({
  status: "idle",
  error: null,
  transcript: "",
  availableModels: [
    {
      id: "Xenova/whisper-small",
      label: "Small",
      description: "Best accuracy here, but takes more browser memory.",
    },
    {
      id: "Xenova/whisper-base",
      label: "Base",
      description: "Balanced speed and accuracy for Japanese transcription.",
    },
  ],
  selectedModelId: "Xenova/whisper-small",
  setSelectedModelId: jest.fn(),
  transcribeFile: jest.fn(),
  reset: jest.fn(),
});

describe("HomeScreen", () => {
  beforeEach(() => {
    (useTranscription as jest.Mock).mockReturnValue(createBaseHookValue());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the 3 main steps", () => {
    render(<HomeScreen />);

    expect(
      screen.queryByText("Step 1 - Choose a model and media file")
    ).not.toBeNull();
    expect(
      screen.queryByText("Step 2 - Model status")
    ).not.toBeNull();
    expect(
      screen.queryByText("Step 3 - Transcription")
    ).not.toBeNull();
  });

  it("calls setSelectedModelId when a model is selected", () => {
    const setSelectedModelId = jest.fn();

    (useTranscription as jest.Mock).mockReturnValue({
      ...createBaseHookValue(),
      setSelectedModelId,
    });

    render(<HomeScreen />);

    fireEvent.change(screen.getByLabelText("Whisper model"), {
      target: { value: "Xenova/whisper-base" },
    });

    expect(setSelectedModelId).toHaveBeenCalledWith("Xenova/whisper-base");
  });


  it("accepts video formats in the hidden file input", () => {
    const { container } = render(<HomeScreen />);

    const fileInput = container.querySelector(
      "input[type=\"file\"]"
    ) as HTMLInputElement;

    expect(fileInput.accept).toBe(
      "audio/*,video/mp4,video/webm,video/ogg,video/x-matroska,video/matroska,.mp4,.webm,.ogv,.m4v,.mkv"
    );
  });

  it("calls transcribeFile when a file is selected", async () => {
    const transcribeFile = jest.fn().mockResolvedValue(undefined);

    (useTranscription as jest.Mock).mockReturnValue({
      ...createBaseHookValue(),
      transcribeFile,
    });

    const { container } = render(<HomeScreen />);

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const file = new File(["dummy"], "sample.mp4", {
      type: "video/mp4",
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(transcribeFile).toHaveBeenCalledTimes(1);
      expect(transcribeFile).toHaveBeenCalledWith(file);
    });

    expect(screen.queryByText("sample.mp4")).not.toBeNull();
  });

  it("disables the Clear button when there is no transcript, error, or file", () => {
    render(<HomeScreen />);

    const clearButton = screen.getByText("Clear") as HTMLButtonElement;

    expect(clearButton.disabled).toBe(true);
  });
});
