"""Skills 接口的请求与响应模型。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

Scope = Literal["public", "private"]


class TreeNode(BaseModel):
    """文件树节点（对齐 antd Tree 的 treeData）。"""

    key: str            # scope 内相对路径
    title: str          # 显示名（文件名/目录名）
    isLeaf: bool        # True=文件
    type: Literal["dir", "file"]
    ext: str = ""       # 文件扩展名（不含点）
    size: int = 0       # 文件字节数（目录为 0）
    children: list[TreeNode] | None = None


class FileContent(BaseModel):
    """单个文件的内容与元信息。"""

    scope: Scope
    path: str
    name: str
    language: str         # Monaco language id
    size: int
    editable: bool        # private 可编辑
    previewable: bool     # 过大/二进制时为 False
    content: str = ""
    reason: str | None = None  # 不可预览原因


class SaveFileRequest(BaseModel):
    scope: Scope
    path: str
    content: str


class CopyRequest(BaseModel):
    scope: Scope = "public"
    path: str
