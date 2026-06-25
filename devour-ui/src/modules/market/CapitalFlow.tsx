/**
 * 资金流向图 - G2 水平条形图
 * 展示各板块资金净流入/流出，按净流入排序，profit/loss颜色区分
 */
import { useEffect, useRef, useState } from 'react';
import { Chart } from '@antv/g2';
import { Spin } from 'antd';
import { fetchCapitalFlow } from '../../api/market.api';
import type { CapitalFlowItem } from '../../types/market';

export default function CapitalFlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [flowData, setFlowData] = useState<CapitalFlowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCapitalFlow()
      .then((data) => {
        if (!cancelled) setFlowData(data);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('获取资金流向失败', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || loading) return;

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height: 260,
    });

    chart.options({
      type: 'interval',
      data: flowData,
      coordinate: { transform: [{ type: 'transpose' }] },
      encode: {
        x: 'name',
        y: 'netInflow',
        color: (d: any) => (d.netInflow >= 0 ? 'inflow' : 'outflow'),
      },
      scale: {
        color: {
          domain: ['inflow', 'outflow'],
          range: ['#00C896', '#FF4D6A'],
        },
      },
      style: {
        radiusTopLeft: 2,
        radiusTopRight: 2,
        radiusBottomLeft: 2,
        radiusBottomRight: 2,
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
          labelFormatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}亿`,
        },
      },
      legend: false,
      tooltip: {
        items: [
          { field: 'netInflow', name: '净流入(亿)', valueFormatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}亿` },
          { field: 'mainForceInflow', name: '主力净流入' },
        ],
      },
    } as any);

    chart.render();

    return () => {
      chart.destroy();
    };
  }, [flowData, loading]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>板块资金流向</span>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 260,
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--color-bg-surface)',
        }}
      >
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-bg-surface)',
              zIndex: 1,
            }}
          >
            <Spin size="small" />
          </div>
        )}
      </div>
    </div>
  );
}
