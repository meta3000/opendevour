"""异步 TTL 缓存装饰器。

基于 cachetools.TTLCache，为数据源适配器的异步方法提供
带过期时间的内存缓存，避免频繁请求外部 API。
"""

from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import Any

from cachetools import TTLCache


def async_ttl_cache(
    maxsize: int = 128, ttl: int = 300
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """异步 TTL 缓存装饰器。

    Args:
        maxsize: 缓存最大条目数。
        ttl: 缓存过期时间（秒），默认 300 秒（5 分钟）。

    Returns:
        装饰后的异步函数，额外提供 ``cache`` 属性和 ``cache_clear()`` 方法。
    """

    cache: TTLCache[str, Any] = TTLCache(maxsize=maxsize, ttl=ttl)

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # 使用位置参数 + 排序后的关键字参数构建缓存键
            key = str(args) + str(sorted(kwargs.items()))
            if key in cache:
                return cache[key]
            result = await func(*args, **kwargs)
            cache[key] = result
            return result

        # 暴露缓存实例，方便外部清理或检查
        wrapper.cache = cache  # type: ignore[attr-defined]
        wrapper.cache_clear = cache.clear  # type: ignore[attr-defined]
        return wrapper

    return decorator
