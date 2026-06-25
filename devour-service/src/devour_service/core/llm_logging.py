"""大模型 prompt / response 专用日志。

按需求拆分为两个独立文件，均位于日志目录下：
- prompt.log   —— 记录每次调用的 prompt（用户消息 + 模型配置 + 上下文）
- response.log —— 记录每次调用的完整响应（或错误）

每行一条 JSON，便于检索与离线分析。
"""

from __future__ import annotations

import json
import time

from .logging import dedicated_logger


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S")


def log_prompt(
    *,
    session_id: str,
    provider: str,
    model: str,
    message: str,
    context: list | None = None,
) -> None:
    """记录一次 prompt。"""
    record = {
        "ts": _ts(),
        "sessionId": session_id,
        "provider": provider,
        "model": model,
        "prompt": message,
        "context": context or [],
    }
    dedicated_logger("devour.prompt", "prompt.log").info(json.dumps(record, ensure_ascii=False))


def log_response(
    *,
    session_id: str,
    provider: str,
    model: str,
    response: str = "",
    tokens: int | None = None,
    error: str | None = None,
    latency_ms: int | None = None,
) -> None:
    """记录一次响应（成功或失败）。"""
    record = {
        "ts": _ts(),
        "sessionId": session_id,
        "provider": provider,
        "model": model,
        "ok": error is None,
        "response": response,
        "tokens": tokens,
        "error": error,
        "latencyMs": latency_ms,
    }
    dedicated_logger("devour.response", "response.log").info(json.dumps(record, ensure_ascii=False))
