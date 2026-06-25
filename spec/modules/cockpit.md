# 智能驾驶舱 - 详细交互设计

## 概述

智能驾驶舱是 AlphaAgent 的核心工作空间。当前版本采用**工作台 + 可拖拽 AI 助手**的布局：上下文不再是独立左列，而是工作台的默认 Tab；AI 助手基于 `@ant-design/x@2.5.0` 的助手模式组件组合实现，支持历史会话管理、关闭/悬浮唤起和拖拽调整宽度。

## 布局结构

```
┌──────────────────────────────────────────────┬──────────────────────┐
│                 WORKBENCH flex:1             │  AI Assistant 420px  │
│                                              │  draggable 320-640px │
│ ┌─ Topbar ─────────────────────────────────┐ │ ┌─ Conversations ─┐  │
│ │ [唤起上下文] 工作台标题 [唤起AI] [操作]   │ │ │ 历史会话/新建    │  │
│ └──────────────────────────────────────────┘ │ └──────────────────┘  │
│ ┌─ Tabs ───────────────────────────────────┐ │ ┌─ Chat Body ─────┐  │
│ │ 上下文(default, closable) | 报告 | 图表... │ │ │ Welcome/Prompts  │  │
│ └──────────────────────────────────────────┘ │ │ Bubble.List      │  │
│ ┌─ ContentRenderer / ContextDrawer ────────┐ │ └──────────────────┘  │
│ │ KPI、待确认决策、因子信号或AI富内容       │ │ ┌─ Sender ────────┐  │
│ └──────────────────────────────────────────┘ │ └──────────────────┘  │
└──────────────────────────────────────────────┴──────────────────────┘

关闭 AI 助手后：右下角显示悬浮 Bot 按钮，可随时唤起。
关闭上下文 Tab 后：工作台顶栏显示“唤起上下文”按钮。
```

## 上下文默认 Tab（ContextDrawer）

上下文从原来的独立左列调整为工作台默认 Tab：

- 默认打开，Tab key 固定为 `__context__`
- 可通过 Tab 的关闭按钮关闭
- 关闭后不影响业务内容 Tab
- 可通过工作台顶栏按钮随时唤起
- 决策数量以 Badge 形式显示在上下文 Tab 标题中

### KPI 卡片（2×2 Grid）
- 组合净值 · 今日收益 · YTD · 超额 α
- 数值使用 JetBrains Mono，颜色语义化

### 待确认决策列表
- 最多同时显示 5 条 Agent 决策
- 每条决策：股票名称 + 方向徽章 + 置信度进度条
- 操作：确认 / 分析 / 忽略
- 点击“分析”会把该标的分析报告推送为新的工作台 Tab

### 因子信号双向条
- 展示 5 个关键因子的当前信号强度（-1 到 1）
- 正值绿色，负值红色，居中对齐

## 中央工作台（WorkbenchPanel）

### 多 Tab 管理
- 上下文 Tab 不计入业务内容上限
- 业务内容最多 5 个标签页，超出时移除最旧的业务内容
- 标签页标题来自 `WorkbenchContent.title`
- `clearContents()` 只清空业务内容，不关闭上下文 Tab

### ContentRenderer 内容类型

| 类型 | 渲染器 | 说明 |
|------|--------|------|
| `markdown` | react-markdown + remarkGfm | 报告、分析文本 |
| `chart` | G2Chart 封装 | 动态图表（传入 spec 对象） |
| `decision_set` | DecisionCard 网格 | 决策集批量展示 |
| `svg` | `<img>` 内联 SVG | 流程图、架构图 |
| `pdf` | `<iframe>` 嵌入 | PDF 报告预览 |
| `image` | `<img>` | 图片预览 |
| `report` | Markdown 变体 | 带 metadata 的富文本报告 |

### 空态
- 当上下文 Tab 和业务内容都关闭时显示空态
- 空态提供“唤起上下文”“打开 AI 助手”“查看决策建议”“运行策略回测”等快捷操作

## AI 助手面板（ChatPanel）

### @ant-design/x 2.5.0 组件组合

| 组件 | 用途 |
|------|------|
| `Conversations` | 历史会话列表、会话切换、新建、删除 |
| `Welcome` | 空会话欢迎态，说明助手能力 |
| `Prompts` | 快捷任务入口，如持仓分析、市场扫描、决策建议 |
| `Bubble.List` | 消息气泡列表与流式渲染 |
| `Sender` | 新版输入框，支持 loading、语音和 slot/skill 扩展 |

> `@ant-design/x@2.5.0` 不再使用旧版 `useXAgent/useXChat` 导出；当前实现采用显式会话状态 + Mock Agent 流程，后续接入真实 SSE 时替换 `runMockAgent()` 即可。

### 历史会话管理
- 支持新建对话
- 支持切换历史会话
- 支持删除对话
- 支持清空当前对话
- 会话与消息保存在 `localStorage`：`alpha-agent-cockpit-chat-history`

### 宽度与开关
- 默认宽度：420px
- 最小宽度：320px
- 最大宽度：640px
- 左侧拖拽手柄支持调整宽度
- 关闭后右下角悬浮 Bot 按钮唤起

## Mock SSE 流程

```
用户发送消息
  → 写入当前会话 user message
  → 创建 loading 状态的 AI message
  → 250ms: 理解问题
  → 520ms: 调用市场数据与持仓上下文
  → 850ms: 检索持仓数据库
  → 1180ms: 计算因子评分与风险暴露
  → 根据意图推送 decision_set 或 markdown 报告到工作台
  → AI message 变为 success
```

## 数据流

```
用户输入
  ↓ ChatPanel.handleSubmit()
  ↓ runMockAgent() 更新当前会话消息
  ↓ pushContent() 推送富内容
  ↓ cockpit.store.activeContents 更新
  ↓ WorkbenchPanel 激活新业务 Tab
```

## Zustand Store 结构

```ts
interface CockpitStore {
  activeContents: WorkbenchContent[];  // 最多 5 个业务 Tab
  activeTabKey: string | null;         // 可为 __context__
  contextTabOpen: boolean;             // 上下文默认 Tab 开关
  chatOpen: boolean;                   // AI 助手面板开关
  chatWidth: number;                   // 320–640px
  pendingDecisions: Decision[];

  pushContent(content: WorkbenchContent): void;
  removeContent(id: string): void;
  clearContents(): void;
  setActiveTabKey(key: string | null): void;
  openContextTab(): void;
  closeContextTab(): void;
  setChatOpen(open: boolean): void;
  setChatWidth(width: number): void;
  confirmDecision(id: string): void;
  dismissDecision(id: string): void;
}
```
