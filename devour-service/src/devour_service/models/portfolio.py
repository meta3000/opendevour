"""持仓管理 ORM 模型：Portfolio（组合）、Position（持仓）、Transaction（交易记录）。

数据库：devour_core
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from ..db.base import Base


class Portfolio(Base):
    """投资组合。"""

    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="组合名称")
    description = Column(String(500), default="", comment="组合描述")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), comment="创建时间")
    updated_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), comment="更新时间"
    )

    positions = relationship(
        "Position", back_populates="portfolio", cascade="all, delete-orphan"
    )


class Position(Base):
    """持仓明细。"""

    __tablename__ = "positions"
    
    __table_args__ = (
        UniqueConstraint('portfolio_id', 'symbol', name='uq_portfolio_symbol'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(
        Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False
    )
    symbol = Column(String(20), nullable=False, comment="股票代码")
    name = Column(String(50), default="", comment="股票名称")
    quantity = Column(Integer, default=0, comment="持股数量")
    avg_cost = Column(Float, default=0.0, comment="成本价")
    current_price = Column(Float, default=0.0, comment="现价")
    sector = Column(String(50), default="", comment="所属行业")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), comment="建仓日期")
    updated_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), comment="更新时间"
    )

    portfolio = relationship("Portfolio", back_populates="positions")
    transactions = relationship(
        "Transaction", back_populates="position", cascade="all, delete-orphan"
    )


class Transaction(Base):
    """交易记录。"""

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    position_id = Column(
        Integer, ForeignKey("positions.id", ondelete="CASCADE"), nullable=False
    )
    type = Column(String(10), nullable=False, comment="交易类型: buy/sell")
    quantity = Column(Integer, nullable=False, comment="交易数量")
    price = Column(Float, nullable=False, comment="交易价格")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), comment="交易时间")
    notes = Column(String(200), default="", comment="备注")

    position = relationship("Position", back_populates="transactions")
