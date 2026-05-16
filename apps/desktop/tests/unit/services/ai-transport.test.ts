import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildMessagesFromPrompt,
  chatCompletion,
  fetchAvailableModels,
} from "../../../src/renderer/services/ai";
import { installWindowMocks } from "../../helpers/window";

describe("ai transport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installWindowMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("uses the main-process stream transport for streaming chat completions", async () => {
    const onContent = vi.fn();
    window.api.ai.requestStream.mockImplementation(
      async (
        _request: unknown,
        handlers?: {
          onChunk?: (chunk: string) => void;
        },
      ) => {
        handlers?.onChunk?.(
          'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
        );
        handlers?.onChunk?.(
          'data: {"choices":[{"delta":{"content":" world"}}]}\n',
        );
        handlers?.onChunk?.("data: [DONE]\n");
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          body: "",
          headers: { "content-type": "text/event-stream" },
        };
      },
    );

    const result = await chatCompletion(
      {
        provider: "openai",
        apiProtocol: "openai",
        apiKey: "test-key",
        apiUrl: "https://api.example.com",
        model: "gpt-test",
        chatParams: {
          stream: true,
        },
      },
      [{ role: "user", content: "Say hello" }],
      {
        stream: true,
        onStream: onContent,
      },
    );

    expect(window.api.ai.requestStream).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
    expect(onContent).toHaveBeenCalledWith("Hello");
    expect(onContent).toHaveBeenCalledWith(" world");
    expect(result).toEqual({
      content: "Hello world",
      thinkingContent: undefined,
    });
  });

  it("uses the main-process request transport for model discovery", async () => {
    window.api.ai.request.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      body: JSON.stringify({
        data: [{ id: "gpt-4o" }, { id: "gpt-4.1-mini" }],
      }),
      headers: { "content-type": "application/json" },
    });

    const result = await fetchAvailableModels(
      "https://api.openai.com",
      "test-key",
    );

    expect(window.api.ai.request).toHaveBeenCalledWith({
      method: "GET",
      url: "https://api.openai.com/v1/models",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer test-key",
      },
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      models: [
        { id: "gpt-4.1-mini", name: "gpt-4.1-mini", owned_by: undefined, created: undefined },
        { id: "gpt-4o", name: "gpt-4o", owned_by: undefined, created: undefined },
      ],
    });
  });

  it("builds text-only prompt messages with the legacy string content shape", () => {
    const messages = buildMessagesFromPrompt(
      "You are concise.",
      "Describe {{topic}}",
      { topic: "SQLite" },
    );

    expect(messages).toEqual([
      { role: "system", content: "You are concise." },
      { role: "user", content: "Describe SQLite" },
    ]);
  });

  it("builds multimodal prompt messages with base64 image URL parts", () => {
    const messages = buildMessagesFromPrompt(
      "You inspect screenshots.",
      "What changed?",
      undefined,
      [
        {
          name: "screen.png",
          mimeType: "image/png",
          base64: "iVBORw0KGgo=",
        },
      ],
    );

    expect(messages).toEqual([
      { role: "system", content: "You inspect screenshots." },
      {
        role: "user",
        content: [
          { type: "text", text: "What changed?" },
          {
            type: "image_url",
            image_url: {
              url: "data:image/png;base64,iVBORw0KGgo=",
            },
          },
        ],
      },
    ]);
  });

  it("sends multimodal messages through the main-process request transport", async () => {
    window.api.ai.request.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      body: JSON.stringify({
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "The image contains a chart." },
            finish_reason: "stop",
          },
        ],
      }),
      headers: { "content-type": "application/json" },
    });

    const messages = buildMessagesFromPrompt(
      undefined,
      "Read the image",
      undefined,
      [{ mimeType: "image/jpeg", base64: "/9j/4AAQSkZJRg==" }],
    );

    const result = await chatCompletion(
      {
        provider: "openai",
        apiProtocol: "openai",
        apiKey: "test-key",
        apiUrl: "https://api.example.com",
        model: "gpt-4o",
      },
      messages,
    );

    expect(result.content).toBe("The image contains a chart.");
    expect(window.api.ai.request).toHaveBeenCalledTimes(1);

    const request = window.api.ai.request.mock.calls[0]?.[0];
    expect(request).toBeDefined();
    const body = JSON.parse(String(request?.body));

    expect(body.messages).toEqual([
      {
        role: "user",
        content: [
          { type: "text", text: "Read the image" },
          {
            type: "image_url",
            image_url: {
              url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
            },
          },
        ],
      },
    ]);
  });

  it("uses Authorization bearer for Gemini OpenAI-compatible chat completions", async () => {
    window.api.ai.request.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      body: JSON.stringify({
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Gemini says hi." },
            finish_reason: "stop",
          },
        ],
      }),
      headers: { "content-type": "application/json" },
    });

    const result = await chatCompletion(
      {
        provider: "google",
        apiProtocol: "gemini",
        apiKey: "gemini-key",
        apiUrl: "https://generativelanguage.googleapis.com",
        model: "gemini-3-flash-preview",
      },
      [{ role: "user", content: "Say hi" }],
    );

    expect(result.content).toBe("Gemini says hi.");
    expect(window.api.ai.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        headers: expect.objectContaining({
          Authorization: "Bearer gemini-key",
        }),
      }),
    );

    const headers = window.api.ai.request.mock.calls[0]?.[0]?.headers;
    expect(headers["x-goog-api-key"]).toBeUndefined();
  });

  it("uses x-goog-api-key for Gemini native model discovery", async () => {
    window.api.ai.request.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      body: JSON.stringify({
        models: [{ name: "models/gemini-3-flash-preview", displayName: "Gemini 3 Flash Preview" }],
      }),
      headers: { "content-type": "application/json" },
    });

    const result = await fetchAvailableModels(
      "https://generativelanguage.googleapis.com",
      "gemini-key",
      "gemini",
    );

    expect(result).toEqual({
      success: true,
      models: [
        {
          id: "gemini-3-flash-preview",
          name: "Gemini 3 Flash Preview (gemini-3-flash-preview)",
          owned_by: "Google",
          description: undefined,
        },
      ],
    });

    expect(window.api.ai.request).toHaveBeenCalledWith({
      method: "GET",
      url: "https://generativelanguage.googleapis.com/v1beta/models",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-goog-api-key": "gemini-key",
      },
    });
  });

  it("preserves image attachments when sending Anthropic multimodal chat requests", async () => {
    window.api.ai.request.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      body: JSON.stringify({
        content: [{ type: "text", text: "I can see the screenshot." }],
      }),
      headers: { "content-type": "application/json" },
    });

    const messages = buildMessagesFromPrompt(
      "You inspect screenshots.",
      "Describe the UI",
      undefined,
      [{ mimeType: "image/png", base64: "iVBORw0KGgo=" }],
    );

    const result = await chatCompletion(
      {
        provider: "anthropic",
        apiProtocol: "anthropic",
        apiKey: "anthropic-key",
        apiUrl: "https://api.anthropic.com",
        model: "claude-3-7-sonnet-latest",
      },
      messages,
    );

    expect(result.content).toBe("I can see the screenshot.");
    const request = window.api.ai.request.mock.calls[0]?.[0];
    const body = JSON.parse(String(request?.body));
    expect(body.system).toBe("You inspect screenshots.");
    expect(body.messages).toEqual([
      {
        role: "user",
        content: [
          { type: "text", text: "Describe the UI" },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: "iVBORw0KGgo=",
            },
          },
        ],
      },
    ]);
  });
});
