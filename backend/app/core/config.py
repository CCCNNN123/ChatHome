import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/chathome.db")
SECRET_KEY = os.getenv("SECRET_KEY", "chathome-secret-key")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.deepseek.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "deepseek-chat")

os.makedirs(UPLOAD_DIR, exist_ok=True)

# 只在 SQLite 时创建目录
if DATABASE_URL.startswith("sqlite"):
    db_path = DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else ".", exist_ok=True)