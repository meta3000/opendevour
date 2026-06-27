"""ContextCompressor 单元测试。"""

import pytest
from unittest.mock import MagicMock

from devour_service.context.context_compressor import ContextCompressor


def make_message(role: str, content: str) -> MagicMock:
    msg = MagicMock()
    msg.role = role
    msg.content = content
    msg.token_count = 0
    return msg


@pytest.fixture
def compressor():
    return ContextCompressor()


class TestContextCompressor:
    """ContextCompressor 拆分与压缩逻辑测试。"""

    def test_split_messages_for_compression_basic(self, compressor: ContextCompressor):
        messages = [make_message("user", f"msg{i}") for i in range(20)]
        to_compress, to_keep = compressor.split_messages_for_compression(messages, keep_recent=5)
        assert len(to_compress) == 15
        assert len(to_keep) == 5
        # 保留的应是最后 5 条
        assert to_keep[0].content == "msg15"
        assert to_keep[-1].content == "msg19"

    def test_split_no_split_when_under_keep_recent(self, compressor: ContextCompressor):
        messages = [make_message("user", f"msg{i}") for i in range(5)]
        to_compress, to_keep = compressor.split_messages_for_compression(messages, keep_recent=10)
        assert to_compress == []
        assert len(to_keep) == 5

    def test_split_exact_keep_recent_count(self, compressor: ContextCompressor):
        messages = [make_message("user", f"msg{i}") for i in range(10)]
        to_compress, to_keep = compressor.split_messages_for_compression(messages, keep_recent=10)
        assert to_compress == []
        assert len(to_keep) == 10

    async def test_compress_empty_messages_returns_existing_summary(self, compressor: ContextCompressor):
        result = await compressor.compress([], existing_summary="existing summary text")
        assert result == "existing summary text"

    async def test_compress_empty_messages_empty_summary(self, compressor: ContextCompressor):
        result = await compressor.compress([], existing_summary="")
        assert result == ""
