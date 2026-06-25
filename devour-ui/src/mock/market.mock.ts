/**
 * AlphaAgent · 市场发现模块 Mock 数据
 */

import type { HeatmapNode, SectorData, CapitalFlowItem, MarketSignal } from '../types/market';


/** 热力图节点 mock（40支股票） */
export const mockHeatmapNodes: HeatmapNode[] = [
  { symbol: '300750', name: '宁德时代', sector: '新能源', price: 183.42, changeRate: 0.0356, volume: 892.3, marketCap: 4023.5, turnoverRate: 0.021 },
  { symbol: '002594', name: '比亚迪', sector: '新能源', price: 263.80, changeRate: 0.0218, volume: 1243.6, marketCap: 7634.2, turnoverRate: 0.016 },
  { symbol: '601012', name: '隆基绿能', sector: '新能源', price: 28.94, changeRate: 0.0487, volume: 2134.8, marketCap: 2189.3, turnoverRate: 0.098 },
  { symbol: '600519', name: '贵州茅台', sector: '消费', price: 1682.00, changeRate: -0.0089, volume: 45.2, marketCap: 21142.3, turnoverRate: 0.003 },
  { symbol: '000858', name: '五粮液', sector: '消费', price: 122.50, changeRate: -0.0234, volume: 234.7, marketCap: 4756.8, turnoverRate: 0.006 },
  { symbol: '600036', name: '招商银行', sector: '金融', price: 32.64, changeRate: 0.0125, volume: 3421.3, marketCap: 8219.6, turnoverRate: 0.042 },
  { symbol: '601318', name: '中国平安', sector: '金融', price: 48.92, changeRate: -0.0156, volume: 2876.4, marketCap: 8912.3, turnoverRate: 0.031 },
  { symbol: '600276', name: '恒瑞医药', sector: '医药', price: 38.74, changeRate: 0.0312, volume: 1234.5, marketCap: 2198.7, turnoverRate: 0.056 },
  { symbol: '300015', name: '爱尔眼科', sector: '医药', price: 16.82, changeRate: 0.0089, volume: 876.3, marketCap: 834.2, turnoverRate: 0.105 },
  { symbol: '603259', name: '药明康德', sector: '医药', price: 42.16, changeRate: -0.0421, volume: 987.2, marketCap: 1423.6, turnoverRate: 0.069 },
  { symbol: '688599', name: '天合光能', sector: '新能源', price: 18.36, changeRate: 0.0564, volume: 3421.7, marketCap: 786.3, turnoverRate: 0.143 },
  { symbol: '002304', name: '洋河股份', sector: '消费', price: 98.20, changeRate: -0.0178, volume: 123.4, marketCap: 1476.8, turnoverRate: 0.008 },
  { symbol: '000333', name: '美的集团', sector: '消费', price: 56.78, changeRate: 0.0234, volume: 1234.6, marketCap: 3987.2, turnoverRate: 0.031 },
  { symbol: '002415', name: '海康威视', sector: '科技', price: 28.42, changeRate: -0.0312, volume: 2134.8, marketCap: 2712.4, turnoverRate: 0.078 },
  { symbol: '600887', name: '伊利股份', sector: '消费', price: 28.96, changeRate: 0.0156, volume: 876.3, marketCap: 1867.3, turnoverRate: 0.046 },
  { symbol: '300760', name: '迈瑞医疗', sector: '医药', price: 262.40, changeRate: 0.0089, volume: 134.5, marketCap: 3152.7, turnoverRate: 0.011 },
  { symbol: '600900', name: '长江电力', sector: '公用事业', price: 28.34, changeRate: 0.0045, volume: 1234.7, marketCap: 6214.8, turnoverRate: 0.020 },
  { symbol: '601888', name: '中国中免', sector: '消费', price: 68.50, changeRate: -0.0267, volume: 234.6, marketCap: 1423.5, turnoverRate: 0.016 },
  { symbol: '688111', name: '金山办公', sector: '科技', price: 192.30, changeRate: 0.0423, volume: 89.4, marketCap: 756.3, turnoverRate: 0.012 },
  { symbol: '002460', name: '赣锋锂业', sector: '材料', price: 32.64, changeRate: -0.0534, volume: 1987.4, marketCap: 658.3, turnoverRate: 0.302 },
  { symbol: '600941', name: '中国移动', sector: '电信', price: 88.20, changeRate: 0.0112, volume: 765.3, marketCap: 19872.4, turnoverRate: 0.004 },
  { symbol: '000725', name: '京东方A', sector: '科技', price: 4.82, changeRate: 0.0187, volume: 12345.6, marketCap: 1423.7, turnoverRate: 0.085 },
  { symbol: '002714', name: '牧原股份', sector: '农业', price: 48.62, changeRate: -0.0189, volume: 678.9, marketCap: 1245.6, turnoverRate: 0.054 },
  { symbol: '600031', name: '三一重工', sector: '机械', price: 16.42, changeRate: 0.0267, volume: 2134.5, marketCap: 1356.8, turnoverRate: 0.157 },
  { symbol: '000002', name: '万科A', sector: '地产', price: 6.82, changeRate: -0.0389, volume: 4312.7, marketCap: 798.3, turnoverRate: 0.541 },
  { symbol: '601628', name: '中国人寿', sector: '金融', price: 32.16, changeRate: 0.0078, volume: 1234.6, marketCap: 9123.4, turnoverRate: 0.013 },
  { symbol: '603288', name: '海天味业', sector: '消费', price: 34.20, changeRate: -0.0123, volume: 234.5, marketCap: 912.4, turnoverRate: 0.026 },
  { symbol: '688036', name: '传音控股', sector: '科技', price: 82.64, changeRate: 0.0534, volume: 234.7, marketCap: 346.2, turnoverRate: 0.067 },
  { symbol: '300122', name: '智飞生物', sector: '医药', price: 38.42, changeRate: 0.0278, volume: 456.8, marketCap: 462.3, turnoverRate: 0.099 },
  { symbol: '601766', name: '中国中车', sector: '机械', price: 7.82, changeRate: 0.0156, volume: 5678.9, marketCap: 2134.6, turnoverRate: 0.027 },
  { symbol: '000001', name: '平安银行', sector: '金融', price: 10.82, changeRate: -0.0212, volume: 6789.3, marketCap: 2098.7, turnoverRate: 0.032 },
  { symbol: '600028', name: '中国石化', sector: '石油', price: 5.62, changeRate: 0.0089, volume: 7890.4, marketCap: 4821.3, turnoverRate: 0.016 },
  { symbol: '601919', name: '中远海控', sector: '交运', price: 13.42, changeRate: -0.0345, volume: 2345.6, marketCap: 987.4, turnoverRate: 0.238 },
  { symbol: '002049', name: '紫光国微', sector: '科技', price: 76.80, changeRate: 0.0612, volume: 345.6, marketCap: 312.4, turnoverRate: 0.111 },
  { symbol: '688981', name: '中芯国际', sector: '科技', price: 82.40, changeRate: 0.0234, volume: 567.8, marketCap: 1654.2, turnoverRate: 0.034 },
  { symbol: '601127', name: '赛力斯', sector: '新能源', price: 82.64, changeRate: 0.0423, volume: 1234.5, marketCap: 876.3, turnoverRate: 0.141 },
  { symbol: '000100', name: 'TCL科技', sector: '科技', price: 7.24, changeRate: -0.0089, volume: 3456.7, marketCap: 765.4, turnoverRate: 0.045 },
  { symbol: '600809', name: '山西汾酒', sector: '消费', price: 142.60, changeRate: -0.0156, volume: 89.3, marketCap: 1096.4, turnoverRate: 0.008 },
  { symbol: '002352', name: '顺丰控股', sector: '交运', price: 36.40, changeRate: 0.0178, volume: 567.8, marketCap: 987.3, turnoverRate: 0.058 },
  { symbol: '300274', name: '阳光电源', sector: '新能源', price: 68.24, changeRate: 0.0389, volume: 456.7, marketCap: 754.2, turnoverRate: 0.060 },
];

/** 板块轮动数据（雷达图） */
export const mockSectorData: SectorData[] = [
  { sector: '新能源', todayChange: 2.34, fiveDayChange: 8.12, twentyDayChange: 15.6, netInflow: 45.2, momentumScore: 0.82, valuationScore: 0.45 },
  { sector: '消费', todayChange: -0.89, fiveDayChange: -2.34, twentyDayChange: 3.2, netInflow: -12.3, momentumScore: 0.38, valuationScore: 0.72 },
  { sector: '医药', todayChange: 1.12, fiveDayChange: 3.56, twentyDayChange: 8.9, netInflow: 18.7, momentumScore: 0.56, valuationScore: 0.61 },
  { sector: '科技', todayChange: 1.87, fiveDayChange: 5.23, twentyDayChange: 12.4, netInflow: 32.1, momentumScore: 0.74, valuationScore: 0.38 },
  { sector: '金融', todayChange: 0.34, fiveDayChange: 1.12, twentyDayChange: 2.8, netInflow: 5.6, momentumScore: 0.29, valuationScore: 0.83 },
  { sector: '地产', todayChange: -2.45, fiveDayChange: -6.78, twentyDayChange: -8.9, netInflow: -28.4, momentumScore: 0.12, valuationScore: 0.89 },
  { sector: '军工', todayChange: 0.98, fiveDayChange: 2.34, twentyDayChange: 6.7, netInflow: 8.9, momentumScore: 0.48, valuationScore: 0.52 },
  { sector: '材料', todayChange: -1.23, fiveDayChange: -3.45, twentyDayChange: -2.1, netInflow: -15.2, momentumScore: 0.22, valuationScore: 0.67 },
];

/** 资金流向 mock */
export const mockCapitalFlow: CapitalFlowItem[] = [
  { name: '新能源', netInflow: 45.2, mainForceInflow: 38.6, retailInflow: 6.6 },
  { name: '科技', netInflow: 32.1, mainForceInflow: 28.4, retailInflow: 3.7 },
  { name: '医药', netInflow: 18.7, mainForceInflow: 15.2, retailInflow: 3.5 },
  { name: '金融', netInflow: 5.6, mainForceInflow: 4.8, retailInflow: 0.8 },
  { name: '军工', netInflow: 8.9, mainForceInflow: 7.2, retailInflow: 1.7 },
  { name: '消费', netInflow: -12.3, mainForceInflow: -9.8, retailInflow: -2.5 },
  { name: '材料', netInflow: -15.2, mainForceInflow: -12.1, retailInflow: -3.1 },
  { name: '地产', netInflow: -28.4, mainForceInflow: -24.6, retailInflow: -3.8 },
].sort((a, b) => b.netInflow - a.netInflow);

/** 信号扫描表格 mock（20 条） */
export const mockSignals: MarketSignal[] = [
  { id: 's-001', symbol: '300750', name: '宁德时代', sector: '新能源', type: 'factor', direction: 'long', strength: 'very_strong', confidence: 87, triggerFactors: ['动量', '资金流'], discoveryStrategy: '多因子选股V2', triggeredAt: Date.now() - 720000, currentPrice: 183.42, expectedReturn: 0.123 },
  { id: 's-002', symbol: '688036', name: '传音控股', sector: '科技', type: 'fundamental', direction: 'long', strength: 'strong', confidence: 81, triggerFactors: ['盈利超预期', '海外拓展'], discoveryStrategy: '基本面突破', triggeredAt: Date.now() - 1440000, currentPrice: 82.64, expectedReturn: 0.187 },
  { id: 's-003', symbol: '002049', name: '紫光国微', sector: '科技', type: 'technical', direction: 'long', strength: 'strong', confidence: 76, triggerFactors: ['均线突破', '成交量放大'], discoveryStrategy: '技术形态识别', triggeredAt: Date.now() - 2160000, currentPrice: 76.80, expectedReturn: 0.156 },
  { id: 's-004', symbol: '000002', name: '万科A', sector: '地产', type: 'event', direction: 'short', strength: 'moderate', confidence: 63, triggerFactors: ['政策利空', '债务压力'], discoveryStrategy: '事件驱动', triggeredAt: Date.now() - 3600000, currentPrice: 6.82, expectedReturn: -0.089 },
  { id: 's-005', symbol: '601012', name: '隆基绿能', sector: '新能源', type: 'factor', direction: 'long', strength: 'very_strong', confidence: 84, triggerFactors: ['成长因子', '行业趋势'], discoveryStrategy: '多因子选股V2', triggeredAt: Date.now() - 4320000, currentPrice: 28.94, expectedReturn: 0.198 },
  { id: 's-006', symbol: '603259', name: '药明康德', sector: '医药', type: 'sentiment', direction: 'short', strength: 'moderate', confidence: 58, triggerFactors: ['舆情负向', '资金流出'], discoveryStrategy: '情绪分析', triggeredAt: Date.now() - 5400000, currentPrice: 42.16, expectedReturn: -0.067 },
  { id: 's-007', symbol: '600276', name: '恒瑞医药', sector: '医药', type: 'factor', direction: 'long', strength: 'strong', confidence: 79, triggerFactors: ['质量因子', '创新药研发'], discoveryStrategy: '多因子选股V2', triggeredAt: Date.now() - 6300000, currentPrice: 38.74, expectedReturn: 0.134 },
  { id: 's-008', symbol: '688981', name: '中芯国际', sector: '科技', type: 'technical', direction: 'long', strength: 'moderate', confidence: 67, triggerFactors: ['底部反转', '量能配合'], discoveryStrategy: '技术形态识别', triggeredAt: Date.now() - 7200000, currentPrice: 82.40, expectedReturn: 0.089 },
  { id: 's-009', symbol: '000333', name: '美的集团', sector: '消费', type: 'fundamental', direction: 'long', strength: 'strong', confidence: 75, triggerFactors: ['盈利稳健', '分红提升'], discoveryStrategy: '基本面突破', triggeredAt: Date.now() - 8100000, currentPrice: 56.78, expectedReturn: 0.112 },
  { id: 's-010', symbol: '002460', name: '赣锋锂业', sector: '材料', type: 'factor', direction: 'short', strength: 'strong', confidence: 72, triggerFactors: ['动量反转', '供需失衡'], discoveryStrategy: '反转策略', triggeredAt: Date.now() - 9000000, currentPrice: 32.64, expectedReturn: -0.123 },
  { id: 's-011', symbol: '002594', name: '比亚迪', sector: '新能源', type: 'factor', direction: 'long', strength: 'very_strong', confidence: 89, triggerFactors: ['动量', '销量超预期'], discoveryStrategy: '多因子选股V2', triggeredAt: Date.now() - 9900000, currentPrice: 263.80, expectedReturn: 0.145 },
  { id: 's-012', symbol: '300760', name: '迈瑞医疗', sector: '医药', type: 'fundamental', direction: 'long', strength: 'moderate', confidence: 65, triggerFactors: ['出海加速', '竞争优势'], discoveryStrategy: '基本面突破', triggeredAt: Date.now() - 10800000, currentPrice: 262.40, expectedReturn: 0.098 },
  { id: 's-013', symbol: '601127', name: '赛力斯', sector: '新能源', type: 'event', direction: 'long', strength: 'strong', confidence: 78, triggerFactors: ['问界M9爆款', '与华为深度合作'], discoveryStrategy: '事件驱动', triggeredAt: Date.now() - 11700000, currentPrice: 82.64, expectedReturn: 0.167 },
  { id: 's-014', symbol: '601919', name: '中远海控', sector: '交运', type: 'factor', direction: 'short', strength: 'moderate', confidence: 61, triggerFactors: ['运价下行', '周期逆转'], discoveryStrategy: '周期轮动', triggeredAt: Date.now() - 12600000, currentPrice: 13.42, expectedReturn: -0.078 },
  { id: 's-015', symbol: '688111', name: '金山办公', sector: '科技', type: 'factor', direction: 'long', strength: 'strong', confidence: 74, triggerFactors: ['AI 增长', '订阅收入'], discoveryStrategy: '成长因子', triggeredAt: Date.now() - 13500000, currentPrice: 192.30, expectedReturn: 0.156 },
  { id: 's-016', symbol: '300122', name: '智飞生物', sector: '医药', type: 'technical', direction: 'long', strength: 'moderate', confidence: 62, triggerFactors: ['突破整理区间', '量能放大'], discoveryStrategy: '技术形态识别', triggeredAt: Date.now() - 14400000, currentPrice: 38.42, expectedReturn: 0.089 },
  { id: 's-017', symbol: '600031', name: '三一重工', sector: '机械', type: 'event', direction: 'long', strength: 'moderate', confidence: 59, triggerFactors: ['基建政策加码', '海外订单'], discoveryStrategy: '事件驱动', triggeredAt: Date.now() - 15300000, currentPrice: 16.42, expectedReturn: 0.073 },
  { id: 's-018', symbol: '000858', name: '五粮液', sector: '消费', type: 'factor', direction: 'short', strength: 'moderate', confidence: 64, triggerFactors: ['库存高企', '渠道承压'], discoveryStrategy: '基本面分析', triggeredAt: Date.now() - 16200000, currentPrice: 122.50, expectedReturn: -0.056 },
  { id: 's-019', symbol: '688599', name: '天合光能', sector: '新能源', type: 'technical', direction: 'long', strength: 'strong', confidence: 77, triggerFactors: ['强势突破', '主力建仓'], discoveryStrategy: '技术形态识别', triggeredAt: Date.now() - 17100000, currentPrice: 18.36, expectedReturn: 0.189 },
  { id: 's-020', symbol: '002352', name: '顺丰控股', sector: '交运', type: 'fundamental', direction: 'long', strength: 'weak', confidence: 54, triggerFactors: ['业绩改善', '市占率提升'], discoveryStrategy: '基本面突破', triggeredAt: Date.now() - 18000000, currentPrice: 36.40, expectedReturn: 0.065 },
];
