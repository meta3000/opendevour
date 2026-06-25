/**
 * 右侧分析面板
 * 包含：行业分布 + 因子暴露 + 相关性矩阵 + 风险指标 + 绩效归因 + Agent洞察
 */
import { Divider } from 'antd';
import { TrendingUp, Shield, Activity, BarChart3 } from 'lucide-react';
import type { RiskMetrics, SectorAllocation } from '../../types/portfolio';
import { mockRiskMetrics, mockSectorAllocation } from '../../mock/portfolio.mock';
import FactorExposureChart from './FactorExposure';
import CorrelationMatrix from './CorrelationMatrix';
import Attribution from './Attribution';

const fmt = (v: number, decimals = 2) => v.toFixed(decimals);
const pct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%`;

interface AnalysisPanelProps {
  riskMetrics?: RiskMetrics;
  sectorAllocation?: SectorAllocation[];
}

export default function AnalysisPanel({ riskMetrics, sectorAllocation }: AnalysisPanelProps) {
  const r = riskMetrics ?? mockRiskMetrics;
  const sectors = sectorAllocation ?? mockSectorAllocation;

  return (
    <div
      style={{
        width: 340,
        flexShrink: 0,
        borderLeft: '1px solid var(--color-border-subtle)',
        overflowY: 'auto',
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* 关键风险指标 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Shield size={13} color="var(--color-accent-blue)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>风险指标</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: '夏普比率', value: fmt(r.sharpeRatio), color: r.sharpeRatio >= 1.5 ? 'var(--color-profit)' : 'var(--color-text-primary)' },
            { label: '信息比率', value: fmt(r.informationRatio), color: 'var(--color-text-primary)' },
            { label: '最大回撤', value: pct(r.maxDrawdown), color: 'var(--color-loss)' },
            { label: 'Beta', value: fmt(r.beta), color: 'var(--color-text-primary)' },
            { label: '年化波动率', value: pct(r.volatility), color: 'var(--color-text-secondary)' },
            { label: 'VaR 95%', value: `¥${(r.var95 / 10000).toFixed(1)}万`, color: 'var(--color-loss)' },
          ].map((item, idx) => (
            <div
              key={item.label}
              className="chart-fade-in"
              style={{
                padding: '8px 10px',
                background: 'var(--color-bg-elevated)',
                borderRadius: 6,
                animationDelay: `${idx * 80}ms`,
                animationFillMode: 'both',
                transition: 'background 200ms ease, transform 200ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#252A3D'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-elevated)'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Divider style={{ borderColor: 'var(--color-border-subtle)', margin: '0' }} />

      {/* 行业分布 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <BarChart3 size={13} color="var(--color-accent-blue)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>行业分布</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sectors.map((s) => (
            <div key={s.sector} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 52, fontSize: 11, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{s.sector}</div>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${s.weight}%`,
                    height: '100%',
                    background: 'var(--color-accent-blue)',
                    borderRadius: 3,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <div style={{ width: 38, textAlign: 'right', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-text-primary)' }}>
                {s.weight.toFixed(1)}%
              </div>
              <div style={{
                width: 44, textAlign: 'right', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                color: s.returnContribution >= 0 ? 'var(--color-profit)' : 'var(--color-loss)',
              }}>
                {s.returnContribution >= 0 ? '+' : ''}{s.returnContribution.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <Divider style={{ borderColor: 'var(--color-border-subtle)', margin: '0' }} />

      {/* 因子暴露 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Activity size={13} color="var(--color-accent-blue)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>因子暴露</span>
        </div>
        <FactorExposureChart />
      </div>

      <Divider style={{ borderColor: 'var(--color-border-subtle)', margin: '0' }} />

      {/* 相关性矩阵 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <TrendingUp size={13} color="var(--color-accent-blue)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>相关性矩阵（前6）</span>
        </div>
        <CorrelationMatrix />
      </div>

      <Divider style={{ borderColor: 'var(--color-border-subtle)', margin: '0' }} />

      {/* 绩效归因 */}
      <Attribution />

      {/* Agent 洞察 */}
      <div
        style={{
          padding: '10px 12px',
          background: 'rgba(100, 160, 255, 0.06)',
          border: '1px solid rgba(100, 160, 255, 0.15)',
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--color-accent-blue)', fontWeight: 600, marginBottom: 6 }}>Agent 洞察</div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
          当前组合动量因子暴露偏高（+0.72），建议关注动量反转风险。新能源板块集中度26.8%，单一板块集中度偏高，建议适度分散。
          五粮液亏损幅度-11.6%，已接近止损线，Agent 建议逢反弹减仓。
        </p>
      </div>
    </div>
  );
}
