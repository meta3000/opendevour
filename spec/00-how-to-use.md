# AlphaAgent · Coding Model Usage Guide
> Version 2.0 · Updated for Ant Design 6 + @ant-design/x + @antv/x6 + @antv/g2

---

## Document Map

| File | Contents | When to include |
|---|---|---|
| `01-design-system.md` | Color tokens, typography, spacing, component specs | Always for UI work |
| `02-module-interactions.md` | All 8 module layouts + interaction behaviors | Include only the relevant module(s) |
| `03-frontend-tech-stack.md` | Tech stack, theme config, key implementations | Always for setup and coding |

---

## Quick-Start Prompts

### 1. Bootstrap the project

```
Set up AlphaAgent frontend. Stack: React 19.2, TypeScript 6.0.3, Vite 6, antd 6.4.4, @ant-design/x 2.8.0.

Tasks:
1. package.json with exact versions from Section 2 of tech spec
2. src/theme/antd-theme.ts — dark theme token overrides from Section 4
3. src/main.tsx — ConfigProvider (dark algorithm) + XProvider + QueryClientProvider
4. src/layout/AppShell.tsx — antd Layout with collapsible Sider (188px → 56px collapsedWidth=56)
5. src/layout/Sidebar.tsx — antd Menu dark mode, lucide-react icons, agent status widget at bottom

[Attach: 01-design-system.md Section 3 (colors), 03-frontend-tech-stack.md Sections 1–5]
```

### 2. Build the Cockpit module

```
Build the 智能驾驶舱 (Cockpit) module. Three-column layout:
LEFT 260px collapsible: ContextDrawer (KPIs + decisions + factor signals)
CENTER flex:1: WorkbenchPanel (renders content from Zustand store by type)
RIGHT 360px fixed: ChatPanel using @ant-design/x

ChatPanel requirements:
- useXAgent for SSE streaming (/api/chat/stream)
- useXChat for message state
- Bubble.List with custom dark bubble styles
- ThoughtChain for tool call display
- Sender for input with toolbar pills above it

WorkbenchPanel renders: markdown / G2 chart / SVG / PDF / image / decision_set
Content is pushed to Zustand store (cockpit.store.activeContents) by the chat handler.

[Attach: 02-module-interactions.md Module 1, 03-frontend-tech-stack.md Sections 6–8]
```

### 3. Build the Agent canvas

```
Build the Agent Orchestration canvas using @antv/x6 3.1.7.

5 custom React node types via @antv/x6-react-shape:
- TriggerNode (140×56, accent #6C63FF border)
- AgentNode (180×80, shows bound skills as antd Tags)
- ConditionalNode (100×100, diamond via clip-path, amber #F5A623 border)
- ToolNode (160×60, teal #00C896 border)
- OutputNode (140×56, subtle border)

Canvas: dark bg #0F1117, subtle dot grid, manhattan router, MiniMap plugin (bottom-right), History plugin.
Right panel: antd Form (contextual by selected node type).
Bottom log: antd Timeline, auto-scroll.

[Attach: 02-module-interactions.md Module 7, 03-frontend-tech-stack.md Section 10]
```

### 4. Set up G2 charts

```
Configure @antv/g2 with a dark financial theme for AlphaAgent.

Create src/theme/g2-theme.ts with dark background, financial color palette, styled axes and tooltips.
Create src/components/G2Chart.tsx — a React wrapper that takes a G2 spec object, renders the chart, and properly destroys/recreates on spec change.

Then implement these specific charts:
1. Equity curve (line, portfolio vs benchmark, % return axis)
2. Factor exposure (bidirectional interval bar, centered at 0, profit/loss colors)
3. Sector donut (pie with custom legend)
4. Capital flow (horizontal bar, sorted, profit/loss colors)

[Attach: 03-frontend-tech-stack.md Section 9, 01-design-system.md Section 3 (color tokens)]
```

---

## Critical Rules for Coding Model

1. **Dark mode only.** Background `#0F1117`, surface `#171B26`, elevated `#1E2335`.
2. **Financial color semantics.** `#00C896` = profit/buy. `#FF4D6A` = loss/sell. `#F5A623` = hold/warn. Never reuse these for non-financial categorical data.
3. **Monospace for numbers.** All prices, %, factor values: `fontFamily: 'JetBrains Mono', monospace`.
4. **antd dark algorithm.** `algorithm: theme.darkAlgorithm` in ConfigProvider.
5. **No CSS frameworks other than antd's built-in styles + CSS variables.** No Tailwind, no Bootstrap.
6. **@ant-design/x requires XProvider at app root.** Don't put it per-component.
7. **@antv/x6: always dispose in useEffect cleanup.** `return () => graph.dispose()`.
8. **@antv/g2: destroy and recreate chart when spec schema changes.** `chart.destroy()` then `new Chart()`.
9. **Zustand for local UI state. React Query for server state.** Don't mix concerns.
10. **lucide-react for all icons.** Consistent 16/18/20/24px sizes. Not antd icons (inconsistent style).
