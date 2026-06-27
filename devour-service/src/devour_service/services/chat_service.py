"""聊天 SSE 流编排。

stream_chat() 产出一系列 ChatStreamChunk：
    thought_step → tool_call? → token... → done
支持 LangGraph ReAct 模式下的工具调用事件推送。
任何配置或调用错误都会转成 error chunk，保证前端始终能收到可读反馈。
"""

from __future__ import annotations

import json
import re
import time
from collections.abc import AsyncIterator
from typing import Any

from langchain_core.messages import AIMessage, ToolMessage

from ..agents.chat_graph import SYSTEM_PROMPT, build_graph
from ..context import ContextBuilder, ContextConfig, ContextCompressor
from ..core.exceptions import AppError
from ..core.llm_logging import log_prompt, log_response
from ..core.logging import get_logger
from ..db.engine import async_session
from ..llm.factory import default_config
from ..llm.schemas import LLMConfig
from ..services.conversation_service import conversation_service
from ..services.session_file_service import session_file_service
from ..schemas.chat import (
    ChatStreamChunk,
    ChatStreamRequest,
    ChartSpecContent,
    DataTableContent,
    DecisionSetContent,
    DoneData,
    ErrorData,
    ReportContent,
    RichChunk,
    RiskAlertContent,
    ThoughtStepData,
    TokenData,
    ToolCallData,
    ToolResultContent,
)

logger = get_logger(__name__)

_context_builder = ContextBuilder(ContextConfig())
_context_compressor = ContextCompressor()


def _resolve_llm_config(req: ChatStreamRequest) -> LLMConfig:
    """请求体中的动态模型配置优先，缺省回落到 .env 默认。"""
    base = default_config()
    return LLMConfig(
        provider=req.provider or base.provider,
        model=req.model or base.model,
        temperature=req.temperature if req.temperature is not None else base.temperature,
    )


def _thought(step: int, title: str, status: str) -> ChatStreamChunk:
    return ChatStreamChunk(
        type="thought_step",
        data=ThoughtStepData(step=step, title=title, status=status).model_dump(),
    )


def _detect_rich_type(tool_name: str, content: Any) -> str | None:
    """根据工具名和返回内容特征自动判断适合的 rich chunk 类型。

    返回 None 表示无法判断（应作为普通 tool_result 处理）。
    """
    # 工具名启发式映射
    _CHART_TOOLS = {"get_market_overview", "get_stock_info", "get_sector_rotation"}
    _TABLE_TOOLS = {"get_portfolio_summary"}
    _RISK_TOOLS = {"analyze_portfolio_risk"}
    _DECISION_TOOLS = {"generate_investment_decision"}

    if tool_name in _DECISION_TOOLS:
        return "decision_set"
    if tool_name in _RISK_TOOLS:
        return "risk_alert"
    if tool_name in _CHART_TOOLS:
        # 市场类工具若返回数据序列 → chart_spec
        if isinstance(content, (list, dict)):
            data = content if isinstance(content, list) else content.get("data", [])
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                return "chart_spec"
        return "data_table"
    if tool_name in _TABLE_TOOLS:
        return "data_table"

    # 内容结构启发式
    if isinstance(content, dict):
        if "level" in content and "metrics" in content:
            return "risk_alert"
        if "decisions" in content and "summary" in content:
            return "decision_set"
        if "chart_type" in content and "data" in content:
            return "chart_spec"
        if "columns" in content and "data" in content:
            return "data_table"
    return None


def _is_markdown_report(text: str) -> bool:
    """检测一段文本是否为结构化 Markdown 报告（含 # 标题且内容较长）。"""
    if not text or len(text) < 100:
        return False
    return bool(re.search(r"(?:^|\n)#{1,6}\s+\S", text))


def _extract_report_title(text: str) -> str:
    """从 Markdown 文本中提取第一个标题作为报告标题。"""
    match = re.search(r"(?:^|\n)#{1,6}\s+(.+)", text)
    if match:
        return match.group(1).strip()[:40]
    return "AI 分析报告"


def format_rich_chunk(tool_name: str, raw_content: Any) -> ChatStreamChunk | None:
    """将工具返回的结构化数据封装为对应的 rich_chunk ChatStreamChunk。

    返回 None 表示无法封装（应作为普通文本/摘要处理）。
    """
    rich_type = _detect_rich_type(tool_name, raw_content)
    if rich_type is None:
        return None

    content_obj: Any
    if rich_type == "chart_spec":
        # 若内容已是 ChartSpecContent 结构则直接使用，否则尝试转换
        if isinstance(raw_content, dict) and "chart_type" in raw_content:
            content_obj = ChartSpecContent(**raw_content).model_dump()
        elif isinstance(raw_content, (list, dict)):
            data = raw_content if isinstance(raw_content, list) else raw_content.get("data", [])
            content_obj = ChartSpecContent(
                chart_type="line",
                title=f"{tool_name} 数据可视化",
                data=data if isinstance(data, list) else [],
                x_field="date",
                y_field="value",
            ).model_dump()
        else:
            return None
    elif rich_type == "data_table":
        if isinstance(raw_content, dict) and "columns" in raw_content:
            content_obj = DataTableContent(**raw_content).model_dump()
        elif isinstance(raw_content, dict) and "headers" in raw_content:
            # 兼容旧的 headers/rows 格式
            headers = raw_content.get("headers", [])
            rows = raw_content.get("rows", [])
            columns = [{"key": h, "title": h, "dataIndex": h} for h in headers]
            data = [dict(zip(headers, row)) for row in rows]
            content_obj = DataTableContent(
                title=raw_content.get("title", f"{tool_name} 数据表"),
                columns=columns,
                data=data,
                summary=raw_content.get("summary"),
            ).model_dump()
        else:
            return None
    elif rich_type == "risk_alert":
        if isinstance(raw_content, dict) and "level" in raw_content:
            content_obj = RiskAlertContent(**raw_content).model_dump()
        else:
            content_obj = RiskAlertContent(
                level="medium",
                title=f"{tool_name} 风险预警",
                description=str(raw_content)[:200],
                metrics=[],
                suggestions=[],
            ).model_dump()
    elif rich_type == "decision_set":
        if isinstance(raw_content, dict) and "decisions" in raw_content:
            content_obj = DecisionSetContent(**raw_content).model_dump()
        else:
            return None
    else:
        return None

    return ChatStreamChunk(
        type="rich_chunk",
        data=RichChunk(type=rich_type, content=content_obj).model_dump(),
    )


async def stream_chat(req: ChatStreamRequest) -> AsyncIterator[ChatStreamChunk]:
    """核心聊天流，逐条 yield SSE chunk。

    集成会话管理 + 上下文构建：
    1. 解析 conversationId（兼容 sessionId）
    2. 获取或创建 Conversation，保存用户消息
    3. 使用 ContextBuilder 构建上下文
    4. 流式调用 LangGraph
    5. 流结束后保存 AI 回复 + 检查压缩
    """
    # 1. 解析会话 ID（conversationId 优先，兼容 sessionId）
    conv_id = req.conversationId or req.sessionId
    llm_config = _resolve_llm_config(req)
    started = time.monotonic()
    full_text = ""
    thought_step = 0

    # 2. 获取或创建会话 + 保存用户消息 + 加载历史
    async with async_session() as db:
        if conv_id:
            conversation = await conversation_service.get_conversation(db, conv_id)
        else:
            conversation = None

        if conversation is None:
            title = req.message[:30] if len(req.message) <= 30 else req.message[:27] + "..."
            conversation = await conversation_service.create_conversation(db, title=title)

        conv_id = conversation.id

        # 保存用户消息
        await conversation_service.add_message(db, conv_id, "user", req.message)

        # 加载历史消息（包含刚保存的用户消息）
        history = await conversation_service.get_messages(db, conv_id)
        summary = conversation.summary or ""

    # 业务日志 + prompt 日志（单独文件）
    logger.info(
        "收到聊天请求 conversation=%s provider=%s model=%s len=%d",
        conv_id, llm_config.provider, llm_config.model, len(req.message),
    )
    log_prompt(
        session_id=conv_id,
        provider=llm_config.provider,
        model=llm_config.model or "",
        message=req.message,
        context=[c.model_dump() for c in (req.context or [])],
    )

    try:
        if req.enableThoughtChain:
            thought_step += 1
            yield _thought(thought_step, "理解你的问题", "running")
            yield _thought(thought_step, "理解你的问题", "success")
            thought_step += 1
            yield _thought(thought_step, f"调用模型 {llm_config.provider}/{llm_config.model}", "running")

        # 3. 构建上下文（排除最后一条用户消息，ContextBuilder 会单独添加 new_message）
        history_except_last = history[:-1] if history and history[-1].role == "user" else history

        context_messages = _context_builder.build_context(
            system_prompt=SYSTEM_PROMPT,
            history_messages=history_except_last,
            conversation_summary=summary,
            new_message=req.message,
        )

        # 4. 构建图并流式调用 — 传入完整上下文
        graph = build_graph(llm_config)

        if req.enableThoughtChain:
            yield _thought(thought_step, f"调用模型 {llm_config.provider}/{llm_config.model}", "success")

        try:
            async for chunk_msg, _metadata in graph.astream(
                {"messages": context_messages},
                stream_mode="messages",
            ):
                # 处理 AIMessage：可能是文本内容或工具调用
                if isinstance(chunk_msg, AIMessage):
                    # 工具调用事件：LLM 决定调用工具
                    if chunk_msg.tool_calls:
                        for tc in chunk_msg.tool_calls:
                            if req.enableThoughtChain:
                                thought_step += 1
                                yield _thought(thought_step, f"调用工具：{tc['name']}", "running")
                            yield ChatStreamChunk(
                                type="tool_call",
                                data=ToolCallData(
                                    toolName=tc["name"],
                                    args=tc.get("args", {}),
                                ).model_dump(),
                            )
                    # 文本内容：token 增量
                    delta = getattr(chunk_msg, "content", "") or ""
                    if delta:
                        full_text += delta
                        yield ChatStreamChunk(type="token", data=TokenData(delta=delta).model_dump())

                # 处理 ToolMessage：工具执行结果
                elif isinstance(chunk_msg, ToolMessage):
                    tool_name = chunk_msg.name or "unknown"
                    content = chunk_msg.content

                    # 尝试将结构化结果封装为富内容 chunk
                    parsed_content: Any
                    if isinstance(content, str):
                        try:
                            parsed_content = json.loads(content)
                        except (json.JSONDecodeError, TypeError):
                            parsed_content = content
                    else:
                        parsed_content = content

                    rich_chunk = format_rich_chunk(tool_name, parsed_content)
                    if rich_chunk is not None:
                        # 同时发出 tool_result chunk（简化结果摘要）
                        summary = str(parsed_content)[:200] if not isinstance(parsed_content, str) else parsed_content[:200]
                        yield ChatStreamChunk(
                            type="rich_chunk",
                            data=rich_chunk.data,
                        )
                        yield ChatStreamChunk(
                            type="tool_call",
                            data=ToolCallData(
                                toolName=tool_name,
                                args={},
                                resultSummary=summary[:200] + ("..." if len(summary) > 200 else ""),
                            ).model_dump(),
                        )
                    else:
                        # 无法封装为富内容 → 发出传统 tool_call chunk
                        if isinstance(content, str):
                            summary = content[:200] + ("..." if len(content) > 200 else "")
                        else:
                            summary = str(content)[:200]
                        yield ChatStreamChunk(
                            type="tool_call",
                            data=ToolCallData(
                                toolName=tool_name,
                                args={},
                                resultSummary=summary,
                            ).model_dump(),
                        )

                    if req.enableThoughtChain:
                        yield _thought(thought_step, f"工具 {tool_name} 执行完成", "success")

            if not full_text:
                yield ChatStreamChunk(type="token", data=TokenData(delta="（模型未返回内容）").model_dump())

            # 自动检测结构化 MD 报告 → 推送 report rich_chunk 到工作台
            if _is_markdown_report(full_text):
                report_title = _extract_report_title(full_text)
                report_content = ReportContent(title=report_title, markdown=full_text).model_dump()
                yield ChatStreamChunk(
                    type="rich_chunk",
                    data=RichChunk(type="report", content=report_content).model_dump(),
                )
        finally:
            # 无论流是否正常完成（客户端断开/异常），都保存 assistant 消息
            if full_text:
                try:
                    async with async_session() as db:
                        await conversation_service.add_message(db, conv_id, "assistant", full_text)

                        # 重新加载历史，检查是否需要压缩
                        all_history = await conversation_service.get_messages(db, conv_id)
                        if _context_builder.should_compress(all_history):
                            to_compress, _to_keep = _context_compressor.split_messages_for_compression(all_history, keep_recent=10)
                            if to_compress:
                                new_summary = await _context_compressor.compress(
                                    to_compress, existing_summary=summary, llm_config=llm_config
                                )
                                await conversation_service.update_summary(db, conv_id, new_summary)
                except Exception:
                    logger.exception("保存 assistant 消息失败 conversation=%s", conv_id)

                # 自动保存 Markdown 报告到会话文件夹
                if _is_markdown_report(full_text):
                    try:
                        from datetime import datetime as _dt
                        timestamp = _dt.now().strftime("%Y%m%d_%H%M%S")
                        report_title = _extract_report_title(full_text)
                        safe_title = "".join(c for c in report_title if c.isalnum() or c in " _-").strip()[:30]
                        filename = f"report_{timestamp}_{safe_title}.md"
                        session_file_service.save_file(conv_id, filename, full_text, "report")
                    except Exception:
                        logger.exception("自动保存报告失败 conversation=%s", conv_id)

        latency = int((time.monotonic() - started) * 1000)
        logger.info("聊天完成 conversation=%s 输出字符=%d 耗时=%dms", conv_id, len(full_text), latency)
        log_response(
            session_id=conv_id,
            provider=llm_config.provider,
            model=llm_config.model or "",
            response=full_text,
            latency_ms=latency,
        )
        yield ChatStreamChunk(type="done", data=DoneData(sessionId=conv_id, conversationId=conv_id).model_dump())

    except AppError as exc:
        logger.warning("聊天业务错误 conversation=%s: %s", conv_id, exc.message)
        log_response(
            session_id=conv_id, provider=llm_config.provider, model=llm_config.model or "",
            error=exc.message,
        )
        yield ChatStreamChunk(
            type="error", data=ErrorData(code=str(exc.code), message=exc.message).model_dump()
        )
        yield ChatStreamChunk(type="done", data=DoneData(sessionId=conv_id, conversationId=conv_id).model_dump())
    except Exception as exc:  # noqa: BLE001 - 任何异常都转为可读 error chunk
        logger.exception("聊天调用失败 conversation=%s", conv_id)
        message = f"模型调用失败：{exc}"
        if "api_key" in str(exc).lower() or "401" in str(exc) or "Unauthorized" in str(exc):
            message = "模型鉴权失败，请检查 devour-service/.env 中的 API Key 是否正确。"
        log_response(
            session_id=conv_id, provider=llm_config.provider, model=llm_config.model or "",
            error=str(exc),
        )
        yield ChatStreamChunk(type="error", data=ErrorData(code="LLM_ERROR", message=message).model_dump())
        yield ChatStreamChunk(type="done", data=DoneData(sessionId=conv_id, conversationId=conv_id).model_dump())
