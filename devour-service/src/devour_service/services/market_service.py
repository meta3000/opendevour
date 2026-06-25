"""市场发现业务逻辑层。"""

from __future__ import annotations

from dataclasses import asdict

from devour_service.core.logging import get_logger
from devour_service.datasources import get_datasource
from devour_service.datasources.base import SignalFilter

logger = get_logger(__name__)


class MarketService:
    """市场发现业务逻辑层。"""

    async def get_heatmap(self, date: str | None = None) -> dict:
        """获取板块热力图。"""
        ds = get_datasource()
        logger.info("调用数据源 %s.get_market_heatmap(date=%s)", ds.__class__.__name__, date)
        sectors = await ds.get_market_heatmap(date)
        return {"date": date or "latest", "sectors": [asdict(s) for s in sectors]}

    async def get_signals(self, filters: SignalFilter) -> list[dict]:
        """获取市场信号列表。"""
        ds = get_datasource()
        logger.info("调用数据源 %s.get_market_signals()", ds.__class__.__name__)
        signals = await ds.get_market_signals(filters)
        return [asdict(s) for s in signals]

    async def get_indices(self) -> list[dict]:
        """获取主要指数行情。"""
        ds = get_datasource()
        logger.info("调用数据源 %s.get_index_data()", ds.__class__.__name__)
        indices = await ds.get_index_data()
        return [asdict(i) for i in indices]

    async def get_sector_detail(self, sector_id: str) -> dict:
        """获取板块详情（当前仅返回板块元信息，成分股需数据源支持按板块查询后扩展）。"""
        ds = get_datasource()
        logger.info("调用数据源 %s.get_stock_quotes() for sector=%s", ds.__class__.__name__, sector_id)
        # TODO: 数据源适配器暂不支持按板块代码查询成分股，先返回空列表占位
        quotes = await ds.get_stock_quotes([])
        return {"sector_id": sector_id, "stocks": [asdict(q) for q in quotes]}

    async def get_overview(self) -> dict:
        """市场概览：指数 + 热门板块 + 信号统计。"""
        ds = get_datasource()
        logger.info("市场概览调用开始, 数据源=%s", ds.__class__.__name__)
        indices = await ds.get_index_data()
        sectors = await ds.get_market_heatmap()
        signals = await ds.get_market_signals(SignalFilter(limit=100))

        signal_count: dict[str, int] = {"bullish": 0, "bearish": 0, "neutral": 0}
        for s in signals:
            signal_count[s.signal_type] = signal_count.get(s.signal_type, 0) + 1

        return {
            "indices": [asdict(i) for i in indices],
            "top_sectors": [
                asdict(s)
                for s in sorted(sectors, key=lambda x: abs(x.change_pct), reverse=True)[:10]
            ],
            "signal_count": signal_count,
        }
