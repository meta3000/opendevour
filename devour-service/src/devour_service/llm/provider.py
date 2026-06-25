"""模型 provider 注册表。

统一通过 OpenAI 兼容端点接入各家模型，从而用同一套 ChatOpenAI 客户端 +
不同 base_url / model / api_key 即可调用，满足「动态传入模型配置」。
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ProviderSpec:
    """某个 provider 的默认接入参数。"""

    name: str
    base_url: str
    default_model: str
    # 在 .env / Settings 中对应的字段前缀（{prefix}_api_key）
    key_prefix: str


# 主流模型供应商（均提供 OpenAI 兼容端点）
PROVIDERS: dict[str, ProviderSpec] = {
    "dashscope": ProviderSpec(
        "dashscope",
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "qwen-plus",
        "dashscope",
    ),
    "openai": ProviderSpec(
        "openai",
        "https://api.openai.com/v1",
        "gpt-4o-mini",
        "openai",
    ),
    "deepseek": ProviderSpec(
        "deepseek",
        "https://api.deepseek.com/v1",
        "deepseek-chat",
        "deepseek",
    ),
    "kimi": ProviderSpec(
        "kimi",
        "https://api.moonshot.cn/v1",
        "moonshot-v1-8k",
        "moonshot",
    ),
    "glm": ProviderSpec(
        "glm",
        "https://open.bigmodel.cn/api/paas/v4",
        "glm-4",
        "zhipu",
    ),
    "gemini": ProviderSpec(
        "gemini",
        "https://generativelanguage.googleapis.com/v1beta/openai/",
        "gemini-1.5-flash",
        "gemini",
    ),
}

# provider 别名 → 规范名
_ALIASES = {
    "qwen": "dashscope",
    "moonshot": "kimi",
    "zhipu": "glm",
    "google": "gemini",
}


def resolve_provider(name: str) -> ProviderSpec:
    """按名称（含别名）解析 provider 规格，未知则抛 KeyError。"""
    key = name.lower().strip()
    key = _ALIASES.get(key, key)
    if key not in PROVIDERS:
        raise KeyError(f"不支持的模型 provider: {name}（支持: {sorted(PROVIDERS)}）")
    return PROVIDERS[key]


def list_providers() -> list[dict[str, str]]:
    """列出所有支持的 provider（供 UI / 文档使用）。"""
    return [
        {"provider": p.name, "default_model": p.default_model, "base_url": p.base_url}
        for p in PROVIDERS.values()
    ]
