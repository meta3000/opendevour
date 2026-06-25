/**
 * AlphaAgent · 持仓管理类型定义
 * 用于持仓管理模块（Module 3）
 */

import type { DecisionAction } from './decision';

/**
 * 持仓明细
 * 对应 API: GET /api/portfolio/holdings
 */
export interface Holding {
  /** 持仓 ID */
  id: string;
  /** 股票代码 */
  symbol: string;
  /** 股票名称 */
  name: string;
  /** 所属行业 */
  sector: string;
  /** 仓位权重（百分比，如 12.5 表示 12.5%） */
  weight: number;
  /** 持股数量（股） */
  shares: number;
  /** 成本价（元） */
  costPrice: number;
  /** 当前价（元） */
  currentPrice: number;
  /** 浮盈亏百分比（-1 到 n，如 0.082 表示 +8.2%） */
  pnlPct: number;
  /** 浮盈亏金额（元） */
  pnlAmount: number;
  /** 对总收益的贡献度（百分比） */
  contribution: number;
  /** 风险得分 1–5 */
  riskScore: number;
  /** Agent 当前建议信号 */
  agentSignal: DecisionAction | null;
  /** 建仓日期 */
  entryDate: string;
  /** 持仓备注 */
  notes?: string;
}

/**
 * 风险指标
 * 对应 API: GET /api/portfolio/risk-metrics
 */
export interface RiskMetrics {
  /** 夏普比率 */
  sharpeRatio: number;
  /** 最大回撤（如 -0.128 表示 -12.8%） */
  maxDrawdown: number;
  /** 波动率（年化） */
  volatility: number;
  /** VaR 95%（每日最大损失，元） */
  var95: number;
  /** Beta 系数 */
  beta: number;
  /** 信息比率 */
  informationRatio: number;
  /** 组合净值 */
  navValue: number;
  /** 今日收益率 */
  todayReturn: number;
  /** 年初至今收益率 */
  ytdReturn: number;
  /** 基准超额收益 */
  alphaReturn: number;
}

/**
 * 因子暴露数据
 * 对应 API: GET /api/portfolio/factor-exposure
 */
export interface FactorExposure {
  /** 因子名称 */
  factor: string;
  /** 暴露值（-1 到 1） */
  value: number;
  /** 因子类型 */
  type: 'momentum' | 'value' | 'quality' | 'size' | 'volatility' | 'custom';
}

/**
 * 持仓相关性矩阵单元格
 * 对应 API: GET /api/portfolio/correlation
 */
export interface CorrelationCell {
  /** 行标的 */
  rowSymbol: string;
  /** 列标的 */
  colSymbol: string;
  /** 相关系数 -1 到 1 */
  correlation: number;
}

/**
 * 绩效归因项
 * 对应 API: GET /api/portfolio/attribution
 */
export interface AttributionItem {
  /** 归因类别（行业/因子/个股等） */
  category: string;
  /** 归因收益率贡献（百分比） */
  contribution: number;
  /** 相对基准的超额贡献 */
  excessContribution: number;
}

/**
 * 行业分布
 * 对应 API: GET /api/portfolio/sector-distribution
 */
export interface SectorAllocation {
  sector: string;
  /** 权重百分比 */
  weight: number;
  /** 收益贡献 */
  returnContribution: number;
}
