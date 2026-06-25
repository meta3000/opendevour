"""决策管理服务 — 管理 AI 生成的投资决策建议。

初期使用内存存储（类变量），单进程环境下安全可靠。
后续可迁移到数据库持久化。"""

from __future__ import annotations

import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Decision:
    """投资决策记录。"""

    id: str
    action: str  # buy/sell/hold/rebalance
    symbol: str
    reason: str
    confidence: float
    status: str = "pending"  # pending/confirmed/rejected
    created_at: str = ""
    confirmed_at: Optional[str] = None


class DecisionService:
    """决策管理服务 — 内存存储单例模式。"""

    _decisions: dict[str, Decision] = {}

    async def create_decision(
        self, action: str, symbol: str, reason: str, confidence: float
    ) -> Decision:
        """创建一条投资决策并推送到待确认队列。"""
        decision = Decision(
            id=str(uuid.uuid4()),
            action=action,
            symbol=symbol,
            reason=reason,
            confidence=confidence,
            created_at=datetime.utcnow().isoformat(),
        )
        self._decisions[decision.id] = decision
        return decision

    async def list_pending(self) -> list[Decision]:
        """获取所有待确认的决策。"""
        return [d for d in self._decisions.values() if d.status == "pending"]

    async def get_all(self) -> list[Decision]:
        """获取所有决策记录。"""
        return list(self._decisions.values())

    async def confirm(self, decision_id: str) -> Decision:
        """确认一条决策。"""
        if decision_id not in self._decisions:
            raise KeyError(f"决策 {decision_id} 不存在")
        d = self._decisions[decision_id]
        d.status = "confirmed"
        d.confirmed_at = datetime.utcnow().isoformat()
        return d

    async def reject(self, decision_id: str) -> Decision:
        """拒绝一条决策。"""
        if decision_id not in self._decisions:
            raise KeyError(f"决策 {decision_id} 不存在")
        d = self._decisions[decision_id]
        d.status = "rejected"
        return d


# 模块级单例
decision_service = DecisionService()
