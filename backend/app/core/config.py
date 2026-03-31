from pathlib import Path

from pydantic_settings import BaseSettings


def _discover_project_root() -> Path:
    current_file = Path(__file__).resolve()

    for candidate in current_file.parents:
        if (candidate / "backend").exists() and (candidate / "frontend").exists():
            return candidate

    for candidate in current_file.parents:
        if (candidate / "app").exists() and (candidate / "requirements.txt").exists():
            return candidate

    return current_file.parents[3]


BASE_DIR = _discover_project_root()
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    # 存储配置
    SQLITE_PATH: str = "Data/nexus_rag.sqlite3"
    CHROMA_PERSIST_DIR: str = "Data/chroma"
    UPLOAD_DIR: str = "Data/uploads"
    LLM_SETTINGS_FILE: str = "Data/llm_settings.json"

    # API 密钥
    DEEPSEEK_API_KEY: str = ""

    # Ollama 配置
    OLLAMA_BASE_URL: str = "http://localhost:11434/v1"
    OLLAMA_MODEL: str = "qwen2.5:7b"

    # DeepSeek 配置
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL: str = "deepseek-chat"

    # 文档处理配置
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50

    # RAG 配置
    RAG_TOP_K: int = 3

    # 超时配置
    OLLAMA_TIMEOUT: float = 120.0  # 2 minutes for local models
    DEEPSEEK_TIMEOUT: float = 60.0  # 1 minute for API

    # 文件上传限制
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB

    @property
    def sqlite_path(self) -> Path:
        return self.resolve_path(self.SQLITE_PATH)

    @property
    def chroma_persist_path(self) -> Path:
        return self.resolve_path(self.CHROMA_PERSIST_DIR)

    @property
    def upload_path(self) -> Path:
        return self.resolve_path(self.UPLOAD_DIR)

    @property
    def llm_settings_path(self) -> Path:
        return self.resolve_path(self.LLM_SETTINGS_FILE)

    @property
    def DATABASE_URL(self) -> str:
        return f"sqlite:///{self.sqlite_path.as_posix()}"

    def resolve_path(self, path_value: str) -> Path:
        candidate = Path(path_value)
        if candidate.is_absolute():
            return candidate
        return BASE_DIR / candidate

    def ensure_runtime_dirs(self) -> None:
        self.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        self.chroma_persist_path.mkdir(parents=True, exist_ok=True)
        self.upload_path.mkdir(parents=True, exist_ok=True)
        self.llm_settings_path.parent.mkdir(parents=True, exist_ok=True)

    class Config:
        env_file = str(ENV_FILE)
        case_sensitive = True
        extra = "ignore"  # 忽略额外的环境变量


settings = Settings()
