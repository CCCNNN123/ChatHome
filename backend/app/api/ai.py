from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Document
from app.api.auth import get_current_user
from app.services.rag_service import RAGService
from app.core.config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI
import asyncio

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ChatRequest(BaseModel):
    message: str
    knowledge_ids: list[int] = []


RAG_SERVICE: Optional[RAGService] = None


def get_rag_service():
    global RAG_SERVICE
    if RAG_SERVICE is None:
        RAG_SERVICE = RAGService()
    return RAG_SERVICE


@router.post("/chat")
async def ai_chat(req: ChatRequest, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    rag = get_rag_service()

    context_chunks = []
    if req.knowledge_ids:
        for kid in req.knowledge_ids:
            doc = db.query(Document).filter(Document.id == kid, Document.user_id == user["id"]).first()
            if doc:
                chunks = rag.search(req.message, doc_id=str(doc.id), top_k=3)
                context_chunks.extend(chunks)

    system_prompt = "你是一个智能 AI 助手，帮助用户解答问题、学习知识。请用清晰、准确的中文回复。"

    if context_chunks:
        context_text = "\n\n".join(context_chunks)
        system_prompt += f"\n\n以下是来自用户知识库的相关资料，请基于这些资料回答问题：\n\n{context_text}"

    client = OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)

    def generate_sync():
        try:
            stream = client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": req.message},
                ],
                stream=True,
            )
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield f"data: {chunk.choices[0].delta.content}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: AI 服务暂时不可用: {str(e)}\n\n"
            yield "data: [DONE]\n\n"

    async def generate():
        loop = asyncio.get_event_loop()
        gen = generate_sync()
        while True:
            try:
                chunk = await loop.run_in_executor(None, next, gen)
                yield chunk
            except StopIteration:
                break

    return StreamingResponse(generate(), media_type="text/event-stream")