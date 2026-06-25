/**
 * 板块轮动雷达图 - G2 Radar
 * 展示各板块的动量、估值等多维度评分
 * 支持 Segmented 切换 Radar/Bar 两种视图
 */
import { useEffect, useRef, useState } from 'react';
import { Segmented, Spin } from 'antd';
import { Chart } from '@antv/g2';
import { fetchSectorData } from '../../api/market.api';
import type { SectorData } from '../../types/market';

type ViewMode = 'radar' | 'bar';

export default function SectorRadar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('radar');
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSectorData()
      .then((data) => {
        if (!cancelled) setSectorData(data);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('获取板块数据失败', err);
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

    // 销毁旧图表
    if (chartRef.current) {
      try { chartRef.current.destroy(); } catch (_) {}
      chartRef.current = null;
    }

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height: 280,
    });

    if (viewMode === 'radar') {
      // 雷达图数据：每个板块两个维度（动量、估值）
      const radarData = sectorData.flatMap((d) => [
        { sector: d.sector, metric: '动量得分', value: d.momentumScore },
        { sector: d.sector, metric: '估值得分', value: d.valuationScore },
      ]);

      chart.options({
        type: 'view',
        coordinate: { type: 'polar' },
        children: [
          {
            type: 'area',
            data: radarData,
            encode: { x: 'sector', y: 'value', color: 'metric', series: 'metric' },
            style: { fillOpacity: 0.2 },
            scale: { y: { domain: [0, 1] } },
          },
          {
            type: 'line',
            data: radarData,
            encode: { x: 'sector', y: 'value', color: 'metric', series: 'metric' },
            style: { lineWidth: 2 },
            scale: { y: { domain: [0, 1] } },
          },
          {
            type: 'point',
            data: radarData,
            encode: { x: 'sector', y: 'value', color: 'metric', series: 'metric' },
            style: { r: 4 },
            scale: { y: { domain: [0, 1] } },
          },
        ],
        scale: {
          color: {
            range: ['#00C896', '#F5A623'],
          },
        },
        axis: {
          x: {
            tick: false,
            gridLineDash: null,
            gridStroke: 'rgba(255,255,255,0.08)',
            labelFill: 'rgba(255,255,255,0.65)',
            labelFontSize: 11,
          },
          y: {
            label: false,
            gridLineDash: null,
            gridStroke: 'rgba(255,255,255,0.06)',
          },
        },
        legend: {
          color: {
            itemLabelFill: 'rgba(255,255,255,0.65)',
          },
        },
      } as any);
    } else {
      // 条形图：今日涨跌幅排序
      const barData = [...sectorData].sort((a, b) => b.todayChange - a.todayChange);

      chart.options({
        type: 'interval',
        data: barData,
        encode: { x: 'sector', y: 'todayChange', color: 'todayChange' },
        scale: {
          color: {
            domain: [-3, 0, 3],
            range: ['#FF4D6A', '#4A5568', '#00C896'],
          },
        },
        style: {
          radiusTopLeft: 2,
          radiusTopRight: 2,
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
            labelFormatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`,
          },
        },
        legend: false,
      } as any);
    }

    chart.render().then(() => {
      chartRef.current = chart;
    });

    return () => {
      try { chart.destroy(); } catch (_) {}
    };
  }, [viewMode, sectorData, loading]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>板块轮动</span>
        <Segmented
          size="small"
          value={viewMode}
          onChange={(v) => setViewMode(v as ViewMode)}
          options={[
            { label: '雷达图', value: 'radar' },
            { label: '柱状图', value: 'bar' },
          ]}
          style={{ background: 'var(--color-bg-elevated)' }}
        />
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 280,
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
