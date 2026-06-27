"""Token 计数抽象层。

定义 TokenCounter 协议（Protocol），不同模型供应商可提供不同实现。
内置 ApproxTokenCounter 基于字符数估算，无需额外依赖。
"""

from __future__ import annotations

from typing import Protocol


class TokenCounter(Protocol):
    """Token 计数接口。不同 LLM 提供商可实现精确版本。"""

    def count(self, text: str) -> int:
        """返回文本的 token 数量（整数）。"""
        ...


class ApproxTokenCounter:
    """基于字符数的近似 token 计数。

    估算规则：
    - 中文字符：约 1.5 字/token（CJK 字符在多数 tokenizer 中 1-2 个 token）
    - 英文/数字：约 4 字符/token（GPT 系列经验值）
    - 标点/空白：按英文规则计算
    """

    def count(self, text: str) -> int:
        if not text:
            return 0
        cjk_count = 0
        other_count = 0
        for ch in text:
            if '\u4e00' <= ch <= '\u9fff' or '\u3400' <= ch <= '\u4dbf':
                cjk_count += 1
            else:
                other_count += 1
        # CJK: 1 token ≈ 1.5 字符; 其他: 1 token ≈ 4 字符
        tokens = cjk_count / 1.5 + other_count / 4.0
        return max(1, int(tokens))
