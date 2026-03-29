from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    engine: str = "api"  # 默认使用 'api'，前端可以传 'ollama' 来切换

class ChatResponse(BaseModel):
    status: str
    reply: Optional[str] = None
    engine_used: Optional[str] = None
    message: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    status: str
    document_id: int
    filename: str
    chunks: int

class ErrorResponse(BaseModel):
    status: str = "error"
    message: str
    detail: Optional[str] = None
