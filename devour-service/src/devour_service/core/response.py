"""统一响应包装，对齐前端 `ApiResponse<T>`：

```json
{ "code": 0, "message": "success", "data": {}, "timestamp": 1735000000000, "requestId": "req-..." }
```
"""

from __future__ import annotations

import time
import uuid
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


def _now_ms() -> int:
    return int(time.time() * 1000)


def _request_id() -> str:
    return f"req-{uuid.uuid4().hex[:16]}"


class ApiResponse(BaseModel, Generic[T]):  # noqa: UP046 - 保持 pydantic 泛型经过验证的写法
    """统一 REST 响应包装。"""

    code: int = 0
    message: str = "success"
    data: T | None = None
    timestamp: int = Field(default_factory=_now_ms)
    requestId: str = Field(default_factory=_request_id)


def ok(data: Any = None, message: str = "success") -> ApiResponse:
    return ApiResponse(code=0, message=message, data=data)


def fail(code: int, message: str, data: Any = None) -> ApiResponse:
    return ApiResponse(code=code, message=message, data=data)
