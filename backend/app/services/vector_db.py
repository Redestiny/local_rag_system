from pathlib import Path
import os

import chromadb
from chromadb.config import Settings

from app.core.config import BASE_DIR, settings as app_settings
from app.core.exceptions import VectorDBError
from typing import Any, Dict, List


class VectorDBService:
    def __init__(self):
        app_settings.ensure_runtime_dirs()
        if os.name == "nt" and Path.cwd().resolve() == (BASE_DIR / "backend").resolve():
            raise VectorDBError(
                "Windows 本地运行嵌入式 ChromaDB 时，请从项目根目录启动后端，例如："
                "uvicorn --app-dir backend app.main:app --reload"
            )
        self.client = chromadb.PersistentClient(
            path=str(app_settings.chroma_persist_path),
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
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        return results

    def list_documents(self, offset: int = 0, limit: int = 100) -> dict:
        results = self.collection.get(include=["documents", "metadatas"])
        ids = results.get("ids") or []
        documents = results.get("documents") or []
        metadatas = results.get("metadatas") or []

        records = [
            {
                "id": doc_id,
                "content": document,
                "metadata": metadata or {},
            }
            for doc_id, document, metadata in zip(ids, documents, metadatas)
        ]
        sorted_records = sorted(
            records,
            key=lambda record: (
                record["metadata"].get("document_id", 0),
                record["metadata"].get("chunk_index", 0),
            ),
        )

        total = len(sorted_records)
        paginated_records = sorted_records[offset:offset + limit]

        return {
            "total": total,
            "items": paginated_records
        }

    def search_documents(
        self,
        query_embedding: List[float],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        results = self.search(query_embedding, top_k)
        ids = (results.get("ids") or [[]])[0]
        documents = (results.get("documents") or [[]])[0]
        metadatas = (results.get("metadatas") or [[]])[0]
        distances = (results.get("distances") or [[]])[0]

        return [
            {
                "id": doc_id,
                "content": document,
                "metadata": metadata or {},
                "distance": distance,
            }
            for doc_id, document, metadata, distance in zip(ids, documents, metadatas, distances)
        ]

    def delete_by_document_id(self, document_id: int):
        """删除指定文档的所有向量"""
        self.collection.delete(
            where={"document_id": document_id}
        )


vector_db_service = VectorDBService()
