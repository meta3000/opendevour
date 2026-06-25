# devour-service

Devour 投资智能体平台 · 后端服务。

技术栈：Python 3.13 · FastAPI · LangChain / LangGraph · SQLAlchemy(async) · uv。

## 快速开始

```bash
cd devour-service

# 1. 安装依赖（uv 会创建 .venv 并按 pyproject.toml 解析锁定）
uv sync

# 2. 配置：复制并填入 API Key（默认用 DashScope 调 qwen-plus）
cp .env.example .env
#   编辑 .env，填入 DASHSCOPE_API_KEY=sk-xxxx

# 3. 启动服务（默认 127.0.0.1:8000）
uv run uvicorn devour_service.main:app --reload --port 8000
```

启动后：

- 健康检查：`GET http://127.0.0.1:8000/api/health`
- 数据库连通性：`GET http://127.0.0.1:8000/api/health/db`
- 交互式文档：`http://127.0.0.1:8000/docs`
- AI 助手流式接口：`POST http://127.0.0.1:8000/api/chat/stream`（SSE）

前端 `devour-ui` 已通过 Vite 代理把 `/api` 转发到本服务，启动前端 `npm run dev` 后，AI 助手即可调用。

## 配置说明（`.env`）

### 大模型（多 provider，OpenAI 兼容端点）

| provider | 默认模型 | API Key 环境变量 |
|---|---|---|
| dashscope（默认） | qwen-plus | `DASHSCOPE_API_KEY` |
| openai | gpt-4o-mini | `OPENAI_API_KEY` |
| deepseek | deepseek-chat | `DEEPSEEK_API_KEY` |
| kimi(moonshot) | moonshot-v1-8k | `MOONSHOT_API_KEY` |
| glm(zhipu) | glm-4 | `ZHIPU_API_KEY` |
| gemini | gemini-1.5-flash | `GEMINI_API_KEY` |

默认 provider/模型由 `LLM_DEFAULT_PROVIDER` / `LLM_DEFAULT_MODEL` 控制；调用时也可在请求体中动态指定 `provider` / `model`。

### 多源数据库（本地 MySQL）

默认连接 `127.0.0.1:3306`，用户 `root`，空密码，包含 `devour_core`、`devour_analytics` 两个测试库。

> MySQL 未安装/未启动时，服务仍可正常启动，AI 助手聊天不依赖数据库；`/api/health/db` 会把对应源标记为 `unavailable`。

初始化测试库（需本地已运行 MySQL）：

```bash
mysql -h127.0.0.1 -uroot < scripts/init_databases.sql
```

## 目录结构

```
src/devour_service/
├── main.py            # FastAPI 应用工厂
├── core/              # 配置、日志、统一响应、异常
├── db/                # 多源 async 引擎与会话
├── llm/              # 模型 provider 注册表与动态工厂
├── agents/            # LangGraph 对话图（RAG 预留）
├── schemas/           # 请求/响应/SSE chunk 模型
├── services/          # 业务编排（聊天 SSE 流）
└── api/               # 路由（health / chat）
```
