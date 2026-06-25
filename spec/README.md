# AlphaAgent 文档索引

**AlphaAgent** 是面向专业投资者的 AI 投资智能体平台，提供多模块协同的智能投研工作流。

## 文档结构

```
spec/
├── README.md                          ← 本文件（文档索引）
├── 00-how-to-use.md                   ← 项目快速开始
│
├── design/                            ← 设计系统
│   ├── 01-design-system.md            ← 设计语言、色彩、排版
│   └── 02-color-tokens.md             ← CSS 变量完整参考
│
├── modules/                           ← 模块交互与详细设计
│   ├── 02-module-interactions.md      ← 模块间交互总览
│   ├── cockpit.md                     ← 智能驾驶舱详细设计
│   ├── market.md                      ← 市场发现详细设计
│   └── portfolio.md                   ← 持仓管理详细设计
│
└── tech/                              ← 技术文档
    ├── 03-frontend-tech-stack.md      ← 前端技术栈规范
    └── api-contracts.md               ← API 接口契约（与代码同步）
```

## 模块概览

| 模块 | 路由 | 状态 | 描述 |
|------|------|------|------|
| 智能驾驶舱 | `/cockpit` | ✅ 已实现 | 三列布局 AI 对话工作台 |
| 市场发现 | `/market` | ✅ 已实现 | 热力图 + 信号扫描 |
| 持仓管理 | `/portfolio` | ✅ 已实现 | 持仓分析 + 风险面板 |
| 策略编排 | `/strategy` | 🔜 开发中 | 可视化策略构建 |
| 因子管理 | `/factors` | 🔜 开发中 | 因子库浏览与测试 |
| Skills 库 | `/skills` | 🔜 开发中 | Agent 技能管理 |
| Agent 编排 | `/agents` | 🔜 开发中 | 多 Agent 协同调度 |
| 数据源管理 | `/data` | 🔜 开发中 | 数据接入配置 |
| 系统设置 | `/settings` | 🔜 开发中 | 系统参数配置 |

## 快速开始

```bash
cd devour-ui
npm install
npm run dev
# 访问 http://localhost:5173
```
