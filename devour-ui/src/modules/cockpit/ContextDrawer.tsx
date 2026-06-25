/**
 * ContextDrawer — 驾驶舱左侧上下文面板
 *
 * 三个区域：
 * 1. Portfolio KPIs — 2×2 MetricCard 网格
 * 2. Agent 决策列表 — 最多 5 条 DecisionCard
 * 3. 因子信号 — 双向 FactorBar 列表
 *
 * @see spec/02-module-interactions.md MODULE 1 LEFT
 */

import React from 'react';
import { useCockpitStore } from '../../stores/cockpit.store';
import { MetricCard } from '../../components/MetricCard';
import { DecisionCard, DecisionBatchBar } from '../../components/DecisionCard';
import { FactorBar } from '../../components/SignalBar';
import { mockPortfolioKPIs, mockFactorSignals } from '../../mock/cockpit.mock';

interface ContextDrawerProps {
  onClose: () => void;
}

export const ContextDrawer: React.FC<ContextDrawerProps> = ({ onClose: _onClose }) => {
  const { pendingDecisions, confirmDecision, dismissDecision, confirmAllDecisions, dismissAllDecisions, pushContent } = useCockpitStore();

  /** 点击"分析"：打开驾驶舱工作台分析报告 */
  const handleAnalyze = (id: string) => {
    const decision = pendingDecisions.find(d => d.id === id);
    if (!decision) return;
    pushContent({
      id: `analysis-${decision.symbol}`,
      title: `${decision.name} 分析`,
      type: 'markdown',
      data: `# ${decision.name}（${decision.symbol}）投资分析\n\n**AI 推理：**\n${decision.reasoning}\n\n**触发因子：** ${decision.triggerFactors.join('、')}\n\n**目标价：** ¥${decision.targetPrice}｜**止损价：** ¥${decision.stopPrice}\n\n*更详细的分析将在后端 API 对接后自动生成*`,
      timestamp: Date.now(),
      sourceMessageId: id,
    });
  };

  const kpis = mockPortfolioKPIs;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 面板标题 */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontSize: 12,
          fontWeight: 500,
          color: '#8B92A5',
          flexShrink: 0,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        初始化概览
      </div>

      {/* 滚动内容区 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

        {/* Section 1: Portfolio KPIs */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#4E5568', marginBottom: 8, fontWeight: 500 }}>
            投资组合
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <MetricCard
              label="组合净值"
              value={`¥${(kpis.navValue / 10000).toFixed(2)}万`}
              delta={`今日 ${kpis.todayReturn >= 0 ? '+' : ''}${(kpis.todayReturn * 100).toFixed(2)}%`}
              deltaPositive={kpis.todayReturn >= 0}
            />
            <MetricCard
              label="夏普比率"
              value={kpis.sharpeRatio.toFixed(2)}
              delta={`IR ${kpis.informationRatio.toFixed(2)}`}
              deltaPositive={null}
            />
            <MetricCard
              label="最大回撤"
              value={`${(kpis.maxDrawdown * 100).toFixed(2)}%`}
              deltaPositive={false}
            />
            <MetricCard
              label="今日决策"
              value={`${kpis.todayDecisionCount} 次`}
              delta={`待确认 ${pendingDecisions.length}`}
              deltaPositive={null}
            />
          </div>
        </div>

        {/* Section 2: Agent 决策 */}
        {pendingDecisions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                color: '#4E5568',
                marginBottom: 8,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Agent 决策</span>
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: 'rgba(108,99,255,0.15)',
                  color: '#6C63FF',
                }}
              >
                {pendingDecisions.length} 待确认
              </span>
            </div>
            <DecisionBatchBar
              count={pendingDecisions.length}
              onConfirmAll={confirmAllDecisions}
              onDismissAll={dismissAllDecisions}
            />
            {pendingDecisions.slice(0, 5).map((decision) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                onConfirm={confirmDecision}
                onDismiss={dismissDecision}
                onAnalyze={handleAnalyze}
                onCardClick={handleAnalyze}
                swipeable
              />
            ))}
          </div>
        )}

        {/* Section 3: 因子信号 */}
        <div>
          <div style={{ fontSize: 11, color: '#4E5568', marginBottom: 8, fontWeight: 500 }}>
            因子信号
          </div>
          {mockFactorSignals.map((signal) => (
            <div key={signal.factor} style={{ marginBottom: 8 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                  fontSize: 11,
                }}
              >
                <span style={{ color: '#8B92A5' }}>{signal.factor}</span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: signal.value >= 0 ? '#00C896' : '#FF4D6A',
                    fontSize: 10,
                  }}
                >
                  {signal.value >= 0 ? '+' : ''}{signal.value.toFixed(2)}
                </span>
              </div>
              <FactorBar value={signal.value} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
