/**
 * AlphaAgent · 市场发现 API 客户端
 *
 * 后端契约：/api/v1/market/*
 * 将后端简单数据模型转换为前端组件期望的 richer 类型。
 * 保留原有接口类型声明；新增 fetch 函数负责真实网络请求与数据转换。
 */

import type {
  HeatmapNode,
  SectorData,
  CapitalFlowItem,
  MarketSignal,
  SignalStrength,
} from '../types/market';
import type { ApiResponse, PaginatedData, PaginationRequest, TimeRange } from './types';

const API_BASE = '/api/v1/market';

/** 统一解包 ApiResponse。 */
async function unwrap<T>(resp: Response): Promise<T> {
  const json = (await resp.json()) as ApiResponse<T>;
  if (!resp.ok || json.code !== 0) {
    throw new Error(json.message || `请求失败：HTTP ${resp.status}`);
  }
  return json.data;
}

/** 构造查询字符串。 */
function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, String(value));
    }
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

// ============================================================
// 后端原始类型（仅用于转换）
// ============================================================

interface HeatmapSectorBackend {
  sector_code: string;
  sector_name: string;
  change_pct: number;
  amount: number;
  leading_stock: string;
  stock_count: number;
}

interface HeatmapBackend {
  date: string;
  sectors: HeatmapSectorBackend[];
}

interface SignalBackend {
  symbol: string;
  name: string;
  signal_type: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  description: string;
  timestamp: string;
}

// ============================================================
// 信号扫描接口
// ============================================================

/**
 * 获取信号扫描列表
 * @endpoint  GET /api/v1/market/signals
 * @param     query  请求参数
 * @returns   MarketSignal[]
 */
export interface GetSignalsRequest extends PaginationRequest {
  /** 发现策略 ID，如 "multi_factor_v2"（仅保留字段，后端暂不处理） */
  strategy?: string;
  /** 时间窗口（仅保留字段，后端暂不处理） */
  timeRange?: TimeRange;
  /** 信号方向筛选 */
  direction?: 'long' | 'short';
  /** 信号类型筛选（仅保留字段，后端暂不处理） */
  type?: 'factor' | 'technical' | 'fundamental' | 'event' | 'sentiment';
  /** 最低置信度（0-100），映射到后端 min_strength */
  minConfidence?: number;
  /** 行业筛选 */
  sector?: string;
}

export type GetSignalsResponse = ApiResponse<PaginatedData<MarketSignal>>;

/**
 * 将单条信号发送至驾驶舱
 * @endpoint  POST /api/market/signals/{signalId}/send-to-cockpit
 * @param     signalId  路径参数，信号 ID
 * @returns   ApiResponse<{ sessionId: string }>  返回新建的驾驶舱会话 ID
 */
export interface SendSignalToCockpitResponse extends ApiResponse<{
  /** 新建或关联的驾驶舱会话 ID */
  sessionId: string;
}> {}

// ============================================================
// 热力图接口
// ============================================================

/**
 * 获取市场热力图数据
 * @endpoint  GET /api/v1/market/heatmap
 * @param     query  请求参数
 * @returns   HeatmapNode[]
 */
export interface GetHeatmapRequest {
  /** 板块筛选（为空则返回全市场 Top N；仅前端过滤） */
  sector?: string;
  /** 返回数量限制，默认 100（仅前端过滤） */
  limit?: number;
  /** 节点大小映射字段（保留字段） */
  sizeField?: 'marketCap' | 'volume' | 'turnoverRate';
  /** 日期 YYYYMMDD */
  date?: string;
}

export type GetHeatmapResponse = ApiResponse<HeatmapNode[]>;

// ============================================================
// 板块数据接口
// ============================================================

/**
 * 获取板块轮动数据
 * @endpoint  GET /api/v1/market/heatmap
 * @param     timeRange  时间窗口（保留字段）
 * @returns   SectorData[]
 */
export interface GetSectorDataRequest {
  timeRange?: TimeRange;
}

export type GetSectorDataResponse = ApiResponse<SectorData[]>;

// ============================================================
// 资金流向接口
// ============================================================

/**
 * 获取板块资金流向数据
 * @endpoint  GET /api/v1/market/heatmap
 * @param     timeRange  时间窗口（保留字段）
 * @returns   CapitalFlowItem[]
 */
export interface GetCapitalFlowRequest {
  /** 时间窗口，默认 '1d'（保留字段） */
  timeRange?: TimeRange;
  /**
   * 返回数量限制，默认全部
   * 可用于只展示资金流入/出最多的 Top N
   */
  topN?: number;
}

export type GetCapitalFlowResponse = ApiResponse<CapitalFlowItem[]>;

// ============================================================
// 个股行情接口
// ============================================================

/**
 * K线数据单根
 */
export interface KlineBar {
  /** 交易日（YYYY-MM-DD） */
  date: string;
  /** 开盘价 */
  open: number;
  /** 收盘价 */
  close: number;
  /** 最高价 */
  high: number;
  /** 最低价 */
  low: number;
  /** 成交量（手） */
  volume: number;
  /** 成交额（元） */
  amount: number;
}

/**
 * 获取个股 K 线数据
 * @endpoint  GET /api/market/kline/{symbol}
 * @param     symbol     路径参数，股票代码（如 "300750"）
 * @param     period     K 线周期：'daily'|'weekly'|'monthly'
 * @param     timeRange  时间范围
 * @returns   ApiResponse<KlineBar[]>
 */
export interface GetKlineRequest {
  period?: 'daily' | 'weekly' | 'monthly';
  timeRange?: TimeRange;
}

export type GetKlineResponse = ApiResponse<KlineBar[]>;

// ============================================================
// 数据转换
// ============================================================

function toHeatmapNode(s: HeatmapSectorBackend): HeatmapNode {
  return {
    symbol: s.sector_code,
    name: s.sector_name,
    sector: s.sector_name,
    price: 0,
    // 后端为百分比数值，前端为小数
    changeRate: s.change_pct / 100,
    // 用成交额（亿）近似成交量展示
    volume: s.amount,
    // 用成交额 * 10 作为节点大小占位
    marketCap: Math.max(s.amount * 10, 1),
    turnoverRate: 0,
  };
}

function toSectorData(s: HeatmapSectorBackend): SectorData {
  // 将涨跌幅归一化为 0-1 的动量得分：-5% -> 0，+5% -> 1
  const momentum = Math.min(Math.max((s.change_pct + 5) / 10, 0), 1);
  return {
    sector: s.sector_name,
    todayChange: s.change_pct,
    fiveDayChange: 0,
    twentyDayChange: 0,
    // 用涨跌幅 * 成交额 / 100 作为资金净流入近似值
    netInflow: (s.change_pct * s.amount) / 100,
    momentumScore: momentum,
    valuationScore: 0.5,
  };
}

function toCapitalFlowItem(s: HeatmapSectorBackend): CapitalFlowItem {
  const net = (s.change_pct * s.amount) / 100;
  return {
    name: s.sector_name,
    netInflow: net,
    mainForceInflow: net * 0.8,
    retailInflow: net * 0.2,
  };
}

function toSignalStrength(strength: number): SignalStrength {
  if (strength >= 80) return 'very_strong';
  if (strength >= 60) return 'strong';
  if (strength >= 40) return 'moderate';
  return 'weak';
}

function parseTimestamp(ts: string): number {
  if (!ts) return Date.now();
  if (/^\d+$/.test(ts)) {
    // YYYYMMDD 等纯数字格式
    const n = parseInt(ts, 10);
    if (ts.length === 8) {
      const y = Math.floor(n / 10000);
      const m = Math.floor((n % 10000) / 100);
      const d = n % 100;
      return new Date(y, m - 1, d).getTime();
    }
    return n;
  }
  return new Date(ts).getTime() || Date.now();
}

function toMarketSignal(s: SignalBackend, index: number): MarketSignal {
  const direction = s.signal_type === 'bearish' ? 'short' : 'long';
  return {
    id: `${s.symbol}-${s.timestamp || index}`,
    symbol: s.symbol,
    name: s.name || s.symbol,
    sector: '市场',
    type: 'technical',
    direction,
    strength: toSignalStrength(s.strength),
    confidence: Math.round(s.strength),
    triggerFactors: s.description ? [s.description] : [],
    discoveryStrategy: '技术信号',
    triggeredAt: parseTimestamp(s.timestamp),
    currentPrice: 0,
    expectedReturn: 0,
  };
}

// ============================================================
// 真实 API 调用
// ============================================================

/** 获取市场热力图数据。 */
export async function fetchHeatmap(req: GetHeatmapRequest = {}): Promise<HeatmapNode[]> {
  const resp = await fetch(`${API_BASE}/heatmap${buildQuery({ date: req.date })}`);
  const data = await unwrap<HeatmapBackend>(resp);
  let nodes = data.sectors.map(toHeatmapNode);
  if (req.sector) {
    nodes = nodes.filter((n) => n.sector === req.sector);
  }
  if (req.limit) {
    nodes = nodes.slice(0, req.limit);
  }
  return nodes;
}

/** 获取板块轮动数据。 */
export async function fetchSectorData(_req: GetSectorDataRequest = {}): Promise<SectorData[]> {
  const resp = await fetch(`${API_BASE}/heatmap`);
  const data = await unwrap<HeatmapBackend>(resp);
  return data.sectors.map(toSectorData);
}

/** 获取板块资金流向数据。 */
export async function fetchCapitalFlow(req: GetCapitalFlowRequest = {}): Promise<CapitalFlowItem[]> {
  const resp = await fetch(`${API_BASE}/heatmap`);
  const data = await unwrap<HeatmapBackend>(resp);
  let items = data.sectors.map(toCapitalFlowItem).sort((a, b) => b.netInflow - a.netInflow);
  if (req.topN) {
    items = items.slice(0, req.topN);
  }
  return items;
}

/** 获取信号扫描列表。 */
export async function fetchSignals(req: GetSignalsRequest = { page: 1, pageSize: 20 }): Promise<MarketSignal[]> {
  const signalType = req.direction === 'long' ? 'bullish' : req.direction === 'short' ? 'bearish' : undefined;
  const resp = await fetch(
    `${API_BASE}/signals${buildQuery({
      signal_type: signalType,
      min_strength: req.minConfidence,
      sector: req.sector,
      limit: req.pageSize,
    })}`,
  );
  const data = await unwrap<SignalBackend[]>(resp);
  let signals = data.map(toMarketSignal);
  // 后端不支持的字段仅做前端过滤
  if (req.type) {
    signals = signals.filter((s) => s.type === req.type);
  }
  return signals;
}
