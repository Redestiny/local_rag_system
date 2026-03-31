from openai import OpenAI
import logging
from ..core.exceptions import LLMError
from .llm_settings import ActiveLLMConfig, LLMSettingsService

logger = logging.getLogger("nexus_rag.llm")


class LLMService:
    def __init__(self, llm_settings_service: LLMSettingsService):
        self.llm_settings_service = llm_settings_service
        self.clients = {}

    def _get_client(self, config: ActiveLLMConfig) -> OpenAI:
        cache_key = (config.base_url, config.api_key, config.timeout)
        if cache_key not in self.clients:
            self.clients[cache_key] = OpenAI(
                base_url=config.base_url,
                api_key=config.api_key,
                timeout=config.timeout,
            )
        return self.clients[cache_key]

    def generate_response(self, prompt: str) -> dict[str, str]:
        try:
            active_config = self.llm_settings_service.get_active_config()
            client = self._get_client(active_config)

            logger.info(
                "LLM调用开始: engine=%s, provider=%s, model=%s",
                active_config.engine,
                active_config.provider,
                active_config.model,
            )
            response = client.chat.completions.create(
                model=active_config.model,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.choices[0].message.content or ""
            logger.info(
                "LLM调用成功: engine=%s, provider=%s",
                active_config.engine,
                active_config.provider,
            )
            return {
                "reply": content,
                "engine": active_config.engine,
                "provider": active_config.provider,
                "model": active_config.model,
            }
        except LLMError:
            raise
        except Exception as e:
            logger.error("LLM调用失败: %s", str(e))
            raise LLMError(f"LLM调用失败: {str(e)}")
