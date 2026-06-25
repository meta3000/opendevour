# CSS 变量完整参考

本文档是 `src/theme/tokens.css` 的设计文档对应，记录所有 CSS 变量的语义与用途。

## 背景色层级

| 变量 | 值 | 用途 |
|------|-----|------|
| `--color-bg-base` | `#0F1117` | 最底层背景（整体页面） |
| `--color-bg-surface` | `#171B26` | 卡片/面板表面 |
| `--color-bg-elevated` | `#1E2335` | 悬浮元素（下拉、Tooltip背景） |
| `--color-bg-overlay` | `#252A3E` | 弹层遮罩底层 |

## 文本色

| 变量 | 值 | 用途 |
|------|-----|------|
| `--color-text-primary` | `rgba(255,255,255,0.92)` | 主标题、数值 |
| `--color-text-secondary` | `rgba(255,255,255,0.65)` | 正文、说明 |
| `--color-text-tertiary` | `rgba(255,255,255,0.38)` | 辅助信息、placeholder |
| `--color-text-disabled` | `rgba(255,255,255,0.20)` | 禁用态 |

## 边框色

| 变量 | 值 | 用途 |
|------|-----|------|
| `--color-border-subtle` | `rgba(255,255,255,0.07)` | 分割线、卡片边框 |
| `--color-border-default` | `rgba(255,255,255,0.12)` | 输入框、交互边框 |
| `--color-border-strong` | `rgba(255,255,255,0.20)` | 强调边框 |

## 金融语义色

| 变量 | 值 | 用途 |
|------|-----|------|
| `--color-profit` | `#00C896` | 盈利/上涨/买入 |
| `--color-loss` | `#FF4D6A` | 亏损/下跌/卖出 |
| `--color-hold` | `#F5A623` | 持平/持有/观望 |
| `--color-profit-dim` | `rgba(0,200,150,0.15)` | 盈利色背景 |
| `--color-loss-dim` | `rgba(255,77,106,0.15)` | 亏损色背景 |

## 强调色

| 变量 | 值 | 用途 |
|------|-----|------|
| `--color-accent-blue` | `#4A9EFF` | 主操作、高亮、链接 |
| `--color-accent-purple` | `#8B5CF6` | AI/Agent 相关元素 |

## 字体

| 变量 | 值 | 用途 |
|------|-----|------|
| `--font-sans` | `Inter, system-ui, sans-serif` | 界面文字 |
| `--font-mono` | `'JetBrains Mono', monospace` | 数值/价格/代码 |

## 间距

| 变量 | 值 |
|------|-----|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |

## 圆角

| 变量 | 值 | 用途 |
|------|-----|------|
| `--radius-sm` | `4px` | Tag、Badge |
| `--radius-md` | `8px` | 卡片、输入框 |
| `--radius-lg` | `12px` | 大卡片、面板 |
| `--radius-xl` | `16px` | 弹层 |
| `--radius-full` | `9999px` | 圆形按钮 |

## 数值显示规范

所有 **价格、百分比、数量** 必须使用 `font-family: var(--font-mono)`，禁止使用等比字体，
原因：等宽字体在数字对齐、正负号切换时保持布局稳定，避免闪烁。

### 颜色规则
- 正值（盈利、上涨）：`var(--color-profit)` + `+` 前缀
- 负值（亏损、下跌）：`var(--color-loss)` + `-` 前缀（原有符号）
- 中性/持有：`var(--color-hold)` 或 `var(--color-text-primary)`
