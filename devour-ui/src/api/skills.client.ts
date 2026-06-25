/**
 * AlphaAgent · Skills 工作区 API 客户端
 *
 * 调用后端 /api/skills/*，解包统一 ApiResponse。契约见 devour-service api/v1/skills.py。
 */

import type { ApiResponse } from './types';

export type SkillScope = 'public' | 'private';

export interface SkillTreeNode {
  key: string;
  title: string;
  isLeaf: boolean;
  type: 'dir' | 'file';
  ext: string;
  size: number;
  children?: SkillTreeNode[] | null;
}

export interface SkillFile {
  scope: SkillScope;
  path: string;
  name: string;
  language: string;
  size: number;
  editable: boolean;
  previewable: boolean;
  content: string;
  reason?: string | null;
}

/** 标准 skill 目录（含 SKILL.md），供对话框 / 唤起 */
export interface SkillCatalogItem {
  name: string;
  folder: string;
  scope: SkillScope;
  path: string;
  description: string;
}

async function unwrap<T>(resp: Response): Promise<T> {
  const json = (await resp.json()) as ApiResponse<T>;
  if (!resp.ok || json.code !== 0) {
    throw new Error(json.message || `请求失败：HTTP ${resp.status}`);
  }
  return json.data;
}

/** 拉取某 scope 的文件树 */
export async function fetchSkillTree(scope: SkillScope): Promise<SkillTreeNode[]> {
  const resp = await fetch(`/api/skills/tree?scope=${scope}`);
  const data = await unwrap<{ scope: SkillScope; tree: SkillTreeNode[] }>(resp);
  return data.tree;
}

/** 拉取所有标准 skill（含 SKILL.md 的顶层文件夹） */
export async function fetchSkillCatalog(): Promise<SkillCatalogItem[]> {
  const resp = await fetch('/api/skills/catalog');
  const data = await unwrap<{ skills: SkillCatalogItem[] }>(resp);
  return data.skills;
}

/** 读取单个文件 */
export async function fetchSkillFile(scope: SkillScope, path: string): Promise<SkillFile> {
  const resp = await fetch(`/api/skills/file?scope=${scope}&path=${encodeURIComponent(path)}`);
  return unwrap<SkillFile>(resp);
}

/** 保存文件（仅 private） */
export async function saveSkillFile(scope: SkillScope, path: string, content: string): Promise<string> {
  const resp = await fetch('/api/skills/file', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope, path, content }),
  });
  const data = await unwrap<{ path: string }>(resp);
  return data.path;
}

/** 复制公共文件/文件夹到我的 Skills，返回新相对路径 */
export async function copySkill(scope: SkillScope, path: string): Promise<string> {
  const resp = await fetch('/api/skills/copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope, path }),
  });
  const data = await unwrap<{ path: string }>(resp);
  return data.path;
}
