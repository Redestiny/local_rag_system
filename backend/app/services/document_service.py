import os
from pathlib import Path
from fastapi import UploadFile
from opendataloader_pdf import PDFDataLoader
from docx import Document as DocxDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from ..core.config import settings
from ..core.exceptions import DocumentProcessingError
from ..repositories.document_repository import DocumentRepository
from .embedding import EmbeddingService
from .vector_db import VectorDBService


class DocumentService:
    def __init__(
        self,
        document_repo: DocumentRepository,
        embedding_service: EmbeddingService,
        vector_db_service: VectorDBService
    ):
        self.document_repo = document_repo
        self.embedding_service = embedding_service
        self.vector_db_service = vector_db_service

    def _extract_text(self, file_path: Path, content_type: str) -> str:
        """根据文件类型提取文本"""
        if content_type == "application/pdf" or str(file_path).endswith('.pdf'):
            loader = PDFDataLoader(file_path=str(file_path))
            return loader.load()
        elif content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                              "application/msword"] or str(file_path).endswith(('.docx', '.doc')):
            doc = DocxDocument(str(file_path))
            return "\n".join([paragraph.text for paragraph in doc.paragraphs])
        else:
            raise DocumentProcessingError(f"不支持的文件类型: {content_type}")

    async def process_document(self, file: UploadFile) -> dict:
        try:
            upload_dir = Path(settings.UPLOAD_DIR)
            upload_dir.mkdir(exist_ok=True)
            file_path = upload_dir / file.filename

            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)

            doc = self.document_repo.create_document(
                filename=file.filename,
                file_path=str(file_path),
                file_size=len(content),
                content_type=file.content_type or "application/octet-stream"
            )

            try:
                text_content = self._extract_text(file_path, file.content_type or "")

                text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=settings.CHUNK_SIZE,
                    chunk_overlap=settings.CHUNK_OVERLAP
                )
                chunks = text_splitter.split_text(text_content)

                embeddings = self.embedding_service.embed_texts(chunks)

                ids = [f"doc_{doc.id}_chunk_{i}" for i in range(len(chunks))]
                metadatas = [{"document_id": doc.id, "chunk_index": i} for i in range(len(chunks))]

                self.vector_db_service.add_documents(
                    ids=ids,
                    embeddings=embeddings,
                    documents=chunks,
                    metadatas=metadatas
                )

                self.document_repo.update_document_status(doc.id, "completed", len(chunks))

                return {
                    "status": "success",
                    "document_id": doc.id,
                    "filename": doc.filename,
                    "chunks": len(chunks)
                }
            except Exception as e:
                self.document_repo.update_document_status(doc.id, "failed")
                raise DocumentProcessingError(f"文档处理失败: {str(e)}")

        except Exception as e:
            raise DocumentProcessingError(f"文档上传失败: {str(e)}")

