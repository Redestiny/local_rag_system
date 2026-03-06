from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv

app = FastAPI(title="Nexus RAG API", version="1.0.0")

# 1. 解决跨域问题 (CORS) - 允许前端 3000 端口访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议改为 ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 定义前端传过来的数据格式
class ChatRequest(BaseModel):
    message: str
    engine: str = "api"  # 默认使用 'api'，前端可以传 'ollama' 来切换

# 3. 初始化大模型客户端
load_dotenv()  # 加载 .env 文件中的环境变量
API_KEY = os.getenv("DEEPSEEK_API_KEY")
API_BASE_URL = "https://api.deepseek.com/v1"

# 4. 核心对话接口
@app.post("/api/chat")
def chat_with_ai(request: ChatRequest):
    try:
        # 🌟 核心架构：根据参数动态切换引擎
        if request.engine == "ollama":
            # Mac 环境下，Docker 访问宿主机 Ollama 的标准魔法域名是 host.docker.internal
            client = OpenAI(
                api_key="ollama", # Ollama 不需要真实的 key
                base_url="http://host.docker.internal:11434/v1" 
            )
            model_name = "llama3" # 替换成你 Mac 上 pull 下来的本地模型名
        else:
            # 走云端 API
            client = OpenAI(
                api_key=API_KEY,
                base_url=API_BASE_URL
            )
            model_name = "deepseek-chat" # 替换成对应的云端模型名

        # 发起流式/非流式请求 (这里先用最简单的非流式测试联通性)
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "你是一个严谨的本地 RAG 系统 AI 助手。"},
                {"role": "user", "content": request.message}
            ],
            temperature=0.7
        )
        
        # 提取 AI 的回复内容
        ai_reply = response.choices[0].message.content
        return {"status": "success", "reply": ai_reply, "engine_used": request.engine}

    except Exception as e:
        return {"status": "error", "message": str(e)}