from sentence_transformers import SentenceTransformer
from typing import List


class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer('BAAI/bge-small-zh-v1.5')

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """批量生成文本向量"""
        embeddings = self.model.encode(texts)
        return embeddings.tolist()

    def embed_text(self, text: str) -> List[float]:
        """生成单个文本向量"""
        return self.embed_texts([text])[0]


embedding_service = EmbeddingService()

