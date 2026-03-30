from fastapi import APIRouter, Depends
import logging
from ..schemas.pydantic import ChatRequest, ChatResponse
from ..services.rag_chain import RAGService
from ..services.llm_service import LLMService

router = APIRouter()
logger = logging.getLogger("nexus_rag.chat")


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
    logger.info(f"收到聊天请求: engine={request.engine}, message_length={len(request.message)}")
    contexts = rag_service.retrieve_context(request.message)
    prompt = rag_service.build_prompt(request.message, contexts) if contexts else request.message
    ai_reply = llm_service.generate_response(prompt, request.engine)
    return ChatResponse(status="success", reply=ai_reply, engine_used=request.engine)


