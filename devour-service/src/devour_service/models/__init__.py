"""models 包：SQLAlchemy ORM 模型定义。

导入此包会自动注册所有模型到 Base.metadata，便于 Alembic 迁移检测。
"""

from .conversation import Conversation, Message
from .portfolio import Portfolio, Position, Transaction

__all__ = ["Conversation", "Message", "Portfolio", "Position", "Transaction"]
