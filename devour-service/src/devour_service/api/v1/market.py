"""市场发现接口。"""

from __future__ import annotations

from fastapi import APIRouter

from devour_service.core.response import ApiResponse, ok
from devour_service.datasources.base import SignalFilter
from devour_service.schemas.market import (
    HeatmapResponse,
    IndexResponse,
    MarketOverviewResponse,
    SignalResponse,
)
from devour_service.services.market_service import MarketService

router = APIRouter(tags=["market"])
service = MarketService()


@router.get("/heatmap", response_model=ApiResponse[HeatmapResponse])
async def get_heatmap(date: str | None = None) -> ApiResponse:
    """获取板块热力图。"""
    result = await service.get_heatmap(date)
    return ok(result)


@router.get("/signals", response_model=ApiResponse[list[SignalResponse]])
async def get_signals(
    signal_type: str | None = None,
    min_strength: float = 0,
    sector: str | None = None,
    limit: int = 50,
) -> ApiResponse:
    """获取市场信号列表。"""
    filters = SignalFilter(
        signal_type=signal_type,
        min_strength=min_strength,
        sector=sector,
        limit=limit,
    )
    result = await service.get_signals(filters)
    return ok(result)


@router.get("/indices", response_model=ApiResponse[list[IndexResponse]])
async def get_indices() -> ApiResponse:
    """获取主要指数行情。"""
    result = await service.get_indices()
    return ok(result)


@router.get("/sectors/{sector_id}")
async def get_sector_detail(sector_id: str) -> ApiResponse:
    """获取板块详情（含成分股行情）。"""
    result = await service.get_sector_detail(sector_id)
    return ok(result)


@router.get("/overview", response_model=ApiResponse[MarketOverviewResponse])
async def get_overview() -> ApiResponse:
    """获取市场概览（指数 + 热门板块 + 信号统计）。"""
    result = await service.get_overview()
    return ok(result)
