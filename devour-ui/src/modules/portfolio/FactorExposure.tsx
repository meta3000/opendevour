/**
 * 因子暴露图 - G2 双向条形图
 * 以中心对齐的方式展示各因子暴露值
 */
import { useEffect, useRef } from 'react';
import { Chart } from '@antv/g2';
import { mockFactorExposure } from '../../mock/portfolio.mock';

export default function FactorExposureChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height: 180,
    });

    chart.options({
      type: 'interval',
      data: mockFactorExposure,
      coordinate: { transform: [{ type: 'transpose' }] },
      encode: {
        x: 'factor',
        y: 'value',
        color: (d: any) => (d.value >= 0 ? 'positive' : 'negative'),
      },
      scale: {
        color: {
          domain: ['positive', 'negative'],
          range: ['#00C896', '#FF4D6A'],
        },
        y: { domain: [-1, 1] },
      },
      style: {
        radiusTopLeft: 2,
        radiusTopRight: 2,
        radiusBottomLeft: 2,
        radiusBottomRight: 2,
        maxWidth: 14,
      },
      axis: {
        x: {
          labelFill: 'rgba(255,255,255,0.65)',
          labelFontSize: 11,
          tickStroke: 'transparent',
          line: false,
        },
        y: {
          labelFill: 'rgba(255,255,255,0.45)',
          labelFontSize: 10,
          gridStroke: 'rgba(255,255,255,0.06)',
          tickStroke: 'transparent',
          labelFormatter: (v: number) => v.toFixed(1),
        },
      },
      legend: false,
    } as any);

    chart.render();

    return () => {
      chart.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 180 }}
    />
  );
}
