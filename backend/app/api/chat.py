from fastapi import APIRouter, Depends
from ..schemas.pydantic import ChatRequest, ChatResponse
from ..services.rag_chain import RAGService
from ..services.llm_service import LLMService

router = APIRouter()


def get_rag_service() -> RAGService:
    from ..main import rag_service
    return rag_service


def get_llm_service() -> LLMService:
    from ..main import llm_service
    return llm_service


@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(
    request: ChatRequest,
    rag_service: RAGService = Depends(get_rag_service),
    llm_service: LLMService = Depends(get_llm_service)
):
    try:
        contexts = rag_service.retrieve_context(request.message)
        prompt = rag_service.build_prompt(request.message, contexts) if contexts else request.message
        ai_reply = llm_service.generate_response(prompt, request.engine)
        return ChatResponse(status="success", reply=ai_reply, engine_used=request.engine)
    except Exception as e:
        return ChatResponse(status="error", message=str(e))


