"""股票基础信息接口。

端点前缀：/api/v1/stocks
"""

from fastapi import APIRouter, Query

from ...core.response import ApiResponse, ok
from ...datasources import get_datasource

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("", response_model=ApiResponse)
async def list_stocks(
    exchange: str | None = Query(None, description="交易所：SSE/SZSE"),
    keyword: str | None = Query(None, description="搜索关键词（代码或名称）"),
    limit: int = Query(100, ge=1, le=1000),
) -> ApiResponse:
    """获取A股股票列表（从Tushare同步）。"""
    ds = get_datasource()
    
    try:
        stocks = await ds.get_stock_list(exchange=exchange, keyword=keyword, limit=limit)
        return ok(stocks)
    except Exception as exc:
        return ok([], message=f"获取股票列表失败: {exc}")


@router.get("/search", response_model=ApiResponse)
async def search_stocks(
    keyword: str = Query(..., min_length=1, max_length=20, description="搜索关键词"),
    limit: int = Query(20, ge=1, le=100),
) -> ApiResponse:
    """模糊搜索股票（代码或名称）。"""
    ds = get_datasource()
    
    try:
        stocks = await ds.search_stocks(keyword, limit=limit)
        return ok(stocks)
    except Exception as exc:
        return ok([], message=f"搜索失败: {exc}")
