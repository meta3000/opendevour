"""会话管理服务：会话 CRUD + 消息持久化。"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.logging import get_logger
from ..models.conversation import Conversation, Message

logger = get_logger(__name__)


class ConversationService:
    """会话 CRUD + 消息持久化。所有方法均为 async，接收外部 AsyncSession。"""

    # ---- 会话 CRUD ----

    async def create_conversation(self, db: AsyncSession, title: str = "新对话") -> Conversation:
        conv = Conversation(title=title)
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        logger.info("创建会话 id=%s title=%s", conv.id, conv.title)
        return conv

    async def list_conversations(
        self, db: AsyncSession, skip: int = 0, limit: int = 20
    ) -> list[Conversation]:
        stmt = (
            select(Conversation)
            .where(Conversation.status != "deleted")
            .order_by(Conversation.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_conversation(self, db: AsyncSession, conv_id: str) -> Conversation | None:
        stmt = select(Conversation).where(
            Conversation.id == conv_id, Conversation.status != "deleted"
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_conversation(
        self, db: AsyncSession, conv_id: str, **kwargs: str
    ) -> Conversation | None:
        conv = await self.get_conversation(db, conv_id)
        if conv is None:
            return None
        for key, value in kwargs.items():
            if hasattr(conv, key):
                setattr(conv, key, value)
        conv.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(conv)
        return conv

    async def delete_conversation(self, db: AsyncSession, conv_id: str) -> bool:
        conv = await self.get_conversation(db, conv_id)
        if conv is None:
            return False
        conv.status = "deleted"
        conv.updated_at = datetime.now(timezone.utc)
        await db.commit()
        logger.info("删除会话 id=%s", conv_id)
        return True

    # ---- 消息管理 ----

    async def add_message(
        self,
        db: AsyncSession,
        conv_id: str,
        role: str,
        content: str,
        token_count: int = 0,
        metadata_json: str = "{}",
    ) -> Message:
        msg = Message(
            conversation_id=conv_id,
            role=role,
            content=content,
            token_count=token_count,
            metadata_json=metadata_json,
        )
        db.add(msg)
        # 更新会话的 updated_at 和 dialogue_count（仅 user 消息增加轮次）
        if role in ("user", "assistant"):
            stmt = (
                update(Conversation)
                .where(Conversation.id == conv_id)
                .values(
                    updated_at=datetime.now(timezone.utc),
                    dialogue_count=Conversation.dialogue_count + (1 if role == "user" else 0),
                )
            )
            await db.execute(stmt)
        await db.commit()
        await db.refresh(msg)
        return msg

    async def get_messages(
        self, db: AsyncSession, conv_id: str, limit: int = 100
    ) -> list[Message]:
        stmt = (
            select(Message)
            .where(Message.conversation_id == conv_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def update_summary(self, db: AsyncSession, conv_id: str, summary: str) -> None:
        stmt = (
            update(Conversation)
            .where(Conversation.id == conv_id)
            .values(summary=summary, updated_at=datetime.now(timezone.utc))
        )
        await db.execute(stmt)
        await db.commit()


# 全局单例，供各模块导入使用
conversation_service = ConversationService()
