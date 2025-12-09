import { renderHook, act } from "@testing-library/react";
import { useTranscription } from "../hooks/useTranscription";

jest.mock("@huggingface/transformers", () => ({
  env: {},
  pipeline: jest.fn(),
}));

describe("useTranscription hook", () => {
  it("exposes the expected initial state", () => {
    const { result } = renderHook(() => useTranscription());

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.transcript).toBe("");
    expect(typeof result.current.transcribeFile).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });

  it("keeps state stable when reset() is called from the initial state", () => {
    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.transcript).toBe("");
  });
});
