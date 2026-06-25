"""业务异常与 FastAPI 异常处理器。"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .logging import get_logger
from .response import fail

logger = get_logger(__name__)


class AppError(Exception):
    """应用级业务异常。"""

    def __init__(self, message: str, code: int = 1, http_status: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.http_status = http_status


class LLMConfigError(AppError):
    """大模型配置错误（如缺少 API Key）。"""

    def __init__(self, message: str) -> None:
        super().__init__(message, code=4001, http_status=400)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.http_status,
            content=fail(exc.code, exc.message).model_dump(),
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("未处理的异常: %s", exc)
        return JSONResponse(
            status_code=500,
            content=fail(5000, f"服务器内部错误: {exc}").model_dump(),
        )
