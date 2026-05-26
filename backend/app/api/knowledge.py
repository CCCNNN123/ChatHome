from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Document
from app.api.auth import get_current_user
from app.services.rag_service import RAGService
from app.core.config import UPLOAD_DIR
from pydantic import BaseModel
from typing import Optional
import os
import uuid

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    filepath: str
    chunk_count: int
    created_at: str


RAG_SERVICE: Optional[RAGService] = None


def get_rag_service():
    global RAG_SERVICE
    if RAG_SERVICE is None:
        RAG_SERVICE = RAGService()
    return RAG_SERVICE


@router.get("/documents")
async def list_documents(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.user_id == user["id"]).order_by(Document.created_at.desc()).all()
    return {"documents": [
        DocumentResponse(
            id=d.id,
            user_id=d.user_id,
            filename=d.filename,
            filepath=d.filepath,
            chunk_count=d.chunk_count or 0,
            created_at=d.created_at.strftime("%Y-%m-%d %H:%M:%S") if d.created_at else ""
        )
        for d in docs
    ]}


@router.post("/upload")
async def upload_document(file: UploadFile = File(...), user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    ext = file.filename.split(".")[-1].lower() if file.filename else "txt"
    if ext not in ["txt", "pdf", "md", "csv", "json"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    unique_name = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    rag = get_rag_service()
    text = rag.extract_text(filepath, ext)

    new_doc = Document(user_id=user["id"], filename=file.filename, filepath=filepath, chunk_count=0)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    doc_id = new_doc.id

    try:
        chunk_count = rag.add_document(text, doc_id=str(doc_id))
        new_doc.chunk_count = chunk_count
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to index document: {str(e)}")

    return {"document": DocumentResponse(
        id=new_doc.id,
        user_id=new_doc.user_id,
        filename=new_doc.filename,
        filepath=new_doc.filepath,
        chunk_count=new_doc.chunk_count or 0,
        created_at=new_doc.created_at.strftime("%Y-%m-%d %H:%M:%S") if new_doc.created_at else ""
    )}


@router.delete("/{doc_id}")
async def delete_document(doc_id: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user["id"]).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    rag = get_rag_service()
    try:
        rag.delete_document(str(doc.id))
    except Exception:
        pass

    if os.path.exists(doc.filepath):
        os.remove(doc.filepath)

    db.delete(doc)
    db.commit()
    return {"success": True}