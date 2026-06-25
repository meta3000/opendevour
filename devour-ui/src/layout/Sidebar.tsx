/**
 * AlphaAgent · Sidebar 导航
 * antd Sider + Menu dark mode，lucide-react 图标
 * 底部：Agent 状态 widget + 折叠切换按钮
 */

import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Globe, Briefcase, SlidersHorizontal,
  FunctionSquare, Puzzle, Bot, Database, Settings,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const { Sider } = Layout;

/** 导航菜单项（含分组 labels） */
const navItems = [
  { type: 'group' as const, label: '核心', key: 'group-core' },
  { key: '/cockpit',   icon: <LayoutDashboard size={16}/>, label: '智能驾驶舱' },
  { key: '/market',    icon: <Globe size={16}/>,           label: '市场发现' },
  { key: '/portfolio', icon: <Briefcase size={16}/>,       label: '持仓管理' },
  { type: 'group' as const, label: '配置', key: 'group-config' },
  { key: '/strategy',  icon: <SlidersHorizontal size={16}/>, label: '策略编排' },
  { key: '/factors',   icon: <FunctionSquare size={16}/>,  label: '因子管理' },
  { key: '/skills',    icon: <Puzzle size={16}/>,          label: 'Skills 库' },
  { key: '/agents',    icon: <Bot size={16}/>,             label: 'Agent 编排' },
  { type: 'group' as const, label: '系统', key: 'group-system' },
  { key: '/data',      icon: <Database size={16}/>,        label: '数据源管理' },
  { key: '/settings',  icon: <Settings size={16}/>,        label: '系统设置' },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={188}
      collapsedWidth={56}
      trigger={null}   // 隐藏 antd 默认 trigger，用自定义按钮
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#171B26',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo 区域 */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          minHeight: 52,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {collapsed ? (
          <Bot size={20} color="#6C63FF" />
        ) : (
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: '#F0F2F7',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Bot size={18} color="#6C63FF" />
              AlphaAgent
            </div>
            <div style={{ fontSize: 11, color: '#4E5568', marginTop: 2 }}>
              投资智能体平台 v2.0
            </div>
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={navItems}
        onClick={({ key }) => navigate(key)}
        style={{
          border: 'none',
          flex: 1,
          overflow: 'auto',
          background: '#171B26',
        }}
      />

      {/* Agent 状态 widget（展开时显示） */}
      {!collapsed && (
        <div
          style={{
            margin: '0 10px 8px',
            padding: '9px 11px',
            background: '#1E2335',
            borderRadius: 6,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: '#8B92A5',
            }}
          >
            {/* 脉冲绿点 */}
            <span
              className="agent-dot-active"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#00C896',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            Agent 运行中
          </div>
          <div style={{ fontSize: 10, color: '#4E5568', marginTop: 3 }}>
            已处理 247 个信号 · 3 待确认
          </div>
        </div>
      )}

      {/* 折叠切换按钮 */}
      <div
        onClick={() => onCollapse(!collapsed)}
        style={{
          padding: '10px',
          textAlign: 'center',
          cursor: 'pointer',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: '#4E5568',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'color 150ms ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.color = '#8B92A5'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.color = '#4E5568'; }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </div>
    </Sider>
  );
};
