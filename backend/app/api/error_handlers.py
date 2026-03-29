from fastapi import Request
from fastapi.responses import JSONResponse
from ..core.exceptions import DocumentProcessingError, EmbeddingError, VectorDBError, LLMError


async def document_processing_error_handler(request: Request, exc: DocumentProcessingError):
    return JSONResponse(
        status_code=400,
        content={"status": "error", "message": str(exc)}
    )


async def embedding_error_handler(request: Request, exc: EmbeddingError):
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": str(exc)}
    )


async def vector_db_error_handler(request: Request, exc: VectorDBError):
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": str(exc)}
    )


async def llm_error_handler(request: Request, exc: LLMError):
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": str(exc)}
    )
