/**
 * ActionBadge — 买入/卖出/持有语义徽章
 *
 * 用于决策卡、持仓表格等场景标识 Agent 信号方向。
 * 颜色严格对应金融语义：green=买入, red=卖出, amber=持有
 */

import React from 'react';
import type { DecisionAction } from '../types/decision';

interface ActionBadgeProps {
  action: DecisionAction;
  /** 'default' 徽章大小（10px 字），'sm' 更小（9px）*/
  size?: 'default' | 'sm';
}

const CONFIG: Record<DecisionAction, { label: string; bg: string; color: string; border: string }> = {
  buy: {
    label: '买入',
    bg: 'rgba(0,200,150,0.12)',
    color: '#00C896',
    border: 'rgba(0,200,150,0.30)',
  },
  sell: {
    label: '卖出',
    bg: 'rgba(255,77,106,0.12)',
    color: '#FF4D6A',
    border: 'rgba(255,77,106,0.30)',
  },
  hold: {
    label: '持有',
    bg: 'rgba(245,166,35,0.12)',
    color: '#F5A623',
    border: 'rgba(245,166,35,0.30)',
  },
};

export const ActionBadge: React.FC<ActionBadgeProps> = ({ action, size = 'default' }) => {
  const cfg = CONFIG[action];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: size === 'sm' ? 9 : 10,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 4,
        letterSpacing: '0.03em',
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
};
