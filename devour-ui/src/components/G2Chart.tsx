/**
 * G2Chart — @antv/g2 图表 React 封装
 *
 * 规则：
 * - spec schema 变化时销毁并重新创建图表（非仅更新数据）
 * - 组件卸载时必须调用 chart.destroy()
 * - 使用 g2DarkTheme 作为默认主题
 *
 * @example
 * <G2Chart spec={equityCurveSpec(data)} height={240} />
 */

import { useEffect, useRef } from 'react';
import { Chart } from '@antv/g2';
import { g2DarkTheme } from '../theme/g2-theme';

interface G2ChartProps {
  /** G2 图表配置对象（传入 chart.options()） */
  spec: object;
  /** 图表高度 px，默认 300 */
  height?: number;
  /** 容器样式 */
  style?: React.CSSProperties;
}

export function G2Chart({ spec, height = 300, style }: G2ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // 用 JSON 序列化检测 spec 结构变化（包括字段增减）
  const specKeyRef = useRef<string>('');

  useEffect(() => {
    if (!containerRef.current) return;

    const specKey = JSON.stringify(Object.keys(spec as object).sort());

    if (chartRef.current && specKey !== specKeyRef.current) {
      // spec schema 结构变化 → 销毁重建
      chartRef.current.destroy();
      chartRef.current = null;
    }

    if (!chartRef.current) {
      chartRef.current = new Chart({
        container: containerRef.current,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        theme: g2DarkTheme as any,
        autoFit: true,
        height,
      });
      specKeyRef.current = specKey;
    }

    chartRef.current.options(spec);
    chartRef.current.render();

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(spec), height]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, ...style }}
    />
  );
}
