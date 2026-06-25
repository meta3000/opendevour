/**
 * AlphaAgent · Agent 决策类型定义
 * 表示 AI Agent 生成的买入/卖出/持有建议
 */

/** 决策动作类型 */
export type DecisionAction = 'buy' | 'sell' | 'hold';

/**
 * Agent 决策建议
 * 对应 API: GET /api/decisions/pending
 */
export interface Decision {
  /** 唯一标识符 */
  id: string;
  /** 股票代码（如 "600519"） */
  symbol: string;
  /** 股票名称（如 "贵州茅台"） */
  name: string;
  /** 决策动作 */
  action: DecisionAction;
  /**
   * 置信度 0–100
   * 用于渲染置信度进度条
   */
  confidence: number;
  /** 目标价（元）*/
  targetPrice: number;
  /** 止损价（元）*/
  stopPrice: number;
  /** 建议仓位调整（正=加仓，负=减仓，如 +2.5 表示加仓 2.5%） */
  positionDelta: number;
  /** 预期盈亏百分比 */
  expectedPnlPct: number;
  /** AI 推理摘要（最多显示 2 行） */
  reasoning: string;
  /** 触发该决策的核心因子列表 */
  triggerFactors: string[];
  /** 决策生成时间戳（Unix ms） */
  createdAt: number;
  /** 决策状态 */
  status: 'pending' | 'confirmed' | 'dismissed' | 'expired';
}

/**
 * 确认决策请求体
 * 对应 API: POST /api/decisions/:id/confirm
 */
export interface ConfirmDecisionRequest {
  /** 决策 ID */
  id: string;
  /** 实际执行价格（可选，默认用市价） */
  executionPrice?: number;
  /** 备注 */
  note?: string;
}

/**
 * 忽略决策请求体
 * 对应 API: POST /api/decisions/:id/dismiss
 */
export interface DismissDecisionRequest {
  id: string;
  /** 忽略原因（optional） */
  reason?: string;
}
