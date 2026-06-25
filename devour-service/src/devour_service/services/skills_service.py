"""Skills 文件服务。

负责对仓库根 `skills/{public,private}` 的安全文件操作：列树 / 读 / 存 / 复制。
安全要点：scope 白名单、路径穿越防护（解析后必须仍在 scope 根内）、5MB 上限、二进制拦截。
"""

from __future__ import annotations

import shutil
from pathlib import Path

from ..core.config import get_settings
from ..core.exceptions import AppError
from ..schemas.skills import FileContent, Scope, TreeNode

MAX_PREVIEW_BYTES = 5 * 1024 * 1024  # 5MB

# 扩展名 → Monaco language id
_LANG_MAP = {
    "md": "markdown", "markdown": "markdown",
    "sql": "sql",
    "py": "python",
    "sh": "shell", "bash": "shell", "zsh": "shell",
    "js": "javascript", "mjs": "javascript", "cjs": "javascript",
    "ts": "typescript", "tsx": "typescript",
    "json": "json",
    "yaml": "yaml", "yml": "yaml",
    "toml": "ini", "ini": "ini",
    "html": "html", "css": "css",
    "txt": "plaintext", "log": "plaintext", "": "plaintext",
}


def detect_language(ext: str) -> str:
    return _LANG_MAP.get(ext.lower().lstrip("."), "plaintext")


def _skills_root() -> Path:
    return Path(get_settings().skills_dir).resolve()


def _scope_root(scope: str) -> Path:
    if scope not in ("public", "private"):
        raise AppError(f"非法 scope: {scope}", code=4002)
    root = _skills_root() / scope
    root.mkdir(parents=True, exist_ok=True)
    return root


def _safe_abspath(scope: str, rel: str) -> Path:
    """拼接相对路径并校验未越界。"""
    root = _scope_root(scope)
    rel = (rel or "").replace("\\", "/").strip().lstrip("/")
    target = (root / rel).resolve()
    if target != root and root not in target.parents:
        raise AppError("非法路径", code=4003)
    return target


def _build_node(base: Path, path: Path) -> TreeNode:
    rel = path.relative_to(base).as_posix()
    if path.is_dir():
        children = _list_dir(base, path)
        return TreeNode(key=rel, title=path.name, isLeaf=False, type="dir", children=children)
    stat = path.stat()
    return TreeNode(
        key=rel,
        title=path.name,
        isLeaf=True,
        type="file",
        ext=path.suffix.lstrip("."),
        size=stat.st_size,
    )


def _list_dir(base: Path, directory: Path) -> list[TreeNode]:
    entries = sorted(
        directory.iterdir(),
        key=lambda p: (p.is_file(), p.name.lower()),  # 目录在前，名称排序
    )
    return [_build_node(base, p) for p in entries if not p.name.startswith(".")]


def list_tree(scope: Scope) -> list[TreeNode]:
    root = _scope_root(scope)
    return _list_dir(root, root)


def read_file(scope: Scope, rel: str) -> FileContent:
    path = _safe_abspath(scope, rel)
    if not path.is_file():
        raise AppError(f"文件不存在: {rel}", code=4004, http_status=404)

    size = path.stat().st_size
    language = detect_language(path.suffix)
    editable = scope == "private"
    base = dict(
        scope=scope, path=path.relative_to(_scope_root(scope)).as_posix(),
        name=path.name, language=language, size=size, editable=editable,
    )

    if size > MAX_PREVIEW_BYTES:
        return FileContent(**base, previewable=False, reason="文件过大（超过 5MB），无法预览")

    raw = path.read_bytes()
    if b"\x00" in raw:
        return FileContent(**base, previewable=False, reason="非文本文件，无法预览")
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return FileContent(**base, previewable=False, reason="非文本文件（非 UTF-8 编码），无法预览")

    return FileContent(**base, previewable=True, content=text)


def save_file(scope: Scope, rel: str, content: str) -> str:
    if scope != "private":
        raise AppError("公共 Skills 不可编辑，请先复制到「我的 Skills」", code=4005)
    path = _safe_abspath(scope, rel)
    if path.exists() and not path.is_file():
        raise AppError("目标不是文件", code=4006)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return path.relative_to(_scope_root(scope)).as_posix()


def _dedupe_target(target: Path) -> Path:
    """目标已存在时生成 `name (n)` 形式的不冲突路径。"""
    if not target.exists():
        return target
    parent = target.parent
    is_file = target.suffix and not target.is_dir()
    stem = target.stem if is_file else target.name
    suffix = target.suffix if is_file else ""
    n = 1
    while True:
        candidate = parent / f"{stem} ({n}){suffix}"
        if not candidate.exists():
            return candidate
        n += 1


def copy_to_private(scope: Scope, rel: str) -> str:
    """把公共文件/文件夹复制到「我的 Skills」（private），返回新相对路径。"""
    if scope != "public":
        raise AppError("仅支持把公共 Skills 复制到我的 Skills", code=4007)
    src = _safe_abspath("public", rel)
    if not src.exists():
        raise AppError(f"源不存在: {rel}", code=4004, http_status=404)

    private_root = _scope_root("private")
    rel_norm = src.relative_to(_scope_root("public")).as_posix()
    target = _dedupe_target(private_root / rel_norm)
    target.parent.mkdir(parents=True, exist_ok=True)

    if src.is_dir():
        shutil.copytree(src, target)
    else:
        shutil.copy2(src, target)
    return target.relative_to(private_root).as_posix()


def _parse_skill_meta(skill_md: Path, folder_name: str) -> tuple[str, str]:
    """从 SKILL.md 解析技能名与描述（支持 YAML frontmatter，缺省回退到目录名 / 首段）。"""
    text = skill_md.read_text(encoding="utf-8", errors="ignore")
    name, desc = folder_name, ""
    body = text

    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            for line in text[3:end].splitlines():
                if ":" in line:
                    key, val = line.split(":", 1)
                    key, val = key.strip().lower(), val.strip().strip("\"'")
                    if key == "name" and val:
                        name = val
                    elif key == "description" and val:
                        desc = val
            body = text[end + 4:]

    if not desc:
        for line in body.splitlines():
            s = line.strip()
            if not s:
                continue
            if s.startswith("#"):
                if name == folder_name:
                    name = s.lstrip("# ").strip() or folder_name
                continue
            desc = s
            break

    return name, desc[:160]


def list_catalog() -> list[dict]:
    """列出所有「标准 skill」：含 SKILL.md 的顶层文件夹（含 public 与 private）。"""
    items: list[dict] = []
    for scope in ("private", "public"):
        root = _scope_root(scope)
        for entry in sorted(root.iterdir(), key=lambda p: p.name.lower()):
            if entry.is_dir() and (entry / "SKILL.md").is_file():
                name, desc = _parse_skill_meta(entry / "SKILL.md", entry.name)
                items.append({
                    "name": name,
                    "folder": entry.name,
                    "scope": scope,
                    "path": entry.name,
                    "description": desc,
                })
    return items
