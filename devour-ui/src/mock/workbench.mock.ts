/**
 * AlphaAgent · 工作台多类型内容 Mock
 *
 * 这些工厂函数模拟「AI 在对话中生成不同类型的数据」，每次调用返回一个新的
 * WorkbenchContent，落为一个工作台内容 Tab。不预设 Tab，由对话触发。
 */

import type { WorkbenchContent, TableData, SlidesData } from '../types/workbench';

const now = () => Date.now();

/** 持仓明细表（type: table，可导出 Excel/CSV） */
export function mockHoldingsTable(): WorkbenchContent {
  const data: TableData = {
    sheetName: '持仓明细',
    headers: ['代码', '名称', '行业', '权重(%)', '今日涨跌(%)', '浮动盈亏(%)', '市值(万元)'],
    rows: [
      ['300750', '宁德时代', '电池', 10.8, 3.56, 11.70, 138.7],
      ['600519', '贵州茅台', '白酒', 12.5, -0.89, 18.45, 160.6],
      ['000858', '五粮液', '白酒', 6.2, -1.34, -11.62, 79.6],
      ['601012', '隆基绿能', '光伏', 5.4, 2.18, 6.30, 69.3],
      ['002594', '比亚迪', '汽车', 9.1, 1.92, 15.20, 116.9],
      ['600036', '招商银行', '银行', 9.2, 1.25, 12.95, 118.2],
      ['000333', '美的集团', '家电', 4.6, 0.42, 8.11, 59.1],
      ['603259', '药明康德', '医药', 3.8, -2.05, -4.37, 48.8],
    ],
  };
  return {
    id: `table-${now()}`,
    title: '持仓明细表',
    type: 'table',
    data,
    timestamp: now(),
  };
}

/** 路演演示大纲（type: slides，可导出 PPTX） */
export function mockRoadshowSlides(): WorkbenchContent {
  const data: SlidesData = {
    title: 'AlphaAgent 组合季度路演',
    slides: [
      {
        title: '组合概览',
        bullets: [
          '组合净值 ¥128.48 万，季度收益 +9.4%',
          '夏普比率 1.82，最大回撤 -8.2%',
          '跑赢沪深300指数 6.1 个百分点',
        ],
      },
      {
        title: '核心持仓',
        bullets: [
          '新能源：宁德时代、比亚迪、隆基绿能合计 25.3%',
          '消费：贵州茅台、美的集团合计 17.1%',
          '金融：招商银行 9.2%',
        ],
      },
      {
        title: '多因子归因',
        bullets: [
          '动量因子贡献 +4.2%（主要超额来源）',
          '质量因子贡献 +1.8%',
          '价值因子拖累 -0.9%',
        ],
      },
      {
        title: '下季度展望',
        bullets: [
          '维持新能源高配，关注 TOPCon 与储能链',
          '逢高减持高估值白酒，控制集中度',
          '新增 AI 算力主题观察仓位',
        ],
      },
    ],
  };
  return {
    id: `slides-${now()}`,
    title: '季度路演大纲',
    type: 'slides',
    data,
    timestamp: now(),
  };
}

/** 投研晨会纪要（type: text，可编辑/导出 txt/md） */
export function mockMeetingNotes(): WorkbenchContent {
  const text = `投研晨会纪要 · ${new Date().toLocaleDateString('zh-CN')}

【市场观点】
1. 隔夜美股科技板块走强，纳指 +1.2%，利好 A 股科技成长方向。
2. 北向资金昨日净流入 38.5 亿，集中于新能源与电子。
3. 央行公开市场净投放，短端流动性宽松。

【组合操作】
- 宁德时代：维持加仓信号，目标价上调至 198.5 元。
- 五粮液：减仓至 3%，行业景气度下行。
- 现金仓位保持 8%，等待回调机会。

【待跟踪】
- 光伏装机数据（本周五公布）
- 比亚迪海外销量月报

（本纪要为 Mock 内容，可直接在工作台编辑后保存为 txt / md）`;
  return {
    id: `notes-${now()}`,
    title: '晨会纪要',
    type: 'text',
    data: text,
    timestamp: now(),
  };
}

/** 收益走势配图（type: image，内联 SVG dataURL，可导出 PNG） */
export function mockChartImage(): WorkbenchContent {
  const points = [20, 45, 38, 60, 52, 78, 70, 95, 88, 120, 110, 140];
  const max = Math.max(...points);
  const w = 640;
  const h = 320;
  const pad = 32;
  const stepX = (w - pad * 2) / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * stepX} ${h - pad - (p / max) * (h - pad * 2)}`)
    .join(' ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0F1117"/>
    <text x="${pad}" y="24" fill="#F0F2F7" font-family="sans-serif" font-size="15" font-weight="600">组合净值走势（近 12 期）</text>
    <path d="${path}" fill="none" stroke="#6C63FF" stroke-width="3" stroke-linejoin="round"/>
    <path d="${path} L ${pad + (points.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z" fill="rgba(108,99,255,0.15)"/>
  </svg>`;
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return {
    id: `image-${now()}`,
    title: '净值走势图',
    type: 'image',
    data: dataUrl,
    timestamp: now(),
  };
}

/** 持仓分析报告（type: markdown，可编辑/导出 md/txt/pdf） */
export function mockAnalysisReport(): WorkbenchContent {
  const report = `# 持仓分析报告

## 总览

当前组合净值 **¥128.48万**，今日收益 **+2.31%**，跑赢沪深300指数 1.82%。

## 主要持仓表现

| 标的 | 权重 | 今日涨跌 | 浮盈亏 |
|---|---:|---:|---:|
| 贵州茅台 | 12.5% | -0.89% | +18.45% |
| 宁德时代 | 10.8% | +3.56% | +11.70% |
| 招商银行 | 9.2% | +1.25% | +12.95% |

## 风险预警

> 五粮液仓位当前处于亏损状态（-11.62%），建议关注 Agent 卖出信号。

## Agent 建议

综合多因子评分，宁德时代买入信号较强（置信度 87%），建议适量加仓。

*本报告可直接在工作台编辑，保存为 md / txt / pdf。*`;
  return {
    id: `report-${now()}`,
    title: '持仓分析报告',
    type: 'markdown',
    data: report,
    timestamp: now(),
  };
}
