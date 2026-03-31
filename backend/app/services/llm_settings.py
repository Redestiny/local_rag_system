import json
import logging
from dataclasses import dataclass
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse, urlunparse
from urllib.request import Request, urlopen

from pydantic import ValidationError

from ..core.config import settings
from ..core.exceptions import LLMError
from ..schemas.pydantic import (
    LLMSettings,
    ModelOption,
    ProviderCatalogEntry,
)

logger = logging.getLogger("nexus_rag.llm_settings")


@dataclass(frozen=True)
class ActiveLLMConfig:
    engine: str
    provider: str
    model: str
    api_key: str
    base_url: str
    timeout: float


class LLMSettingsService:
    MODEL_MIGRATIONS = {
        "glm": {
            "glm-4-plus": "glm-5",
        },
    }

    PROVIDER_CATALOG = [
        ProviderCatalogEntry(
            id="glm",
            label="GLM",
            description="智谱 GLM OpenAI 兼容接口",
            base_url="https://open.bigmodel.cn/api/paas/v4/",
            models=["glm-5", "glm-4.7", "glm-4.7-flash"],
        ),
        ProviderCatalogEntry(
            id="deepseek",
            label="DeepSeek",
            description="DeepSeek 官方推理服务",
            base_url="https://api.deepseek.com",
            models=["deepseek-chat", "deepseek-reasoner"],
        ),
        ProviderCatalogEntry(
            id="minimax",
            label="MiniMax",
            description="MiniMax OpenAI 兼容接口",
            base_url="https://api.minimaxi.com/v1",
            models=["MiniMax-M2.7","MiniMax-M2.5-highspeed", "MiniMax-M2.5", "MiniMax-M2.1"],
        ),
    ]

    def __init__(self) -> None:
        self.settings_path: Path = settings.llm_settings_path
        self.provider_lookup = {entry.id: entry for entry in self.PROVIDER_CATALOG}

    def ensure_initialized(self) -> LLMSettings:
        current = self.load_settings()
        if not self.settings_path.exists():
            self._write_settings(current)
        return current

    def get_provider_catalog(self) -> list[ProviderCatalogEntry]:
        return self.PROVIDER_CATALOG

    def load_settings(self) -> LLMSettings:
        structural_defaults = self._build_structural_defaults()
        if not self.settings_path.exists():
            bootstrap_defaults = self._build_bootstrap_settings()
            self._write_settings(bootstrap_defaults)
            return bootstrap_defaults

        try:
            raw_data = json.loads(self.settings_path.read_text(encoding="utf-8"))
            merged = self._merge_with_defaults(raw_data, structural_defaults)
        except (OSError, json.JSONDecodeError, ValidationError, TypeError) as exc:
            logger.warning("读取 LLM 设置失败，重新生成默认设置: %s", exc)
            self._write_settings(structural_defaults)
            return structural_defaults

        if merged.model_dump() != raw_data:
            self._write_settings(merged)
        return merged

    def save_settings(self, llm_settings: LLMSettings) -> LLMSettings:
        self.validate_settings(llm_settings)
        self._write_settings(llm_settings)
        return llm_settings

    def validate_settings(self, llm_settings: LLMSettings) -> None:
        if llm_settings.engine == "api":
            provider_entry = self.provider_lookup[llm_settings.apiProvider]
            provider_config = getattr(llm_settings.providers, llm_settings.apiProvider)

            if not provider_config.apiKey.strip():
                raise LLMError(f"{provider_entry.label} API Key 不能为空")

            if provider_config.model not in provider_entry.models:
                raise LLMError(f"{provider_entry.label} 模型不在预置列表中")
            return

        if not llm_settings.ollama.model.strip():
            raise LLMError("Ollama 模型不能为空")

        models = self.get_ollama_models()
        available_ids = {model.id for model in models}
        if llm_settings.ollama.model not in available_ids:
            raise LLMError("所选 Ollama 模型未在本机安装，请先拉取模型或刷新列表")

    def get_active_config(self) -> ActiveLLMConfig:
        llm_settings = self.load_settings()
        if llm_settings.engine == "ollama":
            if not llm_settings.ollama.model.strip():
                raise LLMError("未配置 Ollama 模型，无法使用本地引擎")
            return ActiveLLMConfig(
                engine="ollama",
                provider="ollama",
                model=llm_settings.ollama.model,
                api_key="ollama",
                base_url=settings.OLLAMA_BASE_URL,
                timeout=settings.OLLAMA_TIMEOUT,
            )

        provider_entry = self.provider_lookup[llm_settings.apiProvider]
        provider_config = getattr(llm_settings.providers, llm_settings.apiProvider)

        if not provider_config.apiKey.strip():
            raise LLMError(f"未配置 {provider_entry.label} API Key，无法使用 api 引擎")

        if provider_config.model not in provider_entry.models:
            raise LLMError(f"{provider_entry.label} 模型配置无效，请在设置页重新选择")

        return ActiveLLMConfig(
            engine="api",
            provider=llm_settings.apiProvider,
            model=provider_config.model,
            api_key=provider_config.apiKey,
            base_url=provider_entry.base_url,
            timeout=settings.DEEPSEEK_TIMEOUT,
        )

    def get_ollama_models(self) -> list[ModelOption]:
        request = Request(self._build_ollama_tags_url(), method="GET")

        try:
            with urlopen(request, timeout=settings.OLLAMA_TIMEOUT) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            logger.error("读取 Ollama 模型列表失败: %s", exc)
            raise LLMError("无法连接 Ollama，请确认本地服务已启动")

        models = payload.get("models", [])
        normalized = [
            ModelOption(id=model.get("name", ""), name=model.get("name", ""))
            for model in models
            if model.get("name")
        ]

        if not normalized:
            raise LLMError("Ollama 当前没有可用模型，请先拉取模型")

        normalized.sort(key=lambda item: item.name.lower())
        return normalized

    def _build_structural_defaults(self) -> LLMSettings:
        return LLMSettings()

    def _build_bootstrap_settings(self) -> LLMSettings:
        bootstrap = self._build_structural_defaults()
        bootstrap.providers.deepseek.apiKey = settings.DEEPSEEK_API_KEY
        bootstrap.providers.deepseek.model = settings.DEEPSEEK_MODEL
        bootstrap.ollama.model = settings.OLLAMA_MODEL
        return bootstrap

    def _merge_with_defaults(self, raw_data: dict, defaults: LLMSettings) -> LLMSettings:
        payload = raw_data if isinstance(raw_data, dict) else {}
        providers = self._as_dict(payload.get("providers"))
        ollama = self._as_dict(payload.get("ollama"))

        merged = {
            "engine": payload.get("engine", defaults.engine),
            "apiProvider": payload.get("apiProvider", defaults.apiProvider),
            "providers": {
                "glm": {
                    "apiKey": self._as_dict(providers.get("glm")).get("apiKey", defaults.providers.glm.apiKey),
                    "model": self._normalize_provider_model(
                        "glm",
                        self._as_dict(providers.get("glm")).get("model", defaults.providers.glm.model),
                        defaults.providers.glm.model,
                    ),
                },
                "deepseek": {
                    "apiKey": self._as_dict(providers.get("deepseek")).get("apiKey", defaults.providers.deepseek.apiKey),
                    "model": self._normalize_provider_model(
                        "deepseek",
                        self._as_dict(providers.get("deepseek")).get("model", defaults.providers.deepseek.model),
                        defaults.providers.deepseek.model,
                    ),
                },
                "minimax": {
                    "apiKey": self._as_dict(providers.get("minimax")).get("apiKey", defaults.providers.minimax.apiKey),
                    "model": self._normalize_provider_model(
                        "minimax",
                        self._as_dict(providers.get("minimax")).get("model", defaults.providers.minimax.model),
                        defaults.providers.minimax.model,
                    ),
                },
            },
            "ollama": {
                "model": ollama.get("model", defaults.ollama.model),
            },
        }
        return LLMSettings.model_validate(merged)

    def _as_dict(self, value: object) -> dict:
        return value if isinstance(value, dict) else {}

    def _normalize_provider_model(
        self,
        provider_id: str,
        model: object,
        fallback: str,
    ) -> str:
        migrated_model = self.MODEL_MIGRATIONS.get(provider_id, {}).get(model, model)
        catalog_entry = self.provider_lookup[provider_id]
        if isinstance(migrated_model, str) and migrated_model in catalog_entry.models:
            return migrated_model
        return fallback

    def _build_ollama_tags_url(self) -> str:
        parsed = urlparse(settings.OLLAMA_BASE_URL)
        path = parsed.path.rstrip("/")
        if path.endswith("/v1"):
            path = path[:-3]
        tags_path = f"{path}/api/tags" if path else "/api/tags"
        return urlunparse(parsed._replace(path=tags_path, params="", query="", fragment=""))

    def _write_settings(self, llm_settings: LLMSettings) -> None:
        settings.ensure_runtime_dirs()
        serialized = json.dumps(llm_settings.model_dump(), indent=2, ensure_ascii=False)
        self.settings_path.write_text(serialized + "\n", encoding="utf-8")
