from pydantic_settings import BaseSettings
from pathlib import Path

# 获取项目根目录（backend 的父目录）
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    # 数据库配置
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "nexus_rag"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # API 密钥
    DEEPSEEK_API_KEY: str

    # Ollama 配置
    OLLAMA_BASE_URL: str = "http://localhost:11434/v1"
    OLLAMA_MODEL: str = "qwen2.5:7b"

    # DeepSeek 配置
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL: str = "deepseek-chat"

    # ChromaDB 配置
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001

    # 文档处理配置
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    UPLOAD_DIR: str = "./uploads"

    # RAG 配置
    RAG_TOP_K: int = 3

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        env_file = str(ENV_FILE)
        case_sensitive = True


settings = Settings()
