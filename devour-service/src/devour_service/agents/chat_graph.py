"""AI 助手对话图（LangGraph ReAct 模式）。

基于 LangGraph 的 Tool Binding + ReAct 循环：
1. 用户消息 → assistant（带 tools 绑定的 LLM）
2. 如果 LLM 输出包含 tool_calls → 路由到 tool_node（执行工具）
3. 工具结果回到 assistant → 继续推理或输出最终回答
4. 如果 LLM 无 tool_calls → 结束

通过 `graph.astream(..., stream_mode="messages")` 可获得 LLM 的 token 级流式输出。
"""

from __future__ import annotations

from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from ..agents.tools import (
    get_market_overview,
    get_stock_info,
    get_sector_rotation,
    analyze_portfolio_risk,
    get_portfolio_summary,
    generate_investment_decision,
)
from ..llm.factory import build_chat_model
from ..llm.schemas import LLMConfig

SYSTEM_PROMPT = """你是 AlphaAgent 智能投研助手，一位专业的量化投资分析师。

## 角色定位
- 专注于A股市场的投资研究与分析
- 擅长基本面分析、技术分析、量化因子分析
- 能调用工具获取实时市场数据和持仓信息

## 输出规范
你的回复应尽可能以**结构化Markdown报告**格式输出，方便展示在工作台。

### 报告格式模板：
```markdown
# [报告标题]

## 摘要
[一句话总结核心结论]

## 分析详情
[具体分析内容，使用表格、列表等结构化展示]

| 指标 | 数值 | 评估 |
|------|------|------|
| ... | ... | ... |

## 结论与建议
- [建议1]
- [建议2]

## 风险提示
[相关风险说明]
```

### 工作规则：
1. 当用户询问市场/个股/持仓相关问题时，先调用对应工具获取数据
2. 基于数据生成结构化分析报告
3. 重要发现应生成投资决策建议（调用generate_investment_decision工具）
4. 数据展示优先使用表格格式
5. 涉及数字时注明单位和时间范围
6. 始终提供风险提示

### 可用工具说明：
- get_market_overview: 获取市场全景（指数、板块、信号）
- get_stock_info: 查询个股实时行情
- get_sector_rotation: 分析板块轮动
- analyze_portfolio_risk: 分析持仓组合风险
- get_portfolio_summary: 获取持仓概况
- generate_investment_decision: 生成投资决策建议
"""

# 所有可调用的工具列表
ALL_TOOLS = [
    get_market_overview,
    get_stock_info,
    get_sector_rotation,
    analyze_portfolio_risk,
    get_portfolio_summary,
    generate_investment_decision,
]


def build_graph(llm_config: LLMConfig):
    """根据给定模型配置编译一个带 Tool Binding 的 ReAct 对话图。

    注意：system prompt 已由调用方（ContextBuilder）包含在 messages 中，
    assistant 节点不再自动插入 SystemMessage。
    """
    model = build_chat_model(llm_config)
    # 将工具绑定到 LLM，使其能在推理时自主决定是否调用
    model_with_tools = model.bind_tools(ALL_TOOLS)

    # 预构建的 ToolNode，负责执行 LLM 输出的 tool_calls
    tool_node = ToolNode(ALL_TOOLS)

    async def assistant(state: MessagesState) -> dict:
        """Assistant 节点：调用绑定了 tools 的 LLM。
        注意：system prompt 已由调用方（ContextBuilder）包含在 state messages 中。
        """
        response = await model_with_tools.ainvoke(state["messages"])
        return {"messages": [response]}

    # 构建状态图
    builder = StateGraph(MessagesState)
    builder.add_node("assistant", assistant)
    builder.add_node("tools", tool_node)

    # 入口 → assistant
    builder.add_edge(START, "assistant")

    # 条件边：assistant 输出后判断是否需要调用工具
    # tools_condition 检查最后一条消息是否有 tool_calls：
    #   - 有 → 路由到 "tools" 节点
    #   - 无 → 路由到 END
    builder.add_conditional_edges("assistant", tools_condition)

    # 工具执行结果回到 assistant 继续推理
    builder.add_edge("tools", "assistant")

    return builder.compile()
