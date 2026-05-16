import type { Prompt } from "@prompthub/shared/types";

const VARIABLE_REGEX = /\{\{([^}:]+)(?::([^}]*))?\}\}/g;
const SYSTEM_VARIABLES = new Set([
  "CURRENT_DATE",
  "CURRENT_TIME",
  "CURRENT_DATETIME",
  "CURRENT_YEAR",
  "CURRENT_MONTH",
  "CURRENT_DAY",
  "CURRENT_WEEKDAY",
]);

export interface ResolvedPromptContent {
  systemPrompt?: string;
  userPrompt: string;
}

export function resolvePromptContentByLanguage(
  prompt: Prompt,
  showEnglish: boolean,
): ResolvedPromptContent {
  return {
    systemPrompt: showEnglish
      ? (prompt.systemPromptEn || prompt.systemPrompt)
      : prompt.systemPrompt,
    userPrompt: showEnglish
      ? (prompt.userPromptEn || prompt.userPrompt)
      : prompt.userPrompt,
  };
}

export function hasUserDefinedPromptVariables(
  systemPrompt?: string,
  userPrompt?: string,
): boolean {
  const combined = `${systemPrompt || ""}\n${userPrompt || ""}`;
  const matches = [...combined.matchAll(VARIABLE_REGEX)];
  return matches.some((match) => !SYSTEM_VARIABLES.has(match[1].trim()));
}

export function buildPromptCopyText({
  systemPrompt,
  userPrompt,
}: ResolvedPromptContent): string {
  if (!systemPrompt) {
    return userPrompt;
  }

  return `[System]\n${systemPrompt}\n\n[User]\n${userPrompt}`;
}
