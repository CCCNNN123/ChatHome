from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import init_db
from app.api.auth import router as auth_router
from app.api.rooms import router as rooms_router
from app.api.ai import router as ai_router
from app.api.knowledge import router as knowledge_router
from app.api.ws import handle_websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="ChatHome API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(rooms_router)
app.include_router(ai_router)
app.include_router(knowledge_router)

app.add_api_websocket_route("/ws", handle_websocket)


@app.get("/")
async def root():
    return {"message": "ChatHome API is running"}