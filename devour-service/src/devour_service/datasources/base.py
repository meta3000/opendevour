"""数据源适配器抽象基类与数据模型定义。

所有数据源适配器（Tushare / AKShare / Wind 等）均需继承 DataSourceAdapter
并实现其抽象方法，以保证对上层提供统一的行情、信号与历史数据接口。
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

import pandas as pd

# ---------------------------------------------------------------------------
# 数据模型
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SectorData:
    """板块热力图数据。"""

    sector_code: str
    sector_name: str
    change_pct: float  # 涨跌幅 (%)
    amount: float  # 成交额（亿）
    leading_stock: str  # 领涨股
    stock_count: int  # 板块内股票数


@dataclass(frozen=True)
class QuoteData:
    """个股行情快照。"""

    symbol: str
    name: str
    price: float
    change_pct: float
    volume: float
    amount: float
    high: float
    low: float
    open: float
    pre_close: float


@dataclass(frozen=True)
class SignalData:
    """市场信号。"""

    symbol: str
    name: str
    signal_type: str  # 'bullish' | 'bearish' | 'neutral'
    strength: float  # 0-100
    description: str
    timestamp: str


@dataclass(frozen=True)
class IndexData:
    """主要指数数据。"""

    code: str
    name: str
    price: float
    change_pct: float
    volume: float
    amount: float


@dataclass
class SignalFilter:
    """市场信号查询过滤器。"""

    signal_type: str | None = None  # 'bullish' | 'bearish' | 'neutral'
    min_strength: float = 0  # 最低信号强度
    sector: str | None = None  # 板块过滤
    limit: int = 50  # 返回数量上限


# ---------------------------------------------------------------------------
# 抽象基类
# ---------------------------------------------------------------------------

class DataSourceAdapter(ABC):
    """数据源适配器抽象基类。

    子类需实现所有抽象方法，以提供特定数据源的行情数据、
    板块热力图、市场信号以及历史 K 线数据。
    """

    @abstractmethod
    async def get_market_heatmap(self, date: str | None = None) -> list[SectorData]:
        """获取板块热力图数据。

        Args:
            date: 日期字符串（YYYYMMDD），默认为最近交易日。

        Returns:
            板块数据列表。
        """
        ...

    @abstractmethod
    async def get_stock_quotes(self, symbols: list[str]) -> list[QuoteData]:
        """获取个股行情快照。

        Args:
            symbols: 股票代码列表，如 ['000001.SZ', '600519.SH']。

        Returns:
            行情快照列表。
        """
        ...

    @abstractmethod
    async def get_market_signals(self, filters: SignalFilter) -> list[SignalData]:
        """获取市场信号。

        Args:
            filters: 信号过滤器。

        Returns:
            信号数据列表。
        """
        ...

    @abstractmethod
    async def get_stock_history(
        self, symbol: str, start_date: str, end_date: str
    ) -> pd.DataFrame:
        """获取个股历史 K 线。

        Args:
            symbol: 股票代码，如 '000001.SZ'。
            start_date: 起始日期（YYYYMMDD）。
            end_date: 截止日期（YYYYMMDD）。

        Returns:
            包含 open / high / low / close / volume 等列的 DataFrame。
        """
        ...

    @abstractmethod
    async def get_index_data(self) -> list[IndexData]:
        """获取主要指数数据（上证、深成、创业板等）。

        Returns:
            指数数据列表。
        """
        ...
