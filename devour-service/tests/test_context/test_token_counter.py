"""ApproxTokenCounter 单元测试。"""

import pytest

from devour_service.context.token_counter import ApproxTokenCounter


@pytest.fixture
def counter():
    return ApproxTokenCounter()


class TestApproxTokenCounter:
    """ApproxTokenCounter 估算规则测试。"""

    def test_empty_string_returns_zero(self, counter: ApproxTokenCounter):
        assert counter.count("") == 0

    def test_pure_english_approx_4_chars_per_token(self, counter: ApproxTokenCounter):
        # 40 个英文字符 ≈ 10 tokens
        text = "a" * 40
        tokens = counter.count(text)
        assert tokens == 10

    def test_pure_chinese_approx_1_5_chars_per_token(self, counter: ApproxTokenCounter):
        # 30 个中文字符 ≈ 20 tokens
        text = "中" * 30
        tokens = counter.count(text)
        assert tokens == 20

    def test_mixed_chinese_english(self, counter: ApproxTokenCounter):
        # 15 中文 (15/1.5=10) + 20 英文 (20/4=5) = 15 tokens
        text = "中" * 15 + "a" * 20
        tokens = counter.count(text)
        assert tokens == 15

    def test_single_char_returns_at_least_one(self, counter: ApproxTokenCounter):
        # 1 个英文字符: 1/4=0.25 → max(1, 0) = 1
        assert counter.count("x") == 1

    def test_punctuation_counted_as_other(self, counter: ApproxTokenCounter):
        # 空格和标点归入 other_count（4 字符/token）
        text = "hello, world! "  # 14 字符 → 14/4=3.5 → 3
        tokens = counter.count(text)
        assert tokens == 3

    def test_longer_english_text(self, counter: ApproxTokenCounter):
        text = "the quick brown fox jumps over the lazy dog"
        # 43 字符 → 43/4=10.75 → 10
        tokens = counter.count(text)
        assert tokens == 10
