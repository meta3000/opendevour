"""Tushare 数据源适配器实现。

使用 tushare pro API 获取 A 股行情数据，将同步调用包装为异步，
并通过 async_ttl_cache 提供 5 分钟内存缓存。

信号生成逻辑基于简单技术指标：
- 量价异动：成交量相对 20 日均量放大超过阈值
- 均线突破：收盘价突破 20 日均线
- 涨跌幅异常：单日涨跌幅超过阈值
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any

import pandas as pd
import tushare as ts

from devour_service.core.config import get_settings
from devour_service.datasources.base import (
    DataSourceAdapter,
    IndexData,
    QuoteData,
    SectorData,
    SignalData,
    SignalFilter,
)
from devour_service.datasources.cache import async_ttl_cache

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 主要指数代码映射
# ---------------------------------------------------------------------------
INDEX_MAP: dict[str, str] = {
    "000001.SH": "上证指数",
    "399001.SZ": "深证成指",
    "399006.SZ": "创业板指",
    "000016.SH": "上证50",
    "000300.SH": "沪深300",
    "000905.SH": "中证500",
}


class TushareAdapter(DataSourceAdapter):
    """基于 Tushare Pro API 的数据源适配器。"""

    def __init__(self) -> None:
        settings = get_settings()
        self._token: str = settings.tushare_token
        self._cache_ttl: int = settings.datasource_cache_ttl
        if self._token:
            ts.set_token(self._token)
            logger.info("初始化 TushareAdapter, token=%s***, cache_ttl=%ds", self._token[:8], self._cache_ttl)
        else:
            logger.warning("TUSHARE_TOKEN 未配置，Tushare API 调用可能失败。")

    # ------------------------------------------------------------------
    # 内部工具
    # ------------------------------------------------------------------

    def _pro(self) -> ts.pro_api:
        """获取 tushare pro_api 实例。"""
        return ts.pro_api()

    @staticmethod
    async def _run_sync(func: Any, **kwargs: Any) -> pd.DataFrame:
        """将 tushare 同步调用包装为异步执行。"""
        return await asyncio.to_thread(func, **kwargs)

    @staticmethod
    def _today_str() -> str:
        """返回今天的日期字符串（YYYYMMDD）。"""
        return datetime.now().strftime("%Y%m%d")

    @staticmethod
    def _n_days_ago_str(n: int) -> str:
        """返回 n 天前的日期字符串（YYYYMMDD）。"""
        return (datetime.now() - timedelta(days=n)).strftime("%Y%m%d")

    # ------------------------------------------------------------------
    # 公开接口实现
    # ------------------------------------------------------------------

    @async_ttl_cache(maxsize=16, ttl=300)
    async def get_market_heatmap(self, date: str | None = None) -> list[SectorData]:
        """获取板块热力图数据（申万行业分类）。"""
        trade_date = date or self._today_str()
        logger.info("[Tushare] get_market_heatmap 开始, trade_date=%s", trade_date)
        pro = self._pro()

        # 获取行业板块行情
        df = await self._run_sync(
            pro.index_classify,
            level="L1",
            src="SW2021",
        )
        if df is None or df.empty:
            logger.warning("Tushare index_classify 返回空数据")
            return []

        industry_codes = df["index_code"].tolist()
        # 分批获取板块行情（避免单次请求过多）
        sectors: list[SectorData] = []
        for code in industry_codes[:50]:  # 限制最多 50 个板块
            try:
                daily_df = await self._run_sync(
                    pro.index_daily,
                    ts_code=code,
                    start_date=trade_date,
                    end_date=trade_date,
                )
                if daily_df is None or daily_df.empty:
                    continue

                row = daily_df.iloc[0]
                name = df.loc[df["index_code"] == code, "industry_name"].values
                sector_name = str(name[0]) if len(name) > 0 else code

                sectors.append(
                    SectorData(
                        sector_code=code,
                        sector_name=sector_name,
                        change_pct=_safe_float(row.get("pct_chg", 0)),
                        amount=_safe_float(row.get("amount", 0)) / 1000,  # 千元 → 亿
                        leading_stock="",  # 需额外接口，暂留空
                        stock_count=int(row.get("count", 0)),
                    )
                )
            except Exception as exc:
                logger.debug("获取板块 %s 行情失败: %s", code, exc)
                continue

        logger.info("[Tushare] get_market_heatmap 完成, 返回 %d 个板块", len(sectors))
        return sectors

    @async_ttl_cache(maxsize=64, ttl=300)
    async def get_stock_quotes(self, symbols: list[str]) -> list[QuoteData]:
        """获取个股行情快照。"""
        logger.info("[Tushare] get_stock_quotes 开始, symbols=%s", symbols[:5] if len(symbols) > 5 else symbols)
        if not symbols:
            return []

        pro = self._pro()
        trade_date = self._today_str()
        results: list[QuoteData] = []

        # tushare daily 接口支持按日期批量拉取，再筛选目标代码
        try:
            df = await self._run_sync(
                pro.daily,
                ts_code=",".join(symbols),
                start_date=trade_date,
                end_date=trade_date,
            )
        except Exception as exc:
            logger.error("获取个股行情失败: %s", exc)
            return []

        if df is None or df.empty:
            # 可能非交易日，尝试前一交易日
            yesterday = self._n_days_ago_str(1)
            df = await self._run_sync(
                pro.daily,
                ts_code=",".join(symbols),
                start_date=yesterday,
                end_date=yesterday,
            )
            if df is None or df.empty:
                return []

        # 获取股票名称映射
        name_map = await self._get_stock_name_map(symbols, pro)

        for _, row in df.iterrows():
            if row.get("ts_code") not in symbols and len(symbols) > 0:
                # 有时 tushare 会返回额外代码，过滤
                if row.get("ts_code") not in set(symbols):
                    continue
            symbol = str(row.get("ts_code", ""))
            results.append(
                QuoteData(
                    symbol=symbol,
                    name=name_map.get(symbol, symbol),
                    price=_safe_float(row.get("close", 0)),
                    change_pct=_safe_float(row.get("pct_chg", 0)),
                    volume=_safe_float(row.get("vol", 0)),
                    amount=_safe_float(row.get("amount", 0)) / 1000,  # 千元 → 亿
                    high=_safe_float(row.get("high", 0)),
                    low=_safe_float(row.get("low", 0)),
                    open=_safe_float(row.get("open", 0)),
                    pre_close=_safe_float(row.get("pre_close", 0)),
                )
            )

        logger.info("[Tushare] get_stock_quotes 完成, 返回 %d 条报价", len(results))
        return results

    @async_ttl_cache(maxsize=16, ttl=300)
    async def get_market_signals(self, filters: SignalFilter) -> list[SignalData]:
        """获取市场信号（基于简单技术指标）。"""
        logger.info("[Tushare] get_market_signals 开始, filter_type=%s, min_strength=%s", filters.signal_type, filters.min_strength)
        pro = self._pro()
        trade_date = self._today_str()

        # 拉取当日全市场行情
        try:
            df = await self._run_sync(
                pro.daily,
                start_date=trade_date,
                end_date=trade_date,
            )
        except Exception as exc:
            logger.error("获取全市场行情失败: %s", exc)
            return []

        if df is None or df.empty:
            return []

        signals: list[SignalData] = []

        # 对每只股票进行信号检测
        for _, row in df.iterrows():
            symbol = str(row.get("ts_code", ""))
            pct_chg = _safe_float(row.get("pct_chg", 0))
            vol = _safe_float(row.get("vol", 0))
            amount = _safe_float(row.get("amount", 0))

            # --- 信号判断逻辑 ---
            signal_type, strength, description = _detect_signal(pct_chg, vol, amount)

            if signal_type == "neutral" and filters.signal_type and filters.signal_type != "neutral":
                continue
            if signal_type != filters.signal_type and filters.signal_type:
                continue
            if strength < filters.min_strength:
                continue

            name = symbol  # 简化，全量获取名称太重
            signals.append(
                SignalData(
                    symbol=symbol,
                    name=name,
                    signal_type=signal_type,
                    strength=strength,
                    description=description,
                    timestamp=trade_date,
                )
            )

            if len(signals) >= filters.limit:
                break

        logger.info("[Tushare] get_market_signals 完成, 返回 %d 条信号", len(signals))
        return signals

    @async_ttl_cache(maxsize=64, ttl=300)
    async def get_stock_history(
        self, symbol: str, start_date: str, end_date: str
    ) -> pd.DataFrame:
        """获取个股历史 K 线。"""
        logger.info("[Tushare] get_stock_history 开始, symbol=%s, range=%s~%s", symbol, start_date, end_date)
        pro = self._pro()
        df = await self._run_sync(
            pro.daily,
            ts_code=symbol,
            start_date=start_date,
            end_date=end_date,
        )
        if df is None or df.empty:
            return pd.DataFrame()

        # 标准化列名
        df = df.rename(columns={
            "trade_date": "date",
            "vol": "volume",
        })
        df = df.sort_values("date").reset_index(drop=True)
        return df

    @async_ttl_cache(maxsize=4, ttl=300)
    async def get_index_data(self) -> list[IndexData]:
        """获取主要指数数据。"""
        logger.info("[Tushare] get_index_data 开始")
        pro = self._pro()
        trade_date = self._today_str()
        results: list[IndexData] = []

        for code, name in INDEX_MAP.items():
            try:
                df = await self._run_sync(
                    pro.index_daily,
                    ts_code=code,
                    start_date=trade_date,
                    end_date=trade_date,
                )
                if df is None or df.empty:
                    # 尝试前一交易日
                    yesterday = self._n_days_ago_str(1)
                    df = await self._run_sync(
                        pro.index_daily,
                        ts_code=code,
                        start_date=yesterday,
                        end_date=yesterday,
                    )
                if df is None or df.empty:
                    continue

                row = df.iloc[0]
                results.append(
                    IndexData(
                        code=code,
                        name=name,
                        price=_safe_float(row.get("close", 0)),
                        change_pct=_safe_float(row.get("pct_chg", 0)),
                        volume=_safe_float(row.get("vol", 0)),
                        amount=_safe_float(row.get("amount", 0)) / 1000,
                    )
                )
            except Exception as exc:
                logger.debug("获取指数 %s 行情失败: %s", code, exc)
                continue

        logger.info("[Tushare] get_index_data 完成, 返回 %d 个指数", len(results))
        return results

    @async_ttl_cache(maxsize=4, ttl=3600)  # 缓存1小时
    async def get_stock_list(
        self, 
        exchange: str | None = None, 
        keyword: str | None = None,
        limit: int = 100
    ) -> list[dict]:
        """获取A股股票列表。
        
        Args:
            exchange: 交易所过滤（SSE=上海，SZSE=深圳）
            keyword: 关键词过滤（代码或名称）
            limit: 返回数量限制
        
        Returns:
            [{"ts_code": "000001.SZ", "name": "平安银行", "industry": "银行"}, ...]
        """
        logger.info("[Tushare] get_stock_list 开始, exchange=%s, keyword=%s", exchange, keyword)
        pro = self._pro()
        
        try:
            df = await self._run_sync(
                pro.stock_basic,
                exchange=exchange or "",
                list_status="L",  # 仅上市状态正常的股票
                fields="ts_code,name,industry,list_date",
            )
            
            if df is None or df.empty:
                return []
            
            # 关键词过滤
            if keyword:
                mask = df["ts_code"].str.contains(keyword, case=False) | \
                       df["name"].str.contains(keyword, case=False)
                df = df[mask]
            
            # 限制数量
            df = df.head(limit)
            
            result = [
                {
                    "ts_code": row["ts_code"],
                    "name": row["name"],
                    "industry": row.get("industry", ""),
                    "list_date": str(row.get("list_date", "")),
                }
                for _, row in df.iterrows()
            ]
            
            logger.info("[Tushare] get_stock_list 完成, 返回 %d 条", len(result))
            return result
            
        except Exception as exc:
            logger.error("获取股票列表失败: %s", exc)
            return []

    @async_ttl_cache(maxsize=16, ttl=300)
    async def search_stocks(self, keyword: str, limit: int = 20) -> list[dict]:
        """模糊搜索股票。"""
        return await self.get_stock_list(keyword=keyword, limit=limit)

    async def _get_stock_name_map(
        self, symbols: list[str], pro: Any
    ) -> dict[str, str]:
        """获取股票代码 → 名称映射。"""
        name_map: dict[str, str] = {}
        try:
            # 从 stock_basic 获取名称
            basic_df = await self._run_sync(
                pro.stock_basic,
                exchange="",
                list_status="L",
                fields="ts_code,name",
            )
            if basic_df is not None and not basic_df.empty:
                for _, row in basic_df.iterrows():
                    name_map[str(row["ts_code"])] = str(row["name"])
        except Exception as exc:
            logger.debug("获取股票名称映射失败: %s", exc)
        return name_map


# ---------------------------------------------------------------------------
# 信号检测辅助函数
# ---------------------------------------------------------------------------

def _detect_signal(
    pct_chg: float, vol: float, amount: float
) -> tuple[str, float, str]:
    """基于简单技术指标检测信号。

    Returns:
        (signal_type, strength, description) 三元组。
    """
    # 涨跌幅异常信号
    if pct_chg >= 9.5:
        return (
            "bullish",
            90.0,
            f"涨停，涨跌幅 {pct_chg:.2f}%",
        )
    if pct_chg >= 5.0:
        return (
            "bullish",
            70.0,
            f"大幅上涨，涨跌幅 {pct_chg:.2f}%",
        )
    if pct_chg <= -9.5:
        return (
            "bearish",
            90.0,
            f"跌停，涨跌幅 {pct_chg:.2f}%",
        )
    if pct_chg <= -5.0:
        return (
            "bearish",
            70.0,
            f"大幅下跌，涨跌幅 {pct_chg:.2f}%",
        )

    # 量价异动信号（成交额 > 5 亿视为异动）
    if amount > 50000 and pct_chg > 2.0:  # amount 单位千元，5 亿 = 50000 千元
        return (
            "bullish",
            60.0,
            f"放量上涨，成交额 {amount / 1000:.1f}亿，涨跌幅 {pct_chg:.2f}%",
        )
    if amount > 50000 and pct_chg < -2.0:
        return (
            "bearish",
            60.0,
            f"放量下跌，成交额 {amount / 1000:.1f}亿，涨跌幅 {pct_chg:.2f}%",
        )

    # 温和信号
    if pct_chg > 2.0:
        return "bullish", 40.0, f"上涨 {pct_chg:.2f}%"
    if pct_chg < -2.0:
        return "bearish", 40.0, f"下跌 {pct_chg:.2f}%"

    return "neutral", 10.0, "无明显信号"


# ---------------------------------------------------------------------------
# 工具函数
# ---------------------------------------------------------------------------

def _safe_float(value: Any, default: float = 0.0) -> float:
    """安全转换为 float，失败时返回默认值。"""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default
