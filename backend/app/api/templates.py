from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..schemas.pydantic import (
    TemplateCreate, TemplateUpdate, TemplateWithDocuments,
    TemplateListResponse, TemplateResponse, TemplateDeleteResponse,
    DocumentInfo
)
from ..models.db_models import Template, TemplateDocument, Document

router = APIRouter()


@router.get("", response_model=TemplateListResponse)
async def list_templates(db: Session = Depends(get_db)):
    templates = db.query(Template).order_by(Template.updated_at.desc()).all()
    result = []
    for t in templates:
        docs = db.query(Document).join(TemplateDocument).filter(
            TemplateDocument.template_id == t.id
        ).all()
        result.append(TemplateWithDocuments(
            id=t.id,
            name=t.name,
            created_at=t.created_at,
            updated_at=t.updated_at,
            documents=[DocumentInfo(id=d.id, filename=d.filename, status=d.status, chunk_count=d.chunk_count) for d in docs]
        ))
    return TemplateListResponse(templates=result)


@router.post("", response_model=TemplateResponse)
async def create_template(template_data: TemplateCreate, db: Session = Depends(get_db)):
    template = Template(name=template_data.name)
    db.add(template)
    db.commit()
    db.refresh(template)
    return TemplateResponse(
        status="success",
        template=TemplateWithDocuments(
            id=template.id,
            name=template.name,
            created_at=template.created_at,
            updated_at=template.updated_at,
            documents=[]
        )
    )


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")
    docs = db.query(Document).join(TemplateDocument).filter(
        TemplateDocument.template_id == template_id
    ).all()
    return TemplateResponse(
        status="success",
        template=TemplateWithDocuments(
            id=template.id,
            name=template.name,
            created_at=template.created_at,
            updated_at=template.updated_at,
            documents=[DocumentInfo(id=d.id, filename=d.filename, status=d.status, chunk_count=d.chunk_count) for d in docs]
        )
    )


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    template_data: TemplateUpdate,
    db: Session = Depends(get_db)
):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")

    if template_data.name is not None:
        template.name = template_data.name

    if template_data.document_ids is not None:
        db.query(TemplateDocument).filter(TemplateDocument.template_id == template_id).delete()
        for doc_id in template_data.document_ids:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if doc:
                td = TemplateDocument(template_id=template_id, document_id=doc_id)
                db.add(td)

    db.commit()
    db.refresh(template)

    docs = db.query(Document).join(TemplateDocument).filter(
        TemplateDocument.template_id == template_id
    ).all()

    return TemplateResponse(
        status="success",
        template=TemplateWithDocuments(
            id=template.id,
            name=template.name,
            created_at=template.created_at,
            updated_at=template.updated_at,
            documents=[DocumentInfo(id=d.id, filename=d.filename, status=d.status, chunk_count=d.chunk_count) for d in docs]
        )
    )


@router.delete("/{template_id}", response_model=TemplateDeleteResponse)
async def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")

    db.query(TemplateDocument).filter(TemplateDocument.template_id == template_id).delete()
    db.delete(template)
    db.commit()

    return TemplateDeleteResponse(status="success", template_id=template_id)


@router.get("/documents/all", response_model=dict)
async def list_all_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.status == "completed").all()
    return {
        "status": "success",
        "documents": [
            {
                "id": d.id,
                "filename": d.filename,
                "status": d.status,
                "chunk_count": d.chunk_count
            }
            for d in docs
        ]
    }