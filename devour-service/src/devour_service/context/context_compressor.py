"""上下文压缩器：当历史消息过长时，将早期消息压缩为摘要。

压缩策略与模型无关——触发条件和保留窗口由 ContextConfig 控制。
仅在实际压缩时调用 LLM 生成摘要文本。
"""

from __future__ import annotations

from ..core.logging import get_logger
from .token_counter import ApproxTokenCounter, TokenCounter

logger = get_logger(__name__)

_SUMMARY_PROMPT = """请将以下对话历史压缩为一段简洁的摘要，保留关键信息（用户关注的问题、已完成的分析、重要结论）。
摘要应能让后续对话理解前文脉络，但不需要逐字复述。

已有摘要（若有，请在此基础上追加）：
{existing_summary}

需要压缩的对话记录：
{conversation_text}

请直接输出摘要内容，不要添加额外说明。"""


class ContextCompressor:
    """上下文压缩器：将早期消息通过 LLM 生成摘要。"""

    def __init__(self, token_counter: TokenCounter | None = None):
        self._counter = token_counter or ApproxTokenCounter()

    async def compress(
        self,
        messages_to_compress: list,
        existing_summary: str = "",
        llm_config=None,
    ) -> str:
        """将一组消息压缩为摘要文本。

        参数:
            messages_to_compress: 需要压缩的 Message ORM 对象列表（按时间升序）
            existing_summary: 已有的摘要（在此基础上追加）
            llm_config: LLMConfig，用于构建临时 LLM 调用

        返回:
            新的摘要文本
        """
        if not messages_to_compress:
            return existing_summary

        conversation_text = "\n".join(
            f"{'用户' if m.role == 'user' else '助手'}: {m.content}"
            for m in messages_to_compress
        )

        prompt = _SUMMARY_PROMPT.format(
            existing_summary=existing_summary or "（无）",
            conversation_text=conversation_text,
        )

        try:
            from ..llm.factory import build_chat_model
            model = build_chat_model(llm_config)
            response = await model.ainvoke([
                {"role": "system", "content": "你是一位对话摘要专家，擅长提炼关键信息。"},
                {"role": "user", "content": prompt},
            ])
            new_summary = response.content if hasattr(response, "content") else str(response)
            logger.info(
                "上下文压缩完成: %d条消息 → %d字符摘要",
                len(messages_to_compress), len(new_summary),
            )
            return new_summary
        except Exception:
            logger.exception("上下文压缩失败，保留原有摘要")
            return existing_summary

    def split_messages_for_compression(
        self, messages: list, keep_recent: int = 10
    ) -> tuple[list, list]:
        """将消息列表拆分为「待压缩」和「保留」两部分。

        参数:
            messages: 完整历史消息列表（按时间升序）
            keep_recent: 保留最近的消息数量

        返回:
            (to_compress, to_keep) 元组
        """
        if len(messages) <= keep_recent:
            return [], messages
        return messages[:-keep_recent], messages[-keep_recent:]
