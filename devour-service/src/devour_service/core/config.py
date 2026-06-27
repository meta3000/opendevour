"""应用配置：基于 pydantic-settings，从环境变量 / .env 读取。

包含三类配置：
- 应用级（端口、CORS、环境）
- 大模型（默认 provider/模型 + 各 provider 的 API Key）
- 本地 SQLite 数据库（单文件）

所有配置均可被环境变量覆盖，便于多环境部署。
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """全局配置单例（通过 get_settings() 获取）。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ---- 应用 ----
    app_name: str = "devour-service"
    app_env: str = "local"
    cors_origins: str = "http://localhost:5173,http://localhost:5174"
    # 日志
    log_dir: str = "logs"
    log_level: str = "INFO"
    # Skills 根目录（相对运行目录，默认指向仓库根的 skills/）
    skills_dir: str = "../skills"

    # ---- 大模型默认值 ----
    llm_default_provider: str = "dashscope"
    llm_default_model: str = "qwen-plus"
    llm_temperature: float = 0.7
    # LLM HTTP 调用代理：留空=直连（默认忽略系统 *_PROXY 环境变量，
    # 适合 dashscope 等国内端点）；需要代理时显式填 http(s)://host:port 或 socks5://host:port
    llm_proxy: str = ""

    # ---- 各 provider API Key ----
    dashscope_api_key: str = ""
    openai_api_key: str = ""
    deepseek_api_key: str = ""
    moonshot_api_key: str = ""
    zhipu_api_key: str = ""
    gemini_api_key: str = ""

    # ---- 可选 base_url 覆盖（留空用内置默认）----
    dashscope_base_url: str = ""
    openai_base_url: str = ""
    deepseek_base_url: str = ""
    moonshot_base_url: str = ""
    zhipu_base_url: str = ""
    gemini_base_url: str = ""

    # ---- 数据源 ----
    tushare_token: str = ""
    default_datasource: str = "tushare"
    datasource_cache_ttl: int = 300  # 秒

    # ---- 本地 SQLite 数据库 ----
    db_path: str = "./data/devour.db"

    # ---- 会话文件存储 ----
    session_files_dir: str = "./data/sessions"

    # ---- 派生属性 ----
    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def api_key_for(self, provider: str) -> str:
        """返回指定 provider 的 API Key。"""
        return getattr(self, f"{_provider_key_prefix(provider)}_api_key", "")

    def base_url_override_for(self, provider: str) -> str:
        """返回指定 provider 的 base_url 覆盖（可能为空字符串）。"""
        return getattr(self, f"{_provider_key_prefix(provider)}_base_url", "")


# provider 名 → 配置字段前缀（处理别名）
_PROVIDER_PREFIX = {
    "dashscope": "dashscope",
    "qwen": "dashscope",
    "openai": "openai",
    "deepseek": "deepseek",
    "kimi": "moonshot",
    "moonshot": "moonshot",
    "glm": "zhipu",
    "zhipu": "zhipu",
    "gemini": "gemini",
    "google": "gemini",
}


def _provider_key_prefix(provider: str) -> str:
    return _PROVIDER_PREFIX.get(provider.lower(), provider.lower())


@lru_cache
def get_settings() -> Settings:
    return Settings()
