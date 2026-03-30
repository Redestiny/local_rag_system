from pathlib import Path
import logging

from opendataloader_pdf import convert as convert_pdf
from docx import Document as DocxDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from ..core.config import settings
from ..core.exceptions import DocumentProcessingError
from ..repositories.document_repository import DocumentRepository
from .embedding import EmbeddingService
from .vector_db import VectorDBService

logger = logging.getLogger("nexus_rag.document")


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
            return self._extract_pdf_text(file_path)
        elif content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                              "application/msword"] or str(file_path).endswith(('.docx', '.doc')):
            doc = DocxDocument(str(file_path))
            return "\n".join([paragraph.text for paragraph in doc.paragraphs])
        else:
            raise DocumentProcessingError(f"不支持的文件类型: {content_type}")

    def _extract_pdf_text(self, file_path: Path) -> str:
        """使用 opendataloader-pdf CLI 包装层提取 PDF 文本。"""
        output_file = None
        try:
            output_dir = settings.upload_path.parent / "pdf_extract_cache"
            output_dir.mkdir(parents=True, exist_ok=True)

            convert_pdf(
                input_path=str(file_path),
                output_dir=str(output_dir),
                format="text",
                quiet=True,
            )

            output_file = output_dir / f"{file_path.stem}.txt"
            if not output_file.exists():
                text_outputs = sorted(output_dir.glob("*.txt"))
                if not text_outputs:
                    raise DocumentProcessingError("PDF 解析未生成文本输出")
                output_file = text_outputs[0]

            text_content = output_file.read_text(encoding="utf-8", errors="replace").strip()
            if not text_content:
                raise DocumentProcessingError("PDF 中未提取到文本内容")
            return text_content
        except FileNotFoundError as exc:
            raise DocumentProcessingError("PDF 解析依赖 Java，请确认已安装并配置到 PATH") from exc
        except DocumentProcessingError:
            raise
        except Exception as exc:
            raise DocumentProcessingError(f"PDF 解析失败: {str(exc)}") from exc
        finally:
            # Clean up temp file
            if output_file and output_file.exists():
                output_file.unlink()
                logger.info(f"清理PDF临时文件: {output_file}")

    async def process_document(
        self,
        filename: str,
        file_path: Path,
        file_size: int,
        content_type: str
    ) -> dict:
        try:
            doc = self.document_repo.create_document(
                filename=filename,
                file_path=str(file_path),
                file_size=file_size,
                content_type=content_type
            )

            logger.info(f"开始处理文档: id={doc.id}, filename={filename}")

            try:
                text_content = self._extract_text(file_path, content_type)

                text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=settings.CHUNK_SIZE,
                    chunk_overlap=settings.CHUNK_OVERLAP
                )
                chunks = text_splitter.split_text(text_content)
                if not chunks:
                    raise DocumentProcessingError("文档中未提取到可用于向量化的文本")

                embeddings = self.embedding_service.embed_texts(chunks)

                ids = [f"doc_{doc.id}_chunk_{i}" for i in range(len(chunks))]
                metadatas = [
                    {
                        "document_id": doc.id,
                        "chunk_index": i,
                        "filename": doc.filename,
                        "source": doc.filename,
                    }
                    for i in range(len(chunks))
                ]

                self.vector_db_service.add_documents(
                    ids=ids,
                    embeddings=embeddings,
                    documents=chunks,
                    metadatas=metadatas
                )

                self.document_repo.update_document_status(doc.id, "completed", len(chunks))
                logger.info(f"文档处理完成: id={doc.id}, chunks={len(chunks)}")

                return {
                    "status": "success",
                    "document_id": doc.id,
                    "filename": doc.filename,
                    "chunks": len(chunks)
                }
            except Exception as e:
                self.document_repo.update_document_status(doc.id, "failed")
                logger.error(f"文档处理失败: id={doc.id}, error={str(e)}")
                raise DocumentProcessingError(f"文档处理失败: {str(e)}")

        except Exception as e:
            logger.error(f"文档上传失败: filename={filename}, error={str(e)}")
            raise DocumentProcessingError(f"文档上传失败: {str(e)}")
