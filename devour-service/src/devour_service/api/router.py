"""聚合 /api 路由。"""

from __future__ import annotations

from fastapi import APIRouter

from .v1 import chat, decisions, health, market, portfolio, scheduler, skills, stocks

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(chat.router)
api_router.include_router(skills.router)
# 市场发现模块按约定暴露到 /api/v1/market/*
api_router.include_router(market.router, prefix="/v1/market")
api_router.include_router(portfolio.router)
# 决策管理模块
api_router.include_router(decisions.router, prefix="/v1")
# 定时任务管理模块
api_router.include_router(scheduler.router, prefix="/v1")
# 股票基础信息模块
api_router.include_router(stocks.router, prefix="/v1")
