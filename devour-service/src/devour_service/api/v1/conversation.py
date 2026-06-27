"""会话管理接口。

POST   /api/v1/conversations          — 创建会话
GET    /api/v1/conversations          — 列出会话
GET    /api/v1/conversations/{id}     — 获取会话详情
PATCH  /api/v1/conversations/{id}     — 更新会话
DELETE /api/v1/conversations/{id}     — 删除会话
GET    /api/v1/conversations/{id}/messages — 获取历史消息
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_serializer
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.response import ApiResponse, ok
from ...db.session import get_db
from ...services.conversation_service import conversation_service

router = APIRouter(prefix="/conversations", tags=["conversations"])

_db_dep = Depends(get_db)


# ---- 请求/响应 Schema ----

class CreateConversationRequest(BaseModel):
    title: str = "新对话"

class UpdateConversationRequest(BaseModel):
    title: str | None = None
    status: str | None = None

class MessageOut(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    token_count: int
    created_at: datetime

    @field_serializer("created_at")
    def serialize_created_at(self, v: datetime) -> str:
        return v.isoformat() if v else ""

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: str
    title: str
    summary: str
    status: str
    dialogue_count: int
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, v: datetime) -> str:
        return v.isoformat() if v else ""

    class Config:
        from_attributes = True


# ---- 会话 CRUD ----

@router.post("", response_model=ApiResponse)
async def create_conversation(req: CreateConversationRequest, db: AsyncSession = _db_dep) -> ApiResponse:
    conv = await conversation_service.create_conversation(db, title=req.title)
    return ok(ConversationOut.model_validate(conv).model_dump())

@router.get("", response_model=ApiResponse)
async def list_conversations(skip: int = 0, limit: int = 20, db: AsyncSession = _db_dep) -> ApiResponse:
    convs = await conversation_service.list_conversations(db, skip=skip, limit=limit)
    return ok([ConversationOut.model_validate(c).model_dump() for c in convs])

@router.get("/{conv_id}", response_model=ApiResponse)
async def get_conversation(conv_id: str, db: AsyncSession = _db_dep) -> ApiResponse:
    conv = await conversation_service.get_conversation(db, conv_id)
    if conv is None:
        raise HTTPException(status_code=404, detail="会话不存在")
    return ok(ConversationOut.model_validate(conv).model_dump())

@router.patch("/{conv_id}", response_model=ApiResponse)
async def update_conversation(conv_id: str, req: UpdateConversationRequest, db: AsyncSession = _db_dep) -> ApiResponse:
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    conv = await conversation_service.update_conversation(db, conv_id, **updates)
    if conv is None:
        raise HTTPException(status_code=404, detail="会话不存在")
    return ok(ConversationOut.model_validate(conv).model_dump())

@router.delete("/{conv_id}", response_model=ApiResponse)
async def delete_conversation(conv_id: str, db: AsyncSession = _db_dep) -> ApiResponse:
    ok_result = await conversation_service.delete_conversation(db, conv_id)
    if not ok_result:
        raise HTTPException(status_code=404, detail="会话不存在")
    return ok({"deleted": True})


# ---- 消息历史 ----

@router.get("/{conv_id}/messages", response_model=ApiResponse)
async def get_messages(conv_id: str, limit: int = 100, db: AsyncSession = _db_dep) -> ApiResponse:
    conv = await conversation_service.get_conversation(db, conv_id)
    if conv is None:
        raise HTTPException(status_code=404, detail="会话不存在")
    msgs = await conversation_service.get_messages(db, conv_id, limit=limit)
    return ok([
        MessageOut(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            token_count=m.token_count,
            created_at=m.created_at.isoformat() if m.created_at else "",
        ).model_dump()
        for m in msgs
    ])
