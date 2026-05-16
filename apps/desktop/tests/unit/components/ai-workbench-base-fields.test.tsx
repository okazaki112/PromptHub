import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BaseFields } from "../../../src/renderer/components/settings/ai-workbench/model-form/BaseFields";
import { renderWithI18n } from "../../helpers/i18n";

function createModelForm(provider: string = "openai") {
  return {
    type: "chat" as const,
    name: "",
    provider,
    apiProtocol: provider === "custom" ? "openai" : provider === "google" ? "gemini" : provider === "anthropic" ? "anthropic" : "openai",
    apiKey: "",
    apiUrl: provider === "openai" ? "https://api.openai.com" : "",
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
      quality: "standard" as const,
      style: "vivid" as const,
      n: 1,
    },
  };
}

describe("BaseFields", () => {
  it("shows protocol selection only for the custom provider", async () => {
    const setModelForm = vi.fn();

    const { rerender } = await renderWithI18n(
      <BaseFields
        modelForm={createModelForm("openai")}
        setModelForm={setModelForm}
        fetchingModels={false}
        onFetchModels={() => undefined}
      />,
      { language: "en" },
    );

    expect(screen.queryByText(/settings\.protocol|Protocol/)).not.toBeInTheDocument();

    rerender(
      <BaseFields
        modelForm={createModelForm("custom")}
        setModelForm={setModelForm}
        fetchingModels={false}
        onFetchModels={() => undefined}
      />,
    );

    expect(screen.getByText(/settings\.protocol|Protocol/)).toBeInTheDocument();
    expect(
      screen.getByText(/settings\.protocolOpenAICompatible|OpenAI-compatible/),
    ).toBeInTheDocument();
  });

  it("keeps provider-recommended protocol when switching away from custom", async () => {
    const setModelForm = vi.fn();

    await renderWithI18n(
      <BaseFields
        modelForm={createModelForm("custom")}
        setModelForm={setModelForm}
        fetchingModels={false}
        onFetchModels={() => undefined}
      />,
      { language: "en" },
    );

    fireEvent.click(screen.getByRole("button", { name: "自定义" }));
    fireEvent.click(await screen.findByRole("button", { name: "Google" }));

    expect(setModelForm).toHaveBeenCalled();
  });

  it("renders translated provider groups instead of mixed-language labels", async () => {
    const setModelForm = vi.fn();

    await renderWithI18n(
      <BaseFields
        modelForm={createModelForm("openai")}
        setModelForm={setModelForm}
        fetchingModels={false}
        onFetchModels={() => undefined}
      />,
      { language: "en" },
    );

    fireEvent.click(screen.getByRole("button", { name: "OpenAI" }));

    expect(screen.getByText("Overseas")).toBeInTheDocument();
    expect(screen.getByText("Domestic")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.queryByText("International / 国际")).not.toBeInTheDocument();
    expect(screen.queryByText("Domestic / 国内")).not.toBeInTheDocument();
    expect(screen.queryByText("Other / 其他")).not.toBeInTheDocument();
  });
});
