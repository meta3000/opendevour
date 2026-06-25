/**
 * AlphaAgent · 决策管理 API 客户端
 *
 * 对接后端 /api/v1/decisions 系列接口
 */

import type { ApiResponse } from './types';

/** 后端 Decision 数据结构 */
export interface DecisionDTO {
  id: string;
  action: string;
  symbol: string;
  reason: string;
  confidence: number;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  confirmed_at: string | null;
}

const BASE = '/api/v1/decisions';

/** 获取待确认决策列表 */
export async function getPendingDecisions(): Promise<ApiResponse<DecisionDTO[]>> {
  const res = await fetch(`${BASE}/pending`);
  return res.json();
}

/** 获取所有决策记录 */
export async function getAllDecisions(): Promise<ApiResponse<DecisionDTO[]>> {
  const res = await fetch(BASE);
  return res.json();
}

/** 确认决策 */
export async function confirmDecision(id: string): Promise<ApiResponse<DecisionDTO>> {
  const res = await fetch(`${BASE}/${id}/confirm`, { method: 'POST' });
  return res.json();
}

/** 拒绝决策 */
export async function rejectDecision(id: string): Promise<ApiResponse<DecisionDTO>> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  return res.json();
}
