from openai import OpenAI
from ..core.config import settings
from ..core.exceptions import LLMError


class LLMService:
    def __init__(self):
        self.ollama_client = None
        self.deepseek_client = None

    def _get_ollama_client(self) -> OpenAI:
        if not self.ollama_client:
            self.ollama_client = OpenAI(
                base_url=settings.OLLAMA_BASE_URL,
                api_key="ollama"
            )
        return self.ollama_client

    def _get_deepseek_client(self) -> OpenAI:
        if not self.deepseek_client:
            self.deepseek_client = OpenAI(
                base_url=settings.DEEPSEEK_BASE_URL,
                api_key=settings.DEEPSEEK_API_KEY
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

            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except Exception as e:
            raise LLMError(f"LLM调用失败: {str(e)}")
