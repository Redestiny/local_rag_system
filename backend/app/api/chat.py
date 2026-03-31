from fastapi import APIRouter, Depends
import logging
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..schemas.pydantic import ChatRequest, ChatResponse, SessionDeleteResponse
from ..services.chat_service import MemoryAwareChatService

router = APIRouter()
logger = logging.getLogger("nexus_rag.chat")


def get_chat_service() -> MemoryAwareChatService:
    from ..main import chat_service
    return chat_service


@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(
    request: ChatRequest,
    chat_service: MemoryAwareChatService = Depends(get_chat_service),
    db: Session = Depends(get_db),
):
    logger.info(
        "收到聊天请求: session_id=%s, message_length=%s",
        request.session_id,
        len(request.message),
    )
    result = chat_service.chat(request.session_id, request.message, db)
    return ChatResponse(
        status="success",
        reply=result["reply"],
        engine_used=result["engine"],
        provider_used=result["provider"],
        model_used=result["model"],
    )


@router.delete("/chat/sessions/{session_id}", response_model=SessionDeleteResponse)
def delete_chat_session(
    session_id: str,
    chat_service: MemoryAwareChatService = Depends(get_chat_service),
    db: Session = Depends(get_db),
):
    chat_service.clear_session_history(session_id, db)
    return SessionDeleteResponse(status="success", session_id=session_id)
