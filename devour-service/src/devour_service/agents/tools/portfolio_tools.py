"""持仓分析工具 — 供 LangGraph Agent 调用的组合分析工具集。

工具通过 @tool 装饰器声明，docstring 是 LLM 判断何时调用的依据。"""

from __future__ import annotations

from langchain_core.tools import tool


@tool
async def analyze_portfolio_risk(portfolio_id: int = 1) -> str:
    """分析指定投资组合的风险指标，包括夏普比率、最大回撤、波动率、Beta等。
    当用户询问持仓风险、组合表现时调用。
    参数：portfolio_id - 组合ID，默认1"""
    try:
        from devour_service.db.session import get_sessionmaker
        from devour_service.services.portfolio_service import PortfolioService

        service = PortfolioService()
        maker = get_sessionmaker("devour_core")

        async with maker() as db:
            risk = await service.calculate_risk(db, portfolio_id)

        if risk.nav_value == 0:
            return f"组合 {portfolio_id} 暂无持仓或数据不足，无法计算风险指标。"

        lines = [
            f"## 组合 {portfolio_id} 风险分析\n",
            f"- 组合净值：{risk.nav_value:,.2f}",
            f"- 夏普比率：{risk.sharpe_ratio:.4f}",
            f"- 最大回撤：{risk.max_drawdown:.2%}",
            f"- 年化波动率：{risk.volatility:.2%}",
            f"- VaR 95%：{risk.var95:,.2f}",
            f"- Beta：{risk.beta:.4f}",
            f"- 信息比率：{risk.information_ratio:.4f}",
            f"- 今日收益：{risk.today_return:.2%}",
            f"- 近一年收益：{risk.ytd_return:.2%}",
            f"- Alpha 收益：{risk.alpha_return:.2%}",
            f"- 持仓集中度：{risk.concentration:.2%}",
        ]

        return "\n".join(lines)
    except Exception as exc:
        return f"分析组合 {portfolio_id} 风险失败：{exc}"


@tool
async def get_portfolio_summary(portfolio_id: int = 1) -> str:
    """获取投资组合持仓概况，包括总市值、盈亏、持仓明细。
    当用户询问我的持仓、组合情况时调用。
    参数：portfolio_id - 组合ID，默认1"""
    try:
        from devour_service.db.session import get_sessionmaker
        from devour_service.services.portfolio_service import PortfolioService

        service = PortfolioService()
        maker = get_sessionmaker("devour_core")

        async with maker() as db:
            portfolio = await service.get_portfolio(db, portfolio_id)

        positions = portfolio.positions
        if not positions:
            return f"组合「{portfolio.name}」暂无持仓。"

        total_value = 0.0
        total_cost = 0.0
        position_lines = []

        for pos in positions:
            market_value = pos.quantity * pos.current_price
            cost_value = pos.quantity * pos.avg_cost
            pnl = market_value - cost_value
            pnl_pct = (pnl / cost_value * 100) if cost_value > 0 else 0
            total_value += market_value
            total_cost += cost_value

            direction = "↑" if pnl >= 0 else "↓"
            position_lines.append(
                f"- {pos.name}（{pos.symbol}）：持仓 {pos.quantity}股  "
                f"现价 {pos.current_price:.2f}  成本 {pos.avg_cost:.2f}  "
                f"市值 {market_value:,.2f}  "
                f"盈亏 {direction} {abs(pnl):,.2f}（{pnl_pct:+.2f}%）"
            )

        total_pnl = total_value - total_cost
        total_pnl_pct = (total_pnl / total_cost * 100) if total_cost > 0 else 0
        direction = "↑" if total_pnl >= 0 else "↓"

        lines = [
            f"## 组合「{portfolio.name}」持仓概况\n",
            f"- 总市值：{total_value:,.2f}",
            f"- 总成本：{total_cost:,.2f}",
            f"- 总盈亏：{direction} {abs(total_pnl):,.2f}（{total_pnl_pct:+.2f}%）",
            f"- 持仓数量：{len(positions)} 只\n",
            "### 持仓明细",
            *position_lines,
        ]

        return "\n".join(lines)
    except Exception as exc:
        return f"获取组合 {portfolio_id} 持仓概况失败：{exc}"
