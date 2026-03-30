from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path
import logging
import time
from ..core.database import get_db
from ..core.config import settings
from ..schemas.pydantic import DocumentUploadResponse
from ..services.document_service import DocumentService
from ..repositories.document_repository import DocumentRepository

router = APIRouter()
logger = logging.getLogger("nexus_rag.document")


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

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"文件大小超过限制 ({settings.MAX_UPLOAD_SIZE / 1024 / 1024:.0f}MB)"
        )

    # Validate PDF magic bytes
    if file_ext == '.pdf' and not content.startswith(b'%PDF'):
        raise HTTPException(status_code=400, detail="无效的 PDF 文件")

    # Generate unique filename
    upload_dir = settings.upload_path
    upload_dir.mkdir(parents=True, exist_ok=True)

    original_name = Path(file.filename or "upload.bin").name or "upload.bin"
    stem = Path(original_name).stem
    timestamp = int(time.time() * 1000)
    unique_filename = f"{stem}_{timestamp}{file_ext}"
    file_path = upload_dir / unique_filename

    # Write file
    with open(file_path, "wb") as f:
        f.write(content)

    logger.info(f"文件上传成功: {unique_filename}, size={len(content)} bytes")

    # Process document
    result = await document_service.process_document(
        filename=unique_filename,
        file_path=file_path,
        file_size=len(content),
        content_type=file.content_type or "application/octet-stream"
    )
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

    # Delete physical file
    file_path = Path(doc.file_path)
    if file_path.exists():
        file_path.unlink()
        logger.info(f"删除物理文件: {file_path}")

    # Delete PDF extraction temp files
    pdf_extract_dir = settings.upload_path.parent / "pdf_extract_cache"
    temp_file = pdf_extract_dir / f"{file_path.stem}.txt"
    if temp_file.exists():
        temp_file.unlink()
        logger.info(f"删除临时文件: {temp_file}")

    # Delete from vector DB
    vector_db_service.delete_by_document_id(document_id)

    # Delete from database
    db.delete(doc)
    db.commit()

    logger.info(f"文档删除成功: id={document_id}, filename={doc.filename}")
    return {"status": "success", "message": "文档已删除"}


