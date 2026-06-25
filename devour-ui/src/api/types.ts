/**
 * AlphaAgent · 公共 API 类型定义
 * 定义各模块通用的请求/响应类型
 * 所有接口均为纯类型定义，不含实际请求逻辑
 */

// ============================================================
// 通用类型
// ============================================================

/** HTTP 方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** 统一 API 响应包装 */
export interface ApiResponse<T> {
  /** 业务状态码，0=成功 */
  code: number;
  /** 提示消息 */
  message: string;
  /** 业务数据 */
  data: T;
  /** 服务端时间戳（ms） */
  timestamp: number;
  /** 请求追踪 ID */
  requestId: string;
}

/** 分页请求参数 */
export interface PaginationRequest {
  /** 页码，从 1 开始 */
  page: number;
  /** 每页数量，默认 20 */
  pageSize: number;
}

/** 分页响应包装 */
export interface PaginatedData<T> {
  /** 数据列表 */
  list: T[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/** 通用时间范围枚举 */
export type TimeRange = '1d' | '5d' | '20d' | '60d' | '120d' | '250d';

/** Agent 运行状态 */
export interface AgentStatus {
  /** Agent ID */
  agentId: string;
  /** Agent 名称 */
  name: string;
  /** 运行状态 */
  status: 'idle' | 'running' | 'error' | 'offline';
  /** 当前任务描述 */
  currentTask?: string;
  /** 最后活跃时间（ms） */
  lastActiveAt: number;
}

/** 数据源状态 */
export interface DataSourceStatus {
  /** 数据源 ID */
  id: string;
  /** 数据源名称 */
  name: string;
  /** 连接状态 */
  connected: boolean;
  /** 最后更新时间（ms） */
  lastUpdatedAt: number;
  /** 数据延迟（ms） */
  latencyMs?: number;
}
