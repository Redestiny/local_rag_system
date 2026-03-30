from fastapi import APIRouter, Depends

from ..schemas.pydantic import VectorSearchRequest
from ..services.embedding import EmbeddingService
from ..services.vector_db import VectorDBService

router = APIRouter()


def get_embedding_service() -> EmbeddingService:
    from ..main import embedding_service

    return embedding_service


def get_vector_db_service() -> VectorDBService:
    from ..main import vector_db_service

    return vector_db_service


@router.get("")
def list_vectors(
    offset: int = 0,
    limit: int = 100,
    vector_db_service: VectorDBService = Depends(get_vector_db_service),
):
    result = vector_db_service.list_documents(offset=offset, limit=limit)
    return {
        "status": "success",
        "total": result["total"],
        "offset": offset,
        "limit": limit,
        "documents": result["items"],
    }


@router.post("/search")
def search_vectors(
    request: VectorSearchRequest,
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_db_service: VectorDBService = Depends(get_vector_db_service),
):
    query_embedding = embedding_service.embed_text(request.query)
    return {
        "status": "success",
        "results": vector_db_service.search_documents(query_embedding, request.top_k),
    }
