import type {
  ApiProvider,
  Engine,
  LLMSettings,
  ProviderCatalogEntry,
} from "@/lib/api";

export const DEFAULT_LLM_SETTINGS: LLMSettings = {
  engine: "api",
  apiProvider: "deepseek",
  providers: {
    glm: {
      apiKey: "",
      model: "glm-4.7",
    },
    deepseek: {
      apiKey: "",
      model: "deepseek-chat",
    },
    minimax: {
      apiKey: "",
      model: "MiniMax-M2.5",
    },
  },
  ollama: {
    model: "qwen2.5:7b",
  },
};

export function cloneLLMSettings(settings: LLMSettings): LLMSettings {
  return JSON.parse(JSON.stringify(settings)) as LLMSettings;
}

export function getProviderCatalogEntry(
  providerCatalog: ProviderCatalogEntry[],
  provider: ApiProvider
): ProviderCatalogEntry | undefined {
  return providerCatalog.find((entry) => entry.id === provider);
}

export function canUseEngine(
  settings: LLMSettings,
  engine: Engine = settings.engine
): boolean {
  if (engine === "api") {
    const providerConfig = settings.providers[settings.apiProvider];
    return Boolean(
      settings.apiProvider &&
        providerConfig.apiKey.trim() &&
        providerConfig.model.trim()
    );
  }

  return Boolean(settings.ollama.model.trim());
}

export function getActiveProviderLabel(
  settings: LLMSettings,
  providerCatalog: ProviderCatalogEntry[]
): string {
  if (settings.engine === "ollama") {
    return "Ollama";
  }

  return (
    getProviderCatalogEntry(providerCatalog, settings.apiProvider)?.label ??
    settings.apiProvider.toUpperCase()
  );
}

export function getActiveModel(settings: LLMSettings): string {
  return settings.engine === "ollama"
    ? settings.ollama.model
    : settings.providers[settings.apiProvider].model;
}
