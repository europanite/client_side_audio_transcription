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

    // These labels are aligned with the current HomeScreen.tsx implementation
    expect(
      screen.queryByText("Step 1 - Select an audio file")
    ).not.toBeNull();
    expect(
      screen.queryByText("Step 2 - Model status")
    ).not.toBeNull();
    expect(
      screen.queryByText("Step 3 - Transcription")
    ).not.toBeNull();
  });

  it("calls transcribeFile when a file is selected", async () => {
    const transcribeFile = jest.fn().mockResolvedValue(undefined);

    // Override the default mock with a version that exposes our spy
    (useTranscription as jest.Mock).mockReturnValue({
      ...createBaseHookValue(),
      transcribeFile,
    });

    const { container } = render(<HomeScreen />);

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const file = new File(["dummy"], "sample.mp3", {
      type: "audio/mpeg",
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(transcribeFile).toHaveBeenCalledTimes(1);
      expect(transcribeFile).toHaveBeenCalledWith(file);
    });

    // File name should be visible in the UI
    expect(screen.queryByText("sample.mp3")).not.toBeNull();
  });

  it("disables the Clear button when there is no transcript, error, or file", () => {
    render(<HomeScreen />);

    const clearButton = screen.getByText("Clear") as HTMLButtonElement;

    expect(clearButton.disabled).toBe(true);
  });
});
