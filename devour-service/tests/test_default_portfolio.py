"""默认组合自动创建测试。"""

import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from devour_service.db.base import Base
# 确保模型被注册到 Base.metadata
from devour_service.models.portfolio import Portfolio  # noqa: F401
from devour_service.services.portfolio_service import PortfolioService
from devour_service.schemas.portfolio import PortfolioCreate


@pytest.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await engine.dispose()


@pytest.fixture
def service():
    return PortfolioService()


@pytest.mark.asyncio
async def test_create_default_portfolio(db_session, service):
    """数据库为空时应自动创建默认组合。"""
    portfolios = await service.list_portfolios(db_session)
    assert len(portfolios) == 0

    # 模拟 main.py lifespan 中的逻辑
    if not portfolios:
        await service.create_portfolio(db_session, PortfolioCreate(name="默认组合", description=""))

    portfolios = await service.list_portfolios(db_session)
    assert len(portfolios) == 1
    assert portfolios[0].name == "默认组合"


@pytest.mark.asyncio
async def test_no_duplicate_default_portfolio(db_session, service):
    """多次执行不应创建重复组合。"""
    # 第一次创建
    portfolios = await service.list_portfolios(db_session)
    if not portfolios:
        await service.create_portfolio(db_session, PortfolioCreate(name="默认组合", description=""))

    # 第二次检查（不应再创建）
    portfolios = await service.list_portfolios(db_session)
    assert len(portfolios) == 1
    if not portfolios:
        await service.create_portfolio(db_session, PortfolioCreate(name="默认组合", description=""))

    portfolios = await service.list_portfolios(db_session)
    assert len(portfolios) == 1
