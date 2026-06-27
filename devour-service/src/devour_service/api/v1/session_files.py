"""会话文件管理接口。

GET    /api/v1/conversations/{id}/files              — 列出文件
GET    /api/v1/conversations/{id}/files/{filename}    — 读取文件
POST   /api/v1/conversations/{id}/files              — 保存文件
DELETE /api/v1/conversations/{id}/files/{filename}    — 删除文件
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ...core.response import ApiResponse, ok
from ...services.session_file_service import session_file_service

router = APIRouter(tags=["session-files"])


class SaveFileRequest(BaseModel):
    filename: str
    content: str
    file_type: str = "text"


@router.get("/conversations/{conv_id}/files", response_model=ApiResponse)
async def list_files(conv_id: str) -> ApiResponse:
    files = session_file_service.list_files(conv_id)
    return ok(files)


@router.get("/conversations/{conv_id}/files/{filename}", response_model=ApiResponse)
async def read_file(conv_id: str, filename: str) -> ApiResponse:
    content = session_file_service.read_file(conv_id, filename)
    if content is None:
        raise HTTPException(status_code=404, detail="文件不存在")
    return ok({"filename": filename, "content": content})


@router.post("/conversations/{conv_id}/files", response_model=ApiResponse)
async def save_file(conv_id: str, req: SaveFileRequest) -> ApiResponse:
    result = session_file_service.save_file(conv_id, req.filename, req.content, req.file_type)
    return ok(result, message="文件已保存")


@router.delete("/conversations/{conv_id}/files/{filename}", response_model=ApiResponse)
async def delete_file(conv_id: str, filename: str) -> ApiResponse:
    deleted = session_file_service.delete_file(conv_id, filename)
    if not deleted:
        raise HTTPException(status_code=404, detail="文件不存在")
    return ok({"deleted": True})
