/**
 * AlphaAgent · 工作台内容类型定义
 * 工作台中央面板承载的所有内容类型
 */

/** 工作台支持的内容类型 */
export type ContentType =
  | 'markdown'      // Markdown 报告/分析文本（可编辑）
  | 'text'          // 纯文本纪要/备忘（可编辑）
  | 'table'         // 表格数据（可导出 Excel/CSV）
  | 'slides'        // 演示大纲（可导出 PPTX）
  | 'chart'         // G2 图表规格对象
  | 'svg'           // SVG 流程图/示意图
  | 'pdf'           // PDF 研报文件
  | 'image'         // 图片（截图/图表图像）
  | 'report'        // 复合报告（MD + 图表 + 决策）
  | 'decision_set'  // 多个买卖决策卡片组
  | 'tool_call'     // 工具调用进度展示
  | 'chart_spec'    // G2图表规格（流式富内容）
  | 'data_table'    // 数据表格（流式富内容）
  | 'risk_alert'    // 风险预警（流式富内容）
  | 'tool_result';  // 工具返回结果（流式富内容）

/**
 * 工作台内容项
 * 由 AI 助手响应触发，推送到 cockpit.store.activeContents[]
 */
export interface WorkbenchContent {
  /** 唯一标识符 */
  id: string;
  /** 标签页标题（如 "宁德时代分析" / "今日晨报"） */
  title: string;
  /** 内容渲染类型 */
  type: ContentType;
  /**
   * 内容数据，类型由 type 决定：
   * - markdown: string (Markdown 文本)
   * - chart: G2ChartSpec (G2 配置对象)
   * - svg: string (SVG 字符串)
   * - pdf: string (PDF URL)
   * - image: string (图片 URL)
   * - report: ReportData
   * - decision_set: Decision[]
   */
  data: unknown;
  /** 创建时间戳（Unix ms） */
  timestamp: number;
  /** 产生此内容的聊天消息 ID（可选，用于溯源） */
  sourceMessageId?: string;
}

/** G2 图表规格（传入 G2 Chart.options()） */
export interface G2ChartSpec {
  type: string;
  data: unknown[];
  encode?: Record<string, unknown>;
  scale?: Record<string, unknown>;
  style?: Record<string, unknown>;
  axis?: Record<string, unknown>;
  [key: string]: unknown;
}

/** 复合报告数据 */
export interface ReportData {
  summary: string;            // Markdown 摘要
  charts: G2ChartSpec[];      // 附属图表列表
  decisions?: import('./decision').Decision[]; // 附属决策建议
}

/** 表格内容数据（导出 Excel / CSV） */
export interface TableData {
  /** 表头列名 */
  headers: string[];
  /** 行数据，二维数组，与 headers 顺序对应 */
  rows: (string | number)[][];
  /** 工作表名 / 导出文件名基（可选） */
  sheetName?: string;
}

/** 单页演示内容 */
export interface SlideItem {
  title: string;
  bullets: string[];
}

/** 演示大纲数据（导出 PPTX） */
export interface SlidesData {
  /** 演示主标题（用于文件名与首页） */
  title: string;
  slides: SlideItem[];
}

// ---- 富内容 chunk 类型（SSE 流式推送） ----

/** G2 图表规格内容（对应后端 ChartSpecContent） */
export interface ChartSpecContent {
  chart_type: 'line' | 'bar' | 'pie' | 'heatmap' | 'area';
  title: string;
  data: Record<string, any>[];
  x_field: string;
  y_field: string;
  series_field?: string;
  description?: string;
}

/** 数据表格内容（对应后端 DataTableContent） */
export interface DataTableContent {
  title: string;
  columns: { key: string; title: string; dataIndex: string; width?: number }[];
  data: Record<string, any>[];
  summary?: string;
}

/** 风险预警内容（对应后端 RiskAlertContent） */
export interface RiskAlertContent {
  level: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metrics: { name: string; value: number; threshold: number; status: string }[];
  suggestions: string[];
}

/** 决策建议集内容（对应后端 DecisionSetContent） */
export interface DecisionSetContent {
  decisions: { action: string; symbol: string; reason: string; confidence: number }[];
  summary: string;
}

/** 工具返回结果内容 */
export interface ToolResultContent {
  toolName: string;
  result: unknown;
  summary?: string;
}

/** MD 报告内容（后端自动检测结构化报告时推送） */
export interface ReportChunkContent {
  title: string;
  markdown: string;
}

/** SSE 流式富内容 chunk（对应后端 RichChunk） */
export interface RichChunk {
  type: 'chart_spec' | 'decision_set' | 'data_table' | 'risk_alert' | 'tool_call' | 'tool_result' | 'report';
  content: ChartSpecContent | DataTableContent | RiskAlertContent | DecisionSetContent | ToolResultContent | ReportChunkContent | string;
}
