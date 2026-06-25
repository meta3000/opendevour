/**
 * 绩效归因图 - G2 Bar 图
 * 放在 Collapse 内，展示各类归因贡献度
 */
import { useEffect, useRef } from 'react';
import { Collapse } from 'antd';
import { Chart } from '@antv/g2';
import { mockAttribution } from '../../mock/portfolio.mock';

function AttributionChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height: 200,
    });

    chart.options({
      type: 'view',
      children: [
        {
          type: 'interval',
          data: mockAttribution,
          coordinate: { transform: [{ type: 'transpose' }] },
          encode: { x: 'category', y: 'contribution', color: (d: any) => (d.contribution >= 0 ? 'pos' : 'neg') },
          scale: {
            color: { domain: ['pos', 'neg'], range: ['#00C896', '#FF4D6A'] },
          },
          style: { maxWidth: 12, radiusTopLeft: 2, radiusTopRight: 2 },
          axis: {
            x: { labelFontSize: 11, labelFill: 'rgba(255,255,255,0.65)', line: false, tickStroke: 'transparent' },
            y: { labelFontSize: 10, labelFill: 'rgba(255,255,255,0.45)', gridStroke: 'rgba(255,255,255,0.06)', tickStroke: 'transparent', labelFormatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%` },
          },
          legend: false,
          tooltip: { items: [{ field: 'contribution', name: '贡献度', valueFormatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%` }] },
        },
      ],
    } as any);

    chart.render();
    return () => { chart.destroy(); };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: 200 }} />;
}

export default function Attribution() {
  return (
    <Collapse
      ghost
      size="small"
      defaultActiveKey={[]}
      items={[
        {
          key: '1',
          label: <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>绩效归因</span>,
          children: <AttributionChart />,
        },
      ]}
      style={{ background: 'transparent' }}
    />
  );
}
