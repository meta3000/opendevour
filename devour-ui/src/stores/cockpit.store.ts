/**
 * AlphaAgent · 驾驶舱 Zustand Store
 * 管理工作台内容、上下文 Tab、AI 助手面板、会话历史和待确认决策列表
 * 规则：Zustand 管理本地 UI 状态，React Query 管理服务端状态
 */

import { create } from 'zustand';
import type { WorkbenchContent, RichChunk } from '../types/workbench';
import type { Decision } from '../types/decision';
import { mockPendingDecisions } from '../mock/cockpit.mock';
import * as decisionsApi from '../api/decisions.api';

const CONTEXT_TAB_KEY = '__context__';
const MIN_CHAT_WIDTH = 360;
const MAX_CHAT_WIDTH = 680;

// ---- 会话历史持久化 ----

/** 聊天消息 */
export type ChatRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  status?: 'loading' | 'success' | 'error';
  /** 若该回复已被路由到工作台，记录对应内容 Tab 的 id */
  workbenchId?: string;
}

/** 聊天会话 */
export interface ChatSession {
  id: string;
  title: string;
  group: '今天' | '昨天' | '历史';
  updatedAt: number;
}

/** 持久化的聊天状态 */
export interface PersistedChatState {
  sessions: ChatSession[];
  messagesBySession: Record<string, ChatMessage[]>;
  activeSessionId: string;
}

const CHAT_STORAGE_KEY = 'alpha-agent-cockpit-chat-history';

export const createId = (prefix: string) => {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomId}`;
};

export const createSession = (title = '新的投资对话'): ChatSession => ({
  id: createId('session'),
  title,
  group: '今天',
  updatedAt: Date.now(),
});

export const createInitialState = (): PersistedChatState => {
  const session = createSession('AlphaAgent 助手');
  return {
    sessions: [session],
    messagesBySession: { [session.id]: [] },
    activeSessionId: session.id,
  };
};

export const loadPersistedChatState = (): PersistedChatState => {
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as PersistedChatState;
    if (!parsed.sessions?.length || !parsed.activeSessionId) return createInitialState();
    return parsed;
  } catch {
    return createInitialState();
  }
};

// ---- 工作台 Tab 排序持久化 ----

const TAB_ORDER_STORAGE_KEY = 'alpha-agent-workbench-tab-order';

const loadTabOrder = (): string[] => {
  try {
    const raw = window.localStorage.getItem(TAB_ORDER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveTabOrder = (ids: string[]) => {
  try { window.localStorage.setItem(TAB_ORDER_STORAGE_KEY, JSON.stringify(ids)); } catch {}
};

interface CockpitStore {
  // ---- 工作台内容 ----
  /** 当前活跃内容列表（最多 5 个业务标签页，不包含上下文默认 Tab） */
  activeContents: WorkbenchContent[];
  /**
   * 推送内容到工作台
   * 若 id 已存在则替换，超过 5 个时移除最旧的业务内容
   */
  pushContent: (content: WorkbenchContent) => void;
  /** 通过 id 移除业务内容 */
  removeContent: (id: string) => void;
  /** 就地更新某条业务内容的数据（用于 md/txt 编辑回写） */
  updateContent: (id: string, data: unknown) => void;
  /** 清空业务工作台内容，不影响上下文 Tab */
  clearContents: () => void;
  /** 当前激活的标签 key，可能是上下文默认 Tab */
  activeTabKey: string | null;
  setActiveTabKey: (key: string | null) => void;

  // ---- 工作台 Tab 拖拽排序 ----
  /** 重新排列工作台内容 Tab 顺序 */
  reorderContents: (fromIndex: number, toIndex: number) => void;

  // ---- 上下文默认 Tab ----
  /** 上下文 Tab 是否显示；可关闭，也可从工作台顶栏唤起 */
  contextTabOpen: boolean;
  openContextTab: () => void;
  closeContextTab: () => void;

  // ---- AI 助手面板 ----
  /** AI 助手面板是否打开；关闭后展示悬浮唤起按钮 */
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  /** AI 助手面板宽度，支持拖拽调整 */
  chatWidth: number;
  setChatWidth: (width: number) => void;

  // ---- 会话历史持久化 ----
  /** 持久化聊天状态 */
  chatState: PersistedChatState;
  /** 创建新会话 */
  createConversation: () => void;
  /** 删除会话 */
  deleteConversation: (sessionId: string) => void;
  /** 切换活跃会话 */
  switchConversation: (sessionId: string) => void;
  /** 重命名会话 */
  renameConversation: (sessionId: string, title: string) => void;
  /** 更新指定会话的消息列表 */
  updateSessionMessages: (sessionId: string, updater: (messages: ChatMessage[]) => ChatMessage[]) => void;
  /** 获取当前活跃会话的消息列表 */
  getActiveMessages: () => ChatMessage[];
  /** 清空当前会话消息 */
  clearActiveMessages: () => void;
  /** 持久化聊天状态到 localStorage */
  persistChatState: () => void;

  // ---- 待确认决策 ----
  /** 待确认的 Agent 决策列表 */
  pendingDecisions: Decision[];
  /**
   * 从后端拉取待确认决策列表
   * 实际调用 GET /api/v1/decisions/pending
   */
  fetchPendingDecisions: () => Promise<void>;
  /**
   * 确认决策（移除并触发执行回调）
   * 实际调用 POST /api/v1/decisions/:id/confirm
   */
  confirmDecision: (id: string) => void;
  /**
   * 忽略决策（移除）
   * 实际调用 DELETE /api/v1/decisions/:id
   */
  dismissDecision: (id: string) => void;
  /** 批量确认所有决策 */
  confirmAllDecisions: () => void;
  /** 批量忽略所有决策 */
  dismissAllDecisions: () => void;

  // ---- 工具调用状态 ----
  /** 当前正在执行的工具调用列表（用于渲染 loading 状态） */
  activeToolCalls: { toolName: string; args: Record<string, unknown> }[];
  /** 添加工具调用 */
  addToolCall: (toolName: string, args: Record<string, unknown>) => void;
  /** 移除工具调用（执行完成时） */
  removeToolCall: (toolName: string) => void;
  /** 清空所有工具调用 */
  clearToolCalls: () => void;

  // ---- 富内容 chunk 状态 ----
  /** 流式接收的富内容 chunk 列表 */
  richChunks: RichChunk[];
  /** 添加一个富内容 chunk */
  addRichChunk: (chunk: RichChunk) => void;
  /** 清空所有富内容 chunks */
  clearRichChunks: () => void;
}

export const useCockpitStore = create<CockpitStore>((set, get) => ({
  // ---- 工作台 ----
  activeContents: [],
  activeTabKey: CONTEXT_TAB_KEY,

  pushContent: (content) =>
    set((s) => {
      const filtered = s.activeContents.filter((c) => c.id !== content.id);
      // 按 localStorage 保存的顺序排列，新内容放末尾
      const tabOrder = loadTabOrder();
      let next: WorkbenchContent[];
      if (tabOrder.length > 0) {
        const ordered = tabOrder
          .map((id) => {
            const existing = filtered.find((c) => c.id === id);
            if (existing) return existing;
            if (content.id === id) return content;
            return null;
          })
          .filter(Boolean) as WorkbenchContent[];
        // 追加不在排序中的内容
        const remaining = filtered.filter((c) => !tabOrder.includes(c.id) && c.id !== content.id);
        const notInOrder = !tabOrder.includes(content.id) ? [content] : [];
        next = [...ordered, ...remaining, ...notInOrder].slice(-5);
      } else {
        next = [...filtered, content].slice(-5);
      }
      return {
        activeContents: next,
        activeTabKey: content.id,
      };
    }),

  removeContent: (id) =>
    set((s) => {
      const next = s.activeContents.filter((c) => c.id !== id);
      saveTabOrder(next.map((c) => c.id));
      if (s.activeTabKey !== id) {
        return { activeContents: next };
      }
      return {
        activeContents: next,
        activeTabKey: next[next.length - 1]?.id ?? (s.contextTabOpen ? CONTEXT_TAB_KEY : null),
      };
    }),

  clearContents: () =>
    set((s) => ({
      activeContents: [],
      activeTabKey: s.contextTabOpen ? CONTEXT_TAB_KEY : null,
    })),

  updateContent: (id, data) =>
    set((s) => ({
      activeContents: s.activeContents.map((c) => (c.id === id ? { ...c, data } : c)),
    })),

  setActiveTabKey: (key) => set({ activeTabKey: key }),

  // ---- 工作台 Tab 拖拽排序 ----
  reorderContents: (fromIndex, toIndex) =>
    set((s) => {
      const items = [...s.activeContents];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      saveTabOrder(items.map((c) => c.id));
      return { activeContents: items };
    }),

  // ---- 上下文默认 Tab ----
  contextTabOpen: true,
  openContextTab: () => set({ contextTabOpen: true, activeTabKey: CONTEXT_TAB_KEY }),
  closeContextTab: () =>
    set((s) => ({
      contextTabOpen: false,
      activeTabKey: s.activeTabKey === CONTEXT_TAB_KEY ? s.activeContents[s.activeContents.length - 1]?.id ?? null : s.activeTabKey,
    })),

  // ---- AI 助手 ----
  chatOpen: true,
  setChatOpen: (open) => set({ chatOpen: open }),
  chatWidth: 460,
  setChatWidth: (width) => set({ chatWidth: Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, width)) }),

  // ---- 会话历史持久化 ----
  chatState: loadPersistedChatState(),

  createConversation: () => {
    const session = createSession();
    set((s) => ({
      chatState: {
        sessions: [session, ...s.chatState.sessions],
        messagesBySession: { ...s.chatState.messagesBySession, [session.id]: [] },
        activeSessionId: session.id,
      },
    }));
    get().persistChatState();
  },

  deleteConversation: (sessionId) => {
    set((s) => {
      const nextSessions = s.chatState.sessions.filter((session) => session.id !== sessionId);
      const nextMessages = { ...s.chatState.messagesBySession };
      delete nextMessages[sessionId];
      if (nextSessions.length === 0) {
        const fresh = createInitialState();
        return { chatState: fresh };
      }
      return {
        chatState: {
          sessions: nextSessions,
          messagesBySession: nextMessages,
          activeSessionId: s.chatState.activeSessionId === sessionId ? nextSessions[0].id : s.chatState.activeSessionId,
        },
      };
    });
    get().persistChatState();
  },

  switchConversation: (sessionId) => {
    set((s) => ({
      chatState: { ...s.chatState, activeSessionId: sessionId },
    }));
    get().persistChatState();
  },

  renameConversation: (sessionId, title) => {
    set((s) => ({
      chatState: {
        ...s.chatState,
        sessions: s.chatState.sessions.map((session) =>
          session.id === sessionId ? { ...session, title, updatedAt: Date.now() } : session
        ),
      },
    }));
    get().persistChatState();
  },

  updateSessionMessages: (sessionId, updater) => {
    set((s) => ({
      chatState: {
        ...s.chatState,
        sessions: s.chatState.sessions.map((session) =>
          session.id === sessionId ? { ...session, updatedAt: Date.now() } : session
        ),
        messagesBySession: {
          ...s.chatState.messagesBySession,
          [sessionId]: updater(s.chatState.messagesBySession[sessionId] ?? []),
        },
      },
    }));
    // 防抖持久化由 ChatPanel 统一处理
  },

  getActiveMessages: () => {
    const { chatState } = get();
    return chatState.messagesBySession[chatState.activeSessionId] ?? [];
  },

  clearActiveMessages: () => {
    const sessionId = get().chatState.activeSessionId;
    set((s) => ({
      chatState: {
        ...s.chatState,
        messagesBySession: {
          ...s.chatState.messagesBySession,
          [sessionId]: [],
        },
      },
    }));
    get().persistChatState();
  },

  persistChatState: () => {
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(get().chatState));
    } catch {}
  },

  // ---- 决策 ----
  pendingDecisions: mockPendingDecisions,

  fetchPendingDecisions: async () => {
    try {
      const res = await decisionsApi.getPendingDecisions();
      if (res.code === 0 && res.data) {
        // 将后端 DecisionDTO 转换为前端 Decision 格式
        const decisions: Decision[] = res.data.map((d) => ({
          id: d.id,
          symbol: d.symbol,
          name: d.symbol, // 后端精简存储，前端可后续补充
          action: d.action as Decision['action'],
          confidence: Math.round(d.confidence * 100),
          targetPrice: 0,
          stopPrice: 0,
          positionDelta: 0,
          expectedPnlPct: 0,
          reasoning: d.reason,
          triggerFactors: [],
          createdAt: new Date(d.created_at).getTime(),
          status: d.status as Decision['status'],
        }));
        set({ pendingDecisions: decisions });
      }
    } catch {
      // 后端不可用时保留 mock 数据
    }
  },

  confirmDecision: (id) => {
    decisionsApi.confirmDecision(id).catch(() => {});
    set((s) => ({
      pendingDecisions: s.pendingDecisions.filter((d) => d.id !== id),
    }));
  },

  dismissDecision: (id) => {
    decisionsApi.rejectDecision(id).catch(() => {});
    set((s) => ({
      pendingDecisions: s.pendingDecisions.filter((d) => d.id !== id),
    }));
  },

  confirmAllDecisions: () => {
    const { pendingDecisions } = get();
    pendingDecisions.forEach((d) => decisionsApi.confirmDecision(d.id).catch(() => {}));
    set({ pendingDecisions: [] });
  },

  dismissAllDecisions: () => {
    const { pendingDecisions } = get();
    pendingDecisions.forEach((d) => decisionsApi.rejectDecision(d.id).catch(() => {}));
    set({ pendingDecisions: [] });
  },

  // ---- 工具调用状态 ----
  activeToolCalls: [],

  addToolCall: (toolName, args) =>
    set((s) => ({
      activeToolCalls: [...s.activeToolCalls, { toolName, args }],
    })),

  removeToolCall: (toolName) =>
    set((s) => ({
      activeToolCalls: s.activeToolCalls.filter((tc) => tc.toolName !== toolName),
    })),

  clearToolCalls: () => set({ activeToolCalls: [] }),

  // ---- 富内容 chunk 状态 ----
  richChunks: [],

  addRichChunk: (chunk) =>
    set((s) => ({
      richChunks: [...s.richChunks, chunk],
    })),

  clearRichChunks: () => set({ richChunks: [] }),
}));

export { CONTEXT_TAB_KEY, MIN_CHAT_WIDTH, MAX_CHAT_WIDTH };
