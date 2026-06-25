/**
 * 市场热力图 - G2 Treemap
 * 展示板块涨跌幅热力图，颜色映射涨跌幅，面积映射成交额
 */
import { useEffect, useRef, useState } from 'react';
import { Chart } from '@antv/g2';
import { Spin } from 'antd';
import { fetchHeatmap } from '../../api/market.api';
import type { HeatmapNode } from '../../types/market';

interface HeatmapChartProps {
  onNodeClick?: (node: HeatmapNode) => void;
}

export default function HeatmapChart({ onNodeClick }: HeatmapChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [nodes, setNodes] = useState<HeatmapNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchHeatmap()
      .then((data) => {
        if (!cancelled) setNodes(data);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('获取热力图失败', err);
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

    // 构造 treemap 数据
    const data = {
      name: 'root',
      children: nodes.map((node) => ({
        name: node.symbol,
        label: node.name,
        value: node.marketCap,
        change: node.changeRate,
        price: node.price,
        sector: node.sector,
      })),
    };

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height: 360,
    });

    chart.options({
      type: 'treemap',
      data: {
        type: 'inline',
        value: data,
        transform: [{ type: 'treemap', field: 'value', tile: 'treemapSquarify', padding: 2, paddingOuter: 2 }],
      },
      encode: {
        color: 'change',
      },
      scale: {
        color: {
          domain: [-0.07, 0, 0.07],
          range: ['#FF4D6A', '#2A2F3E', '#00C896'],
        },
      },
      style: {
        labelText: (d: any) => (d.data?.label ?? ''),
        labelFontSize: 11,
        labelFill: 'rgba(255,255,255,0.85)',
        labelFontFamily: "'JetBrains Mono', monospace",
        sublabelText: (d: any) => {
          const c = d.data?.change;
          if (c == null) return '';
          return `${c >= 0 ? '+' : ''}${(c * 100).toFixed(2)}%`;
        },
        sublabelFontSize: 10,
        sublabelFill: 'rgba(255,255,255,0.6)',
        stroke: '#0F1117',
        lineWidth: 1,
      },
    } as any);

    chart.render().then(() => {
      chartRef.current = chart;
    });

    // 点击事件
    if (onNodeClick) {
      chart.on('element:click', (e: any) => {
        const d = e.data?.data;
        if (d?.name) {
          const node = nodes.find((n) => n.symbol === d.name);
          if (node) onNodeClick(node);
        }
      });
    }

    return () => {
      chart.destroy();
    };
  }, [onNodeClick, nodes, loading]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 360,
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
  );
}
