/**
 * MetricCard — KPI 指标卡组件
 *
 * 用于展示投资组合关键指标，如净值、夏普比率、最大回撤等。
 * 数值列使用等宽字体（JetBrains Mono），正负值使用金融语义色。
 *
 * @example
 * <MetricCard label="组合净值" value="¥1,284,763" delta="+2.31%" deltaPositive={true} />
 */

import React from 'react';

interface MetricCardProps {
  /** 指标标签（如"夏普比率"） */
  label: string;
  /** 主值（已格式化的字符串，如"¥1,284,763" 或 "1.82"） */
  value: string;
  /** 变动量（如"+2.31%"，已含符号） */
  delta?: string;
  /** delta 是否为正方向（正=profit绿, 负=loss红, undefined=neutral灰） */
  deltaPositive?: boolean | null;
  /** 点击回调（可跳转到详细分析） */
  onClick?: () => void;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  delta,
  deltaPositive,
  onClick,
  style,
}) => {
  const deltaColor =
    deltaPositive === true
      ? '#00C896'
      : deltaPositive === false
      ? '#FF4D6A'
      : '#8B92A5';

  return (
    <div
      onClick={onClick}
      style={{
        background: '#1E2335',
        borderRadius: 6,
        padding: '12px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 150ms ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.background = '#252A3D';
      }}
      onMouseLeave={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.background = '#1E2335';
      }}
    >
      {/* 标签 */}
      <div
        style={{
          fontSize: 11,
          color: '#8B92A5',
          marginBottom: 6,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </div>

      {/* 主数值 */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#F0F2F7',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>

      {/* Delta 变动 */}
      {delta && (
        <div
          style={{
            fontSize: 11,
            marginTop: 4,
            fontFamily: "'JetBrains Mono', monospace",
            color: deltaColor,
          }}
        >
          {delta}
        </div>
      )}
    </div>
  );
};
