"""投资决策工具 — 供 LangGraph Agent 生成投资决策建议。

工具通过 @tool 装饰器声明，docstring 是 LLM 判断何时调用的依据。"""

from __future__ import annotations

from langchain_core.tools import tool


@tool
async def generate_investment_decision(
    action: str,
    symbol: str,
    reason: str,
    confidence: float = 0.7,
) -> str:
    """生成投资决策建议并推送到待确认队列。
    当分析结果明确指向买入/卖出/调仓操作时调用。
    参数：
    - action: 操作类型 'buy'/'sell'/'hold'/'rebalance'
    - symbol: 标的代码
    - reason: 决策理由
    - confidence: 置信度 0-1
    """
    from devour_service.services.decision_service import DecisionService

    service = DecisionService()
    decision = await service.create_decision(
        action=action,
        symbol=symbol,
        reason=reason,
        confidence=confidence,
    )
    return (
        f"已生成决策建议：{action} {symbol}，"
        f"置信度{confidence * 100:.0f}%，"
        f"已推送到待确认队列。决策ID：{decision.id}"
    )
