/**
 * AlphaAgent · G2 图表暗色主题
 * 应用于所有 @antv/g2 图表实例
 * Financial color palette — 不用于金融语义以外的分类数据
 */

export const g2DarkTheme = {
  type: 'dark',
  background: 'transparent',   // 继承容器背景
  defaultColor: '#6C63FF',
  /** 分类色板（8色），严格不与 profit/loss/hold 语义色混用 */
  colors10: [
    '#6C63FF', '#00C896', '#F5A623', '#FF6B9D',
    '#4ECDC4', '#A78BFA', '#FCD34D', '#6EE7B7',
  ],
  colors20: [
    '#6C63FF', '#00C896', '#F5A623', '#FF6B9D',
    '#4ECDC4', '#A78BFA', '#FCD34D', '#6EE7B7',
    '#818CF8', '#34D399', '#FBBF24', '#F472B6',
    '#22D3EE', '#C4B5FD', '#FDE68A', '#A7F3D0',
    '#60A5FA', '#FB923C', '#F87171', '#94A3B8',
  ],
  view: {
    viewFill: 'transparent',
  },
  axis: {
    bottom: {
      label: { style: { fill: '#8B92A5', fontSize: 11 } },
      line:  { style: { stroke: 'rgba(255,255,255,0.06)' } },
      tick:  { style: { stroke: 'rgba(255,255,255,0.12)' } },
      grid:  { line: { style: { stroke: 'rgba(255,255,255,0.06)' } } },
    },
    left: {
      label: { style: { fill: '#8B92A5', fontSize: 11 } },
      line:  { style: { stroke: 'rgba(255,255,255,0.06)' } },
      tick:  { style: { stroke: 'rgba(255,255,255,0.12)' } },
      grid:  { line: { style: { stroke: 'rgba(255,255,255,0.06)' } } },
    },
    right: {
      label: { style: { fill: '#8B92A5', fontSize: 11 } },
      grid:  { line: { style: { stroke: 'rgba(255,255,255,0.06)' } } },
    },
    top: {
      label: { style: { fill: '#8B92A5', fontSize: 11 } },
    },
  },
  tooltip: {
    domStyles: {
      'g2-tooltip': {
        background: '#252A3D',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '6px',
        color: '#F0F2F7',
        fontSize: '12px',
        fontFamily: "'Inter', sans-serif",
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        padding: '8px 12px',
      },
      'g2-tooltip-title': {
        color: '#F0F2F7',
        fontWeight: '500',
        marginBottom: '4px',
      },
      'g2-tooltip-list-item': {
        color: '#8B92A5',
        fontSize: '11px',
      },
      'g2-tooltip-marker': {
        borderRadius: '50%',
      },
    },
  },
  legend: {
    label: { style: { fill: '#8B92A5', fontSize: 11 } },
  },
};
