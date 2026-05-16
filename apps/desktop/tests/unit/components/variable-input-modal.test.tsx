import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VariableInputModal } from "../../../src/renderer/components/prompt/VariableInputModal";
import { renderWithI18n } from "../../helpers/i18n";

describe("VariableInputModal", () => {
  it("shows image attachment controls when filling variables for AI test", async () => {
    await renderWithI18n(
      <VariableInputModal
        isOpen
        onClose={vi.fn()}
        promptId="prompt-1"
        systemPrompt="You inspect images."
        userPrompt="Describe {{subject}} in this screenshot."
        mode="aiTest"
        onAiTest={vi.fn()}
      />,
      { language: "en" },
    );

    expect(screen.getByText("Test Attachments")).toBeInTheDocument();
    expect(screen.getByText("Add Images")).toBeInTheDocument();
    expect(screen.getByText(/PNG, JPG, WebP, or GIF/u)).toBeInTheDocument();
  });
});
