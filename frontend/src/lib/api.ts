export interface ChatRequest {
  message: string;
  engine: "api" | "ollama";
}

export interface ChatResponse {
  status: string;
  reply: string;
  engine_used: string;
  message?: string;
}

export interface VectorDocument {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  distance?: number;
}

export interface VectorSearchRequest {
  query: string;
  top_k: number;
}

const API_BASE_URL = "http://localhost:8000";

export async function sendChatMessage(
  message: string,
  engine: "api" | "ollama"
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, engine }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function fetchVectors(): Promise<VectorDocument[]> {
  const response = await fetch(`${API_BASE_URL}/api/vectors`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.documents || [];
}

export async function searchVectors(
  query: string,
  top_k: number = 10
): Promise<VectorDocument[]> {
  const response = await fetch(`${API_BASE_URL}/api/vectors/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}
