import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AvailableModelsList } from "../../../src/renderer/components/settings/ai-workbench/model-form/AvailableModelsList";
import { renderWithI18n } from "../../helpers/i18n";

describe("AvailableModelsList", () => {
  it("translates the fallback Other category label", async () => {
    await renderWithI18n(
      <AvailableModelsList
        availableModels={[{ id: "custom-model-1", owned_by: "unknown-lab" }]}
        modelForm={{
          type: "chat",
          name: "",
          provider: "custom",
          apiProtocol: "openai",
          apiKey: "",
          apiUrl: "https://api.example.com",
          model: "",
          chatParams: {
            temperature: 0.7,
            maxTokens: 2048,
            topP: 1,
            topK: "",
            frequencyPenalty: 0,
            presencePenalty: 0,
            stream: false,
            enableThinking: false,
            customParamsText: "",
          },
          imageParams: {
            size: "1024x1024",
            quality: "standard",
            style: "vivid",
            n: 1,
          },
        }}
        setModelForm={vi.fn()}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
      />,
      { language: "zh" },
    );

    expect(screen.getByText("其他")).toBeInTheDocument();
    expect(screen.queryByText("Other")).not.toBeInTheDocument();
  });
});
