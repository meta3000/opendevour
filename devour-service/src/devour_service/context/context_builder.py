"""上下文组装器：将历史消息构建为 LLM 可消费的 prompt 序列。

策略：
1. 始终保留 system_prompt（最高优先级）
2. 若有 conversation_summary，作为 SystemMessage 插入
3. 从最新消息向前保留，直到超出 token 预算
4. 返回 LangChain BaseMessage 列表
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage

from ..core.logging import get_logger
from .token_counter import ApproxTokenCounter, TokenCounter

if TYPE_CHECKING:
    from ..models.conversation import Message

logger = get_logger(__name__)

# 预留输出 token 的比例（上下文预算 = max_tokens × (1 - output_reserve_ratio)）
_DEFAULT_OUTPUT_RESERVE_RATIO = 0.3


@dataclass
class ContextConfig:
    """上下文构建参数。所有参数均可配置，与具体模型无关。"""

    max_context_tokens: int = 6000
    max_history_messages: int = 20
    summary_threshold_tokens: int = 4000
    output_reserve_ratio: float = _DEFAULT_OUTPUT_RESERVE_RATIO
    token_counter: TokenCounter = field(default_factory=ApproxTokenCounter)


def _orm_to_langchain(msg: "Message") -> BaseMessage:
    """将 ORM Message 转换为 LangChain 消息类型。"""
    if msg.role == "user":
        return HumanMessage(content=msg.content)
    elif msg.role == "assistant":
        return AIMessage(content=msg.content)
    elif msg.role == "system":
        return SystemMessage(content=msg.content)
    else:
        # tool 等其他角色，作为 AIMessage 附带 name
        return AIMessage(content=msg.content, additional_kwargs={"name": msg.role})


class ContextBuilder:
    """上下文组装器：根据配置将历史消息裁剪为 token 预算内的消息序列。"""

    def __init__(self, config: ContextConfig | None = None):
        self.config = config or ContextConfig()
        self._counter = self.config.token_counter

    def build_context(
        self,
        system_prompt: str,
        history_messages: list["Message"],
        conversation_summary: str,
        new_message: str,
    ) -> list[BaseMessage]:
        """组装发送给 LLM 的完整消息列表。

        参数:
            system_prompt: 系统提示词（始终保留在最前）
            history_messages: 数据库中的历史消息（按时间升序，不含当前新消息）
            conversation_summary: 已有的上下文摘要（可能为空）
            new_message: 当前用户输入

        返回:
            LangChain BaseMessage 列表，可直接传给 graph.astream()
        """
        counter = self._counter
        messages: list[BaseMessage] = []

        # 1. 系统提示词（始终保留）
        messages.append(SystemMessage(content=system_prompt))
        system_tokens = counter.count(system_prompt)

        # 2. 上下文摘要（若有）
        summary_tokens = 0
        if conversation_summary:
            messages.append(SystemMessage(content=f"[历史对话摘要]\n{conversation_summary}"))
            summary_tokens = counter.count(conversation_summary) + 20  # +20 for prefix

        # 3. 当前用户消息（必须保留）
        new_msg = HumanMessage(content=new_message)
        new_msg_tokens = counter.count(new_message)

        # 4. 计算历史消息的 token 预算
        budget = self.config.max_context_tokens
        used = system_tokens + summary_tokens + new_msg_tokens
        history_budget = budget - used

        # 5. 从最新消息向前保留，直到超出预算
        # 注意：history_messages 不包含 new_message，它已在上面单独添加
        selected_history: list[BaseMessage] = []
        history_lc = [_orm_to_langchain(m) for m in history_messages]

        # 从后向前遍历（最新的优先保留）
        accumulated_tokens = 0
        for lc_msg in reversed(history_lc):
            msg_tokens = counter.count(lc_msg.content if isinstance(lc_msg.content, str) else str(lc_msg.content))
            if accumulated_tokens + msg_tokens > history_budget:
                break
            if len(selected_history) >= self.config.max_history_messages:
                break
            selected_history.insert(0, lc_msg)
            accumulated_tokens += msg_tokens

        # 6. 组装最终消息列表
        result = messages + selected_history + [new_msg]

        total_tokens = used + accumulated_tokens
        logger.debug(
            "上下文构建完成: system=%d summary=%d history=%d条/%dtokens new=%d 总计=%d/%d",
            system_tokens, summary_tokens, len(selected_history), accumulated_tokens,
            new_msg_tokens, total_tokens, budget,
        )

        return result

    def should_compress(self, history_messages: list["Message"]) -> bool:
        """判断是否需要触发上下文压缩。

        当历史消息的总 token 数超过 summary_threshold_tokens 时返回 True。
        """
        total = sum(
            self._counter.count(m.content) for m in history_messages
        )
        return total > self.config.summary_threshold_tokens

    def estimate_tokens(self, text: str) -> int:
        """估算文本的 token 数（供外部使用）。"""
        return self._counter.count(text)
