"""会话管理 API 集成测试（httpx AsyncClient + 内存 SQLite）。"""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from devour_service.db.base import Base
from devour_service.db.session import get_db
from devour_service.models.conversation import Conversation, Message  # noqa: F401
# 导入 portfolio 模型避免 Base.metadata 不完整
from devour_service.models import portfolio  # noqa: F401
from devour_service.main import create_app


@pytest.fixture
async def test_app():
    """创建测试用 FastAPI 应用，覆盖数据库依赖为内存 SQLite。"""
    app = create_app()
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    yield app
    await engine.dispose()


@pytest.fixture
async def client(test_app):
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestConversationAPI:
    """会话管理 HTTP 接口测试。"""

    async def test_create_conversation(self, client: AsyncClient):
        resp = await client.post("/api/v1/conversations", json={"title": "API测试会话"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        body = data["data"]
        assert body["title"] == "API测试会话"
        assert "id" in body

    async def test_list_conversations(self, client: AsyncClient):
        await client.post("/api/v1/conversations", json={"title": "会话A"})
        await client.post("/api/v1/conversations", json={"title": "会话B"})
        resp = await client.get("/api/v1/conversations")
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert isinstance(data["data"], list)
        assert len(data["data"]) >= 2

    async def test_get_conversation(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/conversations", json={"title": "获取测试"})
        conv_id = create_resp.json()["data"]["id"]
        resp = await client.get(f"/api/v1/conversations/{conv_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["data"]["id"] == conv_id
        assert data["data"]["title"] == "获取测试"

    async def test_update_conversation(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/conversations", json={"title": "原标题"})
        conv_id = create_resp.json()["data"]["id"]
        resp = await client.patch(f"/api/v1/conversations/{conv_id}", json={"title": "更新后标题"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["data"]["title"] == "更新后标题"

    async def test_delete_conversation(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/conversations", json={"title": "待删除"})
        conv_id = create_resp.json()["data"]["id"]
        resp = await client.delete(f"/api/v1/conversations/{conv_id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["deleted"] is True
        # 确认再获取时返回 404
        get_resp = await client.get(f"/api/v1/conversations/{conv_id}")
        assert get_resp.status_code == 404

    async def test_get_nonexistent_conversation_returns_404(self, client: AsyncClient):
        resp = await client.get("/api/v1/conversations/nonexistent-id-xyz")
        assert resp.status_code == 404

    async def test_get_messages(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/conversations", json={"title": "消息测试"})
        conv_id = create_resp.json()["data"]["id"]
        # 通过 service 直接添加消息（API 没有添加消息的端点）
        # 这里直接测试空消息列表
        resp = await client.get(f"/api/v1/conversations/{conv_id}/messages")
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert isinstance(data["data"], list)
        assert len(data["data"]) == 0
