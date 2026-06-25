"""日志配置。

- 业务日志：同时输出到 stdout 与 `<log_dir>/app.log`（滚动文件）。
- 专用日志：通过 dedicated_logger() 建立独立文件日志（如 prompt.log / response.log），
  各自独立文件、不向根日志传播，便于单独检索。
"""

from __future__ import annotations

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

_CONFIGURED = False

_BUSINESS_FMT = logging.Formatter(
    fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


def get_log_dir() -> Path:
    """解析并确保日志目录存在（相对运行目录）。"""
    from .config import get_settings

    path = Path(get_settings().log_dir).resolve()
    path.mkdir(parents=True, exist_ok=True)
    return path


def setup_logging() -> None:
    """初始化根日志：stdout + app.log（幂等）。"""
    global _CONFIGURED
    if _CONFIGURED:
        return
    from .config import get_settings

    level = getattr(logging, get_settings().log_level.upper(), logging.INFO)

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(_BUSINESS_FMT)

    file_handler = RotatingFileHandler(
        get_log_dir() / "app.log", maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    file_handler.setFormatter(_BUSINESS_FMT)

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [stream_handler, file_handler]
    # langchain-openai 每次调用都会就「自定义 transport 关闭代理自动探测」打印 WARNING，
    # 这是我们刻意为之（trust_env=False），降噪以保持业务日志整洁。
    logging.getLogger("langchain_openai.chat_models._client_utils").setLevel(logging.ERROR)
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    setup_logging()
    return logging.getLogger(name)


def dedicated_logger(name: str, filename: str) -> logging.Logger:
    """创建/获取一个写入独立文件的日志器（不向根日志传播）。

    用于 prompt / response 等需要单独成文件的日志。message 通常已是 JSON 字符串。
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    handler = RotatingFileHandler(
        get_log_dir() / filename, maxBytes=10 * 1024 * 1024, backupCount=10, encoding="utf-8"
    )
    handler.setFormatter(logging.Formatter(fmt="%(asctime)s %(message)s", datefmt="%Y-%m-%d %H:%M:%S"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False
    return logger
