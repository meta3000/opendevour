# AlphaAgent · Module Interaction Specifications
> Version 2.0 · Three-column Cockpit · Ant Design X · For coding model consumption

---

## MODULE 1 — 智能驾驶舱 (Cockpit)

### Three-Column Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Topbar (44px): 智能驾驶舱  [context toggle]  [status]  [controls]    │
├─────────────────┬─────────────────────────────────┬──────────────────┤
│  LEFT CONTEXT   │  CENTER — WORKBENCH (主工作台)   │  RIGHT — CHAT    │
│  (260px,        │  (flex: 1, primary content area) │  (360px, fixed)  │
│  collapsible    │                                  │                  │
│  to 0)          │  Renders AI-generated output:    │  @ant-design/x   │
│                 │  • Markdown reports              │  assistant mode  │
│  KPI metrics    │  • G2 charts & visualizations    │                  │
│  Agent decisions│  • SVG diagrams                  │  Bubble.List     │
│  Factor signals │  • PDF previews                  │  (message thread)│
│                 │  • Images                        │                  │
│  [collapse btn] │  • Multi-tab for multiple items  │  Sender          │
│                 │                                  │  (input area)    │
└─────────────────┴─────────────────────────────────┴──────────────────┘
```

**Layout rule:** Rich content (reports, charts, decision sets) always routes to the CENTER workbench. Plain text and conversational replies stay in the RIGHT chat panel. The workbench is the "output canvas"; the chat is the "command interface."

### LEFT — Context Drawer

Collapsible via a toggle button in the topbar. Collapses to `width: 0` with CSS transition.

**Section 1 — Portfolio KPIs**  
Four `MetricCard` components in a 2×2 grid:
- 净值 (monospace, large)
- 夏普比率
- 最大回撤 (with warning color if > threshold)
- 今日 Agent 决策次数

Each card is clickable — sends "详细分析[metric name]" to chat.

**Section 2 — Agent Decisions** (max 5, scrollable)  
Decision cards: left accent border (3px semantic color), symbol + badge, confidence bar, reasoning (2 lines), [确认] / [分析] / [忽略] buttons.

Clicking card body → sends analysis request to chat AND opens a decision report in the workbench center.

**Section 3 — Factor Signals**  
5–6 bidirectional bars (G2 chart, compact). Clicking opens full factor report in workbench.

### CENTER — Workbench Panel

The primary content display area. Managed by `cockpit.store.activeContents[]`.

**Content types and their renderers:**

| Content type | Renderer | Notes |
|---|---|---|
| `markdown` | `react-markdown` + syntax highlight | Reports, analysis summaries |
| `chart` | `G2Chart` (spec-driven) | Any chart type from backend spec |
| `svg` | Inline SVG with pan/zoom | Diagrams, flowcharts |
| `pdf` | `<iframe>` or PDF.js | Research reports, documents |
| `image` | `<img>` with lightbox | Screenshots, charts as images |
| `report` | Composite: MD + charts + decisions | Full investment report |
| `decision_set` | Grid of `DecisionCard` | Multiple buy/sell/hold recommendations |

**Multi-tab behavior:** When workbench has >1 content item, antd `Tabs` appears. Tab labels = content title (e.g., "宁德时代分析" / "今日晨报"). Max 5 tabs; oldest is closed when limit exceeded.

**Empty state:** Shows a brief prompt with suggestions: "问 Agent 帮你生成分析报告 →" and quick-action chips for common tasks.

**Workbench topbar (inside center column):**  
- Left: [◀/▶] context toggle button, current content title
- Right: [导出 PDF] [全屏] [清除]

### RIGHT — Chat Panel (@ant-design/x)

Uses `@ant-design/x` assistant/conversation mode.

**Components used:**
- `XProvider` — wraps the entire app (in `main.tsx`)
- `useXAgent` — manages the streaming connection to backend
- `useXChat` — manages message state
- `Bubble.List` — renders the message thread
- `Sender` — the input component with action buttons
- `ThoughtChain` — renders tool call chains inline in bubbles

**Message rendering rules:**

```
User message       → Bubble (placement="end", accent bg)
Agent text         → Bubble (placement="start", surface bg)
Agent tool chain   → ThoughtChain component inline in bubble
Agent rich output  → Bubble with a "已生成 → 工作台" link card
                     (clicking opens the content in workbench)
```

**Tool chain display** (ThoughtChain):
```
⚡ 执行中...
  ✓ 调用 财报解析 Skill (0.8s)
  ✓ 检索 研报数据库 · 找到 12 条 (1.2s)
  ✓ 计算 多因子评分 (0.3s)
  → 报告已生成，已推送到工作台
```

**Input toolbar (above Sender):**  
Pills: `数据源` / `Skills` / `研报` / `Agent` / `上传 @`  
Each opens an antd `Popover` with a searchable list of available items.

**`@` mention detection:** Intercept Sender `onChange`, detect `@` → show dropdown of available Skills / Factors / Agents for autocomplete.

**Sender submit behavior:**
1. User sends message
2. Message appears in Bubble.List immediately
3. ThoughtChain appears as Agent begins processing
4. If output is rich content: a "已推送到工作台" bubble appears + workbench updates
5. If output is plain text: final text bubble streams in

---

## MODULE 2 — 市场发现 (Market Discovery)

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Topbar: 发现策略选择器  [时间范围]  [刷新]  [偏好设置]│
├───────────────┬─────────────────┬───────────────────┤
│  市场热力图    │  板块轮动分析    │  资金流向          │
│  (G2 Treemap) │  (G2 Radar/Line)│  (G2 Bar)         │
│  (flex: 1.5)  │  (flex: 1)      │  (flex: 1)        │
├───────────────┴─────────────────┴───────────────────┤
│  信号扫描列表 (antd Table, sticky header, paginated)  │
└─────────────────────────────────────────────────────┘
```

### Charts (all G2)

**Heatmap (Treemap):** G2 `treemap` mark. Node fill = day return (color scale: loss → gray → profit). Hover tooltip: ticker, name, price, change%, volume. Click → send analysis to cockpit chat.

**Sector Rotation (Radar + Line toggle):** G2 `radar` mark for current state. G2 `line` for historical. Use antd `Segmented` for view toggle.

**Capital Flow (Bar):** G2 horizontal `interval` mark. Sorted by net inflow. Color by direction (profit/loss).

### Signal Table

Antd `Table` component. Columns: 标的 / 信号类型 / 强度(dots) / 置信度(progress bar) / 触发因子 / 发现策略 / 操作

Sortable headers. Column filter for signal type. Row click → opens analysis in cockpit workbench.

### Discovery Strategy Selector

Antd `Select` in topbar. Lists user's saved discovery strategies. [+ 新建] option at bottom opens strategy editor drawer.

---

## MODULE 3 — 持仓管理 (Portfolio Management)

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Topbar: [导入持仓] [同步券商] [日期]  [发送到驾驶舱]  │
├────────────────────┬─────────────────────────────────┤
│  持仓明细表 (antd   │  分析面板 (right, 340px)        │
│  Table, left,      │                                 │
│  flex: 1)          │  行业分布 (G2 Pie/Donut)         │
│                    │  因子暴露 (G2 bidirectional bar) │
│  Expandable rows   │  相关性矩阵 (CSS Grid heatmap)   │
│  for inline        │  风险指标 (antd Statistic grid)  │
│  position detail   │  Agent 洞察 (antd List)          │
├────────────────────┴─────────────────────────────────┤
│  绩效归因 (antd Collapse, G2 Bar inside)              │
└──────────────────────────────────────────────────────┘
```

### Holdings Table (antd Table)

```tsx
const columns = [
  { title: '标的', dataIndex: 'ticker', sorter: true, render: TickerCell },
  { title: '仓位%', dataIndex: 'weight', sorter: true, render: WeightCell },
  { title: '成本价', dataIndex: 'costPrice', align: 'right' },
  { title: '现价', dataIndex: 'currentPrice', align: 'right' },
  { title: '浮盈亏', dataIndex: 'pnlPct', sorter: true, render: PnlCell },
  { title: '贡献度', dataIndex: 'contribution', align: 'right' },
  { title: '风险', dataIndex: 'riskScore', render: RiskDots },
  { title: 'Agent', dataIndex: 'signal', render: SignalBadge },
  { title: '操作', render: ActionCell, width: 60 },
];
```

Expandable rows (`expandable.expandedRowRender`): shows mini position detail with entry date, P&L breakdown, notes.

**Import flow:** antd `Modal` with `Tabs` (手动输入 / 文件导入). File import uses antd `Upload.Dragger`.

### Risk Metrics

Use antd `Statistic` + `Row/Col` for 2×2 grid. Color `valueStyle` based on threshold breach.

---

## MODULE 4 — 策略编排 (Strategy Builder)

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Topbar: 策略名  [状态badge]  [回测]  [激活/停用]     │
├──────────────────────────────────────────────────────┤
│  左侧 antd Sider │  主区域 (Tabs: 规则编辑 / 可视化 / 回测)│
│  (240px)         │                                   │
│                  │  规则编辑: condition builder UI    │
│  Strategy list   │  可视化: @antv/x6 canvas          │
│  (antd Menu)     │  回测结果: G2 equity curve         │
│                  │                                   │
│  [+ 新建] btn    │                                   │
└──────────────────┴───────────────────────────────────┘
```

### Tabs: 规则编辑

Visual condition builder (no code required for basic strategies):
- antd `Form` with dynamic field rows
- Factor picker: antd `Select` sourced from user's factor library
- Operator: antd `Select` (>, <, =, crosses above, crosses below, in range)
- Value: antd `InputNumber`
- AND/OR toggle: antd `Radio.Group`

"自然语言转规则" input: antd `Input.Search` — submit fills form fields via API call.

### Tabs: 可视化

@antv/x6 canvas in strategy mode. Node shapes for strategies:

- **入场条件节点** (ConditionRuleNode): shows condition summary, green border
- **动作节点** (ActionRuleNode): shows action (buy/sell + params), accent border
- **退出节点** (ExitRuleNode): red border
- **过滤节点** (FilterNode): amber border

Simpler than Agent canvas — primarily a DAG (directed acyclic graph), not a general graph.

### Tabs: 回测结果

Top row: date range antd `DatePicker.RangePicker` + [重新回测] button.

G2 line chart: equity curve (portfolio vs benchmark). Separate panel with antd `Descriptions` for metrics grid. Bottom: trades antd `Table`.

---

## MODULE 5 — 因子管理 (Factor Library)

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Topbar: antd Search  [类型 filter]  [+ 新建因子]     │
├──────────────────┬───────────────────────────────────┤
│  Factor List     │  Factor Detail / Editor           │
│  (antd List,     │                                   │
│  280px)          │  Metadata (antd Descriptions)     │
│                  │  IC Performance (G2 line chart)   │
│  Each item:      │  Quintile Returns (G2 bar chart)  │
│  name + type +   │  Monaco Editor (Python formula)   │
│  IC value +      │  [验证] [IC检验] buttons          │
│  used-in count   │  Agent Bindings (antd List)       │
└──────────────────┴───────────────────────────────────┘
```

### Factor Type Badges

antd `Tag` component with color:
- 日终: `color="blue"` (built-in antd color)
- 实时: `color="orange"`
- 自定义: `color="purple"`
- 内置: `color="default"`

### Monaco Editor Config

```tsx
<MonacoEditor
  language="python"
  theme="vs-dark"           // override with custom dark to match app
  value={formula}
  onChange={setFormula}
  options={{
    minimap: { enabled: false },
    fontSize: 13,
    lineHeight: 22,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    suggest: { showWords: true },
  }}
/>
```

Auto-complete items: built-in SDK functions (`close()`, `open()`, `volume()`, `ma(n)`, `std(n)`, `rsi(n)`, `macd()`, ...) + user's other factors by name.

---

## MODULE 6 — Skills 库 (Skills Library)

### Layout

Same structure as Factor Library but:
- Left panel: antd `Card` grid (2 columns) instead of list
- Right panel: shows I/O schema + Monaco editor + **Test Sandbox**

### Test Sandbox

Left: antd `Input.TextArea` for JSON input  
Right: output viewer (read-only, syntax highlighted)  
[运行测试] button: calls `/api/skills/{id}/test` with input  
Shows: output JSON + execution time + errors (antd `Alert` for errors)

### Skill Card

```tsx
// antd Card with custom meta
<Card
  hoverable
  onClick={() => selectSkill(skill)}
  style={{ borderLeft: `3px solid ${categoryColor}` }}
>
  <Card.Meta
    avatar={<Avatar icon={categoryIcon} />}
    title={skill.name}
    description={skill.description}
  />
  <div>
    <Tag>{skill.category}</Tag>
    <span>用于 {skill.usedInCount} 个 Agent</span>
  </div>
  <div>延迟 {skill.avgLatency}ms · 上次运行 {skill.lastRun}</div>
</Card>
```

---

## MODULE 7 — Agent 编排 (Agent Orchestration)

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Topbar: 工作流名  [状态]  [测试运行]  [保存]  [激活]  │
├──────────────────────────────────────────────────────┤
│  左侧工作流列表   │  Canvas (flex:1, @antv/x6)        │
│  (antd Menu,     │                          [minimap]│
│   240px)         │                                   │
│                  │  Node types:                      │
│  List of         │  - TriggerNode (hexagon-ish)      │
│  workflows       │  - AgentNode (card with skills)   │
│                  │  - ConditionalNode (diamond)      │
│  [+ 新建]        │  - ToolNode (direct skill call)   │
│                  │  - OutputNode (result target)     │
├──────────────────┤                                   │
│  右侧属性面板     ├───────────────────────────────────┤
│  (antd Form,     │  执行日志 (antd Timeline, 160px,   │
│   280px)         │  collapsible)                     │
└──────────────────┴───────────────────────────────────┘
```

### Custom X6 Node Components

```tsx
// TriggerNode — rendered as React component inside X6
function TriggerNode({ node }: { node: Node }) {
  const data = node.getData();
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#1E2335',
      border: '2px solid #6C63FF',
      borderRadius: 8,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 8,
    }}>
      <Zap size={16} color="#6C63FF" />
      <div style={{ fontSize: 12, fontWeight: 600, color: '#F0F2F7', marginTop: 4 }}>
        {data.label}
      </div>
      <div style={{ fontSize: 10, color: '#8B92A5' }}>{data.triggerType}</div>
    </div>
  );
}

// AgentNode — shows bound skills count
function AgentNode({ node }: { node: Node }) {
  const data = node.getData();
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#1E2335',
      border: '2px solid #6C63FF',
      borderRadius: 8, padding: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Bot size={14} color="#6C63FF" />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F2F7' }}>{data.name}</span>
      </div>
      {data.skills?.slice(0, 3).map(s => (
        <Tag key={s} style={{ marginTop: 4, fontSize: 10 }}>{s}</Tag>
      ))}
      {data.skills?.length > 3 && (
        <Tag style={{ marginTop: 4, fontSize: 10 }}>+{data.skills.length - 3}</Tag>
      )}
    </div>
  );
}
```

### Properties Panel

antd `Form` layout, contextual by node type. Use antd `Tabs` inside the panel:
- Tab 1: **配置** — form fields for node settings
- Tab 2: **运行日志** — last 10 executions as antd `Timeline`

### Execution Log

antd `Timeline` or custom scrolling div.  
Auto-scroll to latest entry.  
Color: gray=info, `colorSuccess`=success, `colorWarning`=warning, `colorError`=error.

---

## MODULE 8 — 数据源管理 (Data Sources)

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Topbar: 状态概览 [4 count badges]  [+ 接入数据源]     │
├──────────────────────────────────────────────────────┤
│  antd Collapse (4 panels, one per data category)     │
│                                                      │
│  ▼ 市场数据    ● 实时同步 · 3个活跃源                  │
│    [source card] [source card] [+ 添加]              │
│                                                      │
│  ▶ 新闻数据    ● 实时同步 · 2个活跃源                  │
│                                                      │
│  ▶ 研报数据    ○ 上次同步 5分钟前                      │
│                                                      │
│  ▶ 音视频数据  ○ 处理队列 3个文件                      │
└──────────────────────────────────────────────────────┘
```

### antd Collapse Configuration

```tsx
<Collapse
  items={[
    { key: 'market',   label: <CategoryHeader type="market" />,  children: <CategoryContent type="market" /> },
    { key: 'news',     label: <CategoryHeader type="news" />,    children: <CategoryContent type="news" /> },
    { key: 'research', label: <CategoryHeader type="research" />,children: <CategoryContent type="research" /> },
    { key: 'media',    label: <CategoryHeader type="media" />,   children: <CategoryContent type="media" /> },
  ]}
  style={{ background: 'transparent' }}
/>
```

### Add Source Wizard

antd `Modal` + `Steps` (3 steps):
1. **选择来源类型** — antd `Card` grid of provider options
2. **配置参数** — antd `Form` (dynamic, type-specific fields)
3. **语义标注** — only for custom/non-standard sources: antd `Input.TextArea` with a description

---

## CROSS-MODULE INTERACTIONS

### Navigation (Sidebar)

antd `Menu` in dark mode, `mode="inline"`, `theme="dark"`.  
Collapsed: `collapsedWidth={56}`, shows icons only (antd handles icon-only display automatically).  
`onCollapse` toggled by a custom button at the bottom of the Sider (not antd's built-in trigger, which is styled differently).

### Global Command Palette

`⌘K / Ctrl+K` → antd `Modal` with a search `Input`, fuzzy-searches across:
- Modules (navigate)
- Portfolio positions (analyze)
- Factors (open editor)
- Skills (open editor)
- Workflows (open canvas)

### Toast Notifications (antd message / notification)

```tsx
// Use antd's message for lightweight toasts
import { message, notification } from 'antd';

// Success (auto-dismiss 3s)
message.success('买入宁德时代已确认执行');

// Warning (auto-dismiss 6s)
message.warning('腾讯仓位超过风控上限，已暂停相关操作');

// Error (no auto-dismiss, requires manual close)
notification.error({
  message: 'Agent 执行失败',
  description: '风控防火墙拦截：单笔交易超过规模限制',
  duration: 0,
  btn: <Button size="small">查看详情</Button>,
});
```

### Keyboard Shortcuts

```
⌘K / Ctrl+K    → Command palette
⌘1–8           → Navigate to module 1–8
/              → Focus chat input in cockpit
Esc            → Close modal / deselect canvas node
⌘Z             → Undo (in X6 canvas)
⌘Shift+Z       → Redo (in X6 canvas)
⌘Enter         → Confirm (in dialogs)
```

### "Send to Cockpit" Pattern

Every module has a [在驾驶舱分析 →] button in its topbar.  
Clicking: navigates to `/cockpit` + pushes context as a pre-filled chat message.  
The chat message format: `[当前模块] [当前选中内容] 的详细分析`  
This triggers the Agent automatically and populates the workbench with results.
