export type VectorMetadataValue = string | number | boolean | null;
export type VectorMetadata = Record<string, VectorMetadataValue>;
export type Engine = "api" | "ollama";
export type ApiProvider = "glm" | "deepseek" | "minimax";

export interface ChatRequest {
  message: string;
  session_id: string;
}

export interface ChatResponse {
  status: string;
  reply: string;
  engine_used: string;
  provider_used: string;
  model_used: string;
  message?: string;
}

export interface ProviderConfig {
  apiKey: string;
  model: string;
}

export type ProvidersConfig = Record<ApiProvider, ProviderConfig>;

export interface LLMSettings {
  engine: Engine;
  apiProvider: ApiProvider;
  providers: ProvidersConfig;
  ollama: {
    model: string;
  };
}

export interface ProviderCatalogEntry {
  id: ApiProvider;
  label: string;
  description: string;
  base_url: string;
  models: string[];
}

export interface LLMSettingsResponse {
  settings: LLMSettings;
  provider_catalog: ProviderCatalogEntry[];
}

export interface ModelOption {
  id: string;
  name: string;
}

export interface OllamaModelsResponse {
  models: ModelOption[];
}

export interface SessionDeleteResponse {
  status: string;
  session_id: string;
}

export interface VectorDocument {
  id: string;
  content: string;
  metadata?: VectorMetadata;
  distance?: number;
}

export interface VectorSearchRequest {
  query: string;
  top_k: number;
}

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const API_BASE_URL =
  configuredApiBaseUrl && configuredApiBaseUrl !== "/"
    ? configuredApiBaseUrl.replace(/\/$/, "")
    : "";

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: Record<string, unknown> | null = null;

  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      (typeof data?.detail === "string" && data.detail) ||
      (typeof data?.message === "string" && data.message) ||
      `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  return (data ?? {}) as T;
}

export async function sendChatMessage(
  message: string,
  sessionId: string
): Promise<ChatResponse> {
  const response = await fetch(buildApiUrl("/api/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  return parseJsonResponse<ChatResponse>(response);
}

export async function deleteChatSession(
  sessionId: string
): Promise<SessionDeleteResponse> {
  const response = await fetch(
    buildApiUrl(`/api/chat/sessions/${encodeURIComponent(sessionId)}`),
    {
      method: "DELETE",
    }
  );

  return parseJsonResponse<SessionDeleteResponse>(response);
}

export async function fetchLLMSettings(): Promise<LLMSettingsResponse> {
  const response = await fetch(buildApiUrl("/api/settings/llm"));
  return parseJsonResponse<LLMSettingsResponse>(response);
}

export async function updateLLMSettings(
  settings: LLMSettings
): Promise<LLMSettingsResponse> {
  const response = await fetch(buildApiUrl("/api/settings/llm"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });

  return parseJsonResponse<LLMSettingsResponse>(response);
}

export async function fetchOllamaModels(): Promise<OllamaModelsResponse> {
  const response = await fetch(buildApiUrl("/api/settings/ollama/models"));
  return parseJsonResponse<OllamaModelsResponse>(response);
}

export async function fetchVectors(): Promise<VectorDocument[]> {
  const response = await fetch(buildApiUrl("/api/vectors"));
  const data = await parseJsonResponse<{ documents?: VectorDocument[] }>(response);
  return data.documents || [];
}

export async function searchVectors(
  query: string,
  top_k: number = 10
): Promise<VectorDocument[]> {
  const response = await fetch(buildApiUrl("/api/vectors/search"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k }),
  });

  const data = await parseJsonResponse<{ results?: VectorDocument[] }>(response);
  return data.results || [];
}
