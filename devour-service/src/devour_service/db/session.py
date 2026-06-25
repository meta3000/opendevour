"""单源 SQLite 会话工厂与 FastAPI 依赖。

原多源 MySQL 的 ``session_dependency(name)`` 已被简化为单一 ``get_db``。
为兼容旧代码，仍保留 ``get_sessionmaker`` 函数（忽略 name 参数）。
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from .engine import async_session


def get_sessionmaker(name: str | None = None) -> async_sessionmaker[AsyncSession]:
    """返回 SQLite 会话工厂（name 参数仅保留兼容，不再使用）。"""
    return async_session


async def get_db() -> AsyncIterator[AsyncSession]:
    """FastAPI 依赖：获取 SQLite 会话。"""
    async with async_session() as session:
        yield session
