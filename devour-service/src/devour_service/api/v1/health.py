"""健康检查与能力发现接口。"""

from __future__ import annotations

from fastapi import APIRouter

from ...core.config import get_settings
from ...core.response import ApiResponse, ok
from ...db.engine import check_all_sources
from ...llm.provider import list_providers

router = APIRouter(tags=["health"])


@router.get("/health", response_model=ApiResponse)
async def health() -> ApiResponse:
    """存活检查。"""
    settings = get_settings()
    return ok(
        {
            "app": settings.app_name,
            "env": settings.app_env,
            "status": "ok",
            "defaultProvider": settings.llm_default_provider,
            "defaultModel": settings.llm_default_model,
        }
    )


@router.get("/health/db", response_model=ApiResponse)
async def health_db() -> ApiResponse:
    """SQLite 数据源连通性（不可用时标记 unavailable，不报错）。"""
    sources = await check_all_sources()
    return ok({"sources": sources})


@router.get("/providers", response_model=ApiResponse)
async def providers() -> ApiResponse:
    """列出支持的大模型 provider。"""
    return ok({"providers": list_providers()})
