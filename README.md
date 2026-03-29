# Nexus RAG 知识库系统

Nexus RAG 是一个面向本地知识库场景的检索增强生成（RAG）系统。  
系统以“文档知识沉淀 + 向量检索 + 智能对话”为核心，支持 API 云端引擎与本地 Ollama 引擎双模式推理，适用于课程项目、企业知识库原型与私有化 AI 助手场景。

## 1. 项目简介

Nexus RAG 的目标是提供一条完整、可扩展的本地知识问答链路：

- 将业务文档转化为可检索知识
- 基于向量检索实现语义召回
- 将检索结果注入大模型上下文，提升回答准确性
- 在统一界面中实现会话管理、模型切换与知识探索

项目采用前后端分离架构，支持 Docker 一键启动，能够快速搭建可演示、可迭代的 RAG 系统基线。

## 2. 完整功能总览

- 文档上传与解析：支持上传知识文档并提取文本内容
- 文本切分与向量化：对文档进行分块后生成嵌入向量并入库
- 检索增强对话：查询问题先检索知识片段，再驱动模型生成回答
- 知识图谱检索：以可视化方式浏览向量数据与检索结果
- 多会话管理：支持会话创建、切换、删除与上下文保留
- 双引擎切换：支持 `api`（DeepSeek）与 `ollama`（本地模型）两种推理路径

典型链路如下：

1. 上传文档
2. 文档切分与向量化
3. 写入 ChromaDB
4. 用户提问
5. 检索相关片段
6. LLM 结合上下文生成答案

## 3. 系统架构与技术栈

### 架构分层

- Frontend：Next.js 16 + React 19 + Tailwind CSS
- Backend：FastAPI + Pydantic（分层架构）
  - API 层：路由与请求处理
  - Service 层：业务逻辑（RAG、LLM、文档处理）
  - Repository 层：数据库访问抽象
- Vector Store：ChromaDB
- Relational DB：PostgreSQL
- LLM Engine：
  - API 模式：DeepSeek（OpenAI SDK 兼容调用）
  - 本地模式：Ollama（如 `qwen2.5:7b`）

### 后端架构设计

```
API 层（路由）
    ↓
Service 层（业务逻辑）
    ├── DocumentService - 文档处理工作流
    ├── RAGService - 检索增强生成
    ├── LLMService - 统一 LLM 客户端管理
    └── 核心服务
        ├── EmbeddingService - 文本向量化
        └── VectorDBService - 向量存储
    ↓
Repository 层（数据访问）
    ↓
数据库（PostgreSQL + ChromaDB）
```

### 逻辑数据流

1. 前端发起聊天/检索请求到 FastAPI
2. API 层验证请求，调用 Service 层
3. RAGService 从 ChromaDB 召回相关知识片段
4. LLMService 根据 `engine` 路由到对应引擎
5. 生成结果返回前端，前端记录会话状态与响应耗时

## 4. 快速开始（Docker 一键启动）

### 4.1 前置依赖

- Docker Desktop（建议 24+）
- Docker Compose（`docker compose` 子命令可用）
- （可选）Ollama 本地服务（使用 `ollama` 引擎时必需）

### 4.2 准备环境变量

在项目根目录创建 `.env`（仅示例，占位值请替换）：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=qwen2.5:7b
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
CHUNK_SIZE=500
CHUNK_OVERLAP=50
RAG_TOP_K=3
```

说明：

- `DEEPSEEK_API_KEY`：`api` 引擎必需
- `OLLAMA_BASE_URL`：本地推理服务地址（默认 `http://localhost:11434/v1`）
- `OLLAMA_MODEL`：本地默认模型名（默认 `qwen2.5:7b`）
- `DEEPSEEK_BASE_URL`：DeepSeek API 地址
- `DEEPSEEK_MODEL`：DeepSeek 模型名
- `CHUNK_SIZE`：文档切片大小（默认 500）
- `CHUNK_OVERLAP`：切片重叠大小（默认 50）
- `RAG_TOP_K`：检索返回的文档片段数量（默认 3）

如果你希望后端容器直接读取 `DEEPSEEK_API_KEY`，请确保 `docker-compose.yml` 中 `backend.environment` 包含该变量注入。

### 4.3 一键启动

在项目根目录执行：

```bash
docker compose up -d --build
```

### 4.4 验证服务状态

```bash
docker compose ps
```

默认访问地址：

- 前端界面：`http://localhost:3000`
- 后端 API：`http://localhost:8000`
- FastAPI 文档：`http://localhost:8000/docs`
- ChromaDB：`http://localhost:8001`
- PostgreSQL：`localhost:5432`

### 4.5 首次联调验证

先确认模型侧可用（按引擎选择）：

- `api` 引擎：`DEEPSEEK_API_KEY` 已正确注入后端
- `ollama` 引擎：本机已启动 Ollama，且已拉取模型（如 `llama3`）

然后调用聊天接口：

```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"请简要介绍你自己\",\"engine\":\"ollama\"}"
```

## 5. 环境变量配置

| 变量名 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | 是（使用 `api` 引擎时） | - | DeepSeek API 密钥 |
| `OLLAMA_BASE_URL` | 否 | `http://localhost:11434/v1` | Ollama 服务地址 |
| `OLLAMA_MODEL` | 否 | `qwen2.5:7b` | Ollama 默认模型 |
| `DEEPSEEK_BASE_URL` | 否 | `https://api.deepseek.com` | DeepSeek API 地址 |
| `DEEPSEEK_MODEL` | 否 | `deepseek-chat` | DeepSeek 模型名 |
| `CHUNK_SIZE` | 否 | `500` | 文档切片大小 |
| `CHUNK_OVERLAP` | 否 | `50` | 切片重叠大小 |
| `RAG_TOP_K` | 否 | `3` | 检索返回片段数 |

建议：

- 开发环境将变量保存在本地 `.env`
- 生产环境通过 CI/CD Secret 或容器编排系统注入
- 不要提交任何真实密钥到仓库

## 6. 使用指南

### 6.1 聊天与会话管理

- 进入 `/chat` 页面发起对话
- 支持新建、切换、删除会话
- 会话状态在前端本地持久化，便于连续对话

### 6.2 引擎切换

- 在侧边栏或设置页面切换推理引擎：
  - `api`：DeepSeek 云端推理
  - `ollama`：本地模型推理

### 6.3 知识图谱检索

- 进入 `/knowledge-graph` 页面查看向量数据
- 支持关键词触发向量检索并展示相似度结果

### 6.4 典型业务流程

1. 上传业务文档并完成解析
2. 触发文本切分与向量化
3. 向量入库 ChromaDB
4. 在对话页面提问
5. 查看检索增强回答与会话记录

### 6.5 API 契约文档（对外接口）

#### `POST /api/chat`

请求体：

```json
{
  "message": "什么是检索增强生成？",
  "engine": "api"
}
```

字段定义：

- `message`：用户输入问题（`string`）
- `engine`：推理引擎（`api` | `ollama`）

成功响应：

```json
{
  "status": "success",
  "reply": "RAG 是...",
  "engine_used": "api"
}
```

失败响应：

```json
{
  "status": "error",
  "message": "错误详情"
}
```

#### `GET /api/vectors`（向量列表）

用途：获取向量库中已入库文档片段及元数据，用于知识图谱展示与调试。

约定响应：

```json
{
  "status": "success",
  "documents": [
    {
      "id": "doc_1_chunk_0",
      "content": "示例片段内容",
      "metadata": {
        "source": "manual.pdf",
        "chunk_index": 0
      }
    }
  ]
}
```

#### `POST /api/vectors/search`（向量检索）

请求体：

```json
{
  "query": "如何配置本地模型？",
  "top_k": 10
}
```

约定响应：

```json
{
  "status": "success",
  "results": [
    {
      "id": "doc_1_chunk_0",
      "content": "相关知识片段",
      "metadata": {
        "source": "manual.pdf"
      },
      "distance": 0.123
    }
  ]
}
```

#### 文档上传与解析接口（能力契约）

用途：上传原始文档并返回解析结果、分片状态与入库状态。  
推荐契约字段：

- 文件信息：`filename`、`size`、`content_type`
- 处理结果：`chunks`、`embedding_status`、`vector_store_status`
- 错误信息：`status=error` + `message`

## 7. 目录结构与模块说明

```text
Local_RAG_System/
├─ backend/
│  ├─ app/
│  │  ├─ api/               # API 路由层（thin controllers）
│  │  │  ├─ chat.py        # 聊天接口
│  │  │  ├─ document.py    # 文档上传接口
│  │  │  └─ error_handlers.py  # 统一错误处理
│  │  ├─ core/              # 核心配置
│  │  │  ├─ config.py      # 环境变量与配置管理
│  │  │  ├─ database.py    # 数据库连接
│  │  │  └─ exceptions.py  # 自定义异常
│  │  ├─ services/          # 业务逻辑层
│  │  │  ├─ llm_service.py      # LLM 客户端管理
│  │  │  ├─ document_service.py # 文档处理工作流
│  │  │  ├─ rag_chain.py        # RAG 检索与提示构建
│  │  │  ├─ embedding.py        # 文本向量化
│  │  │  └─ vector_db.py        # 向量数据库操作
│  │  ├─ repositories/      # 数据访问层
│  │  │  └─ document_repository.py  # 文档数据库操作
│  │  ├─ models/            # ORM 模型
│  │  │  └─ db_models.py   # SQLAlchemy 模型定义
│  │  ├─ schemas/           # Pydantic 模型
│  │  │  └─ pydantic.py    # 请求/响应模型
│  │  └─ main.py           # FastAPI 应用入口
│  ├─ requirements.txt
│  └─ Dockerfile
├─ frontend/
│  ├─ src/
│  │  ├─ app/          # 路由页面（chat / settings / knowledge-graph）
│  │  ├─ components/   # UI 组件与交互模块
│  │  ├─ contexts/     # 全局状态（会话、引擎、延迟）
│  │  └─ lib/          # 前端 API 请求封装
│  ├─ package.json
│  └─ Dockerfile
├─ docker-compose.yml
└─ README.md
```

## 8. 常见问题（FAQ）

### Q1：`docker compose up` 失败，提示端口被占用

常见冲突端口：`3000`、`5432`、`8000`、`8001`。  
处理方式：

- 关闭占用端口的本地进程
- 或修改 `docker-compose.yml` 的端口映射后重启容器

### Q2：调用 `ollama` 引擎报错，提示连接模型失败

请依次检查：

1. 本机 Ollama 服务是否已启动
2. 模型是否已拉取（例如 `llama3`）
3. 容器内地址是否可达（`host.docker.internal:11434`）

### Q3：调用 `api` 引擎报错，提示鉴权失败或无响应

请确认：

1. `DEEPSEEK_API_KEY` 已正确配置且未过期
2. 密钥已注入后端容器运行环境
3. 外网访问策略允许访问 DeepSeek API

### Q4：前端页面可打开，但无法与后端联调

请确认：

1. 后端容器状态为 `Up`
2. 前端请求地址为 `http://localhost:8000`
3. 通过 `http://localhost:8000/docs` 可访问 FastAPI 文档页

### Q5：知识图谱页面没有数据

常见原因：

- 向量库尚未写入文档数据
- 检索参数为空或过于严格
- 向量接口未返回有效结果

建议先完成文档入库，再进行向量检索验证。

