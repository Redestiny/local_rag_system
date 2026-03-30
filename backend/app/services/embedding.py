from pathlib import Path
from sentence_transformers import SentenceTransformer
from typing import List
from ..core.exceptions import EmbeddingError


EMBEDDING_MODEL_NAME = "BAAI/bge-small-zh-v1.5"
HF_CACHE_DIR = Path.home() / ".cache" / "huggingface"
HF_HUB_MODEL_DIR = HF_CACHE_DIR / "hub" / "models--BAAI--bge-small-zh-v1.5"


class EmbeddingService:
    def __init__(self):
        self.model = self._load_model()

    def _load_model(self) -> SentenceTransformer:
        local_snapshot = self._find_local_snapshot()
        if local_snapshot is not None:
            try:
                return SentenceTransformer(
                    str(local_snapshot),
                    local_files_only=True,
                )
            except Exception:
                pass

        try:
            return SentenceTransformer(
                EMBEDDING_MODEL_NAME,
                cache_folder=str(HF_CACHE_DIR),
                local_files_only=True,
            )
        except Exception:
            try:
                return SentenceTransformer(
                    EMBEDDING_MODEL_NAME,
                    cache_folder=str(HF_CACHE_DIR),
                    local_files_only=False,
                )
            except Exception as exc:
                raise EmbeddingError(
                    "嵌入模型加载失败。请确认 Hugging Face 缓存中已存在 "
                    f"{EMBEDDING_MODEL_NAME}，或当前环境允许访问 Hugging Face。"
                ) from exc

    def _find_local_snapshot(self) -> Path | None:
        ref_file = HF_HUB_MODEL_DIR / "refs" / "main"
        if ref_file.exists():
            snapshot = HF_HUB_MODEL_DIR / "snapshots" / ref_file.read_text().strip()
            if snapshot.exists():
                return snapshot

        snapshots_dir = HF_HUB_MODEL_DIR / "snapshots"
        if snapshots_dir.exists():
            for snapshot in sorted(snapshots_dir.iterdir(), reverse=True):
                if (snapshot / "config.json").exists() and (snapshot / "model.safetensors").exists():
                    return snapshot

        return None

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """批量生成文本向量"""
        embeddings = self.model.encode(texts)
        return embeddings.tolist()

    def embed_text(self, text: str) -> List[float]:
        """生成单个文本向量"""
        return self.embed_texts([text])[0]


embedding_service = EmbeddingService()
