from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..schemas.pydantic import DocumentUploadResponse
from ..services.document_service import DocumentService
from ..repositories.document_repository import DocumentRepository

router = APIRouter()


def get_document_service(db: Session = Depends(get_db)) -> DocumentService:
    from ..main import embedding_service, vector_db_service
    document_repo = DocumentRepository(db)
    return DocumentService(document_repo, embedding_service, vector_db_service)


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_service: DocumentService = Depends(get_document_service)
):
    allowed_extensions = ['.pdf', '.docx', '.doc']
    file_ext = file.filename[file.filename.rfind('.'):].lower() if '.' in file.filename else ''

    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="仅支持 PDF 和 Word 文档")

    result = await document_service.process_document(file)
    return DocumentUploadResponse(**result)


@router.get("/list")
async def list_documents(db: Session = Depends(get_db)):
    document_repo = DocumentRepository(db)
    documents = document_repo.list_documents()
    return {
        "status": "success",
        "documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "status": doc.status,
                "chunk_count": doc.chunk_count,
                "uploaded_at": doc.uploaded_at.isoformat()
            }
            for doc in documents
        ]
    }


@router.delete("/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    from ..main import vector_db_service
    document_repo = DocumentRepository(db)

    doc = document_repo.get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")

    vector_db_service.delete_by_document_id(document_id)
    db.delete(doc)
    db.commit()

    return {"status": "success", "message": "文档已删除"}


