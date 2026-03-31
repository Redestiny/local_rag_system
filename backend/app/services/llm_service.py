import logging
from collections.abc import Sequence

from langchain_community.chat_models.openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from ..core.exceptions import LLMError
from .llm_settings import ActiveLLMConfig, LLMSettingsService

logger = logging.getLogger("nexus_rag.llm")


class LLMService:
    def __init__(self, llm_settings_service: LLMSettingsService):
        self.llm_settings_service = llm_settings_service
        self.clients = {}

    def _get_client(self, config: ActiveLLMConfig) -> ChatOpenAI:
        cache_key = (config.base_url, config.api_key, config.model, config.timeout)
        if cache_key not in self.clients:
            self.clients[cache_key] = ChatOpenAI(
                model_name=config.model,
                openai_api_base=config.base_url,
                openai_api_key=config.api_key,
                request_timeout=config.timeout,
                max_retries=2,
            )
        return self.clients[cache_key]

    def get_chat_model(self) -> tuple[ChatOpenAI, ActiveLLMConfig]:
        active_config = self.llm_settings_service.get_active_config()
        return self._get_client(active_config), active_config

    def extract_text_content(self, content: object) -> str:
        if isinstance(content, str):
            return content

        if isinstance(content, Sequence):
            parts: list[str] = []
            for item in content:
                if isinstance(item, str):
                    parts.append(item)
                    continue

                if isinstance(item, dict) and item.get("type") == "text":
                    parts.append(str(item.get("text", "")))
                    continue

                parts.append(str(item))
            return "".join(parts)

        return str(content)

    def generate_response(self, prompt: str) -> dict[str, str]:
        try:
            client, active_config = self.get_chat_model()

            logger.info(
                "LLM调用开始: engine=%s, provider=%s, model=%s",
                active_config.engine,
                active_config.provider,
                active_config.model,
            )
            response = client.invoke([HumanMessage(content=prompt)])
            content = self.extract_text_content(response.content)
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
