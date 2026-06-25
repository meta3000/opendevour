/**
 * AlphaAgent · 持仓管理 API 客户端
 *
 * 真实 API 基础路径：/api/portfolios/
 * 当 VITE_USE_MOCK=true 时回退到 Mock 数据
 */

import type {
  Holding, RiskMetrics, FactorExposure, AttributionItem, SectorAllocation, CorrelationCell,
} from '../types/portfolio';
import type { ApiResponse } from './types';
import {
  getMockHoldings, mockAddPosition, mockUpdatePosition, mockDeletePosition,
  mockRiskMetrics, mockFactorExposure,
  mockSectorAllocation, mockCorrelationMatrix, mockCorrelationSymbols,
  mockAttribution,
} from '../mock/portfolio.mock';

// ---------------------------------------------------------------------------
// 通用请求封装
// ---------------------------------------------------------------------------

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message || `业务错误 code=${json.code}`);
  }
  return json.data as T;
}

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 后端返回的持仓数据（snake_case → camelCase 映射在调用处处理） */
export interface PositionDTO {
  id: number;
  portfolio_id: number;
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  pnl_amount: number;
  pnl_pct: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface PortfolioDTO {
  id: number;
  name: string;
  description: string;
  created_at: string | null;
  updated_at: string | null;
  position_count?: number;
  positions?: PositionDTO[];
}

export interface ImportHoldingsResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

export interface RiskMetricsDTO {
  sharpe_ratio: number;
  max_drawdown: number;
  volatility: number;
  var95: number;
  beta: number;
  information_ratio: number;
  nav_value: number;
  today_return: number;
  ytd_return: number;
  alpha_return: number;
  concentration: number;
}

// ---------------------------------------------------------------------------
// 数据转换：后端 DTO → 前端类型
// ---------------------------------------------------------------------------

function positionToHolding(pos: PositionDTO, totalValue?: number): Holding {
  const marketValue = pos.quantity * pos.current_price;
  const weight = totalValue ? (marketValue / totalValue) * 100 : 0;
  return {
    id: String(pos.id),
    symbol: pos.symbol,
    name: pos.name,
    sector: pos.sector,
    weight,
    shares: pos.quantity,
    costPrice: pos.avg_cost,
    currentPrice: pos.current_price,
    pnlPct: pos.pnl_pct,
    pnlAmount: pos.pnl_amount,
    contribution: 0,
    riskScore: 3,
    agentSignal: null,
    entryDate: pos.created_at?.split('T')[0] ?? '',
    notes: undefined,
  };
}

function riskDtoToMetrics(dto: RiskMetricsDTO): RiskMetrics {
  return {
    sharpeRatio: dto.sharpe_ratio,
    maxDrawdown: dto.max_drawdown,
    volatility: dto.volatility,
    var95: dto.var95,
    beta: dto.beta,
    informationRatio: dto.information_ratio,
    navValue: dto.nav_value,
    todayReturn: dto.today_return,
    ytdReturn: dto.ytd_return,
    alphaReturn: dto.alpha_return,
  };
}

// ---------------------------------------------------------------------------
// API 调用（含 Mock fallback）
// ---------------------------------------------------------------------------

/** 获取默认组合的持仓列表 */
export async function getHoldings(portfolioId: number = 1): Promise<Holding[]> {
  if (USE_MOCK) return getMockHoldings();

  const dto = await request<{ positions: PositionDTO[] }>(
    `/api/portfolios/${portfolioId}`,
  );
  const positions = dto.positions ?? [];
  const totalValue = positions.reduce((s, p) => s + p.quantity * p.current_price, 0);
  return positions.map((p) => positionToHolding(p, totalValue));
}

/** 添加持仓 */
export async function addPosition(
  portfolioId: number,
  data: { symbol: string; name?: string; quantity: number; avg_cost: number },
): Promise<Holding> {
  if (USE_MOCK) {
    return mockAddPosition(data);
  }
  const pos = await request<PositionDTO>(`/api/portfolios/${portfolioId}/positions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return positionToHolding(pos);
}

/** 更新持仓 */
export async function updatePosition(
  portfolioId: number,
  positionId: number | string,
  data: Partial<{ name: string; quantity: number; avg_cost: number }>,
): Promise<Holding | null> {
  if (USE_MOCK) {
    return mockUpdatePosition(String(positionId), data);
  }
  const pos = await request<PositionDTO>(`/api/portfolios/${portfolioId}/positions/${positionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return positionToHolding(pos);
}

/** 删除持仓 */
export async function deletePosition(
  portfolioId: number,
  positionId: number | string,
): Promise<void> {
  if (USE_MOCK) {
    mockDeletePosition(String(positionId));
    return;
  }
  await request<null>(`/api/portfolios/${portfolioId}/positions/${positionId}`, {
    method: 'DELETE',
  });
}

/** 获取风险指标 */
export async function getRiskMetrics(portfolioId: number = 1): Promise<RiskMetrics> {
  if (USE_MOCK) return mockRiskMetrics;

  const dto = await request<RiskMetricsDTO>(`/api/portfolios/${portfolioId}/risk`);
  return riskDtoToMetrics(dto);
}

/** 获取因子暴露 */
export async function getFactorExposure(_portfolioId: number = 1): Promise<FactorExposure[]> {
  // 因子暴露暂未有后端端点，使用 mock
  return mockFactorExposure;
}

/** 获取相关性矩阵 */
export async function getCorrelation(_portfolioId: number = 1): Promise<{
  cells: CorrelationCell[];
  symbols: Array<{ symbol: string; name: string }>;
}> {
  // 相关性矩阵暂未有后端端点，使用 mock
  return { cells: mockCorrelationMatrix, symbols: mockCorrelationSymbols };
}

/** 获取绩效归因 */
export async function getAttribution(_portfolioId: number = 1): Promise<AttributionItem[]> {
  // 绩效归因暂未有后端端点，使用 mock
  return mockAttribution;
}

/** 获取行业分布 */
export async function getSectorAllocation(_portfolioId: number = 1): Promise<SectorAllocation[]> {
  // 行业分布暂未有后端端点，使用 mock
  return mockSectorAllocation;
}

/** 导入持仓 */
export async function importPositions(
  portfolioId: number,
  records: Array<{ symbol: string; name?: string; quantity?: number; avg_cost?: number; current_price?: number; sector?: string }>,
): Promise<ImportHoldingsResult> {
  if (USE_MOCK) {
    return { imported: records.length, skipped: 0, errors: [] };
  }
  return request<ImportHoldingsResult>(`/api/portfolios/${portfolioId}/import`, {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}

/** 刷新持仓价格 */
export async function refreshPrices(portfolioId: number = 1): Promise<void> {
  if (USE_MOCK) return;
  await request<null>(`/api/portfolios/${portfolioId}/refresh`, { method: 'POST' });
}

/** 发送组合至驾驶舱 */
export async function sendPortfolioToCockpit(portfolioId: number = 1): Promise<{ sessionId: string }> {
  if (USE_MOCK) {
    return { sessionId: `sess-mock-${Date.now()}` };
  }
  // 暂用占位端点
  return request(`/api/portfolios/${portfolioId}/send-to-cockpit`, { method: 'POST' });
}

/** 获取所有投资组合 */
export async function getPortfolios(): Promise<PortfolioDTO[]> {
  if (USE_MOCK) {
    return [{ id: 1, name: '默认组合', description: '', created_at: null, updated_at: null, position_count: 0 }];
  }
  return request<PortfolioDTO[]>('/api/portfolios');
}

/** 创建投资组合 */
export async function createPortfolio(data: { name: string; description?: string }): Promise<PortfolioDTO> {
  if (USE_MOCK) {
    return { id: Date.now(), name: data.name, description: data.description || '', created_at: null, updated_at: null };
  }
  return request<PortfolioDTO>('/api/portfolios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 更新投资组合 */
export async function updatePortfolio(
  portfolioId: number,
  data: { name?: string; description?: string }
): Promise<PortfolioDTO> {
  if (USE_MOCK) {
    return { id: portfolioId, name: data.name || '默认组合', description: data.description || '', created_at: null, updated_at: null };
  }
  return request<PortfolioDTO>(`/api/portfolios/${portfolioId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** 删除投资组合 */
export async function deletePortfolio(portfolioId: number): Promise<void> {
  if (USE_MOCK) return;
  await request<null>(`/api/portfolios/${portfolioId}`, { method: 'DELETE' });
}
