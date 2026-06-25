"""市场发现模块请求/响应模型。"""

from __future__ import annotations

from pydantic import BaseModel, Field


class HeatmapRequest(BaseModel):
    """热力图请求。"""

    date: str | None = Field(default=None, description="日期 YYYYMMDD，默认最新")


class SectorResponse(BaseModel):
    """板块热力图节点。"""

    sector_code: str
    sector_name: str
    change_pct: float
    amount: float
    leading_stock: str
    stock_count: int


class HeatmapResponse(BaseModel):
    """热力图响应。"""

    date: str
    sectors: list[SectorResponse]


class SignalFilterRequest(BaseModel):
    """信号筛选请求。"""

    signal_type: str | None = Field(default=None, description="bullish/bearish/neutral")
    min_strength: float = 0
    sector: str | None = None
    limit: int = 50


class SignalResponse(BaseModel):
    """市场信号。"""

    symbol: str
    name: str
    signal_type: str
    strength: float
    description: str
    timestamp: str


class IndexResponse(BaseModel):
    """主要指数数据。"""

    code: str
    name: str
    price: float
    change_pct: float
    volume: float
    amount: float


class MarketOverviewResponse(BaseModel):
    """市场概览：指数 + 热门板块 + 信号统计。"""

    indices: list[IndexResponse]
    top_sectors: list[SectorResponse]
    signal_count: dict[str, int]
