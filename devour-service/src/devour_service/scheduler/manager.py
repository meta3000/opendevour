"""定时任务管理器。

使用 APScheduler 3.x AsyncIOScheduler，与 FastAPI asyncio 事件循环兼容。
支持 cron 和 interval 两种触发器，提供任务注册、启停、立即执行等操作。
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)


@dataclass
class TaskConfig:
    """定时任务配置。"""

    id: str
    name: str
    description: str
    trigger_type: str  # 'cron' | 'interval'
    trigger_args: dict[str, Any]  # cron: {hour, minute} | interval: {minutes/hours}
    enabled: bool = True
    last_run: Optional[str] = None
    last_status: Optional[str] = None  # 'success' | 'failed' | 'running'
    next_run: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


class SchedulerManager:
    """定时任务管理器。

    生命周期：
    - start()   — 在 lifespan startup 调用
    - shutdown() — 在 lifespan shutdown 调用
    """

    def __init__(self) -> None:
        self._scheduler = AsyncIOScheduler()
        self._tasks: dict[str, TaskConfig] = {}
        self._handlers: dict[str, Callable] = {}

    # ------------------------------------------------------------------
    # 注册 & 调度
    # ------------------------------------------------------------------

    def register_task(self, config: TaskConfig, handler: Callable) -> None:
        """注册任务配置和处理函数，并在启用时自动加入调度。"""
        self._tasks[config.id] = config
        self._handlers[config.id] = handler
        if config.enabled and self._scheduler.running:
            self._add_job(config)

    def _add_job(self, config: TaskConfig) -> None:
        """向调度器添加/替换 APScheduler job。"""
        if config.trigger_type == "cron":
            trigger = CronTrigger(**config.trigger_args)
        elif config.trigger_type == "interval":
            trigger = IntervalTrigger(**config.trigger_args)
        else:
            raise ValueError(f"未知 trigger_type: {config.trigger_type}")

        self._scheduler.add_job(
            self._run_task,
            trigger=trigger,
            id=config.id,
            args=[config.id],
            replace_existing=True,
        )
        logger.info("任务已加入调度: %s [%s %s]", config.id, config.trigger_type, config.trigger_args)

    # ------------------------------------------------------------------
    # 执行
    # ------------------------------------------------------------------

    async def _run_task(self, task_id: str) -> None:
        """内部执行入口：更新状态、调用 handler、捕获异常。"""
        config = self._tasks.get(task_id)
        if config is None:
            logger.warning("任务 %s 不存在，跳过执行", task_id)
            return

        config.last_run = datetime.utcnow().isoformat()
        config.last_status = "running"
        logger.info("开始执行任务: %s", task_id)

        try:
            handler = self._handlers[task_id]
            await handler()
            config.last_status = "success"
            logger.info("任务执行成功: %s", task_id)
        except Exception as exc:
            config.last_status = "failed"
            logger.error("任务执行失败: %s — %s", task_id, exc, exc_info=True)

    async def run_now(self, task_id: str) -> None:
        """手动立即执行一次任务（不影响既有调度）。"""
        if task_id not in self._tasks:
            raise KeyError(f"任务 {task_id} 不存在")
        await self._run_task(task_id)

    # ------------------------------------------------------------------
    # 生命周期
    # ------------------------------------------------------------------

    def start(self) -> None:
        """启动调度器，并将所有已注册任务加入调度。"""
        self._scheduler.start()
        logger.info("定时任务调度器已启动")
        # 调度器启动后再统一加入 job（避免 scheduler not running 报错）
        for config in self._tasks.values():
            if config.enabled:
                self._add_job(config)

    def shutdown(self) -> None:
        """关闭调度器（wait=False 避免阻塞）。"""
        if self._scheduler.running:
            self._scheduler.shutdown(wait=False)
            logger.info("定时任务调度器已关闭")

    # ------------------------------------------------------------------
    # 查询 & 管理
    # ------------------------------------------------------------------

    def get_all_tasks(self) -> list[TaskConfig]:
        """获取所有任务配置（含最新 next_run 时间）。"""
        for task_id, config in self._tasks.items():
            job = self._scheduler.get_job(task_id)
            if job and job.next_run_time:
                config.next_run = job.next_run_time.isoformat()
            else:
                config.next_run = None
        return list(self._tasks.values())

    def get_task(self, task_id: str) -> Optional[TaskConfig]:
        """获取单个任务配置，不存在返回 None。"""
        config = self._tasks.get(task_id)
        if config:
            job = self._scheduler.get_job(task_id)
            if job and job.next_run_time:
                config.next_run = job.next_run_time.isoformat()
        return config

    def enable_task(self, task_id: str) -> None:
        """启用任务并加入调度。"""
        config = self._tasks[task_id]
        config.enabled = True
        if self._scheduler.running:
            self._add_job(config)
        logger.info("任务已启用: %s", task_id)

    def disable_task(self, task_id: str) -> None:
        """禁用任务并从调度中移除。"""
        config = self._tasks[task_id]
        config.enabled = False
        try:
            self._scheduler.remove_job(task_id)
        except Exception:
            pass  # job 可能本就不存在
        config.next_run = None
        logger.info("任务已禁用: %s", task_id)

    def update_schedule(
        self, task_id: str, trigger_type: str, trigger_args: dict[str, Any]
    ) -> None:
        """更新任务调度规则（立即生效）。"""
        config = self._tasks[task_id]
        config.trigger_type = trigger_type
        config.trigger_args = trigger_args
        if config.enabled and self._scheduler.running:
            self._add_job(config)
        logger.info("任务调度已更新: %s [%s %s]", task_id, trigger_type, trigger_args)


# 全局单例
scheduler_manager = SchedulerManager()
