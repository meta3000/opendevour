/**
 * AlphaAgent · 市场数据类型定义
 * 用于市场发现模块（Module 2）
 */

/**
 * 市场热力图节点
 * 对应 API: GET /api/market/heatmap?date=YYYY-MM-DD
 */
export interface HeatmapNode {
  /** 股票代码 */
  symbol: string;
  /** 股票名称 */
  name: string;
  /** 所属板块 */
  sector: string;
  /** 当前价格（元） */
  price: number;
  /** 日涨跌幅（-1 到 1 的小数，如 0.032 表示 +3.2%） */
  changeRate: number;
  /** 成交量（万手） */
  volume: number;
  /** 流通市值（亿元，用于 treemap 节点大小） */
  marketCap: number;
  /** 换手率 */
  turnoverRate: number;
}

/** 板块数据（用于雷达图/轮动分析） */
export interface SectorData {
  /** 板块名称 */
  sector: string;
  /** 今日涨幅 */
  todayChange: number;
  /** 近5日涨幅 */
  fiveDayChange: number;
  /** 近20日涨幅 */
  twentyDayChange: number;
  /** 资金净流入（亿元） */
  netInflow: number;
  /** 动量得分（因子） */
  momentumScore: number;
  /** 估值得分（因子） */
  valuationScore: number;
}

/**
 * 资金流向数据
 * 对应 API: GET /api/market/capital-flow
 */
export interface CapitalFlowItem {
  /** 板块/股票名称 */
  name: string;
  /** 净流入金额（亿元，正=流入，负=流出） */
  netInflow: number;
  /** 主力资金净流入 */
  mainForceInflow: number;
  /** 散户资金净流入 */
  retailInflow: number;
}

/** 信号强度等级 */
export type SignalStrength = 'weak' | 'moderate' | 'strong' | 'very_strong';

/** 信号类型 */
export type SignalType = 'technical' | 'fundamental' | 'sentiment' | 'factor' | 'event';

/**
 * 市场信号（信号扫描表格行）
 * 对应 API: GET /api/market/signals
 */
export interface MarketSignal {
  /** 信号 ID */
  id: string;
  /** 股票代码 */
  symbol: string;
  /** 股票名称 */
  name: string;
  /** 所属板块 */
  sector: string;
  /** 信号类型 */
  type: SignalType;
  /** 信号方向 */
  direction: 'long' | 'short';
  /** 信号强度 */
  strength: SignalStrength;
  /** 置信度 0–100 */
  confidence: number;
  /** 触发因子列表 */
  triggerFactors: string[];
  /** 发现策略名称 */
  discoveryStrategy: string;
  /** 触发时间戳 */
  triggeredAt: number;
  /** 价格 */
  currentPrice: number;
  /** 预期收益率 */
  expectedReturn: number;
}

/**
 * 发现策略（搜索框下拉选项）
 * 对应 API: GET /api/strategies/discovery
 */
export interface DiscoveryStrategy {
  id: string;
  name: string;
  description: string;
  /** 策略类型 */
  type: 'factor' | 'event' | 'technical' | 'ai';
  /** 最近信号数 */
  recentSignals: number;
}
