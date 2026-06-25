"""数据源模块 — 统一抽象层，支持 Tushare / AKShare / Wind 等多种数据源。

快速使用::

    from devour_service.datasources import get_datasource, DataSourceRegistry

    # 获取默认数据源
    ds = get_datasource()
    heatmap = await ds.get_market_heatmap()

    # 按名称获取
    ds = DataSourceRegistry.get("tushare")

说明：
- ``tushare`` 已改为可选依赖（``uv sync --extra datasources``）。
- 未安装时模块会自动降级为 ``NoopDataSource``，服务仍可启动，但行情接口返回空数据。
"""

from __future__ import annotations

import pandas as pd

from devour_service.core.config import get_settings
from devour_service.core.logging import get_logger
from devour_service.datasources.base import (
    DataSourceAdapter,
    IndexData,
    QuoteData,
    SectorData,
    SignalData,
    SignalFilter,
)
from devour_service.datasources.cache import async_ttl_cache
from devour_service.datasources.registry import DataSourceRegistry

logger = get_logger(__name__)


class NoopDataSource(DataSourceAdapter):
    """tushare 未安装时的空实现，保证服务可启动。"""

    async def get_market_heatmap(self, date: str | None = None) -> list[SectorData]:
        logger.warning("[NoopDataSource] get_market_heatmap 调用，tushare 未安装，返回空数据")
        return []

    async def get_stock_quotes(self, symbols: list[str]) -> list[QuoteData]:
        logger.warning("[NoopDataSource] get_stock_quotes(%s) 调用，tushare 未安装，返回空数据", symbols)
        return []

    async def get_market_signals(self, filters: SignalFilter) -> list[SignalData]:
        logger.warning("[NoopDataSource] get_market_signals 调用，tushare 未安装，返回空数据")
        return []

    async def get_stock_history(
        self, symbol: str, start_date: str, end_date: str
    ) -> pd.DataFrame:
        logger.warning("[NoopDataSource] get_stock_history(%s) 调用，tushare 未安装，返回空数据", symbol)
        return pd.DataFrame()

    async def get_index_data(self) -> list[IndexData]:
        logger.warning("[NoopDataSource] get_index_data 调用，tushare 未安装，返回空数据")
        return []


# 尝试导入 Tushare 适配器；未安装时注册空实现，避免应用启动崩溃
try:
    import tushare  # noqa: F401

    from devour_service.datasources.tushare_adapter import TushareAdapter

    DataSourceRegistry.register("tushare", TushareAdapter)
    logger.info("数据源注册成功: tushare (TushareAdapter)")
except ImportError:
    default_name = get_settings().default_datasource or "tushare"
    logger.warning(
        "tushare 未安装，数据源功能不可用。如需行情数据，请执行：uv sync --extra datasources"
    )
    DataSourceRegistry.register(default_name, NoopDataSource)
    logger.info("数据源降级注册: %s (NoopDataSource)", default_name)


def get_datasource(name: str | None = None) -> DataSourceAdapter:
    """获取数据源适配器便捷函数。

    Args:
        name: 数据源名称，为 None 时返回默认数据源。

    Returns:
        对应的数据源适配器实例。
    """
    if name is None:
        return DataSourceRegistry.get_default()
    return DataSourceRegistry.get(name)


__all__ = [
    # 数据模型
    "SectorData",
    "QuoteData",
    "SignalData",
    "IndexData",
    "SignalFilter",
    # 抽象基类
    "DataSourceAdapter",
    # 注册表
    "DataSourceRegistry",
    # 缓存
    "async_ttl_cache",
    # 便捷函数
    "get_datasource",
]

# tushare 已安装时才对外暴露真实适配器
if "TushareAdapter" in globals():
    __all__.append("TushareAdapter")

