from sqlalchemy.orm import Session
from typing import Optional, List
from ..models.db_models import Document


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_document(self, filename: str, file_path: str, file_size: int, content_type: str) -> Document:
        doc = Document(
            filename=filename,
            file_path=file_path,
            file_size=file_size,
            content_type=content_type,
            status="processing"
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def update_document_status(self, doc_id: int, status: str, chunk_count: Optional[int] = None) -> None:
        doc = self.db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = status
            if chunk_count is not None:
                doc.chunk_count = chunk_count
            self.db.commit()

    def get_document_by_id(self, doc_id: int) -> Optional[Document]:
        return self.db.query(Document).filter(Document.id == doc_id).first()

    def list_documents(self) -> List[Document]:
        return self.db.query(Document).all()
