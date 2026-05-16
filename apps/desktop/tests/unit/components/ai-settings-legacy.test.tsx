import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AISettings } from "../../../src/renderer/components/settings/AISettings";
import { renderWithI18n } from "../../helpers/i18n";

const useSettingsStoreMock = vi.fn();
const useToastMock = vi.fn();

vi.mock("../../../src/renderer/stores/settings.store", () => ({
  useSettingsStore: () => useSettingsStoreMock(),
}));

vi.mock("../../../src/renderer/components/ui/Toast", () => ({
  useToast: () => useToastMock(),
}));

vi.mock("../../../src/renderer/services/ai", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../src/renderer/services/ai")>();
  return {
    ...actual,
    fetchAvailableModels: vi.fn().mockResolvedValue({ success: true, models: [] }),
    testAIConnection: vi.fn().mockResolvedValue({ success: true, latency: 10 }),
    testImageGeneration: vi.fn().mockResolvedValue({ success: true, latency: 10, data: [] }),
  };
});

function createSettingsState() {
  return {
    aiModels: [],
    aiProvider: "openai",
    aiApiProtocol: "openai",
    aiApiKey: "",
    aiApiUrl: "",
    aiModel: "",
    addAiModel: vi.fn(),
    updateAiModel: vi.fn(),
    deleteAiModel: vi.fn(),
    setDefaultAiModel: vi.fn(),
    setScenarioModelDefault: vi.fn(),
    scenarioModelDefaults: {},
    setAiProvider: vi.fn(),
    setAiApiProtocol: vi.fn(),
    setAiApiKey: vi.fn(),
    setAiApiUrl: vi.fn(),
    setAiModel: vi.fn(),
  };
}

describe("AISettings legacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useToastMock.mockReturnValue({ showToast: vi.fn() });
  });

  it("preserves apiProtocol when adding a Google chat model", async () => {
    const settingsState = createSettingsState();
    useSettingsStoreMock.mockReturnValue(settingsState);

    await renderWithI18n(<AISettings />, { language: "en" });

    fireEvent.click(screen.getByRole("button", { name: "Add Chat Model" }));
    fireEvent.click(screen.getByRole("button", { name: "OpenAI" }));
    fireEvent.click(await screen.findByText("Google"));
    fireEvent.change(screen.getByPlaceholderText("Enter API Key"), {
      target: { value: "test-key" },
    });
    fireEvent.change(screen.getByDisplayValue("https://generativelanguage.googleapis.com"), {
      target: { value: "https://generativelanguage.googleapis.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g., gpt-4o, deepseek-chat"), {
      target: { value: "gemini-2.5-pro" },
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Add Model" }).at(-1)!);

    expect(settingsState.addAiModel).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        apiProtocol: "gemini",
        model: "gemini-2.5-pro",
      }),
    );
  });
});
