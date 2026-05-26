import os
import json
import numpy as np
from typing import List
from openai import OpenAI
from app.core.config import LLM_API_KEY, LLM_BASE_URL


class RAGService:
    def __init__(self):
        self.client = OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)
        self.collections: dict[str, dict] = {}

    def extract_text(self, filepath: str, ext: str) -> str:
        if ext == "pdf":
            try:
                from PyPDF2 import PdfReader
                reader = PdfReader(filepath)
                return "\n".join([page.extract_text() or "" for page in reader.pages])
            except Exception:
                pass
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    def _split_text(self, text: str, chunk_size: int = 500, overlap: int = 80) -> List[str]:
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += chunk_size - overlap
        return chunks

    def _get_embedding(self, text: str) -> List[float]:
        try:
            response = self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )
            return response.data[0].embedding
        except Exception:
            return [0.0] * 1536

    def add_document(self, text: str, doc_id: str) -> int:
        chunks = self._split_text(text)
        if not chunks:
            return 0

        embeddings = []
        for chunk in chunks:
            emb = self._get_embedding(chunk)
            embeddings.append(emb)

        self.collections[doc_id] = {
            "chunks": chunks,
            "embeddings": np.array(embeddings),
        }
        return len(chunks)

    def search(self, query: str, doc_id: str, top_k: int = 3) -> List[str]:
        if doc_id not in self.collections:
            return []

        collection = self.collections[doc_id]
        chunks = collection["chunks"]
        embeddings = collection["embeddings"]

        query_embedding = np.array(self._get_embedding(query))

        similarities = np.dot(embeddings, query_embedding) / (
            np.linalg.norm(embeddings, axis=1) * np.linalg.norm(query_embedding) + 1e-10
        )
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        return [chunks[i] for i in top_indices if similarities[i] > 0.1]

    def delete_document(self, doc_id: str):
        self.collections.pop(doc_id, None)