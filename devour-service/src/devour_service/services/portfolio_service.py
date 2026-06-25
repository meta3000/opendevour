"""持仓管理服务：CRUD 操作 + 风险指标计算。

数据库会话通过参数注入（AsyncSession），由 API 层负责创建和提交。
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.exceptions import AppError
from ..core.logging import get_logger
from ..datasources import get_datasource
from ..models.portfolio import Portfolio, Position, Transaction
from ..schemas.portfolio import (
    ImportRecord,
    ImportResult,
    PortfolioCreate,
    PortfolioUpdate,
    PositionCreate,
    PositionUpdate,
    RiskMetrics,
)

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# 风险计算工具函数
# ---------------------------------------------------------------------------


def calc_sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.03) -> float:
    """年化夏普比率 = sqrt(252) * (日均超额收益) / 日超额收益标准差。"""
    excess = returns - risk_free_rate / 252
    if excess.std() == 0 or pd.isna(excess.std()):
        return 0.0
    return float(np.sqrt(252) * excess.mean() / excess.std())


def calc_max_drawdown(prices: pd.Series) -> float:
    """最大回撤 = min((prices - peak) / peak)。"""
    if prices.empty:
        return 0.0
    peak = prices.cummax()
    drawdown = (prices - peak) / peak
    return float(drawdown.min())


def calc_volatility(returns: pd.Series) -> float:
    """年化波动率 = 日收益率标准差 * sqrt(252)。"""
    if returns.empty or returns.std() == 0:
        return 0.0
    return float(returns.std() * np.sqrt(252))


def calc_beta(portfolio_returns: pd.Series, market_returns: pd.Series) -> float:
    """Beta = cov(portfolio, market) / var(market)。"""
    if market_returns.empty or np.var(market_returns) == 0:
        return 1.0
    cov = np.cov(portfolio_returns.dropna(), market_returns.dropna())[0][1]
    var = np.var(market_returns.dropna())
    return float(cov / var) if var > 0 else 1.0


def calc_var95(returns: pd.Series, portfolio_value: float) -> float:
    """VaR 95%（参数法）：每日最大损失估计（正数表示损失金额）。"""
    if returns.empty:
        return 0.0
    z_95 = 1.645
    daily_var = returns.mean() - z_95 * returns.std()
    return float(abs(daily_var) * portfolio_value)


# ---------------------------------------------------------------------------
# PortfolioService
# ---------------------------------------------------------------------------


class PortfolioService:
    """持仓管理服务。"""

    # ----- 组合 CRUD -----

    async def list_portfolios(self, db: AsyncSession) -> list[Portfolio]:
        result = await db.execute(
            select(Portfolio).options(selectinload(Portfolio.positions)).order_by(Portfolio.updated_at.desc())
        )
        return list(result.scalars().all())

    async def create_portfolio(self, db: AsyncSession, data: PortfolioCreate) -> Portfolio:
        portfolio = Portfolio(name=data.name, description=data.description)
        db.add(portfolio)
        await db.flush()
        await db.refresh(portfolio)
        return portfolio

    async def get_portfolio(self, db: AsyncSession, portfolio_id: int) -> Portfolio:
        result = await db.execute(
            select(Portfolio)
            .options(selectinload(Portfolio.positions))
            .where(Portfolio.id == portfolio_id)
        )
        portfolio = result.scalar_one_or_none()
        if portfolio is None:
            raise AppError(f"组合 {portfolio_id} 不存在", code=4004, http_status=404)
        return portfolio

    async def update_portfolio(
        self, db: AsyncSession, portfolio_id: int, data: PortfolioUpdate
    ) -> Portfolio:
        portfolio = await self.get_portfolio(db, portfolio_id)
        if data.name is not None:
            portfolio.name = data.name
        if data.description is not None:
            portfolio.description = data.description
        portfolio.updated_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(portfolio)
        return portfolio

    async def delete_portfolio(self, db: AsyncSession, portfolio_id: int) -> None:
        portfolio = await self.get_portfolio(db, portfolio_id)
        await db.delete(portfolio)
        await db.flush()

    # ----- 持仓 CRUD -----

    async def list_positions(self, db: AsyncSession, portfolio_id: int) -> list[Position]:
        # 确保组合存在
        await self.get_portfolio(db, portfolio_id)
        result = await db.execute(
            select(Position).where(Position.portfolio_id == portfolio_id).order_by(Position.id)
        )
        return list(result.scalars().all())

    async def add_position(
        self, db: AsyncSession, portfolio_id: int, data: PositionCreate
    ) -> Position:
        # 确保组合存在
        await self.get_portfolio(db, portfolio_id)
        position = Position(
            portfolio_id=portfolio_id,
            symbol=data.symbol,
            name=data.name,
            quantity=data.quantity,
            avg_cost=data.avg_cost,
            current_price=data.current_price,
            sector=data.sector,
        )
        db.add(position)
        await db.flush()
        await db.refresh(position)
        return position

    async def get_position(self, db: AsyncSession, position_id: int) -> Position:
        result = await db.execute(select(Position).where(Position.id == position_id))
        position = result.scalar_one_or_none()
        if position is None:
            raise AppError(f"持仓 {position_id} 不存在", code=4004, http_status=404)
        return position

    async def update_position(
        self, db: AsyncSession, position_id: int, data: PositionUpdate
    ) -> Position:
        position = await self.get_position(db, position_id)
        for field in ("symbol", "name", "quantity", "avg_cost", "current_price", "sector"):
            value = getattr(data, field, None)
            if value is not None:
                setattr(position, field, value)
        position.updated_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(position)
        return position

    async def delete_position(self, db: AsyncSession, position_id: int) -> None:
        position = await self.get_position(db, position_id)
        await db.delete(position)
        await db.flush()

    # ----- 风险计算 -----

    async def calculate_risk(self, db: AsyncSession, portfolio_id: int) -> RiskMetrics:
        """计算组合风险指标。

        流程：
        1. 获取该组合所有持仓
        2. 通过 get_datasource() 获取近一年历史K线
        3. 按持仓权重计算组合日收益率
        4. 计算夏普比率、最大回撤、波动率、Beta、集中度等
        """
        portfolio = await self.get_portfolio(db, portfolio_id)
        positions = portfolio.positions

        if not positions:
            return RiskMetrics()

        # 计算持仓市值和权重
        position_values = []
        total_value = 0.0
        for pos in positions:
            mv = pos.quantity * pos.current_price
            total_value += mv
            position_values.append((pos, mv))

        if total_value == 0:
            return RiskMetrics()

        weights = {pos.symbol: mv / total_value for pos, mv in position_values}

        # 集中度 = 最大持仓占比
        concentration = max(weights.values()) if weights else 0.0

        # 获取历史K线（近一年）
        ds = get_datasource()
        end_date = datetime.now().strftime("%Y%m%d")
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y%m%d")

        symbol_returns: dict[str, pd.Series] = {}
        for pos, _ in position_values:
            try:
                df = await ds.get_stock_history(pos.symbol, start_date, end_date)
                if df is not None and not df.empty and "close" in df.columns:
                    daily_ret = df["close"].pct_change().dropna()
                    symbol_returns[pos.symbol] = daily_ret
            except Exception as exc:
                logger.warning("获取 %s 历史数据失败: %s", pos.symbol, exc)

        if not symbol_returns:
            # 无历史数据时返回基础指标
            nav_value = total_value
            return RiskMetrics(
                nav_value=nav_value,
                concentration=concentration,
            )

        # 对齐所有收益率序列
        returns_df = pd.DataFrame(symbol_returns)
        returns_df = returns_df.dropna()

        if returns_df.empty:
            return RiskMetrics(nav_value=total_value, concentration=concentration)

        # 组合加权日收益率
        weight_series = pd.Series(
            {sym: weights.get(sym, 0.0) for sym in returns_df.columns}
        )
        portfolio_returns = returns_df @ weight_series

        # 获取沪深300作为市场基准
        market_returns = pd.Series(dtype=float)
        try:
            market_df = await ds.get_stock_history("000300.SH", start_date, end_date)
            if market_df is not None and not market_df.empty and "close" in market_df.columns:
                market_returns = market_df["close"].pct_change().dropna()
        except Exception as exc:
            logger.warning("获取沪深300历史数据失败: %s", exc)

        # 计算各项指标
        sharpe = calc_sharpe_ratio(portfolio_returns)
        max_dd = calc_max_drawdown((1 + portfolio_returns).cumprod())
        vol = calc_volatility(portfolio_returns)
        var95_val = calc_var95(portfolio_returns, total_value)

        beta_val = 1.0
        if not market_returns.empty:
            # 对齐日期
            aligned = pd.concat([portfolio_returns, market_returns], axis=1).dropna()
            if len(aligned) > 10:
                beta_val = calc_beta(aligned.iloc[:, 0], aligned.iloc[:, 1])

        # 年化收益
        total_return = float((1 + portfolio_returns).prod() - 1)
        ytd_return = total_return  # 近一年近似

        # 今日收益
        today_return = float(portfolio_returns.iloc[-1]) if len(portfolio_returns) > 0 else 0.0

        # 超额收益 alpha (简化: 组合年化收益 - beta * 市场年化收益)
        alpha_return = 0.0
        if not market_returns.empty and len(market_returns) > 0:
            market_ann_return = float((1 + market_returns).prod() - 1)
            alpha_return = total_return - beta_val * market_ann_return

        # 信息比率 (简化)
        info_ratio = 0.0
        if not market_returns.empty:
            aligned = pd.concat([portfolio_returns, market_returns], axis=1).dropna()
            if len(aligned) > 10:
                excess = aligned.iloc[:, 0] - aligned.iloc[:, 1]
                if excess.std() > 0:
                    info_ratio = float(np.sqrt(252) * excess.mean() / excess.std())

        return RiskMetrics(
            sharpe_ratio=round(sharpe, 4),
            max_drawdown=round(max_dd, 4),
            volatility=round(vol, 4),
            var95=round(var95_val, 2),
            beta=round(beta_val, 4),
            information_ratio=round(info_ratio, 4),
            nav_value=round(total_value, 2),
            today_return=round(today_return, 4),
            ytd_return=round(ytd_return, 4),
            alpha_return=round(alpha_return, 4),
            concentration=round(concentration, 4),
        )

    # ----- 批量导入 -----

    async def import_positions(
        self, db: AsyncSession, portfolio_id: int, records: list[ImportRecord]
    ) -> ImportResult:
        """批量导入持仓到指定组合。"""
        await self.get_portfolio(db, portfolio_id)
        imported = 0
        skipped = 0
        errors: list[dict] = []

        for i, rec in enumerate(records):
            try:
                position = Position(
                    portfolio_id=portfolio_id,
                    symbol=rec.symbol,
                    name=rec.name,
                    quantity=rec.quantity,
                    avg_cost=rec.avg_cost,
                    current_price=rec.current_price,
                    sector=rec.sector,
                )
                db.add(position)
                imported += 1
            except Exception as exc:
                skipped += 1
                errors.append({"row": i + 1, "reason": str(exc)})

        await db.flush()
        return ImportResult(imported=imported, skipped=skipped, errors=errors)

    # ----- 刷新价格 -----

    async def refresh_prices(self, db: AsyncSession, portfolio_id: int) -> None:
        """通过数据源刷新持仓当前价格。"""
        positions = await self.list_positions(db, portfolio_id)
        if not positions:
            return

        ds = get_datasource()
        symbols = [p.symbol for p in positions]

        try:
            quotes = await ds.get_stock_quotes(symbols)
            quote_map = {q.symbol: q.price for q in quotes}
            for pos in positions:
                if pos.symbol in quote_map:
                    pos.current_price = quote_map[pos.symbol]
                    pos.updated_at = datetime.now(timezone.utc)
            await db.flush()
        except Exception as exc:
            # 数据源不可用（如 NoopDataSource）时静默跳过，保留数据库中已有价格
            logger.warning("刷新价格失败（静默跳过）: %s", exc)


# 模块级单例
portfolio_service = PortfolioService()
