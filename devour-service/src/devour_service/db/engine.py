"""单源 SQLite 异步数据库引擎。

使用本地 SQLite 文件（aiosqlite 驱动）替代原来的多源 MySQL 集群。
启动时由 lifespan 自动建表，无需手动执行 SQL。
"""

from __future__ import annotations

from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from ..core.config import get_settings
from ..core.logging import get_logger

logger = get_logger(__name__)

settings = get_settings()

# 将相对路径解析为绝对路径，确保无论工作目录如何，SQLite 文件始终指向正确位置
_db_abs_path = str(Path(settings.db_path).resolve())

# 确保 SQLite 文件所在目录存在，避免引擎初始化失败
Path(_db_abs_path).parent.mkdir(parents=True, exist_ok=True)

logger.info("数据库文件绝对路径: %s", _db_abs_path)

engine: AsyncEngine = create_async_engine(
    f"sqlite+aiosqlite:///{_db_abs_path}",
    echo=False,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def check_source() -> dict[str, str]:
    """检查 SQLite 连通性，返回状态字典（不抛异常）。"""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"name": "sqlite", "status": "ok"}
    except Exception as exc:  # noqa: BLE001 - 健康检查需吞掉所有异常
        return {"name": "sqlite", "status": "unavailable", "detail": str(exc).splitlines()[0][:200]}


async def check_all_sources() -> list[dict[str, str]]:
    """检查所有已配置数据源的连通性。"""
    return [await check_source()]


async def dispose_engines() -> None:
    """释放数据库引擎连接池（应用关闭时调用）。"""
    await engine.dispose()
    logger.info("已释放 SQLite 数据库引擎")
