"""FastAPI 应用工厂。

create_app() 装配：CORS、统一异常处理、/api 路由、生命周期（启动日志 + 关闭时释放 DB 引擎）。
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import api_router
from .core.config import get_settings
from .core.exceptions import register_exception_handlers
from .core.logging import get_logger
from .db.base import Base
from .db.engine import engine
from .db.session import async_session
from .models import portfolio  # noqa: F401 - 注册 ORM 表到 Base.metadata
from .scheduler.manager import TaskConfig, scheduler_manager
from .scheduler.tasks.portfolio_analysis import daily_portfolio_analysis

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info(
        "启动 %s [env=%s] 默认模型=%s/%s 数据库=%s",
        settings.app_name,
        settings.app_env,
        settings.llm_default_provider,
        settings.llm_default_model,
        settings.db_path,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("数据库表已初始化: %s", settings.db_path)

    # 确保默认投资组合存在
    from .schemas.portfolio import PortfolioCreate
    from .services.portfolio_service import portfolio_service as _portfolio_svc
    async with async_session() as _db:
        _portfolios = await _portfolio_svc.list_portfolios(_db)
        if not _portfolios:
            await _portfolio_svc.create_portfolio(_db, PortfolioCreate(name="默认组合", description=""))
            await _db.commit()
            logger.info("已创建默认投资组合")

    # 注册定时任务
    scheduler_manager.register_task(
        TaskConfig(
            id="daily_portfolio_analysis",
            name="每日持仓分析",
            description="刷新持仓价格、计算风险指标（夏普/回撤/波动率）、生成预警信号",
            trigger_type="cron",
            trigger_args={"hour": 18, "minute": 0},  # 每天 18:00 执行
            enabled=True,
        ),
        daily_portfolio_analysis,
    )
    scheduler_manager.start()
    logger.info("定时任务调度器已启动")

    yield

    # 关闭时释放调度器和数据库连接池
    scheduler_manager.shutdown()
    from .db.engine import dispose_engines

    await dispose_engines()
    logger.info("服务已关闭")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="devour-service",
        description="Devour 投资智能体平台 · 后端服务",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
