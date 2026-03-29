import chromadb
from chromadb.config import Settings
from app.core.config import settings as app_settings
from typing import List, Dict, Any


class VectorDBService:
    def __init__(self):
        self.client = chromadb.HttpClient(
            host=app_settings.CHROMA_HOST,
            port=app_settings.CHROMA_PORT,
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )

    def add_documents(
        self,
        ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: List[Dict[str, Any]]
    ):
        """添加文档向量到数据库"""
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5
    ) -> Dict[str, Any]:
        """向量检索"""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        return results

    def delete_by_document_id(self, document_id: int):
        """删除指定文档的所有向量"""
        self.collection.delete(
            where={"document_id": document_id}
        )


vector_db_service = VectorDBService()

