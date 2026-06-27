"""持仓管理 REST API 接口。

端点前缀：/api/v1/portfolios
数据库：devour_core
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.response import ApiResponse, fail, ok
from ...db.session import get_db
from ...schemas.portfolio import (
    ImportRequest,
    PortfolioCreate,
    PortfolioUpdate,
    PositionCreate,
    PositionUpdate,
)
from ...services.portfolio_service import portfolio_service

router = APIRouter(prefix="/portfolios", tags=["portfolios"])

_db_dep = Depends(get_db)


# ---------------------------------------------------------------------------
# 组合 CRUD
# ---------------------------------------------------------------------------


@router.get("", response_model=ApiResponse)
async def list_portfolios(db: AsyncSession = _db_dep) -> ApiResponse:
    """获取所有投资组合列表。"""
    portfolios = await portfolio_service.list_portfolios(db)
    return ok([
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            "position_count": len(p.positions) if p.positions else 0,
        }
        for p in portfolios
    ])


@router.post("", response_model=ApiResponse)
async def create_portfolio(
    data: PortfolioCreate, db: AsyncSession = _db_dep
) -> ApiResponse:
    """创建新的投资组合。"""
    p = await portfolio_service.create_portfolio(db, data)
    await db.commit()
    return ok({"id": p.id, "name": p.name}, message="组合已创建")


@router.get("/{portfolio_id}", response_model=ApiResponse)
async def get_portfolio(portfolio_id: int, db: AsyncSession = _db_dep) -> ApiResponse:
    """获取组合详情（含持仓列表）。"""
    p = await portfolio_service.get_portfolio(db, portfolio_id)
    return ok({
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        "positions": [
            _position_to_dict(pos) for pos in (p.positions or [])
        ],
    })


@router.put("/{portfolio_id}", response_model=ApiResponse)
async def update_portfolio(
    portfolio_id: int, data: PortfolioUpdate, db: AsyncSession = _db_dep
) -> ApiResponse:
    """更新投资组合信息。"""
    p = await portfolio_service.update_portfolio(db, portfolio_id, data)
    await db.commit()
    return ok({"id": p.id, "name": p.name}, message="组合已更新")


@router.delete("/{portfolio_id}", response_model=ApiResponse)
async def delete_portfolio(portfolio_id: int, db: AsyncSession = _db_dep) -> ApiResponse:
    """删除投资组合（级联删除所有持仓和交易记录）。至少保留一个组合。"""
    all_portfolios = await portfolio_service.list_portfolios(db)
    if len(all_portfolios) <= 1:
        return fail(code=400, message="至少保留一个投资组合")
    await portfolio_service.delete_portfolio(db, portfolio_id)
    await db.commit()
    return ok(message="组合已删除")


# ---------------------------------------------------------------------------
# 持仓 CRUD
# ---------------------------------------------------------------------------


@router.get("/{portfolio_id}/positions", response_model=ApiResponse)
async def list_positions(portfolio_id: int, db: AsyncSession = _db_dep) -> ApiResponse:
    """获取组合下所有持仓。"""
    positions = await portfolio_service.list_positions(db, portfolio_id)
    return ok([_position_to_dict(p) for p in positions])


@router.post("/{portfolio_id}/positions", response_model=ApiResponse)
async def add_position(
    portfolio_id: int, data: PositionCreate, db: AsyncSession = _db_dep
) -> ApiResponse:
    """向组合添加持仓。"""
    pos = await portfolio_service.add_position(db, portfolio_id, data)
    await db.commit()
    return ok(_position_to_dict(pos), message="持仓已添加")


@router.put("/{portfolio_id}/positions/{pos_id}", response_model=ApiResponse)
async def update_position(
    portfolio_id: int, pos_id: int, data: PositionUpdate, db: AsyncSession = _db_dep
) -> ApiResponse:
    """更新持仓信息。"""
    pos = await portfolio_service.update_position(db, pos_id, data)
    await db.commit()
    return ok(_position_to_dict(pos), message="持仓已更新")


@router.delete("/{portfolio_id}/positions/{pos_id}", response_model=ApiResponse)
async def delete_position(
    portfolio_id: int, pos_id: int, db: AsyncSession = _db_dep
) -> ApiResponse:
    """删除持仓（级联删除交易记录）。"""
    await portfolio_service.delete_position(db, pos_id)
    await db.commit()
    return ok(message="持仓已删除")


# ---------------------------------------------------------------------------
# 风险分析 / 导入 / 刷新
# ---------------------------------------------------------------------------


@router.get("/{portfolio_id}/risk", response_model=ApiResponse)
async def get_risk_metrics(portfolio_id: int, db: AsyncSession = _db_dep) -> ApiResponse:
    """计算并返回组合风险指标。"""
    metrics = await portfolio_service.calculate_risk(db, portfolio_id)
    return ok(metrics.model_dump())


@router.post("/{portfolio_id}/import", response_model=ApiResponse)
async def import_positions(
    portfolio_id: int, data: ImportRequest, db: AsyncSession = _db_dep
) -> ApiResponse:
    """批量导入持仓。"""
    result = await portfolio_service.import_positions(db, portfolio_id, data.records)
    await db.commit()
    return ok(result.model_dump(), message=f"已导入 {result.imported} 条持仓")


@router.post("/{portfolio_id}/refresh", response_model=ApiResponse)
async def refresh_prices(portfolio_id: int, db: AsyncSession = _db_dep) -> ApiResponse:
    """刷新组合下所有持仓的当前价格。"""
    await portfolio_service.refresh_prices(db, portfolio_id)
    await db.commit()
    return ok(message="价格已刷新")


# ---------------------------------------------------------------------------
# 辅助函数
# ---------------------------------------------------------------------------


def _position_to_dict(pos) -> dict:
    """将 Position ORM 对象转为字典（匹配前端 Holding 类型字段）。"""
    quantity = pos.quantity or 0
    avg_cost = pos.avg_cost or 0.0
    current_price = pos.current_price or 0.0

    # 计算浮盈亏
    pnl_amount = quantity * (current_price - avg_cost) if quantity and avg_cost else 0.0
    pnl_pct = (current_price - avg_cost) / avg_cost if avg_cost > 0 else 0.0

    return {
        "id": pos.id,
        "portfolio_id": pos.portfolio_id,
        "symbol": pos.symbol,
        "name": pos.name or "",
        "sector": pos.sector or "",
        "quantity": quantity,
        "avg_cost": avg_cost,
        "current_price": current_price,
        "pnl_amount": round(pnl_amount, 2),
        "pnl_pct": round(pnl_pct, 4),
        "created_at": pos.created_at.isoformat() if pos.created_at else None,
        "updated_at": pos.updated_at.isoformat() if pos.updated_at else None,
    }
