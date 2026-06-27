"""ContextBuilder 单元测试。"""

import pytest
from unittest.mock import MagicMock

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from devour_service.context.context_builder import ContextBuilder, ContextConfig
from devour_service.context.token_counter import ApproxTokenCounter


def make_message(role: str, content: str) -> MagicMock:
    msg = MagicMock()
    msg.role = role
    msg.content = content
    msg.token_count = 0
    return msg


@pytest.fixture
def default_builder():
    return ContextBuilder()


@pytest.fixture
def small_budget_builder():
    """小 token 预算的 builder，方便测试截断逻辑。"""
    config = ContextConfig(max_context_tokens=100, summary_threshold_tokens=80)
    return ContextBuilder(config=config)


class TestContextBuilder:
    """ContextBuilder 上下文组装逻辑测试。"""

    def test_empty_history_returns_system_and_new_message(self, default_builder: ContextBuilder):
        result = default_builder.build_context(
            system_prompt="You are a helpful assistant.",
            history_messages=[],
            conversation_summary="",
            new_message="Hello",
        )
        # 应只有 SystemMessage + HumanMessage
        assert len(result) == 2
        assert isinstance(result[0], SystemMessage)
        assert result[0].content == "You are a helpful assistant."
        assert isinstance(result[1], HumanMessage)
        assert result[1].content == "Hello"

    def test_history_messages_converted_to_langchain_types(self, default_builder: ContextBuilder):
        history = [
            make_message("user", "What is AI?"),
            make_message("assistant", "AI is artificial intelligence."),
            make_message("system", "Be concise."),
        ]
        result = default_builder.build_context(
            system_prompt="System prompt",
            history_messages=history,
            conversation_summary="",
            new_message="Tell me more",
        )
        # system + 3 history + new_message = 5
        assert len(result) == 5
        assert isinstance(result[1], HumanMessage)
        assert result[1].content == "What is AI?"
        assert isinstance(result[2], AIMessage)
        assert result[2].content == "AI is artificial intelligence."
        assert isinstance(result[3], SystemMessage)
        assert result[3].content == "Be concise."

    def test_summary_inserted_as_system_message(self, default_builder: ContextBuilder):
        result = default_builder.build_context(
            system_prompt="System",
            history_messages=[],
            conversation_summary="Previous discussion about stocks.",
            new_message="Continue",
        )
        # system + summary(SystemMessage) + new_message(HumanMessage) = 3
        assert len(result) == 3
        assert isinstance(result[1], SystemMessage)
        assert "[历史对话摘要]" in result[1].content
        assert "Previous discussion about stocks." in result[1].content

    def test_truncation_drops_oldest_messages_when_over_budget(self, small_budget_builder: ContextBuilder):
        # 每条消息 20 字符 → 20/4=5 tokens
        # max_context_tokens=100，system+new_message 占用约 10+5=15 tokens
        # history_budget ≈ 85 tokens → 最多 17 条 5-token 消息
        # 创建 30 条历史消息，应该会被截断
        history = [make_message("user", "a" * 20) for _ in range(30)]
        result = small_budget_builder.build_context(
            system_prompt="Sys",  # 3/4=0 → 1 token (min 1)
            history_messages=history,
            conversation_summary="",
            new_message="Hi",  # 2/4=0 → 1 token
        )
        # system(1) + new(1) = 2 tokens used, history_budget = 100 - 2 = 98
        # each history msg = 5 tokens, 98/5=19.6 → 19 messages max
        # but max_history_messages=20 default, so 19 messages fit
        history_msgs = [m for m in result if isinstance(m, (HumanMessage, AIMessage)) and m.content == "a" * 20]
        assert len(history_msgs) < 30  # 确认有截断发生
        assert len(history_msgs) > 0   # 至少保留了一些

    def test_should_compress_returns_true_when_over_threshold(self, default_builder: ContextBuilder):
        # summary_threshold_tokens=4000 by default
        # 创建总 token > 4000 的消息
        # 每条消息 100 字符 → 25 tokens, 需要 > 160 条
        history = [make_message("user", "a" * 100) for _ in range(200)]
        assert default_builder.should_compress(history) is True

    def test_should_compress_returns_false_when_under_threshold(self, default_builder: ContextBuilder):
        # 少量消息，远低于 4000 token 阈值
        history = [make_message("user", "hello") for _ in range(5)]
        assert default_builder.should_compress(history) is False

    def test_new_message_always_preserved(self, small_budget_builder: ContextBuilder):
        # 即使预算很小，new_message 也必须保留
        result = small_budget_builder.build_context(
            system_prompt="S",
            history_messages=[make_message("user", "x" * 200) for _ in range(50)],
            conversation_summary="",
            new_message="important question",
        )
        # 最后一条一定是 new_message
        assert isinstance(result[-1], HumanMessage)
        assert result[-1].content == "important question"

    def test_max_history_messages_respected(self):
        config = ContextConfig(max_context_tokens=100000, max_history_messages=3)
        builder = ContextBuilder(config=config)
        history = [make_message("user", "msg") for _ in range(10)]
        result = builder.build_context(
            system_prompt="Sys",
            history_messages=history,
            conversation_summary="",
            new_message="New",
        )
        # system + max 3 history + new = 5
        assert len(result) == 5  # 1 system + 3 history + 1 new
