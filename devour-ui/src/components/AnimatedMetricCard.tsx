/**
 * AnimatedMetricCard — 带计数动画的 KPI 指标卡
 *
 * 数值变化时使用 requestAnimationFrame 计数动画
 * 支持前缀/后缀（如 ¥ 和 万、% 等）
 */

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedMetricCardProps {
  /** 数值字符串（纯数字部分） */
  value: string;
  /** 前缀（如 ¥、+） */
  prefix?: string;
  /** 后缀（如 万、%） */
  suffix?: string;
  /** 文字颜色 */
  color?: string;
  /** 动画时长 ms */
  duration?: number;
}

/** 将数字字符串解析为数值 */
function parseNumericValue(str: string): number {
  const cleaned = str.replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned) || 0;
}

/** 格式化数值为字符串，保留原始小数位数 */
function formatValue(num: number, originalStr: string): string {
  const dotIndex = originalStr.indexOf('.');
  const decimals = dotIndex >= 0 ? originalStr.length - dotIndex - 1 : 0;
  return num.toFixed(decimals);
}

export const AnimatedMetricCard: React.FC<AnimatedMetricCardProps> = ({
  value,
  prefix = '',
  suffix = '',
  color = 'var(--color-text-primary)',
  duration = 800,
}) => {
  const [displayValue, setDisplayValue] = useState('0');
  const prevValueRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const target = parseNumericValue(value);
    const start = prevValueRef.current;
    const diff = target - start;

    if (Math.abs(diff) < 0.001) {
      setDisplayValue(formatValue(target, value));
      return;
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplayValue(formatValue(current, value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <div style={{
      fontSize: 16,
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700,
      color,
      transition: 'color 300ms ease',
    }}>
      {prefix}{displayValue}{suffix}
    </div>
  );
};