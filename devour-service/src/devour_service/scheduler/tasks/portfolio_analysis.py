"""每日持仓分析任务。

执行逻辑：
1. 获取所有投资组合
2. 逐组合刷新持仓现价
3. 计算风险指标（夏普、最大回撤、波动率等）
4. 超阈值时通过 DecisionService 生成预警信号

本模块作为定时任务框架的示例任务，后续可在此基础上扩展
个股贡献度分析、行业分布预警等逻辑。
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


async def daily_portfolio_analysis() -> None:
    """每日持仓分析 — 定时任务入口。"""
    # 延迟导入：避免循环依赖，并保证在 lifespan 启动后再导入
    from devour_service.db.engine import async_session
    from devour_service.services.decision_service import decision_service
    from devour_service.services.portfolio_service import PortfolioService

    logger.info("=== 开始每日持仓分析 ===")

    portfolio_svc = PortfolioService()

    async with async_session() as db:
        # 1. 获取所有组合
        try:
            portfolios = await portfolio_svc.list_portfolios(db)
        except Exception as exc:
            logger.error("获取组合列表失败: %s", exc)
            raise

        if not portfolios:
            logger.info("暂无投资组合，跳过分析")
            return

        logger.info("共 %d 个组合待分析", len(portfolios))

        for portfolio in portfolios:
            pid = portfolio.id
            pname = portfolio.name

            # 2. 刷新价格
            try:
                await portfolio_svc.refresh_prices(db, pid)
                logger.info("[%s] 价格刷新完成", pname)
            except Exception as exc:
                logger.warning("[%s] 价格刷新失败，继续计算风险: %s", pname, exc)

            # 3. 计算风险指标
            try:
                risk = await portfolio_svc.calculate_risk(db, pid)
                logger.info(
                    "[%s] 风险指标 — 夏普: %.3f  最大回撤: %.1f%%  波动率: %.1f%%",
                    pname,
                    risk.sharpe_ratio or 0,
                    (risk.max_drawdown or 0) * 100,
                    (risk.volatility or 0) * 100,
                )

                # 4. 生成预警信号
                await _check_risk_alerts(pname, pid, risk, decision_service)

            except Exception as exc:
                logger.warning("[%s] 风险计算失败: %s", pname, exc)

        await db.commit()

    logger.info("=== 每日持仓分析完成 ===")


async def _check_risk_alerts(
    pname: str,
    pid: int,
    risk: object,
    decision_service: object,
) -> None:
    """根据风险指标生成预警决策信号。"""
    max_drawdown = getattr(risk, "max_drawdown", None) or 0.0
    volatility = getattr(risk, "volatility", None) or 0.0
    concentration = getattr(risk, "concentration", None) or 0.0

    # 最大回撤超 15% 预警
    if max_drawdown < -0.15:
        await decision_service.create_decision(
            action="rebalance",
            symbol=f"Portfolio#{pid}",
            reason=f"[{pname}] 最大回撤达 {max_drawdown * 100:.1f}%，建议调仓",
            confidence=0.8,
        )
        logger.warning("[%s] 触发回撤预警: %.1f%%", pname, max_drawdown * 100)

    # 波动率超 40% 预警
    if volatility > 0.40:
        await decision_service.create_decision(
            action="hold",
            symbol=f"Portfolio#{pid}",
            reason=f"[{pname}] 年化波动率 {volatility * 100:.1f}%，风险偏高，建议观望",
            confidence=0.6,
        )
        logger.warning("[%s] 触发波动率预警: %.1f%%", pname, volatility * 100)

    # 集中度超 60% 预警
    if concentration > 0.60:
        await decision_service.create_decision(
            action="rebalance",
            symbol=f"Portfolio#{pid}",
            reason=f"[{pname}] 最大持仓集中度 {concentration * 100:.1f}%，建议分散配置",
            confidence=0.7,
        )
        logger.warning("[%s] 触发集中度预警: %.1f%%", pname, concentration * 100)
