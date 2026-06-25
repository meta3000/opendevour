"""投资决策管理接口。

GET    /api/v1/decisions          - 获取所有决策
GET    /api/v1/decisions/pending  - 获取待确认决策
POST   /api/v1/decisions/{id}/confirm - 确认决策
DELETE /api/v1/decisions/{id}     - 拒绝决策
"""

from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter

from ...core.response import fail, ok
from ...core.logging import get_logger
from ...services.decision_service import decision_service

logger = get_logger(__name__)

router = APIRouter(prefix="/decisions", tags=["decisions"])


@router.get("/pending")
async def list_pending_decisions():
    """获取待确认决策列表。"""
    decisions = await decision_service.list_pending()
    return ok([asdict(d) for d in decisions])


@router.get("/")
async def list_all_decisions():
    """获取所有决策记录。"""
    decisions = await decision_service.get_all()
    return ok([asdict(d) for d in decisions])


@router.post("/{decision_id}/confirm")
async def confirm_decision(decision_id: str):
    """确认决策。"""
    try:
        decision = await decision_service.confirm(decision_id)
        return ok(asdict(decision), message="决策已确认")
    except KeyError:
        return fail(code=4004, message=f"决策 {decision_id} 不存在")


@router.delete("/{decision_id}")
async def reject_decision(decision_id: str):
    """拒绝/删除决策。"""
    try:
        decision = await decision_service.reject(decision_id)
        return ok(asdict(decision), message="决策已拒绝")
    except KeyError:
        return fail(code=4004, message=f"决策 {decision_id} 不存在")
