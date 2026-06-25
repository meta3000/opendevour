/**
 * AlphaAgent · 持仓管理模块 Mock 数据
 */

import type { Holding, RiskMetrics, FactorExposure, AttributionItem, SectorAllocation, CorrelationCell } from '../types/portfolio';

/** 持仓明细 mock（10支持仓） — 使用 let 以支持运行时增删改 */
let _mockHoldings: Holding[] = [
  { id: 'h-001', symbol: '600519', name: '贵州茅台', sector: '消费', weight: 12.5, shares: 300, costPrice: 1420.00, currentPrice: 1682.00, pnlPct: 0.1845, pnlAmount: 78600, contribution: 2.31, riskScore: 2, agentSignal: 'hold', entryDate: '2023-06-15', notes: '核心持仓，长期持有' },
  { id: 'h-002', symbol: '300750', name: '宁德时代', sector: '新能源', weight: 10.8, shares: 2000, costPrice: 164.20, currentPrice: 183.42, pnlPct: 0.1170, pnlAmount: 38440, contribution: 1.26, riskScore: 3, agentSignal: 'buy', entryDate: '2023-09-20' },
  { id: 'h-003', symbol: '600036', name: '招商银行', sector: '金融', weight: 9.2, shares: 8000, costPrice: 28.90, currentPrice: 32.64, pnlPct: 0.1295, pnlAmount: 29920, contribution: 1.19, riskScore: 2, agentSignal: 'hold', entryDate: '2023-03-10' },
  { id: 'h-004', symbol: '002594', name: '比亚迪', sector: '新能源', weight: 8.6, shares: 1000, costPrice: 245.30, currentPrice: 263.80, pnlPct: 0.0754, pnlAmount: 18500, contribution: 0.65, riskScore: 4, agentSignal: 'buy', entryDate: '2024-01-08' },
  { id: 'h-005', symbol: '601012', name: '隆基绿能', sector: '新能源', weight: 7.4, shares: 10000, costPrice: 22.30, currentPrice: 28.94, pnlPct: 0.2978, pnlAmount: 66400, contribution: 2.20, riskScore: 4, agentSignal: 'buy', entryDate: '2023-11-25' },
  { id: 'h-006', symbol: '600276', name: '恒瑞医药', sector: '医药', weight: 6.8, shares: 5000, costPrice: 34.60, currentPrice: 38.74, pnlPct: 0.1197, pnlAmount: 20700, contribution: 0.81, riskScore: 3, agentSignal: 'hold', entryDate: '2024-02-14' },
  { id: 'h-007', symbol: '000333', name: '美的集团', sector: '消费', weight: 6.2, shares: 3000, costPrice: 52.40, currentPrice: 56.78, pnlPct: 0.0836, pnlAmount: 13140, contribution: 0.52, riskScore: 2, agentSignal: 'hold', entryDate: '2023-12-05' },
  { id: 'h-008', symbol: '000858', name: '五粮液', sector: '消费', weight: 5.8, shares: 1500, costPrice: 138.60, currentPrice: 122.50, pnlPct: -0.1162, pnlAmount: -24150, contribution: -1.34, riskScore: 3, agentSignal: 'sell', entryDate: '2023-08-30' },
  { id: 'h-009', symbol: '688981', name: '中芯国际', sector: '科技', weight: 4.9, shares: 2000, costPrice: 74.20, currentPrice: 82.40, pnlPct: 0.1105, pnlAmount: 16400, contribution: 0.54, riskScore: 4, agentSignal: 'hold', entryDate: '2024-03-12' },
  { id: 'h-010', symbol: '300760', name: '迈瑞医疗', sector: '医药', weight: 4.2, shares: 500, costPrice: 248.00, currentPrice: 262.40, pnlPct: 0.0581, pnlAmount: 7200, contribution: 0.24, riskScore: 2, agentSignal: 'hold', entryDate: '2024-01-20' },
];

/** 获取当前 mock 持仓列表（返回副本） */
export function getMockHoldings(): Holding[] {
  return [..._mockHoldings];
}

/** mock 添加持仓 */
export function mockAddPosition(data: { symbol: string; name?: string; quantity: number; avg_cost: number }): Holding {
  const id = `h-${Date.now()}`;
  const holding: Holding = {
    id,
    symbol: data.symbol,
    name: data.name ?? '',
    sector: '',
    weight: 0,
    shares: data.quantity,
    costPrice: data.avg_cost,
    currentPrice: data.avg_cost, // 新建时现价=成本价
    pnlPct: 0,
    pnlAmount: 0,
    contribution: 0,
    riskScore: 3,
    agentSignal: null,
    entryDate: new Date().toISOString().split('T')[0],
  };
  _mockHoldings = [..._mockHoldings, holding];
  return holding;
}

/** mock 更新持仓 */
export function mockUpdatePosition(id: string, data: Partial<{ name: string; quantity: number; avg_cost: number }>): Holding | null {
  let updated: Holding | null = null;
  _mockHoldings = _mockHoldings.map((h) => {
    if (h.id === id) {
      updated = {
        ...h,
        name: data.name ?? h.name,
        shares: data.quantity ?? h.shares,
        costPrice: data.avg_cost ?? h.costPrice,
      };
      return updated;
    }
    return h;
  });
  return updated;
}

/** mock 删除持仓 */
export function mockDeletePosition(id: string): boolean {
  const before = _mockHoldings.length;
  _mockHoldings = _mockHoldings.filter((h) => h.id !== id);
  return _mockHoldings.length < before;
}

// 保持向后兼容的导出（引用初始快照的地方不会断）
export const mockHoldings: Holding[] = _mockHoldings;

/** 风险指标 mock */
export const mockRiskMetrics: RiskMetrics = {
  sharpeRatio: 1.82,
  maxDrawdown: -0.0821,
  volatility: 0.1456,
  var95: 28430,
  beta: 0.87,
  informationRatio: 1.24,
  navValue: 1284763.50,
  todayReturn: 0.0231,
  ytdReturn: 0.1847,
  alphaReturn: 0.0623,
};

/** 因子暴露 mock */
export const mockFactorExposure: FactorExposure[] = [
  { factor: '动量因子', value: 0.72, type: 'momentum' },
  { factor: '价值因子', value: -0.38, type: 'value' },
  { factor: '质量因子', value: 0.54, type: 'quality' },
  { factor: '规模因子', value: -0.21, type: 'size' },
  { factor: '波动率', value: -0.45, type: 'volatility' },
  { factor: '流动性', value: 0.18, type: 'custom' },
];

/** 行业分布 mock */
export const mockSectorAllocation: SectorAllocation[] = [
  { sector: '新能源', weight: 26.8, returnContribution: 2.11 },
  { sector: '消费', weight: 24.5, returnContribution: 1.49 },
  { sector: '金融', weight: 9.2, returnContribution: 1.19 },
  { sector: '医药', weight: 11.0, returnContribution: 1.05 },
  { sector: '科技', weight: 4.9, returnContribution: 0.54 },
  { sector: '其他', weight: 23.6, returnContribution: 0.48 },
];

/** 相关性矩阵 mock（前 6 支） */
const symbols = ['600519', '300750', '600036', '002594', '601012', '600276'];
const names = ['茅台', '宁德时代', '招商银行', '比亚迪', '隆基绿能', '恒瑞医药'];

export const mockCorrelationMatrix: CorrelationCell[] = symbols.flatMap((row, i) =>
  symbols.map((col, j) => ({
    rowSymbol: row,
    colSymbol: col,
    correlation: i === j ? 1.0 : parseFloat((Math.random() * 0.8 - 0.2).toFixed(2)),
  }))
);

export const mockCorrelationSymbols = symbols.map((s, i) => ({ symbol: s, name: names[i] }));

/** 绩效归因 mock */
export const mockAttribution: AttributionItem[] = [
  { category: '新能源板块', contribution: 4.32, excessContribution: 2.18 },
  { category: '贵州茅台个股', contribution: 2.31, excessContribution: 1.45 },
  { category: '因子择时', contribution: 1.87, excessContribution: 0.92 },
  { category: '招商银行个股', contribution: 1.19, excessContribution: 0.56 },
  { category: '行业配置', contribution: 0.98, excessContribution: 0.34 },
  { category: '五粮液个股', contribution: -1.34, excessContribution: -0.78 },
  { category: '现金摩擦', contribution: -0.23, excessContribution: -0.12 },
];
