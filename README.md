# Nexus RAG

Nexus RAG 是一个本地知识库 RAG 项目，包含文档上传、文本切分、向量检索、对话问答和模型配置等功能。项目采用前后端分离架构，关系数据使用 SQLite，向量数据使用嵌入式 ChromaDB，运行数据默认保存在 `Data/` 目录。

当前版本面向单机 / 单实例使用，本地开发可直接运行，也支持通过 Docker 进行一体化部署。

## 快速启动

### Docker 部署

```bash
docker compose up -d --build
```

默认访问地址：

- 应用首页：`http://localhost:10113`
- FastAPI 文档：`http://localhost:10113/docs`

### 本地开发

```bash
cd backend
pip install -r requirements.txt
cd ..
uvicorn --app-dir backend app.main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```

默认访问地址：

- Frontend：`http://localhost:3000`
- Backend API：`http://localhost:8000`
- FastAPI 文档：`http://localhost:8000/docs`

### 启动前说明

- 需要 Python 3.10 及以上
- 需要 Node.js 20 及以上，以及 npm
- PDF 解析依赖 Java 运行环境
- 仅在使用本地模型引擎时需要 Ollama
- 如果终端无法识别 `python`、`node` 或 `npm`，请先确认相关工具已经安装并加入系统 `PATH`

## 功能概览

- 文档上传与解析：支持 PDF、DOCX、DOC 文件上传
- 文本切分与向量化：自动切片并生成嵌入，写入嵌入式 ChromaDB
- 检索增强对话：基于召回文档片段和最近会话历史生成回答
- 会话记忆：后端按 `session_id` 保存最近消息，前端保留本地会话列表
- 向量库可视化：在“知识图谱”页面查看已入库片段并执行相似度检索
- 模型设置管理：支持 `api` 与 `ollama` 两类引擎切换
- 多 Provider 支持：`api` 引擎可选择 GLM、DeepSeek、MiniMax

## 核心页面

| 页面 | 说明 |
| --- | --- |
| `/chat` | 智能对话主界面，展示当前引擎、模型和会话列表 |
| `/knowledge-graph` | 向量片段浏览、相似度搜索与文档管理 |
| `/settings` | 配置默认引擎、API Provider、API Key 和模型 |

## 技术架构

| 层级 | 技术实现 |
| --- | --- |
| Frontend | Next.js 16、React 19、Tailwind CSS 4 |
| Backend | FastAPI、Pydantic、SQLAlchemy |
| 关系数据 | SQLite |
| 向量存储 | Embedded ChromaDB |
| 嵌入模型 | `BAAI/bge-small-zh-v1.5` |
| 推理引擎 | API Provider（GLM / DeepSeek / MiniMax）、Ollama |

系统处理链路如下：

```text
文档上传
  -> 文本提取
  -> 文本切分
  -> 嵌入生成
  -> 写入 ChromaDB

用户提问
  -> 向量检索
  -> 拼接文档上下文
  -> 结合最近会话历史
  -> LLM 生成回答
```

运行时数据目录会在后端启动时自动创建：

- `Data/nexus_rag.sqlite3`：SQLite 数据库文件
- `Data/chroma/`：ChromaDB 持久化目录
- `Data/llm_settings.json`：全局模型配置文件
- `Data/uploads/`：上传文件目录
- `Data/logs/app.log`：应用日志文件

## 本地运行

### 1. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 2. 启动后端服务

请在项目根目录执行以下命令：

```bash
uvicorn --app-dir backend app.main:app --reload
```

默认地址：

- Backend API：`http://localhost:8000`
- FastAPI 文档：`http://localhost:8000/docs`

### 3. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

默认地址：

- Frontend：`http://localhost:3000`

### 4. 初始化模型配置

- 使用 API 引擎时，推荐在浏览器打开 `/settings` 页面后填写 API Key 和模型
- 使用 Ollama 引擎时，请先确认本机 Ollama 服务已启动且目标模型已经拉取
- 前端默认通过同源 `/api` 代理访问后端；如需显式指定后端地址，可在项目根目录创建 `.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Docker 部署

根目录 `docker-compose.yml` 用于一体化部署当前版本。

### 启动命令

```bash
docker compose up -d --build
```

### 默认访问地址

- 应用首页：`http://localhost:10113`
- FastAPI 文档：`http://localhost:10113/docs`

### 部署说明

- Docker 使用根目录单一 `Dockerfile` 构建前后端一体化镜像
- 容器内 FastAPI 监听 `8000`，Next.js 监听 `10113`
- 浏览器统一访问 `10113`，前端会将 `/api`、`/docs`、`/redoc`、`/openapi.json` 转发到容器内后端
- 本地 `Data/` 目录会挂载到容器内 `/app/Data`，用于持久化 SQLite、ChromaDB、上传文件和模型配置
- 若启用 Ollama，容器默认通过 `http://host.docker.internal:11434/v1` 访问宿主机 Ollama 服务

## 配置说明

大部分配置项已经提供默认值，普通使用场景通常无需额外修改。推荐优先通过 `/settings` 页面管理模型相关配置。

### 常用环境变量

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | 空或 `/` | 前端请求 API 的基地址；本地开发可设置为 `http://localhost:8000` |
| `DEEPSEEK_API_KEY` | 空 | 首次初始化 `Data/llm_settings.json` 时可作为默认 API Key |
| `DEEPSEEK_MODEL` | `deepseek-chat` | DeepSeek 默认模型 |
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | 后端访问 Ollama 的地址 |
| `OLLAMA_MODEL` | `qwen2.5:7b` | Ollama 默认模型 |
| `CHUNK_SIZE` | `500` | 文本切片大小 |
| `CHUNK_OVERLAP` | `50` | 文本切片重叠长度 |
| `RAG_TOP_K` | `3` | 默认召回片段数量 |
| `MAX_UPLOAD_SIZE` | `50MB` | 单文件上传大小上限 |

### 路径相关变量

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `SQLITE_PATH` | `Data/nexus_rag.sqlite3` | SQLite 数据库文件位置 |
| `CHROMA_PERSIST_DIR` | `Data/chroma` | ChromaDB 持久化目录 |
| `UPLOAD_DIR` | `Data/uploads` | 上传文件保存目录 |
| `LLM_SETTINGS_FILE` | `Data/llm_settings.json` | 模型配置文件位置 |

### 配置生效规则

- `Data/llm_settings.json` 是运行时模型配置的持久化来源
- 当该文件不存在时，后端会根据结构化默认值和部分 `.env` 变量生成初始配置
- 初始化完成后，推荐通过 `/settings` 页面维护后续配置，而不是直接编辑前端代码
- API Key 保存在服务端 `Data/llm_settings.json` 中，不写入浏览器 `localStorage`

## 使用流程

1. 启动前后端服务或 Docker 容器
2. 打开 `/settings` 页面，选择默认引擎并完成模型配置
3. 在 `/knowledge-graph` 页面上传文档并确认处理完成
4. 在 `/chat` 页面发起对话，系统会结合召回片段和会话历史生成回答
5. 如需查看向量内容或验证召回结果，可返回 `/knowledge-graph` 页面进行浏览和检索

## API 概览

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/api/chat` | `POST` | 发送聊天请求并返回模型回答 |
| `/api/chat/sessions/{session_id}` | `DELETE` | 删除指定会话的后端记忆记录 |
| `/api/settings/llm` | `GET` | 获取当前全局模型配置及 Provider 目录 |
| `/api/settings/llm` | `PUT` | 保存全局模型配置 |
| `/api/settings/ollama/models` | `GET` | 获取本机 Ollama 已安装模型列表 |
| `/api/documents/upload` | `POST` | 上传并处理文档 |
| `/api/documents/list` | `GET` | 获取文档列表与处理状态 |
| `/api/documents/{document_id}` | `DELETE` | 删除文档、对应向量及物理文件 |
| `/api/vectors` | `GET` | 分页列出已入库向量片段 |
| `/api/vectors/search` | `POST` | 根据查询文本执行相似度搜索 |

### `POST /api/chat` 示例

请求体：

```json
{
  "message": "什么是检索增强生成？",
  "session_id": "session_1710000000000_abc123xyz"
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

## 目录结构

```text
Local_RAG_System/
├─ Data/                         # 运行时数据目录，首次启动后自动生成
├─ backend/
│  ├─ app/
│  │  ├─ api/                    # FastAPI 路由
│  │  ├─ core/                   # 配置、日志、数据库初始化
│  │  ├─ models/                 # SQLAlchemy 数据模型
│  │  ├─ repositories/           # 数据访问层
│  │  ├─ schemas/                # Pydantic 模型
│  │  ├─ services/               # RAG、向量、文档、LLM 服务
│  │  └─ main.py                 # 后端入口
│  └─ requirements.txt
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  ├─ app/                    # 页面入口
│  │  ├─ components/             # UI 组件
│  │  ├─ contexts/               # 全局状态与会话管理
│  │  └─ lib/                    # API 与模型工具函数
│  └─ package.json
├─ Dockerfile
├─ docker-compose.yml
├─ start.sh
└─ README.md
```

## 已知限制与常见问题

### 1. `Data/` 目录不存在

后端启动时会自动创建 `Data/`、SQLite 文件、ChromaDB 目录、上传目录、日志目录和 `llm_settings.json`。只要后端成功启动，相关目录会自动生成。

### 2. PDF 上传或解析失败

请优先检查以下项目：

- 系统是否安装并配置了 Java 运行环境
- PDF 文件是否完整且包含可提取文本
- 文件大小是否超过 `50MB`

### 3. Ollama 模型列表为空或本地模型无法使用

请确认：

- 本机 Ollama 服务已经启动
- 目标模型已经提前拉取
- 本地开发时 `OLLAMA_BASE_URL` 为 `http://localhost:11434/v1`
- Docker 部署时容器可以访问 `host.docker.internal`

### 4. Windows 下后端启动报只读或拒绝访问

使用嵌入式 ChromaDB 时，请在项目根目录执行：

```bash
uvicorn --app-dir backend app.main:app --reload
```

不要在 `backend/` 目录中直接运行 `uvicorn app.main:app --reload`。

### 5. 嵌入模型加载失败

系统默认使用 `BAAI/bge-small-zh-v1.5`。首次加载时会优先尝试读取本地 Hugging Face 缓存；若缓存不存在，则可能需要联网下载模型。若环境无法访问 Hugging Face，请提前准备本地缓存。

### 6. 终端无法识别 `python`、`node` 或 `npm`

这通常表示本地运行环境尚未配置完成。请先安装对应工具并确认已加入系统 `PATH`，然后再执行 README 中的标准启动命令。

### 7. 文档上传成功但检索不到结果

常见原因包括：

- 文档尚未处理完成
- 文档内容较少，切片数量有限
- 检索关键词与文档内容相关性不足

建议先通过 `/api/documents/list` 确认文档状态为 `completed`，再在 `/knowledge-graph` 页面检查向量片段是否已写入。
