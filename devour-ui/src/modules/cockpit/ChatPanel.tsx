/**
 * ChatPanel — 驾驶舱右侧 AI 助手面板
 *
 * 基于 @ant-design/x 2.5.0 的助手模式能力组合：
 * - Conversations：历史会话列表与新建/切换/删除/重命名（侧边会话列表面板）
 * - Welcome + Prompts：空会话欢迎态与快捷提示
 * - Bubble.List：流式消息气泡列表
 * - Sender：支持 slot/skill 体系的新版输入框
 *
 * 会话历史已迁移至 cockpit.store（Zustand），支持 localStorage 持久化。
 * 侧边会话列表显示标题+时间，支持新建/删除/重命名。
 */

import React from 'react';
import { Avatar, Button, Dropdown, Input, Popover, Select, Tooltip, message as antdMessage } from 'antd';
import { Attachments, Bubble, Conversations, Prompts, Sender, Suggestion, Welcome } from '@ant-design/x';
import type { BubbleProps } from '@ant-design/x/es/bubble';
import type { SenderRef } from '@ant-design/x/es/sender';
import type { Attachment, AttachmentsRef } from '@ant-design/x/es/attachments';
import type { SuggestionItem } from '@ant-design/x/es/suggestion';
import {
  Bot,
  Brain,
  Check,
  ChevronDown,
  Database,
  FileText,
  History,
  Image as ImageIcon,
  MessageSquare,
  MoreHorizontal,
  NotebookPen,
  Pencil,
  PanelRightClose,
  Paperclip,
  Plus,
  Presentation,
  Puzzle,
  Sparkles,
  Table as TableIcon,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import {
  useCockpitStore,
  createId,
  type ChatMessage,
  type ChatSession,
} from '../../stores/cockpit.store';
import { streamChat } from '../../api/chat.client';
import { fetchSkillCatalog, type SkillCatalogItem } from '../../api/skills.client';
import { mockPendingDecisions } from '../../mock/cockpit.mock';
import {
  mockHoldingsTable,
  mockRoadshowSlides,
  mockMeetingNotes,
  mockChartImage,
  mockAnalysisReport,
} from '../../mock/workbench.mock';

/** 自定义 Agent 气泡样式 */
const agentBubbleStyle: BubbleProps['styles'] = {
  content: {
    background: '#1E2335',
    color: '#F0F2F7',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    fontSize: 13,
  },
};

/** 自定义用户气泡样式 */
const userBubbleStyle: BubbleProps['styles'] = {
  content: {
    background: '#252A3D',
    color: '#F0F2F7',
    borderRadius: 12,
    fontSize: 13,
  },
};

const promptTexts: Record<string, string> = {
  portfolio: '分析今日持仓风险和机会，重点说明需要调仓的标的。',
  market: '扫描今日市场信号，找出新能源和科技板块的高置信度机会。',
  decision: '生成当前组合的买入、卖出和持有决策建议。',
  risk: '评估当前组合的回撤、波动率、因子暴露和集中度风险。',
  table: '生成当前组合的持仓明细数据表。',
  slides: '生成一份季度组合路演演示大纲。',
  notes: '整理今天的投研晨会纪要文本。',
  image: '生成组合净值走势配图。',
};

const promptItems = [
  { key: 'portfolio', icon: <Database size={14} />, label: '持仓分析', description: '组合风险、机会与调仓建议（Markdown 报告）' },
  { key: 'table', icon: <TableIcon size={14} />, label: '持仓数据表', description: '生成可导出 Excel/CSV 的明细表' },
  { key: 'slides', icon: <Presentation size={14} />, label: '路演演示', description: '生成可导出 PPT 的演示大纲' },
  { key: 'notes', icon: <NotebookPen size={14} />, label: '晨会纪要', description: '生成可编辑/导出的文本纪要' },
  { key: 'image', icon: <ImageIcon size={14} />, label: '走势配图', description: '生成可导出 PNG 的净值走势图' },
  { key: 'decision', icon: <Sparkles size={14} />, label: '决策建议', description: '买入/卖出/持有候选清单' },
];

/** 模型选择项（接入后端后映射到真实模型 id） */
const MODEL_OPTIONS = [
  { value: 'alpha-pro', label: 'AlphaAgent Pro' },
  { value: 'alpha-fast', label: 'AlphaAgent Fast' },
  { value: 'alpha-research', label: '深度研究模型' },
];

/** 输入框内通过 "/" 唤起的技能列表 */
const skillItems: SuggestionItem[] = [
  { label: '持仓分析', value: 'portfolio', icon: <Database size={14} /> },
  { label: '持仓数据表', value: 'table', icon: <TableIcon size={14} /> },
  { label: '路演演示', value: 'slides', icon: <Presentation size={14} /> },
  { label: '晨会纪要', value: 'notes', icon: <NotebookPen size={14} /> },
  { label: '走势配图', value: 'image', icon: <ImageIcon size={14} /> },
  { label: '市场扫描', value: 'market', icon: <Zap size={14} /> },
  { label: '决策建议', value: 'decision', icon: <Sparkles size={14} /> },
  { label: '风险评估', value: 'risk', icon: <FileText size={14} /> },
];

/** 根据关键词推送演示富内容到工作台 */
function pushDemoRichContent(
  message: string,
  pushContent: ReturnType<typeof useCockpitStore.getState>['pushContent'],
) {
  const lower = message.toLowerCase();
  if (/表格|数据表|持仓表|明细/.test(message)) return pushContent(mockHoldingsTable());
  if (/演示|路演|汇报|幻灯/.test(message) || lower.includes('ppt')) return pushContent(mockRoadshowSlides());
  if (/纪要|备忘|笔记/.test(message)) return pushContent(mockMeetingNotes());
  if (/图片|截图|配图|走势图|图像/.test(message)) return pushContent(mockChartImage());
  if (lower.includes('决策') || lower.includes('买入') || lower.includes('卖出')) {
    return pushContent({
      id: `decisions-${Date.now()}`,
      title: 'Agent 决策建议',
      type: 'decision_set',
      data: mockPendingDecisions.slice(0, 3),
      timestamp: Date.now(),
    });
  }
  if (/分析报告|持仓分析|生成报告/.test(message)) return pushContent(mockAnalysisReport());
}

/**
 * 判断一段回复是否为「结构化 / 长文」
 */
function isStructuredLongform(text: string): boolean {
  if (!text) return false;
  if (text.length >= 280) return true;
  if (/(^|\n)#{1,6}\s+\S/.test(text)) return true;
  if (/```/.test(text)) return true;
  if (/\n\s*\|.+\|\s*\n\s*\|?[\s:|-]*-[\s:|-]*\|?/.test(text)) return true;
  return false;
}

/** 为气泡折叠态提取一句话摘要 */
function summarizeAnswer(text: string): string {
  const heading = text.match(/(?:^|\n)#{1,6}\s+(.+)/);
  if (heading) return heading[1].trim().slice(0, 48);
  const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  return firstLine.replace(/[#*`>|]/g, '').trim().slice(0, 60) || '内容已生成';
}

/** 为工作台内容 Tab 生成标题 */
function deriveWorkbenchTitle(answer: string, question: string): string {
  const heading = answer.match(/(?:^|\n)#{1,6}\s+(.+)/);
  if (heading) return heading[1].trim().slice(0, 20);
  return question.trim().slice(0, 16) || 'AI 回复';
}

/**
 * 调用后端 AI 助手并分离「思考链进度」与「正文流」
 * 同时处理工具调用事件，展示 loading 状态
 */
async function runAgent(
  message: string,
  handlers: {
    onProgress: (text: string) => void;
    onAnswer: (fullText: string) => void;
    onDone: (fullText: string) => void;
    onToolCall?: (toolName: string, args: Record<string, unknown>, resultSummary?: string) => void;
    onRichChunk?: (chunk: import('../../types/workbench').RichChunk) => void;
  },
) {
  const steps = new Map<number, { title: string; status: string }>();
  let answering = false;
  const renderThoughts = () =>
    [...steps.values()].map((s) => `${s.status === 'success' ? '✓' : '⚡'} ${s.title}`).join('\n');

  handlers.onProgress('正在连接 AlphaAgent...');

  const full = await streamChat(
    { message, enableThoughtChain: true },
    {
      onThought: (s) => {
        steps.set(s.step, { title: s.title, status: s.status });
        if (!answering) handlers.onProgress(renderThoughts());
      },
      onToken: (fullText) => {
        answering = true;
        handlers.onAnswer(fullText);
      },
      onToolCall: (data) => {
        handlers.onToolCall?.(data.toolName, data.args, data.resultSummary ?? undefined);
      },
      onRichChunk: (chunk) => {
        handlers.onRichChunk?.(chunk);
      },
      onError: (e) => {
        throw new Error(e.message);
      },
    },
  );

  handlers.onDone(full || '（模型未返回内容）');
}

/** 格式化会话时间 */
function formatSessionTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

interface ChatPanelProps {
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onClose }) => {
  const {
    pushContent, updateContent, setActiveTabKey,
    chatState, createConversation, deleteConversation,
    switchConversation, renameConversation, updateSessionMessages,
    clearActiveMessages, persistChatState,
    addToolCall, removeToolCall, clearToolCalls, addRichChunk,
  } = useCockpitStore();

  const [inputValue, setInputValue] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [deepThink, setDeepThink] = React.useState(false);
  const [model, setModel] = React.useState('alpha-pro');
  const [files, setFiles] = React.useState<Attachment[]>([]);
  const [attachmentsOpen, setAttachmentsOpen] = React.useState(false);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const senderRef = React.useRef<SenderRef>(null);
  const attachmentsRef = React.useRef<AttachmentsRef>(null);

  // 持久化聊天状态（节流）
  const persistTimerRef = React.useRef<ReturnType<typeof setTimeout>>();
  const schedulePersist = React.useCallback(() => {
    clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => persistChatState(), 500);
  }, [persistChatState]);

  // 标准 skill 目录
  const [skillCatalog, setSkillCatalog] = React.useState<SkillCatalogItem[]>([]);
  React.useEffect(() => {
    fetchSkillCatalog().then(setSkillCatalog).catch(() => {});
  }, []);

  // "/" 唤起的建议项
  const suggestionItems = React.useMemo<SuggestionItem[]>(() => {
    const skills: SuggestionItem[] = skillCatalog.map((s) => ({
      label: s.name,
      value: `skill:${s.scope}:${s.folder}`,
      icon: <Puzzle size={14} />,
      extra: s.description,
    }));
    return [...skills, ...skillItems];
  }, [skillCatalog]);

  const activeMessages = chatState.messagesBySession[chatState.activeSessionId] ?? [];

  const handleSubmit = React.useCallback(async (value: string) => {
    const text = value.trim();
    if (!text || loading) return;

    const sessionId = chatState.activeSessionId;
    const attachmentNote = files.length > 0 ? `\n\n📎 已附带 ${files.length} 个文件：${files.map((f) => f.name).join('、')}` : '';
    const userMessage: ChatMessage = { id: createId('msg'), role: 'user', content: `${text}${attachmentNote}`, status: 'success' };
    const aiMessageId = createId('msg');
    const aiMessage: ChatMessage = { id: aiMessageId, role: 'ai', content: '正在连接 AlphaAgent...', status: 'loading' };

    setInputValue('');
    setFiles([]);
    setAttachmentsOpen(false);
    setLoading(true);

    // 如果是默认标题，用用户消息更新会话标题
    const currentSession = chatState.sessions.find(s => s.id === sessionId);
    if (currentSession && (currentSession.title === '新的投资对话' || currentSession.title === 'AlphaAgent 助手')) {
      renameConversation(sessionId, text.slice(0, 18));
    }

    updateSessionMessages(sessionId, (messages) => [...messages, userMessage, aiMessage]);
    schedulePersist();

    pushDemoRichContent(text, pushContent);

    const prefix = deepThink ? '🧠 深度思考模式 · 多步推理\n\n' : '';
    let workbenchId: string | null = null;
    let reportFromBackend = false;

    const ensureWorkbench = (answer: string) => {
      if (workbenchId) return workbenchId;
      workbenchId = createId('wb');
      pushContent({
        id: workbenchId,
        title: deriveWorkbenchTitle(answer, text),
        type: 'markdown',
        data: prefix + answer,
        timestamp: Date.now(),
        sourceMessageId: aiMessageId,
      });
      return workbenchId;
    };

    try {
      await runAgent(text, {
        onProgress: (partialText) => {
          updateSessionMessages(sessionId, (messages) => messages.map((item) => (
            item.id === aiMessageId ? { ...item, content: prefix + partialText, status: 'loading' } : item
          )));
        },
        onAnswer: (fullText) => {
          if (reportFromBackend) {
            // 后端将发送 report rich_chunk，由 WorkbenchPanel 自动创建工作台 Tab
            // 仅更新气泡显示，不创建前端侧重的工作台内容
            updateSessionMessages(sessionId, (messages) => messages.map((item) => (
              item.id === aiMessageId
                ? { ...item, content: `正在生成报告…\n\n${summarizeAnswer(fullText)}`, status: 'loading' }
                : item
            )));
          } else if (workbenchId || isStructuredLongform(fullText)) {
            const id = ensureWorkbench(fullText);
            updateContent(id, prefix + fullText);
            updateSessionMessages(sessionId, (messages) => messages.map((item) => (
              item.id === aiMessageId
                ? { ...item, content: `正在生成到工作台…\n\n${summarizeAnswer(fullText)}`, status: 'loading', workbenchId: id }
                : item
            )));
          } else {
            updateSessionMessages(sessionId, (messages) => messages.map((item) => (
              item.id === aiMessageId ? { ...item, content: prefix + fullText, status: 'loading' } : item
            )));
          }
        },
        onToolCall: (toolName, args, resultSummary) => {
          if (resultSummary) {
            // 工具执行完成，移除 loading 状态
            removeToolCall(toolName);
          } else {
            // 工具开始调用，添加 loading 状态
            addToolCall(toolName, args);
          }
        },
        onRichChunk: (chunk) => {
          // 收到富内容 chunk → 写入 store，WorkbenchPanel 会自动推送为工作台 Tab
          if (chunk.type === 'report') {
            reportFromBackend = true;
          }
          addRichChunk(chunk);
        },
        onDone: (finalText) => {
          clearToolCalls();
          if (workbenchId) {
            const id = workbenchId;
            updateContent(id, prefix + finalText);
            updateSessionMessages(sessionId, (messages) => messages.map((item) => (
              item.id === aiMessageId
                ? { ...item, content: `已在工作台生成内容：「${summarizeAnswer(finalText)}」`, status: 'success', workbenchId: id }
                : item
            )));
          } else if (reportFromBackend) {
            // 报告已通过后端 report rich_chunk 推送到工作台，显示成功提示
            updateSessionMessages(sessionId, (messages) => messages.map((item) => (
              item.id === aiMessageId
                ? { ...item, content: `已在工作台生成报告：「${summarizeAnswer(finalText)}」`, status: 'success' }
                : item
            )));
          } else {
            updateSessionMessages(sessionId, (messages) => messages.map((item) => (
              item.id === aiMessageId ? { ...item, content: prefix + finalText, status: 'success' } : item
            )));
          }
          schedulePersist();
        },
      });
    } catch (error) {
      updateSessionMessages(sessionId, (messages) => messages.map((item) => (
        item.id === aiMessageId ? { ...item, content: `请求失败：${(error as Error).message}`, status: 'error' } : item
      )));
    } finally {
      setLoading(false);
      schedulePersist();
    }
  }, [loading, pushContent, updateContent, chatState.activeSessionId, chatState.sessions, updateSessionMessages, renameConversation, schedulePersist, deepThink, files, addToolCall, removeToolCall, clearToolCalls, addRichChunk]);

  const handleRenameSubmit = (sessionId: string) => {
    if (renameValue.trim()) {
      renameConversation(sessionId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const conversationItems = chatState.sessions
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((session) => ({
      key: session.id,
      label: session.title,
      group: session.group,
      icon: <MessageSquare size={13} />,
    }));

  const bubbleItems = activeMessages.map((item) => ({
    key: item.id,
    role: item.role === 'user' ? 'user' : 'ai',
    placement: item.role === 'user' ? 'end' : 'start',
    avatar: item.role === 'user'
      ? <Avatar size={28} icon={<User size={14} />} style={{ background: '#6C63FF', color: '#fff' }} />
      : <Avatar size={28} icon={<Bot size={14} />} style={{ background: '#252A3D', color: '#6C63FF' }} />,
    content: item.content,
    status: item.status,
    styles: item.role === 'user' ? userBubbleStyle : agentBubbleStyle,
    typing: item.role === 'ai' && item.status === 'loading' && !item.workbenchId ? { effect: 'typing', step: 2, interval: 35 } : false,
    streaming: item.role === 'ai' && item.status === 'loading' && !item.workbenchId,
    contentRender: item.workbenchId
      ? (content: string) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ color: '#D4D9E8', whiteSpace: 'pre-wrap' }}>{content}</span>
            <Button
              size="small"
              icon={<Presentation size={13} />}
              onClick={() => setActiveTabKey(item.workbenchId!)}
              style={{
                alignSelf: 'flex-start',
                background: 'rgba(108,99,255,0.14)',
                color: '#A78BFA',
                borderColor: 'rgba(108,99,255,0.3)',
              }}
            >
              在工作台查看
            </Button>
          </div>
        )
      : undefined,
  }));

  // ---- 会话历史侧边列表面板 ----
  const historyContent = (
    <div style={{ width: 268, display: 'flex', flexDirection: 'column', maxHeight: 420 }}>
      <Button
        block
        size="small"
        icon={<Plus size={13} />}
        onClick={createConversation}
        style={{ marginBottom: 8, background: 'rgba(108,99,255,0.12)', color: '#A78BFA', borderColor: 'rgba(108,99,255,0.25)' }}
      >
        新建对话
      </Button>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Conversations
          items={conversationItems}
          activeKey={chatState.activeSessionId}
          onActiveChange={(key) => {
            switchConversation(key);
            setHistoryOpen(false);
          }}
          groupable
          menu={(item) => ({
            items: [
              { key: 'rename', icon: <Pencil size={12} />, label: '重命名' },
              { key: 'delete', icon: <Trash2 size={12} />, label: '删除对话', danger: true },
            ],
            onClick: ({ key: menuKey, domEvent }) => {
              domEvent.stopPropagation();
              if (menuKey === 'delete') {
                deleteConversation(item.key);
              } else if (menuKey === 'rename') {
                const session = chatState.sessions.find(s => s.id === item.key);
                if (session) {
                  setRenamingId(item.key);
                  setRenameValue(session.title);
                }
              }
            },
          })}
          styles={{ item: { color: '#8B92A5' } }}
        />
        {/* 内联重命名输入框 */}
        {renamingId && (
          <div style={{ padding: '8px 12px', display: 'flex', gap: 4 }}>
            <Input
              size="small"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onPressEnter={() => handleRenameSubmit(renamingId)}
              autoFocus
              style={{ flex: 1, background: '#1E2335', borderColor: 'rgba(108,99,255,0.35)', color: '#F0F2F7', fontSize: 12 }}
            />
            <Button
              size="small"
              type="text"
              icon={<Check size={13} />}
              onClick={() => handleRenameSubmit(renamingId)}
              style={{ color: '#00C896' }}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section style={{ display: 'flex', minWidth: 0, flexDirection: 'column', height: '100%' }}>
        <div
          style={{
            height: 44,
            padding: '0 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <Bot size={16} color="#6C63FF" />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#F0F2F7' }}>AI 助手</span>
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(0,200,150,0.12)', color: '#00C896' }}>
            在线
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* 历史会话：侧边列表 */}
            <Popover
              open={historyOpen}
              onOpenChange={setHistoryOpen}
              trigger="click"
              placement="bottomRight"
              arrow={false}
              content={historyContent}
              styles={{ content: { background: '#111521', border: '1px solid rgba(255,255,255,0.08)', padding: 10 } }}
            >
              <Button
                type="text"
                size="small"
                style={{ color: '#8B92A5', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <History size={14} />
                <span style={{ fontSize: 11 }}>{chatState.sessions.length}</span>
              </Button>
            </Popover>

            <Tooltip title="新建对话">
              <Button
                type="text"
                size="small"
                icon={<Plus size={14} />}
                onClick={createConversation}
                style={{ color: '#A78BFA' }}
              />
            </Tooltip>

            <Dropdown
              menu={{
                items: [
                  { key: 'clear', icon: <Trash2 size={12} />, label: '清空当前对话' },
                ],
                onClick: ({ key }) => {
                  if (key === 'clear') {
                    clearActiveMessages();
                    antdMessage.success('当前对话已清空');
                  }
                },
              }}
            >
              <Button type="text" size="small" icon={<MoreHorizontal size={14} />} style={{ color: '#8B92A5' }} />
            </Dropdown>
            <Tooltip title="关闭 AI 助手">
              <Button type="text" size="small" icon={<PanelRightClose size={14} />} onClick={onClose} style={{ color: '#8B92A5' }} />
            </Tooltip>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', padding: '10px 0' }}>
          {bubbleItems.length === 0 ? (
            <div style={{ height: '100%', overflowY: 'auto', padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Welcome
                variant="borderless"
                icon={<Sparkles size={30} color="#6C63FF" />}
                title="AlphaAgent 助手模式"
                description="我可以结合工作台上下文、Mock 持仓、市场信号和 Agent 决策，生成报告或推送富内容到工作台。"
                style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.16)', borderRadius: 12 }}
                styles={{
                  title: { color: '#F0F2F7', fontSize: 14 },
                  description: { color: '#8B92A5', fontSize: 12, lineHeight: 1.7 },
                }}
              />
              <Prompts
                title={<span style={{ color: '#8B92A5', fontSize: 12 }}>快捷任务</span>}
                items={promptItems}
                vertical
                onItemClick={({ data }) => handleSubmit(promptTexts[data.key] ?? String(data.label ?? ''))}
                styles={{
                  item: { background: '#1E2335', borderColor: 'rgba(255,255,255,0.08)' },
                  itemContent: { color: '#D4D9E8' },
                  title: { color: '#8B92A5' },
                }}
              />
            </div>
          ) : (
            <Bubble.List
              items={bubbleItems as any}
              autoScroll
              style={{ height: '100%', overflowY: 'auto', padding: '0 12px' }}
            />
          )}
        </div>

        <div style={{ padding: '12px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <Suggestion
            items={suggestionItems}
            onSelect={(value) => {
              if (value.startsWith('skill:')) {
                const folder = value.split(':')[2] ?? '';
                setInputValue(`/${folder} `);
              } else {
                setInputValue(promptTexts[value] ?? '');
              }
              senderRef.current?.focus();
            }}
            styles={{ popup: { background: '#171B26' } }}
          >
            {({ onTrigger, onKeyDown }) => (
              <Sender
                ref={senderRef}
                value={inputValue}
                loading={loading}
                onChange={(nextVal) => {
                  if (nextVal === '/') {
                    onTrigger();
                  } else if (!nextVal) {
                    onTrigger(false);
                  }
                  setInputValue(nextVal);
                }}
                onKeyDown={onKeyDown}
                onSubmit={handleSubmit}
                onCancel={() => setLoading(false)}
                onPasteFile={(fileList) => {
                  Array.from(fileList).forEach((file) => attachmentsRef.current?.upload(file));
                  setAttachmentsOpen(true);
                }}
                placeholder="问 Agent，输入 / 唤起技能，或上传研报、持仓文件…"
                autoSize={{ minRows: 3, maxRows: 8 }}
                allowSpeech
                suffix={false}
                header={
                  <Sender.Header
                    title={<span style={{ fontSize: 12, color: '#8B92A5' }}>附件</span>}
                    open={attachmentsOpen}
                    onOpenChange={setAttachmentsOpen}
                    forceRender
                    styles={{ content: { padding: 8 } }}
                  >
                    <Attachments
                      ref={attachmentsRef}
                      beforeUpload={() => false}
                      items={files}
                      onChange={({ fileList }) => setFiles(fileList as Attachment[])}
                      getDropContainer={() => senderRef.current?.nativeElement ?? undefined}
                      placeholder={(type) =>
                        type === 'drop'
                          ? { title: '松开上传文件' }
                          : {
                              icon: <Paperclip size={18} />,
                              title: '上传文件',
                              description: '支持研报 PDF、持仓 CSV、图片等',
                            }
                      }
                    />
                  </Sender.Header>
                }
                footer={(_, { components }) => {
                  const { SendButton, LoadingButton, SpeechButton } = components;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Tooltip title="上传文件">
                          <Button
                            type="text"
                            size="small"
                            icon={<Paperclip size={15} />}
                            onClick={() => {
                              setAttachmentsOpen(true);
                              attachmentsRef.current?.select();
                            }}
                            style={{ color: '#8B92A5' }}
                          />
                        </Tooltip>
                        <Sender.Switch
                          icon={<Brain size={13} />}
                          checkedChildren="深度思考"
                          unCheckedChildren="深度思考"
                          value={deepThink}
                          onChange={setDeepThink}
                        />
                        <Select
                          size="small"
                          variant="borderless"
                          value={model}
                          onChange={setModel}
                          options={MODEL_OPTIONS}
                          suffixIcon={<ChevronDown size={12} />}
                          popupMatchSelectWidth={180}
                          style={{ minWidth: 124 }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <SpeechButton />
                        {loading ? <LoadingButton type="text" /> : <SendButton type="primary" />}
                      </div>
                    </div>
                  );
                }}
                styles={{
                  input: { color: '#F0F2F7', fontSize: 13 },
                  root: {
                    background: '#1E2335',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12,
                  },
                }}
              />
            )}
          </Suggestion>
        </div>
      </section>
  );
};
