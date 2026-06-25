/**
 * 工作台内容导出工具
 *
 * 按内容类型导出为 md / txt / csv / excel / pptx / pdf / png。
 * 采用主流开源库：
 * - xlsx (SheetJS)   → Excel
 * - pptxgenjs        → PPTX
 * - jspdf            → PDF（用 DOM 截图分页嵌入，正确渲染中文/表格/图表）
 * - html-to-image    → PNG 截图
 * - file-saver       → 触发浏览器下载
 *
 * 纯函数（formatsFor / tableToAOA / toCSV / slidesToStructure / contentToMarkdown 等）
 * 抽离在 ./exportFormats，便于单测并在此再导出；本文件仅保留依赖 DOM/库的薄封装。
 */

import * as XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import type { WorkbenchContent, TableData, SlidesData } from '../types/workbench';
import {
  FORMAT_META,
  formatsFor,
  sanitizeFilename,
  tableToAOA,
  toCSV,
  slidesToStructure,
  contentToMarkdown,
  type ExportFormat,
} from './exportFormats';

// 透传纯函数 / 常量，调用方统一从 utils/export 引入
export {
  FORMAT_META,
  formatsFor,
  sanitizeFilename,
  tableToAOA,
  toCSV,
  slidesToStructure,
  contentToMarkdown,
};
export type { ExportFormat };

// ============================================================
// 下载：基于 file-saver
// ============================================================

function downloadText(text: string, filename: string, mime: string, withBom = false) {
  const parts = withBom ? ['﻿', text] : [text];
  saveAs(new Blob(parts, { type: `${mime};charset=utf-8` }), filename);
}

/** 导出 Markdown 文件 */
export function exportMarkdown(content: WorkbenchContent) {
  downloadText(contentToMarkdown(content), `${sanitizeFilename(content.title)}.md`, 'text/markdown');
}

/** 导出纯文本文件 */
export function exportText(content: WorkbenchContent) {
  downloadText(contentToMarkdown(content), `${sanitizeFilename(content.title)}.txt`, 'text/plain');
}

/** 导出 CSV 文件（带 BOM，Excel 中文不乱码） */
export function exportCsv(content: WorkbenchContent) {
  const table = content.data as TableData;
  downloadText(toCSV(table), `${sanitizeFilename(content.title)}.csv`, 'text/csv', true);
}

/** 导出 Excel 文件 */
export function exportExcel(content: WorkbenchContent) {
  const table = content.data as TableData;
  const ws = XLSX.utils.aoa_to_sheet(tableToAOA(table));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (table.sheetName || 'Sheet1').slice(0, 31));
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  saveAs(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${sanitizeFilename(content.title)}.xlsx`,
  );
}

/** 导出 PPTX 文件（每张 slide 一页：标题 + bullets） */
export async function exportPptx(content: WorkbenchContent) {
  const data = content.data as SlidesData;
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  slidesToStructure(data).forEach((s) => {
    const slide = pptx.addSlide();
    slide.background = { color: '0F1117' };
    slide.addText(s.title, {
      x: 0.5, y: 0.4, w: '90%', h: 0.9, fontSize: 26, bold: true, color: 'F0F2F7',
    });
    if (s.bullets.length) {
      slide.addText(
        s.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        { x: 0.7, y: 1.6, w: '88%', h: 4.5, fontSize: 16, color: 'D4D9E8', lineSpacingMultiple: 1.3 },
      );
    }
  });
  await pptx.writeFile({ fileName: `${sanitizeFilename(content.title || data.title)}.pptx` });
}

// ============================================================
// DOM 截图 → PNG / PDF
// ============================================================

/** 在节点内寻找标记为可滚动的内容容器，找不到则用节点自身 */
function resolveCaptureEl(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>('[data-wb-scroll]') ?? root;
}

/**
 * 截取节点完整内容为 PNG dataURL（临时撑开滚动容器以截取全部内容）。
 * 返回 dataURL 及自然像素尺寸。
 */
async function captureNode(root: HTMLElement, pixelRatio = 2): Promise<{ dataUrl: string; width: number; height: number }> {
  const el = resolveCaptureEl(root);
  const prev = { height: el.style.height, maxHeight: el.style.maxHeight, overflow: el.style.overflow };
  el.style.height = 'auto';
  el.style.maxHeight = 'none';
  el.style.overflow = 'visible';
  const width = el.scrollWidth;
  const height = el.scrollHeight;
  try {
    const dataUrl = await toPng(el, { backgroundColor: '#0F1117', pixelRatio, width, height, cacheBust: true });
    return { dataUrl, width, height };
  } finally {
    el.style.height = prev.height;
    el.style.maxHeight = prev.maxHeight;
    el.style.overflow = prev.overflow;
  }
}

/** 导出当前内容截图为 PNG */
export async function exportPng(content: WorkbenchContent, node: HTMLElement | null) {
  if (!node) throw new Error('无法获取内容节点');
  const { dataUrl } = await captureNode(node);
  saveAs(dataUrl, `${sanitizeFilename(content.title)}.png`);
}

/** 把一张高图按 A4 分页装进 PDF */
function imageToPdf(dataUrl: string, natWidth: number, natHeight: number): jsPDF {
  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (natHeight / natWidth) * imgW;

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(dataUrl, 'PNG', 0, position, imgW, imgH, undefined, 'FAST');
  heightLeft -= pageH;
  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(dataUrl, 'PNG', 0, position, imgW, imgH, undefined, 'FAST');
    heightLeft -= pageH;
  }
  return pdf;
}

/** 导出当前内容为 PDF（DOM 截图分页，中文正常显示） */
export async function exportPdf(content: WorkbenchContent, node: HTMLElement | null) {
  // 已是 PDF：直接下载源文件
  if (content.type === 'pdf' && typeof content.data === 'string') {
    saveAs(content.data, `${sanitizeFilename(content.title)}.pdf`);
    return;
  }
  if (!node) throw new Error('无法获取内容节点');
  const { dataUrl, width, height } = await captureNode(node);
  const pdf = imageToPdf(dataUrl, width, height);
  pdf.save(`${sanitizeFilename(content.title)}.pdf`);
}

/** 导出图片：下载原图 */
export function exportImage(content: WorkbenchContent, node: HTMLElement | null) {
  if (typeof content.data === 'string' && content.data) {
    saveAs(content.data, `${sanitizeFilename(content.title)}.png`);
    return;
  }
  return exportPng(content, node);
}

// ============================================================
// 统一入口
// ============================================================

/** 按格式导出内容；png/pdf 需要传入已渲染的 DOM 节点 */
export async function exportContent(
  content: WorkbenchContent,
  format: ExportFormat,
  node?: HTMLElement | null,
): Promise<void> {
  switch (format) {
    case 'md':
      return exportMarkdown(content);
    case 'txt':
      return exportText(content);
    case 'csv':
      return exportCsv(content);
    case 'excel':
      return exportExcel(content);
    case 'pptx':
      return exportPptx(content);
    case 'pdf':
      return exportPdf(content, node ?? null);
    case 'png':
      return content.type === 'image'
        ? exportImage(content, node ?? null)
        : exportPng(content, node ?? null);
    default:
      throw new Error(`不支持的导出格式：${format}`);
  }
}
