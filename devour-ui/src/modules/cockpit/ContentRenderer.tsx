/**
 * ContentRenderer — 工作台内容类型渲染器
 *
 * 根据 WorkbenchContent.type 分发到对应渲染组件：
 * - markdown → react-markdown（可「编辑/预览」切换）
 * - text     → 纯文本（可「编辑/预览」切换）
 * - table    → antd Table（可导出 Excel/CSV）
 * - slides   → 卡片式演示预览（可导出 PPTX）
 * - chart    → G2Chart
 * - svg      → 内联 SVG
 * - pdf      → iframe
 * - image    → img
 * - report   → Markdown 视图
 * - decision_set → DecisionCard 网格
 * - tool_call → 工具调用进度展示（Spin + 描述）
 *
 * 截图导出（PNG/PDF）会查找带 data-wb-scroll 的内容容器并临时撑开以截取完整内容。
 *
 * @see spec/02-module-interactions.md CENTER Workbench Panel
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Alert, Button, Collapse, Spin, Table, Tag } from 'antd';
import Editor from '@monaco-editor/react';
import { Eye, Pencil, Wrench } from 'lucide-react';
import { debounce } from 'lodash-es';
import { G2Chart } from '../../components/G2Chart';
import { DecisionCard, DecisionBatchBar } from '../../components/DecisionCard';
import type {
  WorkbenchContent,
  TableData,
  SlidesData,
  ChartSpecContent,
  DataTableContent,
  RiskAlertContent,
  DecisionSetContent,
  ToolResultContent,
} from '../../types/workbench';
import type { Decision } from '../../types/decision';
import { useCockpitStore } from '../../stores/cockpit.store';

interface ContentRendererProps {
  content: WorkbenchContent;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ content }) => {
  switch (content.type) {
    case 'markdown':
      return <EditableDocView content={content} kind="markdown" />;
    case 'text':
      return <EditableDocView content={content} kind="text" />;
    case 'table':
      return <TableView table={content.data as TableData} />;
    case 'slides':
      return <SlidesView slides={content.data as SlidesData} />;
    case 'chart':
      return (
        <div data-wb-scroll style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
          <G2Chart spec={content.data as object} height={400} style={{ flex: 1 }} />
        </div>
      );
    case 'svg':
      return <SvgView svg={content.data as string} />;
    case 'pdf':
      return <PdfView url={content.data as string} />;
    case 'image':
      return <ImageView src={content.data as string} />;
    case 'decision_set':
      return <DecisionSetView decisions={content.data as Decision[]} />;
    case 'tool_call':
      return <ToolCallView data={content.data as { toolName: string; args?: Record<string, unknown>; resultSummary?: string }} />;
    case 'report': {
      // 兼容两种数据格式：纯字符串 和 { summary/markdown }
      const reportData = content.data;
      const md = typeof reportData === 'string'
        ? reportData
        : (reportData as { markdown?: string; summary?: string }).markdown
          ?? (reportData as { summary: string }).summary ?? '';
      return <MarkdownView markdown={md} />;
    }
    // ---- 新增富内容渲染 ----
    case 'chart_spec':
      return <ChartSpecView spec={content.data as ChartSpecContent} />;
    case 'data_table':
      return <DataTableView data={content.data as DataTableContent} />;
    case 'risk_alert':
      return <RiskAlertView alert={content.data as RiskAlertContent} />;
    case 'tool_result':
      return <ToolResultView data={content.data as ToolResultContent} />;
    default:
      return null;
  }
};

// ---- 子渲染器 ----

/** Markdown 渲染（react-markdown + GFM 表格支持） */
function MarkdownView({ markdown }: { markdown: string }) {
  return (
    <div
      data-wb-scroll
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 32px',
        lineHeight: 1.8,
        fontSize: 13,
        color: '#F0F2F7',
        maxWidth: 860,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#F0F2F7', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#F0F2F7', margin: '20px 0 10px' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#F0F2F7', margin: '16px 0 8px' }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ margin: '8px 0', color: '#D4D9E8' }}>{children}</p>
          ),
          strong: ({ children }) => (
            <strong style={{ color: '#F0F2F7', fontWeight: 600 }}>{children}</strong>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <pre style={{ background: '#1E2335', borderRadius: 6, padding: '12px 16px', overflowX: 'auto', margin: '12px 0' }}>
                  <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#A78BFA' }}>{children}</code>
                </pre>
              );
            }
            return (
              <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: '#1E2335', padding: '2px 6px', borderRadius: 4, color: '#A78BFA' }}>
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, margin: '12px 0' }}>
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th style={{ textAlign: 'left', fontSize: 10, fontWeight: 500, color: '#4E5568', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{ padding: '8px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#F0F2F7' }}>
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: '3px solid #6C63FF', paddingLeft: 16, margin: '12px 0', color: '#8B92A5' }}>
              {children}
            </blockquote>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

/** 纯文本预览 */
function TextView({ text }: { text: string }) {
  return (
    <div
      data-wb-scroll
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 32px',
        fontSize: 13,
        lineHeight: 1.8,
        color: '#D4D9E8',
      }}
    >
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>
        {text}
      </pre>
    </div>
  );
}

/**
 * 可编辑文档视图（markdown / text 共用）
 * - 默认预览态；点「编辑」切到 Monaco 编辑器
 * - 编辑内容防抖写回 store（updateContent），保存导出即包含改动
 */
function EditableDocView({ content, kind }: { content: WorkbenchContent; kind: 'markdown' | 'text' }) {
  const updateContent = useCockpitStore((s) => s.updateContent);
  const [editing, setEditing] = React.useState(false);
  const text = typeof content.data === 'string' ? content.data : String(content.data ?? '');

  // 防抖写回，避免每次按键都触发全树重渲染
  const debouncedUpdate = React.useMemo(
    () => debounce((value: string) => updateContent(content.id, value), 350),
    [content.id, updateContent],
  );
  React.useEffect(() => () => debouncedUpdate.cancel(), [debouncedUpdate]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '6px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <Button
          type="text"
          size="small"
          icon={editing ? <Eye size={13} /> : <Pencil size={13} />}
          onClick={() => setEditing((v) => !v)}
          style={{ color: editing ? '#A78BFA' : '#8B92A5', fontSize: 12 }}
        >
          {editing ? '预览' : '编辑'}
        </Button>
      </div>
      {editing ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            height="100%"
            defaultLanguage={kind === 'markdown' ? 'markdown' : 'plaintext'}
            defaultValue={text}
            theme="vs-dark"
            onChange={(value) => debouncedUpdate(value ?? '')}
            options={{
              minimap: { enabled: false },
              automaticLayout: true,
              fontSize: 13,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              lineNumbers: kind === 'markdown' ? 'on' : 'off',
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>
      ) : kind === 'markdown' ? (
        <MarkdownView markdown={text} />
      ) : (
        <TextView text={text} />
      )}
    </div>
  );
}

/** 表格渲染（antd Table，可导出 Excel/CSV） */
function TableView({ table }: { table: TableData }) {
  const columns = table.headers.map((h, i) => ({
    title: h,
    dataIndex: String(i),
    key: String(i),
    ellipsis: true,
  }));
  const dataSource = table.rows.map((row, ri) => {
    const record: Record<string, unknown> = { key: ri };
    row.forEach((cell, ci) => {
      record[String(ci)] = cell;
    });
    return record;
  });
  return (
    <div data-wb-scroll style={{ flex: 1, overflow: 'auto', padding: 20 }}>
      <Table
        columns={columns}
        dataSource={dataSource}
        size="small"
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}

/** 演示大纲渲染（卡片式逐页，可导出 PPTX） */
function SlidesView({ slides }: { slides: SlidesData }) {
  return (
    <div data-wb-scroll style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {slides.title && (
          <div style={{ fontSize: 20, fontWeight: 700, color: '#F0F2F7', textAlign: 'center', marginBottom: 4 }}>
            {slides.title}
          </div>
        )}
        {slides.slides.map((slide, i) => (
          <div
            key={i}
            style={{
              aspectRatio: '16 / 9',
              background: 'linear-gradient(135deg, #1E2335 0%, #171B26 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: 14, right: 18, fontSize: 11, color: '#4E5568' }}>
              {i + 1} / {slides.slides.length}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#F0F2F7', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid rgba(108,99,255,0.4)' }}>
              {slide.title}
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {slide.bullets.map((b, bi) => (
                <li key={bi} style={{ fontSize: 14, color: '#D4D9E8', lineHeight: 1.6 }}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** SVG 内联渲染 */
function SvgView({ svg }: { svg: string }) {
  return (
    <div
      data-wb-scroll
      style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** PDF iframe 渲染 */
function PdfView({ url }: { url: string }) {
  return (
    <iframe
      src={url}
      style={{ flex: 1, width: '100%', border: 'none', height: '100%' }}
      title="PDF 预览"
    />
  );
}

/** 图片渲染 */
function ImageView({ src }: { src: string }) {
  return (
    <div data-wb-scroll style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <img
        src={src}
        alt="工作台图片"
        style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, objectFit: 'contain' }}
      />
    </div>
  );
}

/** 工具调用进度渲染（Spin + 工具名 + 参数描述） */
function ToolCallView({ data }: { data: { toolName: string; args?: Record<string, unknown>; resultSummary?: string } }) {
  const toolLabelMap: Record<string, string> = {
    get_market_overview: '获取市场概览',
    get_stock_info: '查询个股行情',
    get_sector_rotation: '分析板块轮动',
    analyze_portfolio_risk: '分析组合风险',
    get_portfolio_summary: '获取持仓概况',
    generate_investment_decision: '生成投资决策',
  };
  const label = toolLabelMap[data.toolName] || data.toolName;
  const hasResult = !!data.resultSummary;

  return (
    <div
      data-wb-scroll
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: '#1E2335',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
        }}
      >
        <Spin spinning={!hasResult} size="small">
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: hasResult ? 'rgba(0,200,150,0.12)' : 'rgba(108,99,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Wrench size={14} color={hasResult ? '#00C896' : '#6C63FF'} />
          </div>
        </Spin>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#F0F2F7' }}>
            {hasResult ? `✓ ${label} 完成` : `正在调用工具：${label}`}
          </div>
          {data.args && Object.keys(data.args).length > 0 && (
            <div style={{ fontSize: 11, color: '#8B92A5', marginTop: 2 }}>
              {Object.entries(data.args)
                .filter(([, v]) => v !== undefined && v !== null && v !== '')
                .map(([k, v]) => `${k}=${String(v)}`)
                .join(' · ')}
            </div>
          )}
        </div>
      </div>
      {hasResult && data.resultSummary && (
        <div
          style={{
            padding: '14px 18px',
            background: '#1E2335',
            border: '1px solid rgba(0,200,150,0.15)',
            borderRadius: 10,
            fontSize: 12,
            lineHeight: 1.8,
            color: '#D4D9E8',
            whiteSpace: 'pre-wrap',
          }}
        >
          {data.resultSummary}
        </div>
      )}
    </div>
  );
}

/** 决策集渲染（买卖决策卡片网格 + 批量操作栏） */
function DecisionSetView({ decisions }: { decisions: Decision[] }) {
  const { confirmDecision, dismissDecision, confirmAllDecisions, dismissAllDecisions, pushContent } = useCockpitStore();
  const handleAnalyze = (id: string) => {
    const d = decisions.find(x => x.id === id);
    if (!d) return;
    pushContent({
      id: `report-${d.symbol}`,
      title: `${d.name} 深度分析`,
      type: 'markdown',
      data: `# ${d.name} 深度分析\n\n${d.reasoning}\n\n触发因子：${d.triggerFactors.join('、')}`,
      timestamp: Date.now(),
    });
  };
  return (
    <div
      data-wb-scroll
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <DecisionBatchBar
        count={decisions.length}
        onConfirmAll={confirmAllDecisions}
        onDismissAll={dismissAllDecisions}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
          alignContent: 'start',
        }}
      >
        {decisions.map(d => (
          <DecisionCard
            key={d.id}
            decision={d}
            onConfirm={confirmDecision}
            onDismiss={dismissDecision}
            onAnalyze={handleAnalyze}
            swipeable
          />
        ))}
      </div>
    </div>
  );
}

// ---- 新增富内容渲染器 ----

/** 图表规格渲染（ChartSpecContent → G2Chart） */
function chartSpecToG2Spec(spec: ChartSpecContent): object {
  const chartTypeMap: Record<string, string> = {
    line: 'line',
    bar: 'interval',
    pie: 'interval',
    heatmap: 'cell',
    area: 'area',
  };  
  const markType = chartTypeMap[spec.chart_type] ?? 'line';
  const g2Spec: Record<string, unknown> = {
    type: 'view',
    children: [
      {
        type: markType,
        data: spec.data,
        encode: {
          x: spec.x_field,
          y: spec.y_field,
          ...(spec.series_field ? { color: spec.series_field } : {}),
        },
        style: { lineWidth: 2 },
        axis: {
          x: { title: spec.x_field },
          y: { title: spec.y_field },
        },
      },
    ],
  };  
  // pie 图需要特殊处理坐标系
  if (spec.chart_type === 'pie') {
    g2Spec.children[0] = {
      type: 'interval',
      data: spec.data,
      transform: [{ type: 'stackY' }],
      encode: {
        x: '___constant___',
        y: spec.y_field,
        color: spec.series_field ?? spec.x_field,
      },
      coordinate: { type: 'theta' },
      style: { radius: 0.8 },
    };  
  }
  return g2Spec;
}

function ChartSpecView({ spec }: { spec: ChartSpecContent }) {
  const g2Spec = chartSpecToG2Spec(spec);
  return (
    <div data-wb-scroll style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>  
      <div style={{ fontSize: 16, fontWeight: 600, color: '#F0F2F7' }}>{spec.title}</div>  
      {spec.description && <div style={{ fontSize: 12, color: '#8B92A5', lineHeight: 1.6 }}>{spec.description}</div>}
      <div style={{ flex: 1, minHeight: 300 }}>
        <G2Chart spec={g2Spec} height={360} style={{ flex: 1 }} />
      </div>
    </div>
  );
}

/** 数据表格渲染（DataTableContent → antd Table） */
function DataTableView({ data }: { data: DataTableContent }) {
  const columns = data.columns.map((col) => ({
    title: col.title,
    dataIndex: col.dataIndex,
    key: col.key,
    width: col.width,
    ellipsis: true,
  }));
  const dataSource = data.data.map((row, idx) => ({ ...row, key: idx }));
  return (
    <div data-wb-scroll style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>  
      <div style={{ fontSize: 16, fontWeight: 600, color: '#F0F2F7' }}>{data.title}</div>  
      {data.summary && <div style={{ fontSize: 12, color: '#8B92A5', lineHeight: 1.6 }}>{data.summary}</div>}
      <Table
        columns={columns}
        dataSource={dataSource}
        size="small"
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}

/** 风险预警渲染（RiskAlertContent → Alert + 指标 Tag + 建议） */
function RiskAlertView({ alert }: { alert: RiskAlertContent }) {
  const alertTypeMap: Record<string, 'error' | 'warning' | 'info'> = {
    high: 'error',
    medium: 'warning',
    low: 'info',
  };  
  const levelLabel: Record<string, string> = { high: '高风险', medium: '中风险', low: '低风险' };  
  return (
    <div data-wb-scroll style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>  
      <Alert
        banner
        type={alertTypeMap[alert.level]}
        message={`${levelLabel[alert.level] ?? alert.level}：${alert.title}`}
        description={alert.description}
        showIcon
      />
      {alert.metrics.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {alert.metrics.map((m, i) => (
            <Tag
              key={i}
              color={m.status === 'over' || m.status === 'exceeded' || m.value > m.threshold ? '#ff4d4f' : '#52c41a'}
            >  
              {m.name}: {m.value} / 阈值 {m.threshold}
            </Tag>
          ))}
        </div>
      )}
      {alert.suggestions.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: '#1E2335',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
        }}>  
          <div style={{ fontSize: 12, fontWeight: 500, color: '#8B92A5', marginBottom: 8 }}>建议：</div>
          <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>  
            {alert.suggestions.map((s, i) => (
              <li key={i} style={{ fontSize: 13, color: '#D4D9E8', lineHeight: 1.6 }}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** 工具返回结果渲染（ToolResultContent → Collapse 折叠面板） */
function ToolResultView({ data }: { data: ToolResultContent }) {
  const isJsonObject = (v: unknown): boolean => {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
  };  
  const resultContent = isJsonObject(data.result) || Array.isArray(data.result)
    ? JSON.stringify(data.result, null, 2)
    : String(data.result);
  return (
    <div data-wb-scroll style={{ flex: 1, overflowY: 'auto', padding: 24 }}>  
      <Collapse
        defaultActiveKey={['result']}
        items={[{
          key: 'result',
          label: `${data.toolName} 执行结果${data.summary ? ` · ${data.summary}` : ''}`,
          children: (
            <pre style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 12,
              lineHeight: 1.7,
              color: '#D4D9E8',
              fontFamily: "'JetBrains Mono', monospace",
            }}>  
              {resultContent}
            </pre>
          ),
        }]}
        style={{ background: '#1E2335', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
      />
    </div>
  );
}
