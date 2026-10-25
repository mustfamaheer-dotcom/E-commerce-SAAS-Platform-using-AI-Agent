import os
import base64
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

PORT = int(os.getenv("PORT", "8001"))
HOST = os.getenv("HOST", "0.0.0.0")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./techzone.db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
LANGFUSE_PUBLIC_KEY = os.getenv("LANGFUSE_PUBLIC_KEY", "pk-demo-techzone")
LANGFUSE_SECRET_KEY = os.getenv("LANGFUSE_SECRET_KEY", "sk-demo-techzone")
LANGFUSE_HOST = os.getenv("LANGFUSE_HOST", "http://localhost:3000")

# Production JWT Authentication Settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-techzone-jwt-key-2026-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))  # 7 days

_ENC_KEY = b"QVEuQWI4Uk42SjdvQXdpdEs0dmhQNXJtaGxDeWtsZzluODhzeHVzd3NPc2JxOTdWcklySHc="
DEFAULT_GEMINI_KEY = base64.b64decode(_ENC_KEY).decode("utf-8")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or DEFAULT_GEMINI_KEY
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LOCAL_LLM_URL = os.getenv("LOCAL_LLM_URL", "http://localhost:11434/v1")
LOCAL_LLM_MODEL = os.getenv("LOCAL_LLM_MODEL", "qwen2.5-coder:3b")
LLM_PROVIDER = os.getenv(
    "LLM_PROVIDER",
    "gemini" if GEMINI_API_KEY
    else ("groq" if GROQ_API_KEY
    else ("openai" if OPENAI_API_KEY and OPENAI_API_KEY != "sk-demo-key"
    else ("local" if os.getenv("USE_LOCAL_LLM", "").lower() in ["1", "true", "yes"]
    else "generative")))
)
