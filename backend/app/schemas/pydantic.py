from typing import Literal, Optional

from pydantic import BaseModel, Field


Engine = Literal["api", "ollama"]
ApiProvider = Literal["glm", "deepseek", "minimax"]


class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    status: str
    reply: Optional[str] = None
    engine_used: Optional[str] = None
    provider_used: Optional[str] = None
    model_used: Optional[str] = None
    message: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    status: str
    document_id: int
    filename: str
    chunks: int


class VectorSearchRequest(BaseModel):
    query: str
    top_k: int = Field(default=10, ge=1, le=100)


class ProviderConfig(BaseModel):
    apiKey: str = ""
    model: str = ""


class ProviderSettings(BaseModel):
    glm: ProviderConfig = Field(default_factory=lambda: ProviderConfig(model="glm-4.7"))
    deepseek: ProviderConfig = Field(default_factory=lambda: ProviderConfig(model="deepseek-chat"))
    minimax: ProviderConfig = Field(default_factory=lambda: ProviderConfig(model="MiniMax-M2.5"))


class OllamaConfig(BaseModel):
    model: str = "qwen2.5:7b"


class LLMSettings(BaseModel):
    engine: Engine = "api"
    apiProvider: ApiProvider = "deepseek"
    providers: ProviderSettings = Field(default_factory=ProviderSettings)
    ollama: OllamaConfig = Field(default_factory=OllamaConfig)


class ProviderCatalogEntry(BaseModel):
    id: ApiProvider
    label: str
    description: str
    base_url: str
    models: list[str]


class LLMSettingsResponse(BaseModel):
    settings: LLMSettings
    provider_catalog: list[ProviderCatalogEntry]


class ModelOption(BaseModel):
    id: str
    name: str


class OllamaModelsResponse(BaseModel):
    models: list[ModelOption]


class ErrorResponse(BaseModel):
    status: str = "error"
    message: str
    detail: Optional[str] = None
