/**
 * 定时任务管理 API 客户端
 */

const BASE = '/api/v1/scheduler';

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  trigger_type: 'cron' | 'interval';
  trigger_args: Record<string, number>;
  enabled: boolean;
  last_run: string | null;
  last_status: 'success' | 'failed' | 'running' | null;
  next_run: string | null;
}

export interface UpdateSchedulePayload {
  trigger_type: 'cron' | 'interval';
  trigger_args: Record<string, number>;
}

// --------------------------------------------------------------------------
// 辅助
// --------------------------------------------------------------------------

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[scheduler API] ${res.status} ${text}`);
  }
  const json = await res.json();
  return json.data as T;
}

// --------------------------------------------------------------------------
// API 函数
// --------------------------------------------------------------------------

/** 获取所有定时任务列表 */
export async function getScheduledTasks(): Promise<ScheduledTask[]> {
  return request<ScheduledTask[]>(`${BASE}/tasks`);
}

/** 获取单个任务详情 */
export async function getScheduledTask(taskId: string): Promise<ScheduledTask> {
  return request<ScheduledTask>(`${BASE}/tasks/${taskId}`);
}

/** 立即执行一次任务 */
export async function runTaskNow(taskId: string): Promise<void> {
  await request(`${BASE}/tasks/${taskId}/run`, { method: 'POST' });
}

/** 启用任务 */
export async function enableTask(taskId: string): Promise<void> {
  await request(`${BASE}/tasks/${taskId}/enable`, { method: 'POST' });
}

/** 禁用任务 */
export async function disableTask(taskId: string): Promise<void> {
  await request(`${BASE}/tasks/${taskId}/disable`, { method: 'POST' });
}

/** 更新任务调度配置 */
export async function updateTaskSchedule(
  taskId: string,
  payload: UpdateSchedulePayload,
): Promise<ScheduledTask> {
  return request<ScheduledTask>(`${BASE}/tasks/${taskId}/schedule`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
