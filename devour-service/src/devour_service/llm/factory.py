"""大模型工厂：根据 LLMConfig 动态构建 LangChain ChatModel。

核心：build_chat_model(cfg) 解析 provider 默认值，叠加 cfg 的覆盖项与 .env 中的
API Key，返回可流式调用的 ChatOpenAI 实例。
"""

from __future__ import annotations

import httpx
from langchain_openai import ChatOpenAI

from ..core.config import get_settings
from ..core.exceptions import LLMConfigError
from .provider import resolve_provider
from .schemas import LLMConfig


def resolve_config(cfg: LLMConfig) -> dict:
    """把 LLMConfig 解析为最终调用参数（合并 provider 默认值 + .env + 覆盖项）。"""
    settings = get_settings()
    spec = resolve_provider(cfg.provider)

    model = cfg.model or spec.default_model
    base_url = cfg.base_url or settings.base_url_override_for(spec.key_prefix) or spec.base_url
    api_key = cfg.api_key or settings.api_key_for(spec.key_prefix)
    temperature = cfg.temperature if cfg.temperature is not None else settings.llm_temperature

    if not api_key:
        env_var = f"{spec.key_prefix.upper()}_API_KEY"
        raise LLMConfigError(
            f"未配置 {spec.name} 的 API Key，请在 devour-service/.env 中设置 {env_var} 后重试。"
        )

    return {
        "model": model,
        "base_url": base_url,
        "api_key": api_key,
        "temperature": temperature,
        "max_tokens": cfg.max_tokens,
    }


def build_chat_model(cfg: LLMConfig) -> ChatOpenAI:
    """根据配置构建一个可流式调用的 ChatOpenAI。"""
    params = resolve_config(cfg)
    proxy = get_settings().llm_proxy or None
    # 自带 httpx 客户端：trust_env=False 忽略系统 *_PROXY（避免把国内端点错误地走代理，
    # 也规避了系统里 socks:// 这类 httpx 不识别的代理 scheme 导致客户端构造失败）。
    kwargs: dict = {
        "model": params["model"],
        "base_url": params["base_url"],
        "api_key": params["api_key"],
        "temperature": params["temperature"],
        "streaming": True,
        "timeout": 60,
        "max_retries": 1,
        "http_client": httpx.Client(trust_env=False, proxy=proxy, timeout=60),
        "http_async_client": httpx.AsyncClient(trust_env=False, proxy=proxy, timeout=60),
    }
    if params["max_tokens"]:
        kwargs["max_tokens"] = params["max_tokens"]
    return ChatOpenAI(**kwargs)


def default_config() -> LLMConfig:
    """从 .env 默认值构造 LLMConfig。"""
    settings = get_settings()
    return LLMConfig(
        provider=settings.llm_default_provider,
        model=settings.llm_default_model,
        temperature=settings.llm_temperature,
    )
