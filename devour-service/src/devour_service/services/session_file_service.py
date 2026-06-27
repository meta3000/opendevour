"""会话文件管理服务。

每个会话对应一个文件夹（data/sessions/{conv_id}/），
存储 AI 生成的报告、看板、画布、笔记等文件。
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from ..core.config import get_settings
from ..core.logging import get_logger

logger = get_logger(__name__)


class SessionFileService:
    """会话文件管理：每个会话一个文件夹，存储报告/笔记等文件。"""

    def _get_base_dir(self) -> Path:
        base = Path(get_settings().session_files_dir)
        base.mkdir(parents=True, exist_ok=True)
        return base

    def get_session_dir(self, conv_id: str) -> Path:
        """返回（并确保存在）会话文件夹。"""
        session_dir = self._get_base_dir() / conv_id
        session_dir.mkdir(parents=True, exist_ok=True)
        return session_dir

    def save_file(self, conv_id: str, filename: str, content: str, file_type: str = "text") -> dict:
        """保存文件到会话文件夹。
        
        返回文件元信息 dict: {filename, file_type, size, created_at}
        """
        session_dir = self.get_session_dir(conv_id)
        filepath = session_dir / filename
        filepath.write_text(content, encoding="utf-8")
        logger.info("保存会话文件: %s/%s (%d bytes)", conv_id, filename, len(content))
        return {
            "filename": filename,
            "file_type": file_type,
            "size": len(content.encode("utf-8")),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    def list_files(self, conv_id: str) -> list[dict]:
        """列出会话文件夹中的所有文件。"""
        session_dir = self._get_base_dir() / conv_id
        if not session_dir.exists():
            return []
        
        files = []
        for fp in sorted(session_dir.iterdir()):
            if fp.is_file():
                stat = fp.stat()
                # 从文件扩展名推断类型
                ext = fp.suffix.lower()
                file_type = {".md": "report", ".json": "data", ".txt": "text"}.get(ext, "other")
                files.append({
                    "filename": fp.name,
                    "file_type": file_type,
                    "size": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat(),
                })
        return files

    def read_file(self, conv_id: str, filename: str) -> str | None:
        """读取文件内容。返回 None 表示文件不存在。"""
        filepath = self._get_base_dir() / conv_id / filename
        if not filepath.exists():
            return None
        return filepath.read_text(encoding="utf-8")

    def delete_file(self, conv_id: str, filename: str) -> bool:
        """删除文件。返回是否成功。"""
        filepath = self._get_base_dir() / conv_id / filename
        if not filepath.exists():
            return False
        filepath.unlink()
        logger.info("删除会话文件: %s/%s", conv_id, filename)
        return True


# 全局单例
session_file_service = SessionFileService()
