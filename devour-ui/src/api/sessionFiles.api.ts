/**
 * 会话文件管理 API 客户端
 */

export interface SessionFile {
  filename: string;
  file_type: string;
  size: number;
  created_at: string;
}

export interface SessionFileContent {
  filename: string;
  content: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message || `错误 code=${json.code}`);
  return json.data as T;
}

export async function listSessionFiles(convId: string): Promise<SessionFile[]> {
  return request<SessionFile[]>(`/api/v1/conversations/${convId}/files`);
}

export async function readSessionFile(convId: string, filename: string): Promise<SessionFileContent> {
  return request<SessionFileContent>(`/api/v1/conversations/${convId}/files/${encodeURIComponent(filename)}`);
}

export async function saveSessionFile(
  convId: string, filename: string, content: string, fileType: string = 'text'
): Promise<SessionFile> {
  return request<SessionFile>(`/api/v1/conversations/${convId}/files`, {
    method: 'POST',
    body: JSON.stringify({ filename, content, file_type: fileType }),
  });
}

export async function deleteSessionFile(convId: string, filename: string): Promise<void> {
  await request(`/api/v1/conversations/${convId}/files/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });
}
