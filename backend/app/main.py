from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.chat import router as chat_router
from app.api.document import router as document_router
from app.api.settings import router as settings_router
from app.api.vector import router as vector_router
from app.api.error_handlers import (
    document_processing_error_handler,
    embedding_error_handler,
    vector_db_error_handler,
    llm_error_handler
)
from app.core.database import init_db
from app.core.exceptions import DocumentProcessingError, EmbeddingError, VectorDBError, LLMError
from app.core.logging import setup_logging
from app.services.embedding import embedding_service
from app.services.chat_service import MemoryAwareChatService
from app.services.llm_settings import LLMSettingsService
from app.services.vector_db import vector_db_service
from app.services.rag_chain import RAGService
from app.services.llm_service import LLMService

# Initialize services
rag_service = RAGService(embedding_service, vector_db_service)
llm_settings_service = LLMSettingsService()
llm_service = LLMService(llm_settings_service)
chat_service = MemoryAwareChatService(rag_service, llm_service)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    init_db()
    llm_settings_service.ensure_initialized()
    yield


app = FastAPI(title="Nexus RAG API", version="1.0.0", lifespan=lifespan)

# Register exception handlers
app.add_exception_handler(DocumentProcessingError, document_processing_error_handler)
app.add_exception_handler(EmbeddingError, embedding_error_handler)
app.add_exception_handler(VectorDBError, vector_db_error_handler)
app.add_exception_handler(LLMError, llm_error_handler)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议改为 ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(document_router, prefix="/api/documents", tags=["documents"])
app.include_router(settings_router, prefix="/api/settings", tags=["settings"])
app.include_router(vector_router, prefix="/api/vectors", tags=["vectors"])
