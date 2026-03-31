from collections.abc import Sequence

from sqlalchemy.orm import Session

from langchain_core.messages import AIMessage, BaseMessage, ChatMessage, HumanMessage, SystemMessage

from ..models.db_models import ChatHistory


class ChatHistoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_recent_messages(
        self,
        session_id: str,
        limit_messages: int | None = None,
    ) -> list[BaseMessage]:
        query = (
            self.db.query(ChatHistory)
            .filter(ChatHistory.session_id == session_id)
            .order_by(ChatHistory.id.desc())
        )

        if limit_messages is not None:
            query = query.limit(limit_messages)

        records = list(reversed(query.all()))
        return [self._to_message(record) for record in records]

    def add_messages(
        self,
        session_id: str,
        messages: Sequence[BaseMessage],
        engine: str | None = None,
    ) -> None:
        if not messages:
            return

        rows = [
            ChatHistory(
                session_id=session_id,
                role=self._to_role(message),
                content=self._stringify_content(message.content),
                engine=engine,
            )
            for message in messages
        ]
        self.db.add_all(rows)
        self.db.commit()

    def clear_session(self, session_id: str) -> None:
        (
            self.db.query(ChatHistory)
            .filter(ChatHistory.session_id == session_id)
            .delete(synchronize_session=False)
        )
        self.db.commit()

    def _to_message(self, record: ChatHistory) -> BaseMessage:
        if record.role == "assistant":
            return AIMessage(content=record.content)
        if record.role == "system":
            return SystemMessage(content=record.content)
        if record.role == "user":
            return HumanMessage(content=record.content)
        return ChatMessage(role=record.role, content=record.content)

    def _to_role(self, message: BaseMessage) -> str:
        if isinstance(message, HumanMessage):
            return "user"
        if isinstance(message, AIMessage):
            return "assistant"
        if isinstance(message, SystemMessage):
            return "system"
        if isinstance(message, ChatMessage):
            return message.role
        return "assistant"

    def _stringify_content(self, content: object) -> str:
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, str):
                    parts.append(item)
                    continue

                if isinstance(item, dict) and item.get("type") == "text":
                    parts.append(str(item.get("text", "")))
                    continue

                parts.append(str(item))

            return "".join(parts)

        return str(content)
