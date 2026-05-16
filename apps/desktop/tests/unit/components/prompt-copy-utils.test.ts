import { describe, expect, it } from "vitest";

import type { Prompt } from "@prompthub/shared/types";
import {
  buildPromptCopyText,
  hasUserDefinedPromptVariables,
  resolvePromptContentByLanguage,
} from "../../../src/renderer/components/prompt/prompt-copy-utils";

const basePrompt: Prompt = {
  id: "prompt-1",
  title: "Prompt",
  userPrompt: "中文用户提示词",
  userPromptEn: "English user prompt",
  systemPrompt: "中文系统提示词",
  systemPromptEn: "English system prompt",
  variables: [],
  tags: [],
  isFavorite: false,
  isPinned: false,
  version: 1,
  currentVersion: 1,
  usageCount: 0,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

describe("prompt-copy-utils", () => {
  it("resolves English prompt content when English mode is enabled", () => {
    expect(resolvePromptContentByLanguage(basePrompt, true)).toEqual({
      systemPrompt: "English system prompt",
      userPrompt: "English user prompt",
    });
  });

  it("falls back to the default prompt content when English text is missing", () => {
    expect(
      resolvePromptContentByLanguage(
        {
          ...basePrompt,
          systemPromptEn: undefined,
          userPromptEn: undefined,
        },
        true,
      ),
    ).toEqual({
      systemPrompt: "中文系统提示词",
      userPrompt: "中文用户提示词",
    });
  });

  it("ignores system variables when deciding whether to open the variable modal", () => {
    expect(
      hasUserDefinedPromptVariables(
        "Today is {{CURRENT_DATE}}",
        "Use {{CURRENT_TIME}} for the answer",
      ),
    ).toBe(false);
  });

  it("detects user variables and builds the combined copy text", () => {
    expect(
      hasUserDefinedPromptVariables(
        "Role: {{role}}",
        "Task: {{task}}",
      ),
    ).toBe(true);
    expect(
      buildPromptCopyText({
        systemPrompt: "System",
        userPrompt: "User",
      }),
    ).toBe("[System]\nSystem\n\n[User]\nUser");
  });
});
