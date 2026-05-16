import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AiTestModal } from "../../../src/renderer/components/prompt/AiTestModal";
import { ToastProvider } from "../../../src/renderer/components/ui/Toast";
import { useSettingsStore } from "../../../src/renderer/stores/settings.store";
import { renderWithI18n } from "../../helpers/i18n";
import { installWindowMocks } from "../../helpers/window";
import type { Prompt } from "@prompthub/shared/types";

const chatCompletionMock = vi.fn();
const multiModelCompareMock = vi.fn();
const generateImageMock = vi.fn();

vi.mock("../../../src/renderer/services/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../src/renderer/services/ai")>();
  return {
    ...actual,
    chatCompletion: (...args: unknown[]) => chatCompletionMock(...args),
    multiModelCompare: (...args: unknown[]) => multiModelCompareMock(...args),
    generateImage: (...args: unknown[]) => generateImageMock(...args),
  };
});

const prompt: Prompt = {
  id: "prompt-1",
  title: "Screenshot Analyzer",
  systemPrompt: "You inspect product screenshots.",
  userPrompt: "Describe {{feature}} in the attached image.",
  variables: [],
  tags: [],
  isFavorite: false,
  isPinned: false,
  version: 1,
  currentVersion: 1,
  usageCount: 0,
  createdAt: new Date("2026-05-01T00:00:00.000Z").toISOString(),
  updatedAt: new Date("2026-05-01T00:00:00.000Z").toISOString(),
};

class MockFileReader {
  result: string | null = null;
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;

  readAsDataURL(file: File) {
    this.result = `data:${file.type};base64,ZmFrZS1pbWFnZQ==`;
    this.onload?.();
  }
}

describe("AiTestModal workbench", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installWindowMocks({
      electron: {
        readImageBase64: vi.fn().mockResolvedValue("c2F2ZWQtcmVmZXJlbmNl"),
      },
    });

    vi.stubGlobal("FileReader", MockFileReader as unknown as typeof FileReader);

    useSettingsStore.setState({
      aiProvider: "openai",
      aiApiProtocol: "openai",
      aiApiKey: "legacy-key",
      aiApiUrl: "https://example.com/v1",
      aiModel: "legacy-chat",
      aiModels: [
        {
          id: "chat-default",
          type: "chat",
          provider: "openai",
          apiProtocol: "openai",
          apiKey: "chat-key",
          apiUrl: "https://example.com/v1",
          model: "gpt-4o-mini",
          isDefault: true,
        },
        {
          id: "chat-compare",
          type: "chat",
          provider: "openai",
          apiProtocol: "openai",
          apiKey: "chat-key-2",
          apiUrl: "https://example.com/v1",
          model: "claude-sonnet",
        },
        {
          id: "image-default",
          type: "image",
          provider: "openai",
          apiProtocol: "openai",
          apiKey: "image-key",
          apiUrl: "https://example.com/v1",
          model: "gpt-image-1",
          isDefault: true,
        },
      ],
      scenarioModelDefaults: {
        promptTest: "chat-default",
        imageTest: "image-default",
      },
    } as Partial<ReturnType<typeof useSettingsStore.getState>>);

    chatCompletionMock.mockResolvedValue({
      content: "analysis done",
      thinkingContent: "",
    });
    multiModelCompareMock.mockResolvedValue({
      messages: [],
      results: [
        {
          id: "chat-default",
          success: true,
          response: "result-a",
          thinkingContent: "",
          latency: 10,
          model: "gpt-4o-mini",
          provider: "openai",
        },
        {
          id: "chat-compare",
          success: true,
          response: "result-b",
          thinkingContent: "",
          latency: 12,
          model: "claude-sonnet",
          provider: "openai",
        },
      ],
      totalTime: 22,
    });
    generateImageMock.mockResolvedValue({
      data: [{ url: "https://example.com/generated.png" }],
    });
  });

  it("renders compare mode and attachment entry for text prompts", async () => {
    await renderWithI18n(
      <ToastProvider>
        <AiTestModal
          isOpen
          onClose={vi.fn()}
          prompt={prompt}
          initialMode="compare"
        />
      </ToastProvider>,
      { language: "en" },
    );

    expect(screen.getByText("Screenshot Analyzer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Multi-Model Compare" })).toHaveClass("bg-primary");
    expect(screen.getByText("Test Attachments")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Images" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test Image" })).not.toBeInTheDocument();
    expect(screen.getByText("{{feature}}")) .toBeInTheDocument();
  });

  it("shows image-only workbench controls for image prompts", async () => {
    await renderWithI18n(
      <ToastProvider>
        <AiTestModal
          isOpen
          onClose={vi.fn()}
          prompt={{
            ...prompt,
            id: "image-prompt-1",
            promptType: "image",
            images: ["reference.png"],
          }}
        />
      </ToastProvider>,
      { language: "en" },
    );

    expect(screen.getAllByRole("button", { name: "Test Image" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Multi-Model Compare" })).not.toBeInTheDocument();
    expect(screen.getByText("Reference Images")).toBeInTheDocument();
    expect(screen.getByText("Select existing reference images")).toBeInTheDocument();
    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  it("uses localized prompt labels in zh interface", async () => {
    await renderWithI18n(
      <ToastProvider>
        <AiTestModal
          isOpen
          onClose={vi.fn()}
          prompt={{
            ...prompt,
            id: "image-prompt-zh",
            promptType: "image",
            images: ["reference.png"],
          }}
        />
      </ToastProvider>,
      { language: "zh" },
    );

    expect(screen.getByText("用户提示词")).toBeInTheDocument();
    expect(screen.getByText("参考图片")).toBeInTheDocument();
    expect(screen.getByText("已选择")).toBeInTheDocument();
    expect(screen.getByText("模型: gpt-image-1")).toBeInTheDocument();
    expect(screen.getByText("服务提供商: openai")).toBeInTheDocument();
  });

  it("passes uploaded chat attachments to single-model tests for text prompts", async () => {
    const user = userEvent.setup();

    await renderWithI18n(
      <ToastProvider>
        <AiTestModal isOpen onClose={vi.fn()} prompt={prompt} />
      </ToastProvider>,
      { language: "en" },
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["fake-image"], "diagram.png", { type: "image/png" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText("diagram.png")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: "AI Test" })[1]);

    await waitFor(() => {
      expect(chatCompletionMock).toHaveBeenCalledTimes(1);
    });

    const messages = chatCompletionMock.mock.calls[0][1] as Array<{ role: string; content: unknown }>;
    const userMessage = messages.find((message) => message.role === "user");

    expect(Array.isArray(userMessage?.content)).toBe(true);
    expect(userMessage?.content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "text" }),
        expect.objectContaining({
          type: "image_url",
          image_url: expect.objectContaining({
            url: expect.stringContaining("data:image/png;base64,ZmFrZS1pbWFnZQ=="),
          }),
        }),
      ]),
    );
  });

  it("passes uploaded chat attachments to compare mode for text prompts", async () => {
    const user = userEvent.setup();

    await renderWithI18n(
      <ToastProvider>
        <AiTestModal isOpen onClose={vi.fn()} prompt={prompt} initialMode="compare" />
      </ToastProvider>,
      { language: "en" },
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["fake-image"], "diagram.png", { type: "image/png" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText("diagram.png")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "gpt-4o-mini" }));
    await user.click(screen.getByRole("button", { name: "claude-sonnet" }));
    await user.click(screen.getByRole("button", { name: "Run Comparison" }));

    await waitFor(() => {
      expect(multiModelCompareMock).toHaveBeenCalledTimes(1);
    });

    const messages = multiModelCompareMock.mock.calls[0][1] as Array<{ role: string; content: unknown }>;
    const userMessage = messages.find((message) => message.role === "user");

    expect(Array.isArray(userMessage?.content)).toBe(true);
    expect(userMessage?.content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "text" }),
        expect.objectContaining({
          type: "image_url",
          image_url: expect.objectContaining({
            url: expect.stringContaining("data:image/png;base64,ZmFrZS1pbWFnZQ=="),
          }),
        }),
      ]),
    );
  });
});
