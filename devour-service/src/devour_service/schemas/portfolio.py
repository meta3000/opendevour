"""持仓管理接口的请求与响应模型。

对齐前端 `devour-ui/src/types/portfolio.ts` 及 `devour-ui/src/api/portfolio.api.ts`。
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Portfolio（组合）
# ---------------------------------------------------------------------------


class PortfolioCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = ""


class PortfolioUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class PortfolioResponse(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime
    updated_at: datetime
    positions: list[PositionResponse] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Position（持仓）
# ---------------------------------------------------------------------------


class PositionCreate(BaseModel):
    symbol: str = Field(min_length=1, max_length=20)
    name: str = ""
    quantity: int = 0
    avg_cost: float = 0.0
    current_price: float = 0.0
    sector: str = ""


class PositionUpdate(BaseModel):
    symbol: str | None = None
    name: str | None = None
    quantity: int | None = None
    avg_cost: float | None = None
    current_price: float | None = None
    sector: str | None = None


class PositionResponse(BaseModel):
    id: int
    portfolio_id: int
    symbol: str
    name: str
    quantity: int
    avg_cost: float
    current_price: float
    sector: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Transaction（交易记录）
# ---------------------------------------------------------------------------


class TransactionCreate(BaseModel):
    type: Literal["buy", "sell"]
    quantity: int = Field(gt=0)
    price: float = Field(gt=0)
    notes: str = ""


class TransactionResponse(BaseModel):
    id: int
    position_id: int
    type: str
    quantity: int
    price: float
    timestamp: datetime
    notes: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# RiskMetrics（风险指标）
# ---------------------------------------------------------------------------


class RiskMetrics(BaseModel):
    """风险指标响应，对齐前端 RiskMetrics 类型。"""

    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    volatility: float = 0.0
    var95: float = 0.0
    beta: float = 1.0
    information_ratio: float = 0.0
    nav_value: float = 0.0
    today_return: float = 0.0
    ytd_return: float = 0.0
    alpha_return: float = 0.0
    concentration: float = 0.0


# ---------------------------------------------------------------------------
# Import（批量导入）
# ---------------------------------------------------------------------------


class ImportRecord(BaseModel):
    """单条导入记录。"""

    symbol: str
    name: str = ""
    quantity: int = 0
    avg_cost: float = 0.0
    current_price: float = 0.0
    sector: str = ""


class ImportRequest(BaseModel):
    records: list[ImportRecord]


class ImportResult(BaseModel):
    imported: int = 0
    skipped: int = 0
    errors: list[dict] = []


# 解决前向引用
PortfolioResponse.model_rebuild()
