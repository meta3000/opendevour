/**
 * AlphaAgent · 智能驾驶舱 API 接口定义
 *
 * 所有接口均为纯类型/接口声明，不含实际网络请求逻辑。
 * 实际实现时应使用 fetch/axios 封装并替换 Mock 数据。
 */

import type { Decision } from '../types/decision';
import type { WorkbenchContent, RichChunk, ChartSpecContent, DataTableContent, RiskAlertContent, DecisionSetContent, ToolResultContent } from '../types/workbench';
import type { ApiResponse } from './types';

// ============================================================
// 聊天流式接口
// ============================================================

/**
 * 上下文引用（告知 Agent 当前关注的标的/报告）
 */
export interface ContextRef {
  /** 引用类型 */
  type: 'symbol' | 'report' | 'decision' | 'portfolio';
  /** 引用 ID（股票代码/报告ID等） */
  id: string;
  /** 可选的显示名称 */
  label?: string;
}

/**
 * 聊天消息请求体
 * @endpoint  POST /api/chat/stream
 * @returns   SSE 流，Content-Type: text/event-stream
 */
export interface ChatStreamRequest {
  /** 用户输入的消息文本 */
  message: string;
  /** 会话 ID（优先使用，续接历史对话） */
  conversationId?: string;
  /** 会话 ID，续接历史对话（保留向后兼容） */
  sessionId?: string;
  /** 当前工作台上下文引用（可选，辅助 Agent 理解背景） */
  context?: ContextRef[];
  /**
   * 是否启用思考链（CoT）推理
   * 开启后 Agent 会先发送 thought_step 类型事件，再给出最终回答
   * @default true
   */
  enableThoughtChain?: boolean;
}

/**
 * SSE 流式响应 chunk 类型
 */
export type ChatStreamChunkType =
  | 'thought_step'   // 思考链步骤（中间过程，不展示给用户的思维）
  | 'token'          // 文本 token 增量（拼接成最终回复）
  | 'tool_call'      // Agent 调用工具（如查询行情、运行策略）
  | 'rich_content'   // 富内容推送（图表/报告/决策集）到工作台
  | 'rich_chunk'     // 结构化富内容 chunk（chart_spec/decision_set/data_table/risk_alert/tool_result）
  | 'done'           // 流结束标志
  | 'error';         // 错误

/**
 * SSE 单个 chunk 数据结构
 *
 * 示例（EventStream 格式）:
 * ```
 * event: message
 * data: {"type":"thought_step","data":{"step":1,"title":"检索行情数据","status":"running"}}
 * ```
 */
export interface ChatStreamChunk {
  type: ChatStreamChunkType;
  data:
    | ThoughtStepData   // type === 'thought_step'
    | TokenData         // type === 'token'
    | ToolCallData      // type === 'tool_call'
    | RichContentData   // type === 'rich_content'
    | RichChunk         // type === 'rich_chunk'
    | DoneData          // type === 'done'
    | ErrorData;        // type === 'error'
}

/** 思考链步骤数据 */
export interface ThoughtStepData {
  /** 步骤序号（1-based） */
  step: number;
  /** 步骤标题，如"检索行情数据" */
  title: string;
  /** 步骤运行状态 */
  status: 'pending' | 'running' | 'success' | 'error';
  /** 步骤详情（可选，展示给用户） */
  detail?: string;
}

/** 文本 token 增量数据 */
export interface TokenData {
  /** 增量文本片段，客户端累积拼接 */
  delta: string;
}

/** 工具调用事件数据 */
export interface ToolCallData {
  /** 工具名称（如 "query_market_data", "run_factor_strategy"） */
  toolName: string;
  /** 工具调用参数（JSON对象） */
  args: Record<string, unknown>;
  /** 工具执行结果摘要（可选，展示给用户） */
  resultSummary?: string;
}

/** 富内容推送数据（推送到工作台 Tabs） */
export interface RichContentData {
  /** 推送到工作台的内容对象（直接映射为 WorkbenchContent） */
  content: WorkbenchContent;
}

/** 流结束标志 */
export interface DoneData {
  /** 会话 ID（服务端分配，首次对话时要保存到客户端） */
  sessionId: string;
  /** 会话 ID（与 sessionId 相同，新字段） */
  conversationId?: string;
  /** 本次 token 消耗量（可选，用于计费/监控） */
  totalTokens?: number;
}

/** 错误数据 */
export interface ErrorData {
  code: string;
  message: string;
}

// Re-export rich chunk types from workbench for convenience
export type {
  RichChunk as RichChunkData,
  ChartSpecContent,
  DataTableContent,
  RiskAlertContent,
  DecisionSetContent,
  ToolResultContent,
} from '../types/workbench';

// ============================================================
// 决策管理接口
// ============================================================

/**
 * 确认/拒绝 Agent 决策
 * @endpoint  POST /api/decisions/{decisionId}/confirm
 * @param     decisionId  路径参数，决策 ID
 * @param     body        确认请求体
 * @returns   ApiResponse<{ success: boolean }>
 */
export interface DecisionConfirmRequest {
  /** 执行动作（用户可以在确认时修改） */
  action: 'buy' | 'sell' | 'hold';
  /** 最终仓位大小（百分比，0–100） */
  finalSize?: number;
  /** 用户备注 */
  note?: string;
}

/**
 * 驳回 Agent 决策
 * @endpoint  DELETE /api/decisions/{decisionId}
 * @param     decisionId  路径参数，决策 ID
 * @param     body        驳回原因（可选）
 * @returns   ApiResponse<{ success: boolean }>
 */
export interface DecisionDismissRequest {
  /** 驳回原因 */
  reason?: string;
}

/**
 * 获取待确认决策列表
 * @endpoint  GET /api/decisions/pending
 * @returns   ApiResponse<Decision[]>
 */
export type GetPendingDecisionsResponse = ApiResponse<Decision[]>;

// ============================================================
// 工作台内容接口
// ============================================================

/**
 * 获取工作台内容详情
 * @endpoint  GET /api/workbench/content/{contentId}
 * @param     contentId  路径参数，内容 ID
 * @returns   ApiResponse<WorkbenchContent>
 */
export type GetWorkbenchContentResponse = ApiResponse<WorkbenchContent>;

/**
 * 删除工作台内容 Tab
 * @endpoint  DELETE /api/workbench/content/{contentId}
 * @returns   ApiResponse<{ success: boolean }>
 */
export type DeleteWorkbenchContentResponse = ApiResponse<{ success: boolean }>;

// ============================================================
// Agent 状态接口
// ============================================================

/**
 * 获取所有 Agent 运行状态
 * @endpoint  GET /api/agents/status
 * @returns   ApiResponse<AgentStatusItem[]>
 */
export interface AgentStatusItem {
  agentId: string;
  name: string;
  status: 'idle' | 'running' | 'error' | 'offline';
  currentTask?: string;
  lastActiveAt: number;
}

export type GetAgentStatusResponse = ApiResponse<AgentStatusItem[]>;
