# AlphaAgent · Design System Specification
> Version 1.0 · For coding model consumption · Priority: Frontend & Interaction

---

## 1. Product Identity

**Product name:** AlphaAgent  
**Tagline:** 投资智能体平台  
**Audience:** Individual investors and professional fund managers  
**Core metaphor:** A cockpit — high information density, always-on awareness, precision controls. Not a dashboard you check; a workspace you live in.

---

## 2. Design Principles

1. **信息密度优先于留白** — This is a professional tool, not a marketing page. Pack information densely but hierarchically. Every pixel earns its place.
2. **决策可追溯** — Every AI-generated recommendation must show its reasoning chain. Users must never wonder "why did the Agent do that."
3. **操作路径最短** — The most frequent actions (confirm a trade, query a position, run a scan) must be reachable in ≤2 clicks or one natural language sentence.
4. **数据实时感知** — The interface must communicate "live" status at all times. Stale data is dangerous in a trading context.
5. **渐进披露** — Show the essential, hide the detailed. Every card has a drill-down. Every summary has a "查看全部" path.

---

## 3. Color System

### Base Palette

```
--color-bg-base:        #0F1117    /* page background — near-black, not pure black */
--color-bg-surface:     #171B26    /* card / panel surface */
--color-bg-elevated:    #1E2335    /* hover states, selected rows, tooltips */
--color-bg-overlay:     #252A3D    /* modal backgrounds, dropdowns */

--color-border-subtle:  rgba(255,255,255,0.06)   /* dividers, card outlines */
--color-border-default: rgba(255,255,255,0.12)   /* interactive element borders */
--color-border-strong:  rgba(255,255,255,0.24)   /* focused inputs, active states */
```

### Text

```
--color-text-primary:   #F0F2F7    /* primary content */
--color-text-secondary: #8B92A5    /* labels, metadata, secondary info */
--color-text-tertiary:  #4E5568    /* placeholders, disabled states */
--color-text-inverse:   #0F1117    /* text on light/colored backgrounds */
```

### Semantic — Financial Context

```
/* Profit / Bullish */
--color-profit:         #00C896    /* gains, buy signals, positive deltas */
--color-profit-dim:     rgba(0,200,150,0.12)     /* profit backgrounds */
--color-profit-border:  rgba(0,200,150,0.30)

/* Loss / Bearish */
--color-loss:           #FF4D6A    /* losses, sell signals, negative deltas */
--color-loss-dim:       rgba(255,77,106,0.12)
--color-loss-border:    rgba(255,77,106,0.30)

/* Neutral / Hold */
--color-hold:           #F5A623    /* hold signals, warnings, amber alerts */
--color-hold-dim:       rgba(245,166,35,0.12)
--color-hold-border:    rgba(245,166,35,0.30)
```

### Brand Accent

```
--color-accent:         #6C63FF    /* primary actions, Agent identity, links */
--color-accent-dim:     rgba(108,99,255,0.15)
--color-accent-border:  rgba(108,99,255,0.35)
--color-accent-hover:   #8179FF
```

### Data Visualization Palette (categorical, 8 colors)

```
--color-data-1: #6C63FF   /* purple — primary series */
--color-data-2: #00C896   /* teal — secondary series */
--color-data-3: #F5A623   /* amber — tertiary */
--color-data-4: #FF6B9D   /* pink */
--color-data-5: #4ECDC4   /* cyan */
--color-data-6: #A78BFA   /* lavender */
--color-data-7: #FCD34D   /* yellow */
--color-data-8: #6EE7B7   /* mint */
```

> **Rule:** Never use profit/loss red/green for non-financial categorical data. Reserve semantic colors for their financial meaning only.

---

## 4. Typography

### Font Stack

```css
--font-display: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

> Inter for all UI text. JetBrains Mono for ticker symbols, prices, factor values, code, and any numeric data where alignment matters.

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `--text-2xs` | 10px | 400 | 1.4 | Timestamps, micro-labels |
| `--text-xs` | 11px | 400 | 1.5 | Table metadata, badges |
| `--text-sm` | 12px | 400 | 1.6 | Body in compact panels |
| `--text-base` | 13px | 400 | 1.6 | Default body text |
| `--text-md` | 14px | 500 | 1.5 | Panel titles, nav items |
| `--text-lg` | 16px | 500 | 1.4 | Section headings |
| `--text-xl` | 20px | 600 | 1.3 | Page-level headings |
| `--text-2xl` | 24px | 600 | 1.2 | Key metric values |
| `--text-3xl` | 32px | 700 | 1.1 | Hero metric (portfolio total) |

### Numeric Display Rules

- All prices, percentages, and factor values: `font-family: var(--font-mono)`
- Positive values: `color: var(--color-profit)` with optional `+` prefix
- Negative values: `color: var(--color-loss)` with `-` prefix
- Zero / neutral: `color: var(--color-text-secondary)`
- Large numbers use `Intl.NumberFormat` with locale `zh-CN` for ¥ amounts

---

## 5. Spacing & Layout

### Spacing Scale

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
```

### Border Radius

```
--radius-sm:  4px    /* tags, badges, small chips */
--radius-md:  6px    /* buttons, inputs, small cards */
--radius-lg:  10px   /* panels, cards */
--radius-xl:  14px   /* modals, large drawers */
--radius-full: 9999px /* pills, avatars */
```

### App Shell Layout

```
┌─────────────────────────────────────────────────┐
│  Sidebar (188px fixed)  │  Main Content Area     │
│                         │  ┌──────────────────┐  │
│  Logo + version         │  │ Topbar (44px)    │  │
│  ─────────────          │  └──────────────────┘  │
│  Nav groups             │  │                  │  │
│    Core (3 items)       │  │  View Content    │  │
│    Configure (4 items)  │  │                  │  │
│    System (2 items)     │  │                  │  │
│  ─────────────          │  └──────────────────┘  │
│  Agent status widget    │                         │
└─────────────────────────────────────────────────┘
```

- Sidebar: `width: 188px`, never collapses on desktop, collapses to icon-only at `< 1024px`
- Main content: fills remaining width, `min-width: 0` to prevent flex overflow
- Topbar: `height: 44px`, sticky, `border-bottom: 1px solid var(--color-border-subtle)`

---

## 6. Component Library

### 6.1 Buttons

```
Primary:    bg=--color-accent, text=white, hover: --color-accent-hover
Secondary:  bg=transparent, border=--color-border-default, hover: bg=--color-bg-elevated
Danger:     bg=transparent, border=--color-loss-border, color=--color-loss, hover: bg=--color-loss-dim
Ghost:      bg=transparent, no border, hover: bg=--color-bg-elevated
```

All buttons: `height: 32px`, `padding: 0 12px`, `border-radius: var(--radius-md)`, `font-size: 12px`, `font-weight: 500`

Large variant: `height: 38px`, `padding: 0 16px`, `font-size: 13px`

### 6.2 Input Fields

```css
.input {
  height: 34px;
  padding: 0 12px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 13px;
  transition: border-color 150ms;
}
.input:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 3px var(--color-accent-dim);
}
.input::placeholder { color: var(--color-text-tertiary); }
```

### 6.3 Cards / Panels

```css
.card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.card-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-body { padding: 14px 16px; }
```

### 6.4 Metric Cards

For KPI display (portfolio value, Sharpe, VaR, etc.):

```
┌─────────────────────┐
│  Label (text-xs,    │
│  secondary)         │
│                     │
│  Value (text-2xl,   │
│  mono, primary)     │
│                     │
│  Delta (text-xs,    │
│  profit/loss color) │
└─────────────────────┘
```

```css
.metric-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  padding: 12px;
}
.metric-label { font-size: 11px; color: var(--color-text-secondary); margin-bottom: 4px; }
.metric-value { font-size: 22px; font-weight: 600; font-family: var(--font-mono); }
.metric-delta { font-size: 11px; margin-top: 3px; font-family: var(--font-mono); }
```

### 6.5 Decision Cards (Agent Output)

Used in Cockpit right panel for buy/sell/hold recommendations:

```
┌─ left accent border (3px, semantic color) ──────┐
│  [Symbol]  [Name]               [Action Badge]  │
│  ─────────────────────────────────────────────  │
│  Target ¥XXX  Stop ¥XXX  Size +X.X%  PnL +XX%  │
│  ━━━━━━━━━━━━━━━━━━━━━ (confidence bar)          │
│  Reasoning text (2 lines max)                   │
│  [Confirm] [Deep Analysis] [Set Condition]       │
└──────────────────────────────────────────────────┘
```

Left border color: `--color-profit` for buy, `--color-loss` for sell, `--color-hold` for hold.  
Confidence bar: height `3px`, uses same semantic color.  
Reasoning text: `font-size: 11px`, `color: var(--color-text-secondary)`.

### 6.6 Action Badges

```css
/* Buy */
.badge-buy { background: var(--color-profit-dim); color: var(--color-profit); border: 1px solid var(--color-profit-border); }
/* Sell */
.badge-sell { background: var(--color-loss-dim); color: var(--color-loss); border: 1px solid var(--color-loss-border); }
/* Hold */
.badge-hold { background: var(--color-hold-dim); color: var(--color-hold); border: 1px solid var(--color-hold-border); }

/* Shared badge base */
.badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-sm); letter-spacing: 0.03em; }
```

### 6.7 Data Tables

```css
.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th {
  text-align: left;
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  padding: 6px 8px;
  border-bottom: 1px solid var(--color-border-subtle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}
.data-table td {
  padding: 8px 8px;
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
  vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--color-bg-elevated); }
```

Ticker column: `font-family: var(--font-mono); font-weight: 600`  
Numeric columns: `font-family: var(--font-mono); text-align: right`  
Sortable headers: add `cursor: pointer` and sort indicator icon

### 6.8 Progress / Signal Bars

For factor scores, confidence levels, exposure bars:

```css
.signal-bar-track {
  height: 4px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.signal-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 400ms ease;
}
```

For bidirectional bars (factor exposure centered at 0):

```css
.factor-bar-track {
  position: relative;
  height: 6px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
}
.factor-bar-center {
  position: absolute;
  left: 50%;
  top: -1px;
  width: 1px;
  height: 8px;
  background: var(--color-border-default);
}
.factor-bar-fill {
  position: absolute;
  height: 6px;
  border-radius: var(--radius-full);
  top: 0;
  /* positive: left=50%, extends right; negative: right=50%, extends left */
}
```

### 6.9 Tags / Pills

```css
.tag { font-size: 10px; padding: 2px 7px; border-radius: var(--radius-sm); font-weight: 500; }
.tag-market  { background: rgba(108,99,255,0.15); color: #A78BFA; }
.tag-news    { background: rgba(78,205,196,0.15); color: #4ECDC4; }
.tag-report  { background: rgba(245,166,35,0.15); color: #F5A623; }
.tag-audio   { background: rgba(255,107,157,0.15); color: #FF6B9D; }
.tag-signal  { background: var(--color-profit-dim); color: var(--color-profit); }
```

### 6.10 Toggle Switch

```css
.toggle { position: relative; width: 36px; height: 20px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-track {
  position: absolute; inset: 0;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-full);
  transition: background 200ms, border-color 200ms;
}
.toggle input:checked ~ .toggle-track {
  background: var(--color-accent);
  border-color: var(--color-accent);
}
.toggle-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 14px; height: 14px;
  background: white;
  border-radius: 50%;
  transition: transform 200ms;
  pointer-events: none;
}
.toggle input:checked ~ .toggle-track ~ .toggle-thumb { transform: translateX(16px); }
```

---

## 7. Iconography

Use **Lucide React** icon set exclusively.  
Size guide: `16px` inline, `18px` nav items, `20px` card headers, `24px` empty states.  
Color: inherit from parent by default; use semantic colors for status icons.

Key icon mappings:
```
智能驾驶舱   → LayoutDashboard
市场发现     → Globe / TrendingUp
持仓管理     → Briefcase
策略编排     → SlidersHorizontal
因子管理     → FunctionSquare / Variable
Skills 库   → Puzzle
Agent 编排  → Bot / Workflow
数据源管理   → Database
设置         → Settings
买入信号     → TrendingUp
卖出信号     → TrendingDown
持有信号     → Minus
风险告警     → AlertTriangle
Agent 运行  → Zap (animated)
数据流       → Activity
新闻         → Newspaper
研报         → FileText
音视频       → Mic / Video
上传         → Upload
搜索         → Search
过滤         → Filter
刷新         → RefreshCw
展开详情     → ChevronRight
```

---

## 8. Motion & Animation

```css
/* Standard transitions */
--transition-fast:   150ms ease
--transition-base:   200ms ease
--transition-slow:   350ms ease

/* Easing functions */
--ease-out:   cubic-bezier(0.0, 0, 0.2, 1)
--ease-in:    cubic-bezier(0.4, 0, 1, 1)
--ease-inout: cubic-bezier(0.4, 0, 0.2, 1)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Specific Animations

**Agent status pulse** (sidebar widget, active dot):
```css
@keyframes agent-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
.agent-dot-active { animation: agent-pulse 2s ease-in-out infinite; }
```

**Data stream entry** (new items arriving in data feed):
```css
@keyframes stream-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.stream-item-new { animation: stream-in 250ms var(--ease-out); }
```

**Confidence bar fill** (on card mount):
```css
@keyframes bar-grow {
  from { width: 0%; }
}
.confidence-bar-fill { animation: bar-grow 600ms var(--ease-out); }
```

**Number update** (when metric values change):
```css
@keyframes value-flash {
  0%   { color: var(--color-text-primary); }
  30%  { color: var(--color-accent); }
  100% { color: var(--color-text-primary); }
}
.value-updated { animation: value-flash 800ms ease; }
```

Always wrap non-essential animations in:
```css
@media (prefers-reduced-motion: reduce) { /* disable animations */ }
```

---

## 9. Dark Mode

The app is **dark-mode only**. No light mode variant. Background is `#0F1117`, not pure black, to avoid harshness on large monitors. All color tokens are calibrated for dark backgrounds only.

---

## 10. Responsive Breakpoints

```
--bp-sm:  768px    /* tablet minimum */
--bp-md:  1024px   /* desktop minimum (sidebar collapses below this) */
--bp-lg:  1280px   /* standard desktop */
--bp-xl:  1440px   /* wide desktop — cockpit side panel expands */
--bp-2xl: 1920px   /* ultrawide — enable 3-column cockpit layout */
```

The app is primarily designed for `1280px+`. Below `1024px` is degraded but functional (sidebar icon-only, panels stack vertically).
