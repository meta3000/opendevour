/**
 * 导出纯函数单元测试（vitest，node 环境，无 DOM 依赖）
 */

import { describe, it, expect } from 'vitest';
import {
  formatsFor,
  sanitizeFilename,
  tableToAOA,
  toCSV,
  tableToMarkdown,
  slidesToStructure,
  slidesToMarkdown,
  contentToMarkdown,
} from './exportFormats';
import type { WorkbenchContent, TableData, SlidesData } from '../types/workbench';

const table: TableData = {
  sheetName: '持仓',
  headers: ['代码', '名称', '权重'],
  rows: [
    ['300750', '宁德时代', 10.8],
    ['600519', '贵州茅台', 12.5],
  ],
};

const slides: SlidesData = {
  title: '季度路演',
  slides: [
    { title: '概览', bullets: ['净值 128 万', '收益 +9.4%'] },
    { title: '展望', bullets: ['维持新能源高配'] },
  ],
};

describe('formatsFor', () => {
  it('markdown / report → md,txt,pdf,png', () => {
    expect(formatsFor('markdown')).toEqual(['md', 'txt', 'pdf', 'png']);
    expect(formatsFor('report')).toEqual(['md', 'txt', 'pdf', 'png']);
  });
  it('text 首选 txt', () => {
    expect(formatsFor('text')[0]).toBe('txt');
  });
  it('table → excel,csv,pdf,png', () => {
    expect(formatsFor('table')).toEqual(['excel', 'csv', 'pdf', 'png']);
  });
  it('slides 首选 pptx', () => {
    expect(formatsFor('slides')[0]).toBe('pptx');
  });
  it('image 只给 png', () => {
    expect(formatsFor('image')).toEqual(['png']);
  });
  it('每种类型至少给一种格式', () => {
    (['markdown', 'text', 'table', 'slides', 'chart', 'svg', 'pdf', 'image', 'report', 'decision_set'] as const)
      .forEach((t) => expect(formatsFor(t).length).toBeGreaterThan(0));
  });
});

describe('sanitizeFilename', () => {
  it('替换非法字符', () => {
    expect(sanitizeFilename('a/b:c*d?')).toBe('a_b_c_d_');
  });
  it('空标题兜底', () => {
    expect(sanitizeFilename('')).toBe('工作台内容');
    expect(sanitizeFilename(null)).toBe('工作台内容');
    expect(sanitizeFilename('   ')).toBe('工作台内容');
  });
  it('保留正常中文标题', () => {
    expect(sanitizeFilename('持仓明细表')).toBe('持仓明细表');
  });
});

describe('tableToAOA', () => {
  it('表头在首行，行序保持', () => {
    const aoa = tableToAOA(table);
    expect(aoa[0]).toEqual(['代码', '名称', '权重']);
    expect(aoa).toHaveLength(3);
    expect(aoa[1]).toEqual(['300750', '宁德时代', 10.8]);
  });
});

describe('toCSV', () => {
  it('生成 CSV 行', () => {
    const csv = toCSV(table);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('代码,名称,权重');
    expect(lines[1]).toBe('300750,宁德时代,10.8');
  });
  it('含逗号/引号/换行的字段被正确转义', () => {
    const t: TableData = { headers: ['a'], rows: [['x,y'], ['他说"好"'], ['行1\n行2']] };
    const lines = toCSV(t).split('\r\n');
    expect(lines[1]).toBe('"x,y"');
    expect(lines[2]).toBe('"他说""好"""');
    expect(lines[3]).toBe('"行1\n行2"');
  });
});

describe('tableToMarkdown', () => {
  it('生成 GFM 表格', () => {
    const md = tableToMarkdown(table);
    expect(md).toContain('| 代码 | 名称 | 权重 |');
    expect(md).toContain('| --- | --- | --- |');
    expect(md).toContain('| 300750 | 宁德时代 | 10.8 |');
  });
});

describe('slidesToStructure', () => {
  it('页数与 bullets 正确', () => {
    const s = slidesToStructure(slides);
    expect(s).toHaveLength(2);
    expect(s[0].bullets).toEqual(['净值 128 万', '收益 +9.4%']);
  });
  it('返回 bullets 副本，不与源共享引用', () => {
    const s = slidesToStructure(slides);
    s[0].bullets.push('mutated');
    expect(slides.slides[0].bullets).toHaveLength(2);
  });
});

describe('slidesToMarkdown', () => {
  it('含主标题与编号小标题', () => {
    const md = slidesToMarkdown(slides);
    expect(md).toContain('# 季度路演');
    expect(md).toContain('## 1. 概览');
    expect(md).toContain('- 净值 128 万');
    expect(md).toContain('## 2. 展望');
  });
});

describe('contentToMarkdown', () => {
  it('markdown 直接返回字符串数据', () => {
    const c: WorkbenchContent = { id: '1', title: 't', type: 'markdown', data: '# Hi', timestamp: 0 };
    expect(contentToMarkdown(c)).toBe('# Hi');
  });
  it('table 转 markdown 表格', () => {
    const c: WorkbenchContent = { id: '1', title: 't', type: 'table', data: table, timestamp: 0 };
    expect(contentToMarkdown(c)).toContain('| 代码 | 名称 | 权重 |');
  });
  it('slides 转 markdown 大纲', () => {
    const c: WorkbenchContent = { id: '1', title: 't', type: 'slides', data: slides, timestamp: 0 };
    expect(contentToMarkdown(c)).toContain('# 季度路演');
  });
});
