from openai import OpenAI
import logging
from ..core.config import settings
from ..core.exceptions import LLMError

logger = logging.getLogger("nexus_rag.llm")


class LLMService:
    def __init__(self):
        self.ollama_client = None
        self.deepseek_client = None

    def _get_ollama_client(self) -> OpenAI:
        if not self.ollama_client:
            self.ollama_client = OpenAI(
                base_url=settings.OLLAMA_BASE_URL,
                api_key="ollama",
                timeout=settings.OLLAMA_TIMEOUT
            )
        return self.ollama_client

    def _get_deepseek_client(self) -> OpenAI:
        if not self.deepseek_client:
            if not settings.DEEPSEEK_API_KEY:
                raise LLMError("未配置 DEEPSEEK_API_KEY，无法使用 api 引擎")
            self.deepseek_client = OpenAI(
                base_url=settings.DEEPSEEK_BASE_URL,
                api_key=settings.DEEPSEEK_API_KEY,
                timeout=settings.DEEPSEEK_TIMEOUT
            )
        return self.deepseek_client

    def generate_response(self, prompt: str, engine: str = "api") -> str:
        try:
            if engine == "ollama":
                client = self._get_ollama_client()
                model = settings.OLLAMA_MODEL
            else:
                client = self._get_deepseek_client()
                model = settings.DEEPSEEK_MODEL

            logger.info(f"LLM调用开始: engine={engine}, model={model}")
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            logger.info(f"LLM调用成功: engine={engine}")
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM调用失败: engine={engine}, error={str(e)}")
            raise LLMError(f"LLM调用失败: {str(e)}")
