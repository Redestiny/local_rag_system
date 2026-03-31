from typing import List
from ..core.config import settings
from .embedding import EmbeddingService
from .vector_db import VectorDBService


class RAGService:
    def __init__(self, embedding_service: EmbeddingService, vector_db_service: VectorDBService):
        self.embedding_service = embedding_service
        self.vector_db_service = vector_db_service

    def retrieve_context(self, query: str, top_k: int = None) -> List[str]:
        """检索相关上下文"""
        if top_k is None:
            top_k = settings.RAG_TOP_K

        query_embedding = self.embedding_service.embed_text(query)
        results = self.vector_db_service.search(query_embedding, top_k)

        if not results['documents'] or not results['documents'][0]:
            return []

        return results['documents'][0]

    def format_contexts(self, contexts: List[str]) -> str:
        if not contexts:
            return "（本轮未检索到相关文档片段）"

        return "\n\n".join(
            [f"[文档片段 {i + 1}]\n{ctx}" for i, ctx in enumerate(contexts)]
        )

    def build_chain_input(self, query: str, top_k: int = None) -> dict[str, str | bool]:
        contexts = self.retrieve_context(query, top_k=top_k)
        return {
            "question": query,
            "context": self.format_contexts(contexts),
            "has_context": bool(contexts),
        }

    def build_prompt(self, query: str, contexts: List[str]) -> str:
        """构建带上下文的提示词"""
        if not contexts:
            return query

        context_text = self.format_contexts(contexts)

        prompt = f"""基于以下文档内容回答问题：

{context_text}

问题：{query}

请根据上述文档内容回答问题。如果文档中没有相关信息，请说明无法从提供的文档中找到答案。"""

        return prompt

