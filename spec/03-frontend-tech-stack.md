# AlphaAgent · Frontend Technology Stack & Implementation Guide
> Version 2.0 · Updated tech stack · For coding model consumption

---

## 1. Tech Stack (Canonical Versions)

### Core Framework
```
react                    19.2.0
react-dom                19.2.0
typescript               6.0.3
vite                     6.x (latest)
```

### UI Library
```
antd                     6.4.4      — Primary UI component library
@ant-design/x            2.8.0      — AI conversation components (Bubble, Conversations, XProvider, useXAgent, useXChat)
@ant-design/icons        latest     — Icon set (used alongside antd)
```

### Graph / Canvas
```
@antv/x6                 3.1.7      — Node-graph canvas for Agent orchestration AND Strategy builder
@antv/x6-react-shape     3.x        — React node renderers for X6
@antv/x6-plugin-minimap  3.x        — Minimap plugin for X6
@antv/x6-plugin-history  3.x        — Undo/redo for X6
@antv/x6-plugin-snapline 3.x        — Snap-to-grid for X6
```

### Charts
```
@antv/g2                 5.x (latest stable)  — Primary charting (replaces Recharts)
```

### Routing & State
```
react-router-dom         7.x (latest)
zustand                  5.x (latest)
@tanstack/react-query    5.x (latest)
```

### Code Editing
```
@monaco-editor/react     latest     — Factor formula editor, Skill code editor
```

### Real-time
```
Native WebSocket          — Live data feeds, Agent status
EventSource (SSE)         — LLM streaming token-by-token
```

### Utilities
```
dayjs                    latest     — Date (antd peer dependency, replaces date-fns)
numeral                  latest     — Financial number formatting
lodash-es                latest     — Tree-shakeable utilities
```

### Build / DX
```
@vitejs/plugin-react      latest    — Vite React plugin (supports React 19)
typescript-eslint         latest
prettier                  latest
```

---

## 2. Package.json Reference

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.0.0",
    "antd": "^6.4.4",
    "@ant-design/x": "^2.8.0",
    "@ant-design/icons": "^6.0.0",
    "@antv/x6": "^3.1.7",
    "@antv/x6-react-shape": "^3.0.0",
    "@antv/x6-plugin-minimap": "^3.0.0",
    "@antv/x6-plugin-history": "^3.0.0",
    "@antv/x6-plugin-snapline": "^3.0.0",
    "@antv/g2": "^5.0.0",
    "@monaco-editor/react": "^4.7.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "dayjs": "^1.11.0",
    "numeral": "^2.0.6",
    "lodash-es": "^4.17.21"
  },
  "devDependencies": {
    "typescript": "^6.0.3",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/lodash-es": "^4.17.0",
    "@types/numeral": "^2.0.0"
  }
}
```

---

## 3. Project Structure

```
src/
├── main.tsx                    # Entry: wrap with AntD ConfigProvider + XProvider + QueryClient
├── App.tsx                     # Router setup
│
├── theme/
│   ├── antd-theme.ts           # Ant Design 6 theme token overrides (dark algo)
│   ├── tokens.css              # CSS custom properties (consumed app-wide)
│   └── g2-theme.ts             # G2 chart theme (dark, financial colors)
│
├── layout/
│   ├── AppShell.tsx            # Ant Design Layout: Sider + Header + Content
│   ├── Sidebar.tsx             # Collapsible Sider with nav Menu
│   └── Topbar.tsx              # Fixed header bar per module
│
├── modules/
│   ├── cockpit/
│   │   ├── Cockpit.tsx         # Three-column layout shell
│   │   ├── WorkbenchPanel.tsx  # CENTER: content canvas (MD/PDF/SVG/chart renderer)
│   │   ├── ChatPanel.tsx       # RIGHT: @ant-design/x conversation panel
│   │   ├── ContextDrawer.tsx   # LEFT: collapsible KPI + decisions sidebar
│   │   ├── ContentRenderer.tsx # Renders MD/PDF/SVG/image/chart by content type
│   │   └── DecisionCard.tsx    # Agent decision card (buy/sell/hold)
│   │
│   ├── market/
│   │   ├── MarketDiscovery.tsx
│   │   ├── HeatmapChart.tsx    # G2 Treemap
│   │   ├── SectorRadar.tsx     # G2 Radar
│   │   ├── CapitalFlow.tsx     # G2 Bar
│   │   └── SignalTable.tsx     # Ant Design Table
│   │
│   ├── portfolio/
│   │   ├── Portfolio.tsx
│   │   ├── HoldingsTable.tsx   # Ant Design Table with expandable rows
│   │   ├── FactorExposure.tsx  # G2 bidirectional bar
│   │   ├── CorrelationMatrix.tsx
│   │   └── Attribution.tsx     # G2 Bar chart
│   │
│   ├── strategy/
│   │   ├── StrategyBuilder.tsx
│   │   ├── RuleEditor.tsx      # Condition builder UI
│   │   ├── StrategyCanvas.tsx  # @antv/x6 canvas for strategy flow
│   │   └── BacktestResults.tsx # G2 equity curve + metrics
│   │
│   ├── factors/
│   │   ├── FactorLibrary.tsx
│   │   ├── FactorEditor.tsx    # Monaco editor + validation
│   │   └── FactorPerformance.tsx # G2 IC chart + quintile bars
│   │
│   ├── skills/
│   │   ├── SkillsLibrary.tsx
│   │   ├── SkillEditor.tsx     # Monaco editor
│   │   └── TestSandbox.tsx
│   │
│   ├── agents/
│   │   ├── AgentOrchestration.tsx
│   │   ├── WorkflowCanvas.tsx  # @antv/x6 canvas — primary use
│   │   ├── NodeShapes/         # Custom X6 React node components
│   │   │   ├── TriggerNode.tsx
│   │   │   ├── AgentNode.tsx
│   │   │   ├── ConditionalNode.tsx
│   │   │   ├── ToolNode.tsx
│   │   │   └── OutputNode.tsx
│   │   └── PropertiesPanel.tsx # Ant Design Form-based config
│   │
│   └── datasources/
│       ├── DataSources.tsx
│       ├── CategoryPanel.tsx   # Ant Design Collapse
│       ├── SourceCard.tsx
│       └── AddSourceWizard.tsx # Ant Design Steps + Form
│
├── hooks/
│   ├── useXChatAgent.ts        # @ant-design/x useXAgent + useXChat wrapper
│   ├── useWebSocket.ts
│   ├── useStream.ts            # SSE streaming
│   └── useHotkeys.ts
│
├── stores/
│   ├── cockpit.store.ts        # Workbench content, pending decisions
│   ├── portfolio.store.ts
│   └── agent.store.ts
│
└── types/
    ├── market.ts
    ├── portfolio.ts
    ├── factor.ts
    ├── skill.ts
    ├── agent.ts
    ├── decision.ts
    └── workbench.ts            # Content types for center workbench panel
```

---

## 4. Ant Design 6 Dark Theme Configuration

```ts
// src/theme/antd-theme.ts
import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    // Brand
    colorPrimary:        '#6C63FF',
    colorLink:           '#6C63FF',
    colorLinkHover:      '#8179FF',

    // Backgrounds
    colorBgBase:         '#0F1117',
    colorBgContainer:    '#171B26',
    colorBgElevated:     '#1E2335',
    colorBgLayout:       '#0F1117',
    colorBgSpotlight:    '#252A3D',

    // Borders
    colorBorder:         'rgba(255,255,255,0.12)',
    colorBorderSecondary:'rgba(255,255,255,0.06)',

    // Text
    colorText:           '#F0F2F7',
    colorTextSecondary:  '#8B92A5',
    colorTextTertiary:   '#4E5568',
    colorTextQuaternary: '#343A4D',

    // Semantic (financial — override antd defaults)
    colorSuccess:        '#00C896',   // profit / buy
    colorWarning:        '#F5A623',   // hold / alert
    colorError:          '#FF4D6A',   // loss / sell

    // Typography
    fontFamily:          "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize:            13,
    fontSizeHeading1:    24,
    fontSizeHeading2:    20,
    fontSizeHeading3:    16,
    lineHeight:          1.6,

    // Shape
    borderRadius:        6,
    borderRadiusLG:      10,
    borderRadiusSM:      4,

    // Motion
    motionDurationFast:  '0.12s',
    motionDurationMid:   '0.2s',
    motionDurationSlow:  '0.35s',

    // Spacing
    padding:             16,
    paddingLG:           24,
    paddingSM:           12,
    paddingXS:           8,
  },
  components: {
    Layout: {
      siderBg:           '#171B26',
      headerBg:          '#171B26',
      bodyBg:            '#0F1117',
    },
    Menu: {
      darkItemBg:             '#171B26',
      darkSubMenuItemBg:      '#171B26',
      darkItemSelectedBg:     '#1E2335',
      darkItemSelectedColor:  '#F0F2F7',
      darkItemColor:          '#8B92A5',
      darkItemHoverBg:        '#1E2335',
      darkItemHoverColor:     '#F0F2F7',
      itemBorderRadius:       6,
      collapsedWidth:         56,
    },
    Table: {
      headerBg:          '#1E2335',
      headerColor:       '#8B92A5',
      rowHoverBg:        '#1E2335',
      borderColor:       'rgba(255,255,255,0.06)',
    },
    Card: {
      colorBgContainer:  '#171B26',
    },
    Collapse: {
      colorBgContainer:  '#171B26',
      headerBg:          '#171B26',
    },
  },
};
```

```tsx
// src/main.tsx
import { ConfigProvider } from 'antd';
import { XProvider } from '@ant-design/x';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { antdTheme } from './theme/antd-theme';
import zhCN from 'antd/locale/zh_CN';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <ConfigProvider theme={antdTheme} locale={zhCN}>
      <XProvider>
        <App />
      </XProvider>
    </ConfigProvider>
  </QueryClientProvider>
);
```

---

## 5. Sidebar — Ant Design Sider with Collapsible Nav

```tsx
// src/layout/Sidebar.tsx
import { Layout, Menu } from 'antd';
import {
  LayoutDashboard, Globe, Briefcase, SlidersHorizontal,
  FunctionSquare, Puzzle, Bot, Database, Settings,
} from 'lucide-react';

const { Sider } = Layout;

const navItems = [
  { type: 'group', label: '核心', key: 'core' },
  { key: '/cockpit',   icon: <LayoutDashboard size={16}/>, label: '智能驾驶舱' },
  { key: '/market',    icon: <Globe size={16}/>,           label: '市场发现' },
  { key: '/portfolio', icon: <Briefcase size={16}/>,       label: '持仓管理' },
  { type: 'group', label: '配置', key: 'config' },
  { key: '/strategy',  icon: <SlidersHorizontal size={16}/>, label: '策略编排' },
  { key: '/factors',   icon: <FunctionSquare size={16}/>,  label: '因子管理' },
  { key: '/skills',    icon: <Puzzle size={16}/>,          label: 'Skills 库' },
  { key: '/agents',    icon: <Bot size={16}/>,             label: 'Agent 编排' },
  { type: 'group', label: '系统', key: 'system' },
  { key: '/data',      icon: <Database size={16}/>,        label: '数据源管理' },
  { key: '/settings',  icon: <Settings size={16}/>,        label: '系统设置' },
];

export function Sidebar({ collapsed, onCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={188}
      collapsedWidth={56}
      style={{ overflow: 'hidden', height: '100vh', position: 'sticky', top: 0 }}
      // Custom trigger at bottom — hide default antd trigger
      trigger={null}
    >
      {/* Logo area */}
      <div style={{ padding: collapsed ? '14px 16px' : '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {collapsed ? (
          <Bot size={20} color="#6C63FF" />
        ) : (
          <>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#F0F2F7', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} color="#6C63FF" /> AlphaAgent
            </div>
            <div style={{ fontSize: 11, color: '#4E5568', marginTop: 2 }}>投资智能体平台 v2.0</div>
          </>
        )}
      </div>

      {/* Nav Menu */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={navItems}
        onClick={({ key }) => navigate(key)}
        style={{ border: 'none', flex: 1 }}
      />

      {/* Agent status widget at bottom */}
      {!collapsed && (
        <div style={{ margin: '0 10px 10px', padding: '9px 11px', background: '#1E2335', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8B92A5' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C896', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Agent 运行中
          </div>
          <div style={{ fontSize: 10, color: '#4E5568', marginTop: 3 }}>已处理 247 个信号 · 3 待确认</div>
        </div>
      )}

      {/* Collapse toggle at very bottom */}
      <div
        onClick={() => onCollapse(!collapsed)}
        style={{ padding: '10px', textAlign: 'center', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#4E5568' }}
      >
        {collapsed ? '›' : '‹'}
      </div>
    </Sider>
  );
}
```

---

## 6. Cockpit Three-Column Layout

```tsx
// src/modules/cockpit/Cockpit.tsx
// LEFT: collapsible context drawer (280px, collapses to 0)
// CENTER: workbench canvas (flex: 1) — the primary content area
// RIGHT: @ant-design/x chat panel (360px, fixed)

import { Layout } from 'antd';
import { WorkbenchPanel } from './WorkbenchPanel';
import { ChatPanel } from './ChatPanel';
import { ContextDrawer } from './ContextDrawer';

export function Cockpit() {
  const [contextOpen, setContextOpen] = useState(true);

  return (
    <Layout style={{ height: '100%', background: '#0F1117' }}>

      {/* LEFT — Context drawer (KPIs, decisions, factor signals) */}
      <Layout.Sider
        width={contextOpen ? 260 : 0}
        style={{ background: '#171B26', borderRight: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', transition: 'width 0.2s ease' }}
        collapsedWidth={0}
        collapsed={!contextOpen}
        trigger={null}
      >
        <ContextDrawer onClose={() => setContextOpen(false)} />
      </Layout.Sider>

      {/* CENTER — Main workbench */}
      <Layout.Content style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <WorkbenchPanel
          onToggleContext={() => setContextOpen(v => !v)}
          contextOpen={contextOpen}
        />
      </Layout.Content>

      {/* RIGHT — AI Chat panel */}
      <Layout.Sider
        width={360}
        style={{ background: '#171B26', borderLeft: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}
        trigger={null}
      >
        <ChatPanel />
      </Layout.Sider>

    </Layout>
  );
}
```

---

## 7. @ant-design/x Chat Panel Implementation

```tsx
// src/modules/cockpit/ChatPanel.tsx
// Uses @ant-design/x: XProvider (in root), useXAgent, useXChat, Bubble, Sender, Conversations

import {
  Bubble, Sender, Conversations, useXAgent, useXChat,
  Attachments, ThoughtChain,
} from '@ant-design/x';
import type { BubbleProps } from '@ant-design/x';
import { Bot, User } from 'lucide-react';

// Bubble renderers by message role
const agentBubble: BubbleProps = {
  placement: 'start',
  avatar: { icon: <Bot size={14} />, style: { background: '#252A3D', color: '#6C63FF' } },
  styles: {
    content: {
      background: '#1E2335',
      color: '#F0F2F7',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 10,
      fontSize: 13,
    },
  },
};

const userBubble: BubbleProps = {
  placement: 'end',
  avatar: { icon: <User size={14} />, style: { background: '#6C63FF', color: '#fff' } },
  styles: {
    content: {
      background: '#252A3D',
      color: '#F0F2F7',
      borderRadius: 10,
      fontSize: 13,
    },
  },
};

export function ChatPanel() {
  const [agent] = useXAgent({
    // Stream from your backend SSE endpoint
    request: async ({ message }, { onSuccess, onUpdate, onError }) => {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) { onSuccess(fullText); break; }
        const chunk = decoder.decode(value);
        // Parse SSE chunks: "data: {token}\n\n"
        const tokens = chunk.split('\n\n')
          .filter(l => l.startsWith('data: '))
          .map(l => l.slice(6));
        for (const token of tokens) {
          if (token === '[DONE]') { onSuccess(fullText); return; }
          try {
            const { text, type } = JSON.parse(token);
            if (type === 'token') { fullText += text; onUpdate(fullText); }
            // tool_call events: onUpdate with special prefix for ThoughtChain
          } catch {}
        }
      }
    },
  });

  const { onRequest, messages } = useXChat({ agent });

  const bubbleList: BubbleProps['items'] = messages.map(msg => ({
    key: msg.id,
    ...(msg.role === 'ai' ? agentBubble : userBubble),
    content: msg.message,
    loading: msg.status === 'loading',
    typing: msg.status === 'loading'
      ? { step: 2, interval: 50 }
      : false,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Panel header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 500, color: '#F0F2F7', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bot size={16} color="#6C63FF" /> AI 助手
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4E5568' }}>3 待确认</span>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '8px 0' }}>
        <Bubble.List
          items={bubbleList}
          style={{ height: '100%', overflowY: 'auto', padding: '0 12px' }}
        />
      </div>

      {/* Toolbar + Sender */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Quick-access toolbar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {['数据源', 'Skills', '研报', 'Agent', '上传'].map(label => (
            <button key={label} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#8B92A5', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        {/* @ant-design/x Sender component */}
        <Sender
          onSubmit={onRequest}
          placeholder="问 Agent：分析持仓风险 / 运行策略回测…"
          styles={{
            input: { background: '#1E2335', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#F0F2F7', fontSize: 12 },
            actions: { color: '#6C63FF' },
          }}
        />
      </div>
    </div>
  );
}
```

---

## 8. Workbench Panel — Content Renderer

The center column renders AI-generated output in multiple formats:

```tsx
// src/modules/cockpit/WorkbenchPanel.tsx
// Renders the active content artifact in the center canvas

import { Tabs } from 'antd';
import type { WorkbenchContent } from '../../types/workbench';

type ContentType = 'markdown' | 'chart' | 'svg' | 'pdf' | 'image' | 'report' | 'decision_set';

export function WorkbenchPanel({ onToggleContext, contextOpen }) {
  const { activeContents } = useCockpitStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Workbench topbar */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#171B26', gap: 10, flexShrink: 0 }}>
        <button onClick={onToggleContext} style={{ background: 'none', border: 'none', color: '#8B92A5', cursor: 'pointer' }}>
          {contextOpen ? '◀' : '▶'}
        </button>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#F0F2F7' }}>工作台</span>
        {/* Content type tabs if multiple items */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {/* Export / fullscreen buttons */}
        </div>
      </div>

      {/* Content area */}
      {activeContents.length === 0 ? (
        <WorkbenchEmpty />
      ) : activeContents.length === 1 ? (
        <ContentRenderer content={activeContents[0]} />
      ) : (
        <Tabs
          items={activeContents.map((c, i) => ({
            key: String(i),
            label: c.title,
            children: <ContentRenderer content={c} />,
          }))}
          style={{ flex: 1, padding: '0 16px' }}
        />
      )}
    </div>
  );
}

function ContentRenderer({ content }: { content: WorkbenchContent }) {
  switch (content.type) {
    case 'markdown': return <MarkdownView content={content.data} />;
    case 'chart':    return <G2ChartView  spec={content.data} />;
    case 'svg':      return <SvgView      svg={content.data} />;
    case 'pdf':      return <PdfView      url={content.data} />;
    case 'image':    return <ImageView    src={content.data} />;
    case 'report':   return <ReportView   report={content.data} />;
    case 'decision_set': return <DecisionSetView decisions={content.data} />;
    default:         return null;
  }
}
```

```ts
// src/types/workbench.ts
export interface WorkbenchContent {
  id:    string;
  title: string;
  type:  'markdown' | 'chart' | 'svg' | 'pdf' | 'image' | 'report' | 'decision_set';
  data:  unknown;
  timestamp: number;
  sourceMessageId?: string;  // which chat message produced this
}
```

**Content flow:** Backend sends structured responses. When content type is detected (chart spec, markdown report, decision cards), the content is pushed to `useCockpitStore().activeContents` and rendered in the workbench. Plain text stays in the chat bubble. Rich content migrates to the workbench.

---

## 9. @antv/g2 Chart Implementation

```tsx
// src/modules/cockpit/G2ChartView.tsx
import { useEffect, useRef } from 'react';
import { Chart } from '@antv/g2';

// G2 dark theme config — apply once at app init
// src/theme/g2-theme.ts
export const g2DarkTheme = {
  type: 'dark',
  background: 'transparent',   // inherit container bg
  defaultColor: '#6C63FF',
  colors10: [
    '#6C63FF', '#00C896', '#F5A623', '#FF6B9D',
    '#4ECDC4', '#A78BFA', '#FCD34D', '#6EE7B7',
  ],
  axisCommon: {
    label: { style: { fill: '#8B92A5', fontSize: 11 } },
    line:  { style: { stroke: 'rgba(255,255,255,0.06)' } },
    tick:  { style: { stroke: 'rgba(255,255,255,0.12)' } },
    grid:  { line: { style: { stroke: 'rgba(255,255,255,0.06)' } } },
  },
  tooltip: {
    domStyles: {
      'g2-tooltip': {
        background: '#252A3D',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '6px',
        color: '#F0F2F7',
        fontSize: '12px',
      },
    },
  },
};

// Generic G2 React wrapper
export function G2Chart({ spec, height = 300 }: { spec: object; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = new Chart({
      container: containerRef.current,
      theme: g2DarkTheme,
      autoFit: true,
      height,
    });
    chartRef.current.options(spec);
    chartRef.current.render();
    return () => chartRef.current?.destroy();
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.options(spec);
    chartRef.current.render();
  }, [spec]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}

// Usage: portfolio equity curve
export const equityCurveSpec = (data: { date: string; value: number; benchmark: number }[]) => ({
  type: 'line',
  data,
  encode: { x: 'date', y: 'value', color: 'series' },
  scale: { color: { range: ['#6C63FF', '#4E5568'] } },
  style: { lineWidth: 1.5 },
  axis: {
    x: { labelFormatter: (d: string) => dayjs(d).format('MM/DD') },
    y: { labelFormatter: (v: number) => `${((v - 1) * 100).toFixed(1)}%` },
  },
});

// Usage: factor exposure bidirectional bar
export const factorExposureSpec = (data: { factor: string; value: number }[]) => ({
  type: 'interval',
  data,
  encode: { x: 'factor', y: 'value', color: (d: any) => d.value >= 0 ? '#00C896' : '#FF4D6A' },
  scale: { y: { domain: [-1, 1] } },
  style: { radiusTopLeft: 3, radiusTopRight: 3, radiusBottomLeft: 3, radiusBottomRight: 3 },
  axis: {
    y: { grid: { lineStyle: { stroke: 'rgba(255,255,255,0.06)' } } },
  },
});
```

---

## 10. @antv/x6 Canvas — Agent & Strategy Orchestration

Both Agent Orchestration (Module 7) and Strategy Builder (Module 4) share the X6 canvas infrastructure. The node shapes differ but the canvas setup is identical.

```tsx
// src/modules/agents/WorkflowCanvas.tsx
import { Graph } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import { MiniMap } from '@antv/x6-plugin-minimap';
import { History } from '@antv/x6-plugin-history';
import { Snapline } from '@antv/x6-plugin-snapline';

// Register custom React node shapes
register({ shape: 'trigger-node',     width: 140, height: 56,  component: TriggerNode });
register({ shape: 'agent-node',       width: 180, height: 80,  component: AgentNode });
register({ shape: 'conditional-node', width: 100, height: 100, component: ConditionalNode });
register({ shape: 'tool-node',        width: 160, height: 60,  component: ToolNode });
register({ shape: 'output-node',      width: 140, height: 56,  component: OutputNode });

// Strategy-specific shapes
register({ shape: 'condition-rule',   width: 200, height: 80,  component: ConditionRuleNode });
register({ shape: 'action-rule',      width: 200, height: 80,  component: ActionRuleNode });

export function WorkflowCanvas({ mode = 'agent' }: { mode: 'agent' | 'strategy' }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new Graph({
      container: containerRef.current,
      background: { color: '#0F1117' },
      grid: { visible: true, size: 20, type: 'doubleMesh',
        args: [
          { color: 'rgba(255,255,255,0.03)', thickness: 1 },
          { color: 'rgba(255,255,255,0.06)', thickness: 1, factor: 4 },
        ],
      },
      connecting: {
        router: 'manhattan',
        connector: { name: 'rounded', args: { radius: 8 } },
        anchor: 'center',
        connectionPoint: 'anchor',
        allowBlank: false,
        snap: { radius: 20 },
        createEdge() {
          return graph.createEdge({
            attrs: {
              line: {
                stroke: 'rgba(108,99,255,0.5)',
                strokeWidth: 1.5,
                targetMarker: { name: 'block', size: 8 },
              },
            },
          });
        },
      },
      mousewheel: { enabled: true, zoomAtMousePosition: true, modifiers: 'ctrl', minScale: 0.5, maxScale: 2 },
      panning: { enabled: true, modifiers: 'alt' },
      selecting: { enabled: true, rubberband: true, showNodeSelectionBox: true },
    });

    graph.use(new MiniMap({ container: document.getElementById('minimap')! }));
    graph.use(new History({ enabled: true }));
    graph.use(new Snapline({ enabled: true, tolerance: 10 }));

    graphRef.current = graph;
    return () => graph.dispose();
  }, []);

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {/* MiniMap container */}
      <div id="minimap" style={{ position: 'absolute', bottom: 16, right: 16, width: 160, height: 100, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, overflow: 'hidden' }} />
      {/* Toolbar */}
      <CanvasToolbar graph={graphRef.current} />
    </div>
  );
}
```

---

## 11. State Management Patterns

### Cockpit Store (Zustand)

```ts
// src/stores/cockpit.store.ts
import { create } from 'zustand';
import type { WorkbenchContent } from '../types/workbench';

interface CockpitStore {
  // Workbench
  activeContents: WorkbenchContent[];
  pushContent: (content: WorkbenchContent) => void;
  removeContent: (id: string) => void;
  clearContents: () => void;

  // Pending decisions
  pendingDecisions: Decision[];
  confirmDecision: (id: string) => void;
  dismissDecision: (id: string) => void;
}

export const useCockpitStore = create<CockpitStore>((set) => ({
  activeContents: [],
  pendingDecisions: [],

  pushContent: (content) =>
    set(s => ({
      activeContents: [
        ...s.activeContents.filter(c => c.id !== content.id),
        content,
      ].slice(-5), // keep max 5 tabs
    })),

  removeContent: (id) =>
    set(s => ({ activeContents: s.activeContents.filter(c => c.id !== id) })),

  clearContents: () => set({ activeContents: [] }),

  confirmDecision: (id) =>
    set(s => ({ pendingDecisions: s.pendingDecisions.filter(d => d.id !== id) })),

  dismissDecision: (id) =>
    set(s => ({ pendingDecisions: s.pendingDecisions.filter(d => d.id !== id) })),
}));
```

---

## 12. Performance & Build Notes

- React 19 concurrent features: use `<Suspense>` for all lazy-loaded modules
- @antv/g2 charts: destroy and recreate on data schema change (not just data update)
- @antv/x6: dispose graph on component unmount — always use the `useEffect` cleanup
- @ant-design/x Sender: controlled mode preferred (manage value in state for `@` mention detection)
- Ant Design 6: tree-shaking works automatically with Vite — no babel plugin needed
- TypeScript 6: enable `--strict`, `--noUncheckedIndexedAccess`, `--exactOptionalPropertyTypes`

---

## 13. Coding Model Prompt Templates

### Bootstrap the app

```
Set up the AlphaAgent frontend project.

Stack: React 19.2, TypeScript 6.0.3, Vite 6, antd 6.4.4, @ant-design/x 2.8.0

Steps:
1. Create vite.config.ts with @vitejs/plugin-react
2. Create src/theme/antd-theme.ts with the dark theme config (see Section 4 of tech spec)
3. Create src/main.tsx wrapping with ConfigProvider + XProvider + QueryClientProvider
4. Create src/layout/AppShell.tsx with collapsible Sider (188px → 56px) + Content
5. Create src/layout/Sidebar.tsx using antd Menu in dark mode with lucide-react icons

Use the exact token values from the design system spec (01-design-system.md).
```

### Build the Cockpit module

```
Build the Cockpit (智能驾驶舱) module for AlphaAgent.

Three-column layout:
- LEFT (260px, collapsible to 0): ContextDrawer with KPI metrics + Agent decisions
- CENTER (flex: 1): WorkbenchPanel — renders AI output (markdown/chart/svg/pdf)
- RIGHT (360px, fixed): ChatPanel using @ant-design/x components

ChatPanel must use:
- useXAgent for streaming backend connection (SSE endpoint /api/chat/stream)
- useXChat for message state management
- Bubble.List for message rendering with custom bubble styles
- Sender for the input field

WorkbenchPanel renders content from Zustand cockpit store (activeContents array).
When chat produces rich content (chart spec, report, decision set), push to store.
Plain text stays in chat bubbles only.

See Section 6, 7, 8 of the tech spec for implementation details.
```

### Build the Agent canvas

```
Build the AgentOrchestration canvas for AlphaAgent.

Uses @antv/x6 3.1.7 with @antv/x6-react-shape.

Custom node types to register:
1. TriggerNode   — 140×56, hexagon-ish, accent (#6C63FF) border
2. AgentNode     — 180×80, rounded rect, accent border, shows bound Skills list
3. ConditionalNode — 100×100, diamond shape (rotated square), amber (#F5A623) border
4. ToolNode      — 160×60, rect, teal (#00C896) border
5. OutputNode    — 140×56, rect, muted border

Canvas config:
- Background: #0F1117
- Grid: double mesh, very subtle
- Connections: manhattan router, rounded connector
- Plugins: MiniMap (bottom-right, 160×100), History (undo/redo), Snapline

Right PropertiesPanel: antd Form, content changes based on selected node type.
Bottom ExecutionLog: antd Timeline or custom log strip, auto-scrolls.

See Section 10 of the tech spec.
```
