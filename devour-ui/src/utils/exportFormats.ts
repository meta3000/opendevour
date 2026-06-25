/**
 * 导出相关的纯函数与常量（无 DOM / 无第三方库依赖）
 *
 * 抽离自 export.ts，便于在 node 环境下单测，且被 export.ts 复用与再导出。
 */

import type { ContentType, WorkbenchContent, TableData, SlidesData } from '../types/workbench';

/** 可导出的文件格式 */
export type ExportFormat = 'md' | 'txt' | 'csv' | 'excel' | 'pptx' | 'pdf' | 'png';

/** 各格式的中文标签与文件后缀 */
export const FORMAT_META: Record<ExportFormat, { label: string; ext: string }> = {
  md:    { label: 'Markdown (.md)', ext: 'md' },
  txt:   { label: '文本 (.txt)',     ext: 'txt' },
  csv:   { label: 'CSV (.csv)',      ext: 'csv' },
  excel: { label: 'Excel (.xlsx)',   ext: 'xlsx' },
  pptx:  { label: 'PPT (.pptx)',     ext: 'pptx' },
  pdf:   { label: 'PDF (.pdf)',      ext: 'pdf' },
  png:   { label: '图片 (.png)',     ext: 'png' },
};

/**
 * 按内容类型返回适用的导出格式列表（纯函数，可单测）。
 * 顺序即菜单展示顺序，首项为该类型的「原生/推荐」格式。
 */
export function formatsFor(type: ContentType): ExportFormat[] {
  switch (type) {
    case 'markdown':
    case 'report':
      return ['md', 'txt', 'pdf', 'png'];
    case 'text':
      return ['txt', 'md', 'pdf', 'png'];
    case 'table':
      return ['excel', 'csv', 'pdf', 'png'];
    case 'slides':
      return ['pptx', 'pdf', 'png'];
    case 'image':
      return ['png'];
    case 'pdf':
      return ['pdf', 'png'];
    case 'chart':
    case 'svg':
    case 'decision_set':
      return ['png', 'pdf'];
    default:
      return ['png'];
  }
}

/** 清洗文件名中的非法字符，空标题给出兜底 */
export function sanitizeFilename(title: string | undefined | null): string {
  const cleaned = (title ?? '').replace(/[\\/:*?"<>|\n\r\t]+/g, '_').trim();
  return cleaned || '工作台内容';
}

/** TableData → 二维数组（含表头行），用于 xlsx.aoa_to_sheet（纯函数） */
export function tableToAOA(table: TableData): (string | number)[][] {
  return [table.headers, ...table.rows];
}

/** 单个 CSV 字段转义（含逗号/引号/换行时加引号并转义内部引号） */
function escapeCsvCell(value: string | number): string {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** TableData → CSV 文本（纯函数）。前置 BOM 由下载环节负责。 */
export function toCSV(table: TableData): string {
  return tableToAOA(table)
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');
}

/** TableData → GitHub Flavored Markdown 表格（纯函数） */
export function tableToMarkdown(table: TableData): string {
  const head = `| ${table.headers.join(' | ')} |`;
  const sep = `| ${table.headers.map(() => '---').join(' | ')} |`;
  const body = table.rows.map((r) => `| ${r.map((c) => String(c ?? '')).join(' | ')} |`).join('\n');
  return [head, sep, body].filter(Boolean).join('\n');
}

/** SlidesData → 规范化结构（纯函数，便于单测页数/bullets） */
export function slidesToStructure(slides: SlidesData): { title: string; bullets: string[] }[] {
  return slides.slides.map((s) => ({ title: s.title, bullets: [...s.bullets] }));
}

/** SlidesData → Markdown 大纲（纯函数） */
export function slidesToMarkdown(slides: SlidesData): string {
  const parts = [`# ${slides.title}`, ''];
  slidesToStructure(slides).forEach((s, i) => {
    parts.push(`## ${i + 1}. ${s.title}`);
    s.bullets.forEach((b) => parts.push(`- ${b}`));
    parts.push('');
  });
  return parts.join('\n').trim();
}

/**
 * 任意内容 → Markdown 文本（用于 md/txt 导出，纯函数）。
 * markdown/text 直接用其字符串数据；table/slides 转换为文本表达。
 */
export function contentToMarkdown(content: WorkbenchContent): string {
  switch (content.type) {
    case 'markdown':
    case 'report':
    case 'text':
    case 'svg':
      return typeof content.data === 'string' ? content.data : String(content.data ?? '');
    case 'table':
      return tableToMarkdown(content.data as TableData);
    case 'slides':
      return slidesToMarkdown(content.data as SlidesData);
    default:
      return `# ${content.title}\n\n（${content.type} 类型内容，暂不支持文本导出）`;
  }
}
