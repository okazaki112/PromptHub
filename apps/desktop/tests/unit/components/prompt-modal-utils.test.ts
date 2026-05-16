import { describe, expect, it } from "vitest";

import {
  isPureEnglish,
  promoteMainEnglishToEnglishVersion,
} from "../../../src/renderer/components/prompt/prompt-modal-utils";

describe("prompt-modal-utils", () => {
  it("detects pure English content without CJK text", () => {
    expect(
      isPureEnglish(
        "You are an AI-assisted programming expert who writes clear coding rules.",
      ),
    ).toBe(true);
    expect(isPureEnglish("这是中文 prompt")).toBe(false);
  });

  it("promotes main English content into dedicated English fields", () => {
    expect(
      promoteMainEnglishToEnglishVersion({
        systemPrompt: "You are a senior engineer.",
        systemPromptEn: "",
        userPrompt: "Refactor this module and keep the API stable.",
        userPromptEn: "",
      }),
    ).toEqual({
      systemPrompt: "",
      systemPromptEn: "You are a senior engineer.",
      userPrompt: "",
      userPromptEn: "Refactor this module and keep the API stable.",
    });
  });

  it("keeps content unchanged when an English version already exists", () => {
    expect(
      promoteMainEnglishToEnglishVersion({
        systemPrompt: "你是高级工程师。",
        systemPromptEn: "You are a senior engineer.",
        userPrompt: "请重构这个模块。",
        userPromptEn: "Refactor this module.",
      }),
    ).toEqual({
      systemPrompt: "你是高级工程师。",
      systemPromptEn: "You are a senior engineer.",
      userPrompt: "请重构这个模块。",
      userPromptEn: "Refactor this module.",
    });
  });
});
