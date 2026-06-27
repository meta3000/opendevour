"""ConversationService CRUD 集成测试（SQLite 内存数据库）。"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from devour_service.db.base import Base
# 导入 ORM 模型以注册到 Base.metadata
from devour_service.models.conversation import Conversation, Message  # noqa: F401
from devour_service.services.conversation_service import ConversationService


@pytest.fixture
async def db_session():
    """创建内存 SQLite 数据库会话。"""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await engine.dispose()


@pytest.fixture
def service():
    return ConversationService()


class TestConversationService:
    """ConversationService CRUD 操作测试。"""

    async def test_create_conversation(self, db_session: AsyncSession, service: ConversationService):
        conv = await service.create_conversation(db_session, title="测试会话")
        assert conv.id is not None
        assert conv.title == "测试会话"
        assert conv.status == "active"

    async def test_create_conversation_default_title(self, db_session: AsyncSession, service: ConversationService):
        conv = await service.create_conversation(db_session)
        assert conv.title == "新对话"

    async def test_list_conversations_ordered_by_updated_at(
        self, db_session: AsyncSession, service: ConversationService
    ):
        import asyncio
        await service.create_conversation(db_session, title="会话1")
        await asyncio.sleep(0.01)
        await service.create_conversation(db_session, title="会话2")
        convs = await service.list_conversations(db_session)
        assert len(convs) == 2
        # 按 updated_at 降序，最新的在前
        assert convs[0].title == "会话2"
        assert convs[1].title == "会话1"

    async def test_get_nonexistent_conversation_returns_none(
        self, db_session: AsyncSession, service: ConversationService
    ):
        result = await service.get_conversation(db_session, "nonexistent-id-12345")
        assert result is None

    async def test_update_conversation_title(self, db_session: AsyncSession, service: ConversationService):
        conv = await service.create_conversation(db_session, title="原标题")
        updated = await service.update_conversation(db_session, conv.id, title="新标题")
        assert updated is not None
        assert updated.title == "新标题"

    async def test_soft_delete_conversation(self, db_session: AsyncSession, service: ConversationService):
        conv = await service.create_conversation(db_session, title="待删除")
        deleted = await service.delete_conversation(db_session, conv.id)
        assert deleted is True
        # 列表查询不再返回
        convs = await service.list_conversations(db_session)
        assert all(c.id != conv.id for c in convs)
        # get 也返回 None
        assert await service.get_conversation(db_session, conv.id) is None

    async def test_delete_nonexistent_returns_false(self, db_session: AsyncSession, service: ConversationService):
        result = await service.delete_conversation(db_session, "nonexistent-id")
        assert result is False

    async def test_add_message(self, db_session: AsyncSession, service: ConversationService):
        conv = await service.create_conversation(db_session, title="消息测试")
        msg = await service.add_message(db_session, conv.id, role="user", content="你好")
        assert msg.conversation_id == conv.id
        assert msg.role == "user"
        assert msg.content == "你好"

    async def test_get_messages_ordered_by_created_at(
        self, db_session: AsyncSession, service: ConversationService
    ):
        conv = await service.create_conversation(db_session, title="消息列表测试")
        await service.add_message(db_session, conv.id, role="user", content="第一条")
        await service.add_message(db_session, conv.id, role="assistant", content="回复一")
        await service.add_message(db_session, conv.id, role="user", content="第二条")
        messages = await service.get_messages(db_session, conv.id)
        assert len(messages) == 3
        assert messages[0].content == "第一条"
        assert messages[1].content == "回复一"
        assert messages[2].content == "第二条"

    async def test_update_summary(self, db_session: AsyncSession, service: ConversationService):
        conv = await service.create_conversation(db_session, title="摘要测试")
        await service.update_summary(db_session, conv.id, summary="这是对话摘要")
        updated = await service.get_conversation(db_session, conv.id)
        assert updated is not None
        assert updated.summary == "这是对话摘要"

    async def test_add_message_increments_dialogue_count(
        self, db_session: AsyncSession, service: ConversationService
    ):
        conv = await service.create_conversation(db_session, title="轮次测试")
        assert conv.dialogue_count == 0
        await service.add_message(db_session, conv.id, role="user", content="问题")
        await service.add_message(db_session, conv.id, role="assistant", content="回答")
        updated = await service.get_conversation(db_session, conv.id)
        # 只有 user 消息增加 dialogue_count
        assert updated.dialogue_count == 1
