/**
 * 股票基础信息 API
 */

import type { ApiResponse } from './types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface StockInfo {
  ts_code: string;
  name: string;
  industry?: string;
  list_date?: string;
}

/** 获取股票列表 */
export async function getStockList(params?: {
  exchange?: string;
  keyword?: string;
  limit?: number;
}): Promise<StockInfo[]> {
  if (USE_MOCK) {
    return [
      { ts_code: '000001.SZ', name: '平安银行', industry: '银行' },
      { ts_code: '600519.SH', name: '贵州茅台', industry: '白酒' },
      { ts_code: '300750.SZ', name: '宁德时代', industry: '新能源' },
    ];
  }
  
  const query = new URLSearchParams();
  if (params?.exchange) query.set('exchange', params.exchange);
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.limit) query.set('limit', String(params.limit));
  
  const res = await fetch(`/api/v1/stocks?${query.toString()}`);
  const json: ApiResponse = await res.json();
  return json.data as StockInfo[];
}

/** 搜索股票 */
export async function searchStocks(keyword: string, limit: number = 20): Promise<StockInfo[]> {
  if (USE_MOCK) {
    return getStockList({ keyword, limit });
  }
  
  const res = await fetch(`/api/v1/stocks/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`);
  const json: ApiResponse = await res.json();
  return json.data as StockInfo[];
}
