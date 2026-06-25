"""Code review skill —— 评审流程示例。

演示 Skills 工作区对 Python 文件的语法高亮。
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Finding:
    """一条评审意见。"""

    file: str
    line: int
    severity: str  # info | warning | error
    message: str


@dataclass
class ReviewResult:
    findings: list[Finding] = field(default_factory=list)

    @property
    def has_blocking(self) -> bool:
        return any(f.severity == "error" for f in self.findings)


def review_diff(diff: str) -> ReviewResult:
    """对 diff 文本做最小化静态检查（示例）。"""
    result = ReviewResult()
    for i, line in enumerate(diff.splitlines(), start=1):
        stripped = line.lstrip("+ ")
        if "TODO" in stripped or "FIXME" in stripped:
            result.findings.append(
                Finding(file="<diff>", line=i, severity="warning", message="存在未完成标记")
            )
        if "print(" in stripped:
            result.findings.append(
                Finding(file="<diff>", line=i, severity="info", message="疑似调试输出")
            )
    return result


if __name__ == "__main__":
    sample = "+ def foo():\n+     print('debug')  # TODO: remove\n"
    for f in review_diff(sample).findings:
        print(f"{f.severity.upper():7} L{f.line}: {f.message}")
