import { describe, expect, it } from "vitest";

import {
  resolveScenarioAIConfig,
  resolveScenarioModel,
} from "../../../src/renderer/services/ai-defaults";

describe("ai-defaults", () => {
  it("uses explicit scenario selection when available", () => {
    const model = resolveScenarioModel(
      [
        {
          id: "chat-a",
          type: "chat",
          provider: "openai",
          apiProtocol: "openai",
          apiKey: "k1",
          apiUrl: "https://api.example.com",
          model: "gpt-4.1",
          isDefault: true,
        },
        {
          id: "chat-b",
          type: "chat",
          provider: "anthropic",
          apiProtocol: "anthropic",
          apiKey: "k2",
          apiUrl: "https://api.anthropic.com",
          model: "claude-4-sonnet",
        },
      ],
      { translation: "chat-b" },
      "translation",
      "chat",
    );

    expect(model?.id).toBe("chat-b");
  });

  it("falls back to the type default when scenario selection is missing", () => {
    const model = resolveScenarioModel(
      [
        {
          id: "image-a",
          type: "image",
          provider: "openai",
          apiProtocol: "openai",
          apiKey: "k1",
          apiUrl: "https://api.example.com",
          model: "gpt-image-1",
          isDefault: true,
        },
        {
          id: "image-b",
          type: "image",
          provider: "google",
          apiProtocol: "gemini",
          apiKey: "k2",
          apiUrl: "https://generativelanguage.googleapis.com",
          model: "gemini-image",
        },
      ],
      {},
      "imageTest",
      "image",
    );

    expect(model?.id).toBe("image-a");
  });

  it("falls back to legacy root chat config when the selected scenario model is unusable", () => {
    const config = resolveScenarioAIConfig({
      aiModels: [
        {
          id: "broken-translation",
          type: "chat",
          provider: "openai",
          apiProtocol: "openai",
          apiKey: "",
          apiUrl: "https://api.example.com",
          model: "gpt-4o-mini",
        },
      ],
      scenarioModelDefaults: { translation: "broken-translation" },
      scenario: "translation",
      type: "chat",
      aiProvider: "openai",
      aiApiProtocol: "openai",
      aiApiKey: "legacy-key",
      aiApiUrl: "https://api.legacy.example.com",
      aiModel: "gpt-4o",
    });

    expect(config).toMatchObject({
      provider: "openai",
      apiKey: "legacy-key",
      apiUrl: "https://api.legacy.example.com",
      model: "gpt-4o",
      type: "chat",
      apiProtocol: "openai",
    });
  });
});
