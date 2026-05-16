import type {
  AIModelConfig,
  AIUsageScenario,
  ScenarioModelDefaults,
} from "../stores/settings.store";
import type { AIConfig } from "./ai";

export function getModelsByType(
  aiModels: AIModelConfig[],
  type: "chat" | "image",
): AIModelConfig[] {
  return aiModels.filter((model) => (model.type ?? "chat") === type);
}

export function resolveScenarioModel(
  aiModels: AIModelConfig[],
  scenarioModelDefaults: ScenarioModelDefaults | undefined,
  scenario: AIUsageScenario,
  type: "chat" | "image",
): AIModelConfig | null {
  const typedModels = getModelsByType(aiModels, type);
  const scenarioModelId = scenarioModelDefaults?.[scenario];

  if (scenarioModelId) {
    const explicitModel = typedModels.find((model) => model.id === scenarioModelId);
    if (explicitModel) {
      return explicitModel;
    }
  }

  return typedModels.find((model) => model.isDefault) ?? typedModels[0] ?? null;
}

export function toAIConfig(model: AIModelConfig): AIConfig {
  return {
    id: model.id,
    provider: model.provider,
    apiProtocol: model.apiProtocol,
    apiKey: model.apiKey,
    apiUrl: model.apiUrl,
    model: model.model,
    type: model.type ?? "chat",
    chatParams: model.chatParams,
    imageParams: model.imageParams,
  };
}

export function isConfiguredModel(model: AIModelConfig | null | undefined): model is AIModelConfig {
  return Boolean(
    model &&
      model.provider?.trim() &&
      model.apiKey?.trim() &&
      model.apiUrl?.trim() &&
      model.model?.trim(),
  );
}

interface ResolveScenarioAIConfigOptions {
  aiModels: AIModelConfig[];
  scenarioModelDefaults: ScenarioModelDefaults | undefined;
  scenario: AIUsageScenario;
  type: "chat" | "image";
  aiProvider: string;
  aiApiProtocol: AIConfig["apiProtocol"];
  aiApiKey: string;
  aiApiUrl: string;
  aiModel: string;
}

export function resolveScenarioAIConfig({
  aiModels,
  scenarioModelDefaults,
  scenario,
  type,
  aiProvider,
  aiApiProtocol,
  aiApiKey,
  aiApiUrl,
  aiModel,
}: ResolveScenarioAIConfigOptions): AIConfig | null {
  const selectedModel = resolveScenarioModel(
    aiModels,
    scenarioModelDefaults,
    scenario,
    type,
  );

  if (isConfiguredModel(selectedModel)) {
    return toAIConfig(selectedModel);
  }

  if (
    type === "chat" &&
    aiProvider.trim() &&
    aiApiKey.trim() &&
    aiApiUrl.trim() &&
    aiModel.trim()
  ) {
    return {
      provider: aiProvider,
      apiProtocol: aiApiProtocol,
      apiKey: aiApiKey,
      apiUrl: aiApiUrl,
      model: aiModel,
      type,
    };
  }

  return null;
}
