/**
 * WorkbenchPanel — 驾驶舱中央工作台
 *
 * 上下文作为工作台默认 Tab，而不是独立列。
 * - 上下文 Tab：可关闭，可从顶栏随时唤起
 * - 业务内容 Tab：AI 生成的报告/图表/决策集，最多 5 个
 * - 支持 Tab 拖拽排序（HTML5 Drag & Drop）
 * - 排列顺序保存到 localStorage
 */

import React from 'react';
import { Badge, Button, Dropdown, Tabs, Tooltip, message } from 'antd';
import { Bot, GripVertical, Maximize2, PanelLeftOpen, Save, Trash2, Zap } from 'lucide-react';
import { CONTEXT_TAB_KEY, useCockpitStore } from '../../stores/cockpit.store';
import type { RichChunk, ReportChunkContent } from '../../types/workbench';
import { ContentRenderer } from './ContentRenderer';
import { ContextDrawer } from './ContextDrawer';
import { mockPendingDecisions } from '../../mock/cockpit.mock';
import {
  mockHoldingsTable,
  mockRoadshowSlides,
  mockMeetingNotes,
  mockChartImage,
} from '../../mock/workbench.mock';
import { exportContent, formatsFor, FORMAT_META, type ExportFormat } from '../../utils/export';

interface WorkbenchPanelProps {
  assistantOpen: boolean;
  onOpenAssistant: () => void;
}

/** 空态（无业务内容且上下文 Tab 已关闭时的引导提示） */
const WorkbenchEmpty: React.FC<{ onOpenContext: () => void; onOpenAssistant: () => void }> = ({ onOpenContext, onOpenAssistant }) => {
  const { pushContent } = useCockpitStore();

  const quickActions = [
    { label: '唤起工作台', onClick: onOpenContext },
    { label: '打开 AI 助手', onClick: onOpenAssistant },
    {
      label: '查看决策建议',
      onClick: () => {
        pushContent({
          id: 'decisions-demo',
          title: 'Agent 决策建议',
          type: 'decision_set',
          data: mockPendingDecisions,
          timestamp: Date.now(),
        });
      },
    },
    { label: '生成持仓表', onClick: () => pushContent(mockHoldingsTable()) },
    { label: '生成路演 PPT', onClick: () => pushContent(mockRoadshowSlides()) },
    { label: '生成纪要文本', onClick: () => pushContent(mockMeetingNotes()) },
    { label: '生成走势图', onClick: () => pushContent(mockChartImage()) },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 40,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 12 }}>
          <Zap size={40} color="rgba(108,99,255,0.4)" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 500, color: '#F0F2F7', marginBottom: 8 }}>
          工作台待激活
        </div>
        <div style={{ fontSize: 13, color: '#8B92A5', maxWidth: 360 }}>
          工作台是默认 Tab，展示初始化信息（组合 KPI、待确认决策与因子信号），可关闭也可随时唤起；右侧 AI 助手生成的报告、图表和决策建议会作为新的 Tab 出现在这里。
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            style={{
              fontSize: 12,
              padding: '6px 14px',
              borderRadius: 20,
              background: 'rgba(108,99,255,0.10)',
              color: '#A78BFA',
              border: '1px solid rgba(108,99,255,0.25)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {action.label} →
          </button>
        ))}
      </div>
    </div>
  );
};

/** 将 RichChunk 转换为 WorkbenchContent 并推送到工作台 */
function richChunkToWorkbenchContent(chunk: RichChunk, index: number): import('../../types/workbench').WorkbenchContent {
  const prefix = chunk.type;
  const id = `rich-${prefix}-${Date.now()}-${index}`;
  let title = '';
  // 根据 chunk 类型生成标题
  if (chunk.type === 'chart_spec') {
    const spec = chunk.content as import('../../types/workbench').ChartSpecContent;
    title = spec.title || '图表';
  } else if (chunk.type === 'data_table') {
    const dt = chunk.content as import('../../types/workbench').DataTableContent;
    title = dt.title || '数据表';
  } else if (chunk.type === 'risk_alert') {
    const ra = chunk.content as import('../../types/workbench').RiskAlertContent;
    title = ra.title || '风险预警';
  } else if (chunk.type === 'decision_set') {
    const ds = chunk.content as import('../../types/workbench').DecisionSetContent;
    title = ds.summary || '决策建议';
  } else if (chunk.type === 'tool_result') {
    const tr = chunk.content as import('../../types/workbench').ToolResultContent;
    title = `${tr.toolName} 结果`;
  } else if (chunk.type === 'report') {
    const rc = chunk.content as ReportChunkContent;
    // 报告类型转换为 markdown WorkbenchContent，复用 EditableDocView
    return {
      id,
      title: rc.title || 'AI 分析报告',
      type: 'markdown' as import('../../types/workbench').ContentType,
      data: rc.markdown,
      timestamp: Date.now(),
    };
  } else {
    title = '富内容';
  }
  return {
    id,
    title,
    type: chunk.type as import('../../types/workbench').ContentType,
    data: chunk.content,
    timestamp: Date.now(),
  };  
}

export const WorkbenchPanel: React.FC<WorkbenchPanelProps> = ({ assistantOpen, onOpenAssistant }) => {
  const {
    activeContents,
    activeTabKey,
    setActiveTabKey,
    removeContent,
    clearContents,
    reorderContents,
    contextTabOpen,
    openContextTab,
    closeContextTab,
    pendingDecisions,
    richChunks,
    addRichChunk,
    pushContent,
  } = useCockpitStore();

  // ---- 富内容 chunk → 工作台 Tab 自动推送 ----
  const prevRichChunkCountRef = React.useRef(0);
  React.useEffect(() => {
    const newChunks = richChunks.slice(prevRichChunkCountRef.current);
    prevRichChunkCountRef.current = richChunks.length;
    if (newChunks.length === 0) return;
    newChunks.forEach((chunk, i) => {
      const wbContent = richChunkToWorkbenchContent(chunk, i);
      pushContent(wbContent);
    });
  }, [richChunks, pushContent]);

  // ---- 拖拽排序状态 ----
  const dragIndexRef = React.useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleDragStart = React.useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = React.useCallback(() => {
    const from = dragIndexRef.current;
    if (from !== null && dragOverIndex !== null && from !== dragOverIndex) {
      reorderContents(from, dragOverIndex);
    }
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, [dragOverIndex, reorderContents]);

  const tabItems = [
    ...(contextTabOpen
      ? [{
          key: CONTEXT_TAB_KEY,
          label: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              工作台
              {pendingDecisions.length > 0 && <Badge count={pendingDecisions.length} size="small" />}
            </span>
          ),
          children: (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <ContextDrawer onClose={closeContextTab} />
            </div>
          ),
          closable: true,
        }]
      : []),
    ...activeContents.map((content, idx) => ({
      key: content.id,
      label: (
        <span
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragEnd={handleDragEnd}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'grab',
            opacity: dragOverIndex === idx ? 0.5 : 1,
            transition: 'opacity 150ms ease',
          }}
        >
          <GripVertical size={10} style={{ opacity: 0.4, flexShrink: 0 }} />
          {content.title}
        </span>
      ),
      children: (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <ContentRenderer content={content} />
        </div>
      ),
      closable: true,
    })),
  ];

  const activeContent = activeContents.find((content) => content.id === activeTabKey);
  const title = activeTabKey === CONTEXT_TAB_KEY ? '工作台' : activeContent?.title ?? '工作台';

  /** 保存当前激活内容 Tab 为指定格式 */
  const handleExport = React.useCallback(async (format: ExportFormat) => {
    if (!activeContent) return;
    // PNG/PDF 需要已渲染的 DOM 节点：取当前激活 Tab 面板
    const node = document.querySelector<HTMLElement>('.ant-tabs-tabpane-active');
    const hide = message.loading('正在导出…', 0);
    try {
      await exportContent(activeContent, format, node);
      hide();
      message.success(`已保存 · ${FORMAT_META[format].label}`);
    } catch (error) {
      hide();
      message.error(`导出失败：${(error as Error).message}`);
    }
  }, [activeContent]);

  const saveMenuItems = activeContent
    ? formatsFor(activeContent.type).map((format) => ({ key: format, label: FORMAT_META[format].label }))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 工作台顶栏 */}
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: '#171B26',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {!contextTabOpen && (
          <Tooltip title="唤起工作台 Tab">
            <Button
              type="text"
              size="small"
              icon={<PanelLeftOpen size={14} />}
              onClick={openContextTab}
              style={{ color: '#8B92A5' }}
            />
          </Tooltip>
        )}

        <span style={{ fontSize: 13, fontWeight: 500, color: '#F0F2F7', flex: 1 }}>
          {title}
        </span>

        <div style={{ display: 'flex', gap: 4 }}>
          {!assistantOpen && (
            <Tooltip title="唤起 AI 助手">
              <Button
                type="text"
                size="small"
                icon={<Bot size={14} />}
                onClick={onOpenAssistant}
                style={{ color: '#A78BFA' }}
              />
            </Tooltip>
          )}
          {activeContent && (
            <Tooltip title="将当前 Tab 保存为文件">
              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                menu={{ items: saveMenuItems, onClick: ({ key }) => handleExport(key as ExportFormat) }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<Save size={14} />}
                  style={{ color: '#8B92A5', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <span style={{ fontSize: 12 }}>保存</span>
                </Button>
              </Dropdown>
            </Tooltip>
          )}
          {activeContents.length > 0 && (
            <>
              <Tooltip title="全屏">
                <Button type="text" size="small" icon={<Maximize2 size={14} />} style={{ color: '#8B92A5' }} />
              </Tooltip>
              <Tooltip title="清空业务内容">
                <Button
                  type="text"
                  size="small"
                  icon={<Trash2 size={14} />}
                  style={{ color: '#8B92A5' }}
                  onClick={clearContents}
                />
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {tabItems.length === 0 ? (
        <WorkbenchEmpty onOpenContext={openContextTab} onOpenAssistant={onOpenAssistant} />
      ) : (
        <Tabs
          activeKey={activeTabKey ?? tabItems[0]?.key}
          onChange={setActiveTabKey}
          type="editable-card"
          hideAdd
          className="fill-tabs"
          onEdit={(targetKey, action) => {
            if (action !== 'remove') return;
            if (targetKey === CONTEXT_TAB_KEY) {
              closeContextTab();
              return;
            }
            removeContent(targetKey as string);
          }}
          style={{ flex: 1, overflow: 'hidden' }}
          tabBarStyle={{
            background: '#171B26',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            margin: 0,
            padding: '0 12px',
          }}
          items={tabItems}
        />
      )}
    </div>
  );
};
