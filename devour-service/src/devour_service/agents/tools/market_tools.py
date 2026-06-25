"""市场行情工具 — 供 LangGraph Agent 调用的市场数据工具集。

工具通过 @tool 装饰器声明，docstring 是 LLM 判断何时调用的依据，
须精确描述触发场景与参数含义。"""

from __future__ import annotations

from dataclasses import asdict

from langchain_core.tools import tool

from devour_service.datasources import get_datasource
from devour_service.services.market_service import MarketService


@tool
async def get_market_overview() -> str:
    """获取当前市场概览，包括主要指数涨跌、热门板块、信号统计。
    当用户询问今日行情、市场走势、大盘情况时调用此工具。"""
    try:
        service = MarketService()
        result = await service.get_overview()

        # 格式化为结构化文本返回给 LLM
        lines = ["## 市场概览\n"]

        # 指数
        if result.get("indices"):
            lines.append("### 主要指数")
            for idx in result["indices"]:
                direction = "↑" if idx.get("change_pct", 0) >= 0 else "↓"
                lines.append(
                    f"- {idx['name']}：{idx['price']:.2f} {direction} {idx['change_pct']:+.2f}%"
                )
            lines.append("")

        # 热门板块
        if result.get("top_sectors"):
            lines.append("### 热门板块（按涨跌幅绝对值排序）")
            for s in result["top_sectors"][:10]:
                direction = "↑" if s.get("change_pct", 0) >= 0 else "↓"
                lines.append(
                    f"- {s['sector_name']}：{direction} {s['change_pct']:+.2f}%  "
                    f"成交额 {s['amount']:.1f}亿  领涨股 {s['leading_stock']}"
                )
            lines.append("")

        # 信号统计
        if result.get("signal_count"):
            sc = result["signal_count"]
            lines.append(
                f"### 信号统计：看多 {sc.get('bullish', 0)} / "
                f"看空 {sc.get('bearish', 0)} / 中性 {sc.get('neutral', 0)}"
            )

        return "\n".join(lines)
    except Exception as exc:
        return f"获取市场概览失败：{exc}"


@tool
async def get_stock_info(symbol: str) -> str:
    """查询个股详细信息，包括当前价格、涨跌幅、成交量等。
    参数：symbol - 股票代码，如 '000001.SZ'"""
    try:
        ds = get_datasource()
        quotes = await ds.get_stock_quotes([symbol])

        if not quotes:
            return f"未找到股票 {symbol} 的行情数据。"

        q = quotes[0]
        direction = "↑" if q.change_pct >= 0 else "↓"
        return (
            f"## {q.name}（{q.symbol}）\n"
            f"- 当前价格：{q.price:.2f}\n"
            f"- 涨跌幅：{direction} {q.change_pct:+.2f}%\n"
            f"- 开盘价：{q.open:.2f}  最高：{q.high:.2f}  最低：{q.low:.2f}\n"
            f"- 昨收：{q.pre_close:.2f}\n"
            f"- 成交量：{q.volume:.0f}  成交额：{q.amount:.2f}亿"
        )
    except Exception as exc:
        return f"查询 {symbol} 行情失败：{exc}"


@tool
async def get_sector_rotation() -> str:
    """分析板块轮动情况，展示各板块资金流向和涨跌排名。
    当用户询问板块表现、行业轮动、资金流向时调用。"""
    try:
        ds = get_datasource()
        sectors = await ds.get_market_heatmap()

        if not sectors:
            return "暂无板块轮动数据。"

        # 按涨跌幅排序
        sorted_up = sorted(sectors, key=lambda x: x.change_pct, reverse=True)
        sorted_down = sorted(sectors, key=lambda x: x.change_pct)

        lines = ["## 板块轮动分析\n"]

        # 涨幅前 5
        lines.append("### 涨幅前 5 板块")
        for s in sorted_up[:5]:
            lines.append(
                f"- {s.sector_name}：+{s.change_pct:.2f}%  "
                f"成交额 {s.amount:.1f}亿  领涨股 {s.leading_stock}"
            )
        lines.append("")

        # 跌幅前 5
        lines.append("### 跌幅前 5 板块")
        for s in sorted_down[:5]:
            lines.append(
                f"- {s.sector_name}：{s.change_pct:.2f}%  "
                f"成交额 {s.amount:.1f}亿  领涨股 {s.leading_stock}"
            )
        lines.append("")

        # 资金流向（按成交额排序）
        sorted_by_amount = sorted(sectors, key=lambda x: x.amount, reverse=True)
        lines.append("### 成交额前 5 板块")
        for s in sorted_by_amount[:5]:
            direction = "↑" if s.change_pct >= 0 else "↓"
            lines.append(
                f"- {s.sector_name}：{direction} {s.change_pct:+.2f}%  "
                f"成交额 {s.amount:.1f}亿"
            )

        return "\n".join(lines)
    except Exception as exc:
        return f"获取板块轮动数据失败：{exc}"
