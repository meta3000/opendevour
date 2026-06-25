"""聊天接口的请求与 SSE chunk 模型。

严格对齐前端 `devour-ui/src/api/cockpit.api.ts` :
- 请求体 ChatStreamRequest
- SSE chunk：thought_step | token | tool_call | rich_content | rich_chunk | done | error
富内容 chunk 类型：chart_spec | decision_set | data_table | risk_alert | tool_result
"""

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel


class ContextRef(BaseModel):
    type: Literal["symbol", "report", "decision", "portfolio"]
    id: str
    label: str | None = None


class ChatStreamRequest(BaseModel):
    """POST /api/chat/stream 请求体。

    仅 message 必填；provider/model 可选，用于动态指定模型（默认走 .env 配置）。
    """

    message: str
    sessionId: str | None = None
    context: list[ContextRef] | None = None
    enableThoughtChain: bool = True
    # 动态模型配置（可选）
    provider: str | None = None
    model: str | None = None
    temperature: float | None = None


# ---- SSE chunk data 负载 ----


class ThoughtStepData(BaseModel):
    step: int
    title: str
    status: Literal["pending", "running", "success", "error"]
    detail: str | None = None


class TokenData(BaseModel):
    delta: str


class DoneData(BaseModel):
    sessionId: str
    totalTokens: int | None = None


class ToolCallData(BaseModel):
    """工具调用事件数据，对齐前端 ToolCallData。"""

    toolName: str
    args: dict[str, Any] = {}
    resultSummary: str | None = None


class ErrorData(BaseModel):
    code: str
    message: str


# ---- 富内容 chunk 子模型 ----


class ChartSpecContent(BaseModel):
    """G2图表规格"""

    chart_type: str  # line, bar, pie, heatmap, area
    title: str
    data: list[dict]
    x_field: str
    y_field: str
    series_field: Optional[str] = None
    description: Optional[str] = None


class DataTableContent(BaseModel):
    """数据表格"""

    title: str
    columns: list[dict]  # [{key, title, dataIndex, width?}]
    data: list[dict]
    summary: Optional[str] = None


class RiskAlertContent(BaseModel):
    """风险预警"""

    level: Literal["high", "medium", "low"]
    title: str
    description: str
    metrics: list[dict]  # [{name, value, threshold, status}]
    suggestions: list[str]


class DecisionSetContent(BaseModel):
    """决策建议集"""

    decisions: list[dict]  # [{action, symbol, reason, confidence}]
    summary: str


class ToolResultContent(BaseModel):
    """工具返回结果"""

    toolName: str
    result: Any  # 文本或结构化JSON
    summary: Optional[str] = None


class ReportContent(BaseModel):
    """MD 报告内容（AI 回复自动检测为结构化报告时推送）"""

    title: str
    markdown: str


class RichChunk(BaseModel):
    """富内容SSE chunk，type 决定 content 的具体结构"""

    type: Literal[
        "chart_spec",
        "decision_set",
        "data_table",
        "risk_alert",
        "tool_call",
        "tool_result",
        "report",
    ]
    content: Any  # 根据type不同，内容结构不同


ChunkType = Literal[
    "thought_step",
    "token",
    "tool_call",
    "rich_content",
    "rich_chunk",
    "done",
    "error",
]


class ChatStreamChunk(BaseModel):
    """单条 SSE 消息的数据结构（序列化后放入 `data:` 字段）。"""

    type: ChunkType
    data: dict[str, Any]
