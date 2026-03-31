# Nexus RAG 知识库系统

Nexus RAG 是一个面向本地知识库场景的检索增强生成系统。当前版本已经改为纯嵌入式存储架构：

- 关系数据使用 SQLite
- 向量数据使用嵌入式 ChromaDB
- 运行时数据统一落在项目根目录 `Data/`

这样本地开发不再依赖 PostgreSQL、Chroma 容器或 devcontainer，开箱即可运行；Docker 仅保留为部署方式。

## 1. 功能概览

- 文档上传与解析：支持 PDF、DOCX、DOC
- 文本切分与向量化：切片后生成嵌入并写入 Chroma
- 检索增强对话：先召回相关片段，再交给模型生成回答
- 知识图谱查看：浏览向量片段并执行相似度检索
- 多模型引擎切换：支持 `api`（GLM / DeepSeek / MiniMax）与 `ollama`（本地模型）

典型链路如下：

1. 上传文档
2. 文档切分与向量化
3. 写入嵌入式 ChromaDB
4. 用户提问
5. 检索相关片段
6. LLM 结合上下文生成答案

## 2. 架构与存储

### 技术栈

- Frontend：Next.js 16 + React 19 + Tailwind CSS
- Backend：FastAPI + Pydantic + SQLAlchemy
- Relational DB：SQLite
- Vector Store：Embedded ChromaDB
- LLM Engine：
  - `api`：GLM / DeepSeek / MiniMax
  - `ollama`：本地 Ollama

### 后端分层

```text
API 层
  -> Service 层
  -> Repository 层
  -> SQLite / ChromaDB
```

### 运行时数据目录

应用启动时会自动创建以下目录或文件：

- `Data/nexus_rag.sqlite3`：SQLite 数据库文件
- `Data/chroma/`：Chroma 持久化目录
- `Data/llm_settings.json`：全局 LLM 运行时配置
- `Data/uploads/`：上传文件目录
- `Data/logs/`：应用日志目录

## 3. 运行方式

### 本地开发

本地开发时前后端都直接跑在宿主机上，不需要数据库容器。

#### 前置依赖

- Python 3.10+
- Node.js 20+
- Ollama 本地服务

#### 环境变量

大部分配置都有默认值，通常只需要在项目根目录创建一个最小 `.env`：

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

说明：

- API Provider 的 key 不再要求全部写进 `.env`；推荐在前端 `/settings` 页面中配置，后端会保存到 `Data/llm_settings.json`
- 如果希望在 `Data/llm_settings.json` 首次创建时自动带入 DeepSeek 默认值，仍然可以在 `.env` 中写 `DEEPSEEK_API_KEY`
- `NEXT_PUBLIC_API_URL` 在本地开发默认就是 `http://localhost:8000`，只有你想显式写出来时才需要加
- 其余参数如 `CHUNK_SIZE`、`RAG_TOP_K`、`SQLITE_PATH` 都已有默认值，只有想覆盖默认行为时才需要写

#### 启动后端

```bash
cd backend
pip install -r requirements.txt
cd ..
uvicorn --app-dir backend app.main:app --reload
```

#### 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认访问地址：

- 前端：`http://localhost:3000`
- 后端 API：`http://localhost:8000`
- FastAPI 文档：`http://localhost:8000/docs`

Windows 提示：

- 如果使用嵌入式 ChromaDB，本地启动 backend 时不要在 `backend/` 目录里直接执行 `uvicorn app.main:app`
- 请在项目根目录执行 `uvicorn --app-dir backend app.main:app --reload`

### Docker 部署

根目录 `docker-compose.yml` 仅用于部署。

- `backend` 和 `frontend` 由 Docker 编排
- `Data/` 会挂载进 backend 容器，保证 SQLite 和 Chroma 数据持久化
- Ollama 仍运行在宿主机，backend 容器通过 `host.docker.internal` 访问
- compose 只注入必须和本地默认值不同的变量；像 `CHUNK_SIZE` 这类已有默认值的配置不再写进 compose

启动命令：

```bash
docker compose up -d --build
```

## 4. 环境变量

**必需配置：**

| 变量名 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | 浏览器访问的后端地址（默认 `http://localhost:8000`） |

**可选配置：**

其他配置项如 `DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`、`OLLAMA_MODEL`、`CHUNK_SIZE`、`RAG_TOP_K`、`OLLAMA_TIMEOUT`、`MAX_UPLOAD_SIZE` 等都有合理的默认值，通常无需修改。如需自定义，可在 `.env` 文件中覆盖，详见 `backend/app/core/config.py`。

说明：

- 路径变量支持相对路径，默认都相对项目根目录解析
- `DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL` / `OLLAMA_MODEL` 仅在 `Data/llm_settings.json` 不存在时用于首次 bootstrap，不会在后续加载时回填已有配置
- Docker 部署时 `OLLAMA_BASE_URL` 由 compose 固定设置为 `http://host.docker.internal:11434/v1`
- 不要提交任何真实密钥到仓库

## 5. 使用指南

### 聊天与引擎切换

- 进入 `/chat` 页面发起对话
- `/settings` 页面可配置全局引擎、API Provider、API Key 与默认模型
- `api` 引擎支持 `GLM`、`DeepSeek`、`MiniMax`
- `ollama` 引擎会从本机读取已安装模型列表
- 左侧侧边栏可在 `api` 与 `ollama` 之间快速切换
- 会话状态由前端本地持久化

### 文档入库

1. 上传 PDF、DOCX 或 DOC 文档（最大 50MB）
2. 后端自动提取文本、切分、向量化
3. 文档元数据写入 SQLite
4. 文档片段与 metadata 写入 Chroma
5. 上传文件保存在 `Data/uploads/`，删除文档时自动清理

### 知识图谱

- 进入 `/knowledge-graph` 查看已入库向量
- 支持按查询词做相似度搜索

## 6. API 概览

### `POST /api/chat`

请求体：

```json
{
  "message": "什么是检索增强生成？"
}
```

成功响应：

```json
{
  "status": "success",
  "reply": "RAG 是...",
  "engine_used": "api",
  "provider_used": "deepseek",
  "model_used": "deepseek-chat"
}
```

### `GET /api/settings/llm`

用途：获取当前全局 LLM 配置，以及 API Provider 目录。

### `PUT /api/settings/llm`

用途：保存当前全局 LLM 配置到 `Data/llm_settings.json`。

### `GET /api/settings/ollama/models`

用途：读取本机 Ollama 已安装模型列表，供设置页选择。

### `POST /api/documents/upload`

用途：上传并处理文档。

成功响应：

```json
{
  "status": "success",
  "document_id": 1,
  "filename": "manual.pdf",
  "chunks": 12
}
```

### `GET /api/documents/list`

用途：获取文档列表及处理状态。

### `DELETE /api/documents/{document_id}`

用途：删除文档记录，并同步删除 Chroma 中对应向量和物理文件。

### `GET /api/vectors?offset=0&limit=100`

用途：列出已入库的向量片段，支持分页。

参数：
- `offset`：偏移量（默认 0）
- `limit`：每页数量（默认 100）

响应示例：

```json
{
  "status": "success",
  "total": 150,
  "offset": 0,
  "limit": 100,
  "documents": [
    {
      "id": "doc_1_chunk_0",
      "content": "示例片段内容",
      "metadata": {
        "document_id": 1,
        "filename": "manual.pdf",
        "source": "manual.pdf",
        "chunk_index": 0
      }
    }
  ]
}
```

### `POST /api/vectors/search`

请求体：

```json
{
  "query": "如何配置本地模型？",
  "top_k": 10
}
```

响应示例：

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

## 7. 目录结构

```text
Local_RAG_System/
├─ Data/                    # 运行时数据目录（自动创建）
├─ backend/
│  ├─ app/
│  │  ├─ api/
│  │  ├─ core/
│  │  ├─ models/
│  │  ├─ repositories/
│  │  ├─ schemas/
│  │  ├─ services/
│  │  └─ main.py
│  ├─ requirements.txt
│  └─ Dockerfile
├─ frontend/
│  ├─ src/
│  ├─ package.json
│  └─ Dockerfile
├─ docker-compose.yml
└─ README.md
```

## 8. FAQ

### Q1：第一次启动后 `Data/` 不存在

后端启动时会自动创建 `Data/`、SQLite 文件、Chroma 目录、`llm_settings.json`、上传目录和日志目录。只要 backend 正常启动即可。

### Q2：调用 `ollama` 引擎报错

请确认：

1. Ollama 已在宿主机启动
2. 模型已经拉取
3. 本地开发时 `OLLAMA_BASE_URL=http://localhost:11434/v1`
4. Docker 部署时 backend 容器能访问 `host.docker.internal`
5. 可访问 `/api/settings/ollama/models` 并返回已安装模型列表

### Q3：前端打不开后端接口

请确认：

1. backend 正在运行
2. `NEXT_PUBLIC_API_URL` 指向浏览器可访问的后端地址
3. `http://localhost:8000/docs` 或 `${NEXT_PUBLIC_API_URL}/docs` 可以访问

### Q4：Windows 本地启动 backend 时提示 Chroma 只读或拒绝访问

请在项目根目录运行：

```bash
uvicorn --app-dir backend app.main:app --reload
```

不要在 `backend/` 目录中直接运行 `uvicorn app.main:app --reload`。

### Q5：知识图谱没有数据

常见原因：

- 还没有完成文档上传
- 文档解析失败
- 向量检索关键词为空或无命中

建议先通过 `/api/documents/list` 确认文档已处理完成，再查看知识图谱页面。

### Q6：文件上传失败

检查以下几点：

- 文件大小是否超过 50MB
- 文件格式是否为 PDF、DOCX 或 DOC
- PDF 文件是否损坏（系统会验证 PDF 魔术字节）
- 查看 `Data/logs/app.log` 获取详细错误信息
