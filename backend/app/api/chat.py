from fastapi import APIRouter
from openai import OpenAI
import os
from dotenv import load_dotenv
from app.schemas.pydantic import ChatRequest, ChatResponse

router = APIRouter()

# 初始化环境变量
load_dotenv()
API_KEY = os.getenv("DEEPSEEK_API_KEY")
API_BASE_URL = "https://api.deepseek.com/v1"

@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(request: ChatRequest):
    try:
        # 根据参数动态切换引擎
        if request.engine == "ollama":
            client = OpenAI(
                api_key="ollama",
                base_url="http://host.docker.internal:11434/v1"
            )
            model_name = "llama3"
        else:
            client = OpenAI(
                api_key=API_KEY,
                base_url=API_BASE_URL
            )
            model_name = "deepseek-chat"

        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "你是一个严谨的本地 RAG 系统 AI 助手。"},
                {"role": "user", "content": request.message}
            ],
            temperature=0.7
        )

        ai_reply = response.choices[0].message.content
        return ChatResponse(status="success", reply=ai_reply, engine_used=request.engine)

    except Exception as e:
        return ChatResponse(status="error", message=str(e))
