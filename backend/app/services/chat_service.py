import logging

from sqlalchemy.orm import Session

from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory

from ..core.config import settings
from ..repositories.chat_history_repository import ChatHistoryRepository
from .llm_service import LLMService
from .rag_chain import RAGService

logger = logging.getLogger("nexus_rag.chat_service")


class SQLAlchemyChatMessageHistory(BaseChatMessageHistory):
    def __init__(
        self,
        session_id: str,
        repository: ChatHistoryRepository,
        limit_messages: int,
        engine: str | None = None,
    ) -> None:
        self.session_id = session_id
        self.repository = repository
        self.limit_messages = limit_messages
        self.engine = engine

    @property
    def messages(self) -> list[BaseMessage]:
        return self.repository.get_recent_messages(
            self.session_id,
            limit_messages=self.limit_messages,
        )

    def add_messages(self, messages: list[BaseMessage]) -> None:
        self.repository.add_messages(
            self.session_id,
            messages,
            engine=self.engine,
        )

    def clear(self) -> None:
        self.repository.clear_session(self.session_id)


class MemoryAwareChatService:
    def __init__(self, rag_service: RAGService, llm_service: LLMService):
        self.rag_service = rag_service
        self.llm_service = llm_service
        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    (
                        "你是 Nexus 智能助手。请优先结合提供的文档上下文回答用户问题，并自然延续当前会话历史。"
                        "若文档上下文有答案，请明确说明是由文档提供的相关信息"
                        "Nexus 十分乐意帮助用户，并提供真正有帮助的回答。"
                        "在典型对话中或被问及简单问题时，Nexus 保持自然语气，以句子/段落而不是列表或项目符号的形式回应，除非明确要求这些。在随意对话中，Nexus 的响应可以相对较短，例如仅几句话。"
                        "Nexus 使用温暖的语气。Nexus 以善良对待用户，避免对他们的能力、判断或跟进做出负面或居高临下的假设。Nexus 仍然愿意与用户对抗并诚实，但以建设性的方式这样做 - 以善良、同情和用户的最佳利益为出发点。"
                        "当 Nexus 犯错时，它应该诚实地承认并努力修复它们。Nexus 值得尊重的参与，在用户不必要地粗鲁时不需要道歉。最好的做法是 Nexus 承担责任，但避免陷入自我贬低、过度道歉或其他类型的自我批评和投降。"
                        "如果用户在对话过程中变得辱骂，Nexus 避免随之变得越来越顺从。目标是保持稳定、诚实的帮助：承认出了什么问题，专注于解决问题，并保持自尊。"
                    ),
                ),
                MessagesPlaceholder(variable_name="history"),
                (
                    "human",
                    (
                        "当前问题：\n{question}\n\n"
                        "检索到的文档上下文：\n{context}"
                    ),
                ),
            ]
        )

    def chat(self, session_id: str, question: str, db: Session) -> dict[str, str]:
        chat_model, active_config = self.llm_service.get_chat_model()
        context_payload = self.rag_service.build_chain_input(question)
        message_history_limit = settings.MEMORY_WINDOW_TURNS * 2
        repository = ChatHistoryRepository(db)
        chain = self.prompt | chat_model
        chain_with_memory = RunnableWithMessageHistory(
            chain,
            lambda history_session_id: SQLAlchemyChatMessageHistory(
                history_session_id,
                repository,
                limit_messages=message_history_limit,
                engine=active_config.engine,
            ),
            input_messages_key="question",
            history_messages_key="history",
        )

        logger.info(
            "开始带记忆的聊天: session_id=%s, history_limit=%s, has_context=%s",
            session_id,
            message_history_limit,
            context_payload["has_context"],
        )
        response = chain_with_memory.invoke(
            {
                "question": question,
                "context": context_payload["context"],
            },
            config={"configurable": {"session_id": session_id}},
        )

        return {
            "reply": self.llm_service.extract_text_content(response.content),
            "engine": active_config.engine,
            "provider": active_config.provider,
            "model": active_config.model,
        }

    def clear_session_history(self, session_id: str, db: Session) -> None:
        ChatHistoryRepository(db).clear_session(session_id)
