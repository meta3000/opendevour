"""大模型调用配置模型。

LLMConfig 支持「动态传入模型相关配置」：调用方可只给 provider（其余取默认），
也可显式覆盖 model / temperature / api_key / base_url / max_tokens。
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class LLMConfig(BaseModel):
    """单次大模型调用的配置。"""

    provider: str = Field(..., description="模型供应商：openai/gemini/deepseek/dashscope/kimi/glm 等")
    model: str | None = Field(None, description="模型 id，留空用该 provider 默认模型")
    temperature: float | None = Field(None, ge=0, le=2)
    max_tokens: int | None = Field(None, gt=0)
    api_key: str | None = Field(None, description="覆盖配置中的 API Key（一般留空，用 .env）")
    base_url: str | None = Field(None, description="覆盖 provider 默认 base_url")
