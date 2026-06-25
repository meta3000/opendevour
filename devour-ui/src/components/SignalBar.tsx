/**
 * SignalBar — 信号强度进度条（单向 & 双向）
 *
 * 单向：0–100% 的进度条，用于置信度显示
 * 双向：-1 到 1 的双向因子暴露条，中心对齐
 */

import React from 'react';

// ---- 单向进度条 ----

interface SignalBarProps {
  /** 进度 0–100 */
  value: number;
  /** 条形颜色（默认 accent 紫） */
  color?: string;
  /** 轨道高度 px */
  height?: number;
  /** 是否显示动画（挂载时从 0 增长） */
  animated?: boolean;
}

export const SignalBar: React.FC<SignalBarProps> = ({
  value,
  color = '#6C63FF',
  height = 4,
  animated = true,
}) => {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      style={{
        height,
        background: '#1E2335',
        borderRadius: 9999,
        overflow: 'hidden',
      }}
    >
      <div
        className={animated ? 'confidence-bar-fill' : undefined}
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 9999,
          transition: 'width 400ms ease',
        }}
      />
    </div>
  );
};

// ---- 双向因子暴露条 ----

interface FactorBarProps {
  /**
   * 因子暴露值 -1 到 1
   * 正值：条形从中间向右延伸（profit 绿）
   * 负值：条形从中间向左延伸（loss 红）
   */
  value: number;
  height?: number;
}

export const FactorBar: React.FC<FactorBarProps> = ({ value, height = 6 }) => {
  const clamped = Math.max(-1, Math.min(1, value));
  const pct = Math.abs(clamped) * 50; // 最大占 50%（半边）
  const isPositive = clamped >= 0;
  const color = isPositive ? '#00C896' : '#FF4D6A';

  return (
    <div
      style={{
        position: 'relative',
        height,
        background: '#1E2335',
        borderRadius: 9999,
      }}
    >
      {/* 中心分割线 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -1,
          width: 1,
          height: height + 2,
          background: 'rgba(255,255,255,0.12)',
        }}
      />
      {/* 填充条 */}
      <div
        style={{
          position: 'absolute',
          height,
          width: `${pct}%`,
          background: color,
          borderRadius: 9999,
          top: 0,
          ...(isPositive
            ? { left: '50%' }
            : { right: '50%' }),
          transition: 'width 400ms ease',
        }}
      />
    </div>
  );
};
