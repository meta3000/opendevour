/**
 * 股票基础信息 API
 */

import type { ApiResponse } from './types';

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
  const res = await fetch(`/api/v1/stocks/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`);
  const json: ApiResponse = await res.json();
  return json.data as StockInfo[];
}
