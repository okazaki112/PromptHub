import type { AIConfig } from "../../services/ai";
import {
  resolveScenarioAIConfig,
} from "../../services/ai-defaults";
import type {
  AIModelConfig,
  ScenarioModelDefaults,
} from "../../stores/settings.store";

interface ResolveQuickAddAnalysisConfigOptions {
  aiModels: AIModelConfig[];
  scenarioModelDefaults: ScenarioModelDefaults;
  aiProvider: string;
  aiApiProtocol: AIConfig["apiProtocol"];
  aiApiKey: string;
  aiApiUrl: string;
  aiModel: string;
}

export function resolveQuickAddAnalysisConfig({
  aiModels,
  scenarioModelDefaults,
  aiProvider,
  aiApiProtocol,
  aiApiKey,
  aiApiUrl,
  aiModel,
}: ResolveQuickAddAnalysisConfigOptions): AIConfig | null {
  return resolveScenarioAIConfig({
    aiModels,
    scenarioModelDefaults,
    scenario: "quickAdd",
    type: "chat",
    aiProvider,
    aiApiProtocol,
    aiApiKey,
    aiApiUrl,
    aiModel,
  });
}

export function getQuickAddFallbackTitle(
  promptText: string,
  emptyFallback = "New Prompt",
): string {
  const firstLine = promptText
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine?.slice(0, 30) || emptyFallback;
}

export type QuickAddMode = "analyze" | "generate";

export interface QuickAddAnalysisResult {
  title?: string;
  systemPrompt?: string;
  description?: string;
  suggestedFolder?: string | null;
  tags: string[];
}

export interface QuickAddGeneratedDraft {
  title: string;
  promptType: "text" | "image";
  systemPrompt?: string;
  userPrompt: string;
  description?: string;
  suggestedFolder?: string | null;
  tags: string[];
}

interface QuickAddPromptContext {
  folderNames: string;
  tagsString: string;
}

function extractJsonObject(
  responseContent: string,
): Record<string, unknown> | null {
  const jsonMatch = responseContent.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function asOptionalFolderName(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  return asOptionalString(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function asPromptType(value: unknown): "text" | "image" | undefined {
  if (value !== "text" && value !== "image") {
    return undefined;
  }

  return value;
}

export function buildQuickAddAnalysisPrompt(
  promptText: string,
  context: QuickAddPromptContext,
): string {
  return `请分析以下用户提供的 Prompt，并返回 JSON 格式的结果：

用户 Prompt:
"""
${promptText}
"""

可用的文件夹列表：
${context.folderNames || "暂无文件夹"}

已知存在的标签（请优先从这些标签中提取或匹配）：
${context.tagsString}

请分析并返回以下 JSON 格式（不要包含任何其他文字，只返回纯 JSON）：
{
  "title": "为这个 Prompt 起一个简洁的标题（不超过20字）",
  "systemPrompt": "如果 Prompt 中包含系统提示词/角色设定，提取出来；如果没有，根据 Prompt 内容生成一个合适的系统提示词",
  "description": "用一句话描述这个 Prompt 的用途（不超过50字）",
  "suggestedFolder": "根据内容推荐最适合的文件夹名称，如果没有合适的则返回 null",
  "tags": ["根据内容提取关键词作为标签，优先使用已存在的标签，如果必要可以生成1-2个新标签"]
}`;
}

export function buildQuickAddGeneratePrompt(
  userRequest: string,
  context: QuickAddPromptContext,
  preferredPromptType: "text" | "image",
): string {
  const preferredTypeLabel =
    preferredPromptType === "image" ? "image（绘图）" : "text（文本）";

  return `你是一名资深 Prompt 设计师。请根据用户需求，生成一份可直接保存到 PromptHub 的 Prompt 草稿，并只返回 JSON。

用户需求：
"""
${userRequest}
"""

当前偏好 Prompt 类型：
${preferredTypeLabel}

可用的文件夹列表：
${context.folderNames || "暂无文件夹"}

已知存在的标签（请优先复用这些标签）：
${context.tagsString}

请只返回以下 JSON 结构，不要输出 Markdown、解释或代码块：
{
  "title": "简洁标题，不超过20字",
  "promptType": "text 或 image",
  "systemPrompt": "系统提示词；如果是 image Prompt 且不需要，可以返回空字符串",
  "userPrompt": "最终给模型使用的 Prompt 正文，必须完整可用",
  "description": "一句话描述用途，不超过50字",
  "suggestedFolder": "推荐的文件夹名称，如果没有合适的则返回 null",
  "tags": ["2-5 个标签，优先使用已存在标签"]
}

生成要求：
- 必须输出可以直接保存和测试的 Prompt，不要只输出大纲。
- 如果用户需求更像绘图 / 生图任务，返回 promptType=image；否则返回 text。
- text Prompt 可以包含 systemPrompt 和 userPrompt。
- image Prompt 的重点应放在 userPrompt，systemPrompt 可以为空。
- 如果用户没有明确指定类型，优先参考当前偏好 Prompt 类型：${preferredTypeLabel}。`;
}

export function parseQuickAddAnalysisResult(
  responseContent: string,
): QuickAddAnalysisResult | null {
  const parsed = extractJsonObject(responseContent);

  if (!parsed) {
    return null;
  }

  return {
    title: asOptionalString(parsed.title),
    systemPrompt: asOptionalString(parsed.systemPrompt),
    description: asOptionalString(parsed.description),
    suggestedFolder: asOptionalFolderName(parsed.suggestedFolder),
    tags: asStringArray(parsed.tags),
  };
}

export function parseQuickAddGeneratedDraft(
  responseContent: string,
  fallbackPromptType: "text" | "image",
  emptyTitleFallback: string,
): QuickAddGeneratedDraft | null {
  const parsed = extractJsonObject(responseContent);

  if (!parsed) {
    return null;
  }

  const userPrompt = asOptionalString(parsed.userPrompt);

  if (!userPrompt) {
    return null;
  }

  return {
    title:
      asOptionalString(parsed.title) ||
      getQuickAddFallbackTitle(userPrompt, emptyTitleFallback),
    promptType: asPromptType(parsed.promptType) || fallbackPromptType,
    systemPrompt: asOptionalString(parsed.systemPrompt),
    userPrompt,
    description: asOptionalString(parsed.description),
    suggestedFolder: asOptionalFolderName(parsed.suggestedFolder),
    tags: asStringArray(parsed.tags),
  };
}
