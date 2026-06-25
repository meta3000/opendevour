/**
 * AlphaAgent · 驾驶舱 Mock 数据
 * 用于开发和 UI 预览，对应实际 API 数据结构
 */

import type { Decision } from '../types/decision';

/** 投资组合 KPI mock 数据 */
export const mockPortfolioKPIs = {
  /** 组合净值 */
  navValue: 1284763.50,
  /** 今日收益率 */
  todayReturn: 0.0231,
  /** 年初至今收益率 */
  ytdReturn: 0.1847,
  /** 夏普比率 */
  sharpeRatio: 1.82,
  /** 最大回撤 */
  maxDrawdown: -0.0821,
  /** 今日 Agent 决策次数 */
  todayDecisionCount: 3,
  /** 信息比率 */
  informationRatio: 1.24,
};

/** Agent 待确认决策 mock（最多展示 5 条） */
export const mockPendingDecisions: Decision[] = [
  {
    id: 'd-001',
    symbol: '300750',
    name: '宁德时代',
    action: 'buy',
    confidence: 87,
    targetPrice: 198.50,
    stopPrice: 172.00,
    positionDelta: 2.5,
    expectedPnlPct: 12.3,
    reasoning: '动量因子持续强势，Q3 电池出货量超预期 +18%，机构资金持续净流入，均线多头排列。技术面突破关键压力位 185 元，成交量配合。',
    triggerFactors: ['动量', '基本面', '资金流'],
    createdAt: Date.now() - 1000 * 60 * 12,
    status: 'pending',
  },
  {
    id: 'd-002',
    symbol: '600519',
    name: '贵州茅台',
    action: 'hold',
    confidence: 72,
    targetPrice: 1750.00,
    stopPrice: 1580.00,
    positionDelta: 0,
    expectedPnlPct: 4.2,
    reasoning: '估值偏高但品牌护城河稳固，春节旺季备货预期支撑短期价格，维持当前 8% 仓位不变。',
    triggerFactors: ['估值', '季节性'],
    createdAt: Date.now() - 1000 * 60 * 35,
    status: 'pending',
  },
  {
    id: 'd-003',
    symbol: '000858',
    name: '五粮液',
    action: 'sell',
    confidence: 64,
    targetPrice: 112.00,
    stopPrice: 138.00,
    positionDelta: -3.0,
    expectedPnlPct: -6.1,
    reasoning: '白酒板块整体承压，渠道库存去化压力加大，技术面破位，量能萎缩，建议减仓至 3%。',
    triggerFactors: ['技术面', '行业景气'],
    createdAt: Date.now() - 1000 * 60 * 58,
    status: 'pending',
  },
  {
    id: 'd-004',
    symbol: '601012',
    name: '隆基绿能',
    action: 'buy',
    confidence: 79,
    targetPrice: 32.80,
    stopPrice: 26.50,
    positionDelta: 1.5,
    expectedPnlPct: 18.7,
    reasoning: '光伏装机需求回暖，TOPCon 技术转换率新高，海外市场开拓加速。低估值高成长性，适量加仓。',
    triggerFactors: ['成长因子', '行业趋势'],
    createdAt: Date.now() - 1000 * 60 * 90,
    status: 'pending',
  },
  {
    id: 'd-005',
    symbol: '002594',
    name: '比亚迪',
    action: 'buy',
    confidence: 83,
    targetPrice: 298.00,
    stopPrice: 246.00,
    positionDelta: 2.0,
    expectedPnlPct: 15.2,
    reasoning: '新能源汽车销量持续强势，出海战略超预期，刀片电池技术壁垒高，估值合理。',
    triggerFactors: ['动量', '基本面', '出口'],
    createdAt: Date.now() - 1000 * 60 * 125,
    status: 'pending',
  },
];

/** 因子信号 mock 数据（双向条形图数据） */
export const mockFactorSignals = [
  { factor: '动量因子', value: 0.72 },
  { factor: '价值因子', value: -0.38 },
  { factor: '质量因子', value: 0.54 },
  { factor: '规模因子', value: -0.21 },
  { factor: '波动率', value: -0.45 },
  { factor: '流动性', value: 0.18 },
];

/** 净值曲线 mock 数据（过去 180 天） */
export const mockEquityCurve = (() => {
  const data: { date: string; portfolio: number; benchmark: number }[] = [];
  let portfolio = 1.0;
  let benchmark = 1.0;
  const now = new Date();
  for (let i = 180; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    portfolio *= 1 + (Math.random() - 0.46) * 0.018;
    benchmark *= 1 + (Math.random() - 0.48) * 0.012;
    data.push({
      date: dateStr,
      portfolio: parseFloat(portfolio.toFixed(4)),
      benchmark: parseFloat(benchmark.toFixed(4)),
    });
  }
  return data;
})();
