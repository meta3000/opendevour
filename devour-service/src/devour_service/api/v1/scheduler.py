"""定时任务管理 API。

GET  /api/v1/scheduler/tasks          — 获取所有任务列表
GET  /api/v1/scheduler/tasks/{id}     — 获取单个任务详情
POST /api/v1/scheduler/tasks/{id}/run — 立即执行一次
POST /api/v1/scheduler/tasks/{id}/enable  — 启用任务
POST /api/v1/scheduler/tasks/{id}/disable — 禁用任务
PUT  /api/v1/scheduler/tasks/{id}/schedule — 更新调度配置
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ...core.response import ApiResponse, ok
from ...scheduler.manager import scheduler_manager

router = APIRouter(prefix="/scheduler", tags=["scheduler"])


# ------------------------------------------------------------------
# Request Schemas
# ------------------------------------------------------------------


class UpdateScheduleRequest(BaseModel):
    """更新调度配置请求体。"""

    trigger_type: str  # 'cron' | 'interval'
    trigger_args: dict[str, Any]  # cron: {hour, minute} | interval: {minutes, hours}


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------


@router.get("/tasks", response_model=ApiResponse)
async def list_tasks() -> ApiResponse:
    """获取所有定时任务列表（含 next_run 时间）。"""
    tasks = scheduler_manager.get_all_tasks()
    return ok(data=[t.to_dict() for t in tasks])


@router.get("/tasks/{task_id}", response_model=ApiResponse)
async def get_task(task_id: str) -> ApiResponse:
    """获取单个任务详情。"""
    task = scheduler_manager.get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")
    return ok(data=task.to_dict())


@router.post("/tasks/{task_id}/run", response_model=ApiResponse)
async def run_task_now(task_id: str) -> ApiResponse:
    """立即执行一次任务（不影响既有调度）。"""
    try:
        await scheduler_manager.run_now(task_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")
    return ok(data={"message": f"任务 {task_id} 已触发执行"})


@router.post("/tasks/{task_id}/enable", response_model=ApiResponse)
async def enable_task(task_id: str) -> ApiResponse:
    """启用定时任务。"""
    try:
        scheduler_manager.enable_task(task_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")
    return ok(data={"message": f"任务 {task_id} 已启用"})


@router.post("/tasks/{task_id}/disable", response_model=ApiResponse)
async def disable_task(task_id: str) -> ApiResponse:
    """禁用定时任务。"""
    try:
        scheduler_manager.disable_task(task_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")
    return ok(data={"message": f"任务 {task_id} 已禁用"})


@router.put("/tasks/{task_id}/schedule", response_model=ApiResponse)
async def update_schedule(task_id: str, body: UpdateScheduleRequest) -> ApiResponse:
    """更新任务调度配置（cron/interval 均支持）。"""
    try:
        scheduler_manager.update_schedule(task_id, body.trigger_type, body.trigger_args)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    task = scheduler_manager.get_task(task_id)
    return ok(data=task.to_dict() if task else None)
