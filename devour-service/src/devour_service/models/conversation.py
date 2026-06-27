"""会话管理 ORM 模型：Conversation（会话）、Message（消息）。"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Conversation(Base):
    """聊天会话。"""

    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=_uuid)
    title = Column(String(255), nullable=False, default="新对话", comment="会话标题")
    summary = Column(Text, default="", comment="上下文压缩摘要")
    status = Column(String(20), nullable=False, default="active", comment="active/archived/deleted")
    dialogue_count = Column(Integer, default=0, comment="对话轮次")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), comment="创建时间")
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        comment="更新时间",
    )

    messages = relationship(
        "Message", back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )


class Message(Base):
    """聊天消息。"""

    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=_uuid)
    conversation_id = Column(
        String(36),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String(20), nullable=False, comment="user/assistant/system/tool")
    content = Column(Text, nullable=False, comment="消息内容")
    token_count = Column(Integer, default=0, comment="该消息 token 数")
    metadata_json = Column(Text, default="{}", comment="扩展元数据 JSON")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), comment="创建时间")

    conversation = relationship("Conversation", back_populates="messages")
