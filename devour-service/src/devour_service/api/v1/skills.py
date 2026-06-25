"""Skills 管理接口。"""

from __future__ import annotations

from fastapi import APIRouter, Query

from ...core.response import ApiResponse, ok
from ...schemas.skills import CopyRequest, SaveFileRequest, Scope
from ...services import skills_service

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("/tree", response_model=ApiResponse)
async def get_tree(scope: Scope = Query("private")) -> ApiResponse:
    """获取某个 scope 的文件树。"""
    return ok({"scope": scope, "tree": [n.model_dump() for n in skills_service.list_tree(scope)]})


@router.get("/catalog", response_model=ApiResponse)
async def get_catalog() -> ApiResponse:
    """列出所有「标准 skill」（含 SKILL.md 的顶层文件夹），供对话框 / 唤起选择。"""
    return ok({"skills": skills_service.list_catalog()})


@router.get("/file", response_model=ApiResponse)
async def get_file(scope: Scope = Query(...), path: str = Query(...)) -> ApiResponse:
    """读取单个文件内容（含过大/二进制判定）。"""
    return ok(skills_service.read_file(scope, path).model_dump())


@router.put("/file", response_model=ApiResponse)
async def put_file(req: SaveFileRequest) -> ApiResponse:
    """保存文件（仅 private 可写）。"""
    new_path = skills_service.save_file(req.scope, req.path, req.content)
    return ok({"path": new_path}, message="已保存")


@router.post("/copy", response_model=ApiResponse)
async def post_copy(req: CopyRequest) -> ApiResponse:
    """把公共 skill 文件/文件夹复制到「我的 Skills」。"""
    new_path = skills_service.copy_to_private(req.scope, req.path)
    return ok({"path": new_path}, message="已复制到我的 Skills")
