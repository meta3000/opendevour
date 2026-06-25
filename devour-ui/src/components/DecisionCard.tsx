/**
 * DecisionCard — Agent 决策卡片
 *
 * 展示买入/卖出/持有决策，包含：
 * - 左侧语义色 3px 边框（买入绿/卖出红/持有橙）
 * - 标的代码 + 名称 + 操作徽章
 * - 目标价/止损价/仓位变化/预期盈亏
 * - 置信度进度条（带动画）
 * - 推理文本（最多 2 行）
 * - 滑动确认交互（向右滑动确认，向左滑动忽略）
 * - 操作按钮：确认 / 深度分析 / 忽略
 * - 确认后成功动画反馈
 *
 * @see spec/02-module-interactions.md Section LEFT Context Drawer
 */

import React from 'react';
import type { Decision } from '../types/decision';
import { ActionBadge } from './ActionBadge';
import { SignalBar } from './SignalBar';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface DecisionCardProps {
  decision: Decision;
  /** 点击"确认"执行按钮 */
  onConfirm?: (id: string) => void;
  /** 点击"深度分析"按钮（打开驾驶舱分析报告） */
  onAnalyze?: (id: string) => void;
  /** 点击"忽略"按钮 */
  onDismiss?: (id: string) => void;
  /** 点击卡片主体（在工作台打开分析） */
  onCardClick?: (id: string) => void;
  /** 是否启用滑动确认模式 */
  swipeable?: boolean;
}

const ACCENT_COLORS: Record<string, string> = {
  buy: '#00C896',
  sell: '#FF4D6A',
  hold: '#F5A623',
};

const SIGNAL_COLORS: Record<string, string> = {
  buy: '#00C896',
  sell: '#FF4D6A',
  hold: '#F5A623',
};

export const DecisionCard: React.FC<DecisionCardProps> = ({
  decision,
  onConfirm,
  onAnalyze,
  onDismiss,
  onCardClick,
  swipeable = false,
}) => {
  const accentColor = ACCENT_COLORS[decision.action];
  const signalColor = SIGNAL_COLORS[decision.action];

  // ---- 滑动确认状态 ----
  const [swipeX, setSwipeX] = React.useState(0);
  const [swiping, setSwiping] = React.useState(false);
  const startXRef = React.useRef(0);

  // ---- 成功动画状态 ----
  const [confirmed, setConfirmed] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  const handleConfirm = React.useCallback(() => {
    setConfirmed(true);
    setTimeout(() => onConfirm?.(decision.id), 600);
  }, [decision.id, onConfirm]);

  const handleDismiss = React.useCallback(() => {
    setDismissed(true);
    setTimeout(() => onDismiss?.(decision.id), 600);
  }, [decision.id, onDismiss]);

  // ---- 滑动手势处理 ----
  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    if (!swipeable) return;
    startXRef.current = e.clientX;
    setSwiping(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [swipeable]);

  const handlePointerMove = React.useCallback((e: React.PointerEvent) => {
    if (!swiping) return;
    const delta = e.clientX - startXRef.current;
    // 限制滑动范围 [-120, 120]
    setSwipeX(Math.max(-120, Math.min(120, delta)));
  }, [swiping]);

  const handlePointerUp = React.useCallback(() => {
    if (!swiping) return;
    setSwiping(false);
    // 向右滑动超过阈值 → 确认
    if (swipeX > 80) {
      handleConfirm();
    }
    // 向左滑动超过阈值 → 忽略
    else if (swipeX < -80) {
      handleDismiss();
    }
    setSwipeX(0);
  }, [swiping, swipeX, handleConfirm, handleDismiss]);

  // ---- 成功/忽略动画 ----
  if (confirmed) {
    return (
      <div
        style={{
          background: 'rgba(0,200,150,0.08)',
          border: '1px solid rgba(0,200,150,0.2)',
          borderRadius: 8,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          animation: 'decision-confirm-fade 600ms ease forwards',
        }}
      >
        <div style={{ fontSize: 16, color: '#00C896' }}>✓</div>
        <span style={{ fontSize: 12, color: '#00C896', fontWeight: 500 }}>
          {decision.symbol} {decision.name} · 已确认{decision.action === 'buy' ? '买入' : decision.action === 'sell' ? '卖出' : '持有'}
        </span>
      </div>
    );
  }

  if (dismissed) {
    return (
      <div
        style={{
          background: 'rgba(255,77,106,0.08)',
          border: '1px solid rgba(255,77,106,0.2)',
          borderRadius: 8,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          animation: 'decision-dismiss-fade 600ms ease forwards',
        }}
      >
        <div style={{ fontSize: 14, color: '#FF4D6A' }}>✕</div>
        <span style={{ fontSize: 12, color: '#8B92A5' }}>
          {decision.symbol} {decision.name} · 已忽略
        </span>
      </div>
    );
  }

  // ---- 滑动进度指示 ----
  const swipeConfirmPct = Math.max(0, swipeX / 80);
  const swipeDismissPct = Math.max(0, -swipeX / 80);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      {/* 滑动确认背景指示 */}
      {swipeable && swiping && swipeX > 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(0,200,150,${swipeConfirmPct * 0.2})`,
          borderRadius: 8,
          transition: 'background 100ms ease',
          zIndex: 0,
        }} />
      )}
      {swipeable && swiping && swipeX < 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(255,77,106,${swipeDismissPct * 0.2})`,
          borderRadius: 8,
          transition: 'background 100ms ease',
          zIndex: 0,
        }} />
      )}

      <div
        onPointerDown={swipeable ? handlePointerDown : undefined}
        onPointerMove={swipeable ? handlePointerMove : undefined}
        onPointerUp={swipeable ? handlePointerUp : undefined}
        onPointerCancel={swipeable ? handlePointerUp : undefined}
        style={{
          background: '#171B26',
          borderRadius: 8,
          borderLeft: `3px solid ${accentColor}`,
          border: `1px solid rgba(255,255,255,0.06)`,
          borderLeftWidth: 3,
          borderLeftColor: accentColor,
          overflow: 'hidden',
          transform: swipeable ? `translateX(${swipeX * 0.5}px)` : undefined,
          transition: swiping ? 'none' : 'transform 200ms ease, background 200ms ease',
          position: 'relative',
          zIndex: 1,
          touchAction: swipeable ? 'pan-y' : undefined,
        }}
      >
        {/* 可点击区域：卡片主体 */}
        <div
          onClick={() => onCardClick?.(decision.id)}
          style={{
            padding: '10px 12px 8px',
            cursor: onCardClick ? 'pointer' : 'default',
          }}
        >
          {/* 第一行：标的 + 徽章 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#F0F2F7',
                }}
              >
                {decision.symbol}
              </span>
              <span style={{ fontSize: 11, color: '#8B92A5' }}>{decision.name}</span>
            </div>
            <ActionBadge action={decision.action} />
          </div>

          {/* 第二行：四个关键数值 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 4,
              marginBottom: 8,
              fontSize: 10,
            }}
          >
            <div>
              <div style={{ color: '#4E5568' }}>目标</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#F0F2F7' }}>
                ¥{decision.targetPrice.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ color: '#4E5568' }}>止损</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#FF4D6A' }}>
                ¥{decision.stopPrice.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ color: '#4E5568' }}>仓位</div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: decision.positionDelta >= 0 ? '#00C896' : '#FF4D6A',
                }}
              >
                {decision.positionDelta >= 0 ? '+' : ''}{decision.positionDelta}%
              </div>
            </div>
            <div>
              <div style={{ color: '#4E5568' }}>预期</div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: decision.expectedPnlPct >= 0 ? '#00C896' : '#FF4D6A',
                }}
              >
                {decision.expectedPnlPct >= 0 ? '+' : ''}{decision.expectedPnlPct.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* 置信度条 */}
          <div style={{ marginBottom: 6 }}>
            <SignalBar value={decision.confidence} color={signalColor} height={3} animated />
          </div>

          {/* 推理文本 */}
          <div
            style={{
              fontSize: 11,
              color: '#8B92A5',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {decision.reasoning}
          </div>

          {/* 时间 */}
          <div style={{ fontSize: 10, color: '#4E5568', marginTop: 4 }}>
            {dayjs(decision.createdAt).fromNow()}
          </div>
        </div>

        {/* 操作按钮行 */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
            style={{
              flex: 1,
              height: 26,
              fontSize: 11,
              fontWeight: 500,
              background: 'rgba(0,200,150,0.12)',
              color: '#00C896',
              border: '1px solid rgba(0,200,150,0.30)',
              borderRadius: 5,
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,200,150,0.22)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,200,150,0.12)'; }}
          >
            确认
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAnalyze?.(decision.id); }}
            style={{
              flex: 1,
              height: 26,
              fontSize: 11,
              fontWeight: 500,
              background: 'rgba(108,99,255,0.12)',
              color: '#6C63FF',
              border: '1px solid rgba(108,99,255,0.35)',
              borderRadius: 5,
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(108,99,255,0.22)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(108,99,255,0.12)'; }}
          >
            分析
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
            style={{
              flex: 1,
              height: 26,
              fontSize: 11,
              fontWeight: 500,
              background: 'transparent',
              color: '#4E5568',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 5,
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,77,106,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#FF4D6A'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#4E5568'; }}
          >
            忽略
          </button>
        </div>

        {/* 滑动提示 */}
        {swipeable && (
          <div style={{
            fontSize: 9,
            color: '#4E5568',
            textAlign: 'center',
            padding: '2px 0 4px',
            background: 'rgba(0,0,0,0.1)',
          }}>
            ← 滑动忽略　　滑动确认 →
          </div>
        )}
      </div>
    </div>
  );
};

/** 批量操作栏组件 — 用于决策列表顶部 */
interface DecisionBatchBarProps {
  count: number;
  onConfirmAll: () => void;
  onDismissAll: () => void;
}

export const DecisionBatchBar: React.FC<DecisionBatchBarProps> = ({ count, onConfirmAll, onDismissAll }) => {
  if (count === 0) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 10px',
      background: 'rgba(108,99,255,0.08)',
      border: '1px solid rgba(108,99,255,0.15)',
      borderRadius: 6,
      marginBottom: 8,
    }}>
      <span style={{ fontSize: 11, color: '#A78BFA', fontWeight: 500 }}>
        {count} 条待确认
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onConfirmAll}
          style={{
            fontSize: 10,
            padding: '3px 10px',
            background: 'rgba(0,200,150,0.12)',
            color: '#00C896',
            border: '1px solid rgba(0,200,150,0.25)',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          全部确认
        </button>
        <button
          onClick={onDismissAll}
          style={{
            fontSize: 10,
            padding: '3px 10px',
            background: 'rgba(255,77,106,0.08)',
            color: '#FF4D6A',
            border: '1px solid rgba(255,77,106,0.20)',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          全部忽略
        </button>
      </div>
    </div>
  );
};