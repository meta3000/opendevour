/**
 * TradeTimeline — 交易记录时间线视图
 *
 * 使用 antd Timeline 组件展示交易历史
 * 按月/周分组，显示买入/卖出标记
 * 颜色编码：买入绿色、卖出红色
 */

import React, { useMemo, useState } from 'react';
import { Drawer, Timeline, Segmented, Tag, Empty, Tooltip } from 'antd';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

/** 交易记录类型 */
interface TradeRecord {
  id: string;
  symbol: string;
  name: string;
  action: 'buy' | 'sell';
  shares: number;
  price: number;
  amount: number;
  timestamp: number;
  reason?: string;
}

/** Mock 交易记录数据 */
const mockTradeRecords: TradeRecord[] = [
  { id: 't-01', symbol: '300750', name: '宁德时代', action: 'buy', shares: 500, price: 178.50, amount: 89250, timestamp: Date.now() - 86400000 * 1, reason: '动量因子买入信号' },
  { id: 't-02', symbol: '000858', name: '五粮液', action: 'sell', shares: 800, price: 125.30, amount: 100240, timestamp: Date.now() - 86400000 * 1, reason: '技术面破位止损' },
  { id: 't-03', symbol: '601012', name: '隆基绿能', action: 'buy', shares: 3000, price: 24.80, amount: 74400, timestamp: Date.now() - 86400000 * 3, reason: '成长因子加仓' },
  { id: 't-04', symbol: '002594', name: '比亚迪', action: 'buy', shares: 200, price: 258.00, amount: 51600, timestamp: Date.now() - 86400000 * 5, reason: '新能源板块配置' },
  { id: 't-05', symbol: '600519', name: '贵州茅台', action: 'sell', shares: 50, price: 1695.00, amount: 84750, timestamp: Date.now() - 86400000 * 5, reason: '仓位再平衡' },
  { id: 't-06', symbol: '600036', name: '招商银行', action: 'buy', shares: 2000, price: 30.15, amount: 60300, timestamp: Date.now() - 86400000 * 8, reason: '低估值因子' },
  { id: 't-07', symbol: '688981', name: '中芯国际', action: 'buy', shares: 500, price: 72.50, amount: 36250, timestamp: Date.now() - 86400000 * 10, reason: '科技板块建仓' },
  { id: 't-08', symbol: '300760', name: '迈瑞医疗', action: 'buy', shares: 100, price: 252.00, amount: 25200, timestamp: Date.now() - 86400000 * 12, reason: '质量因子配置' },
  { id: 't-09', symbol: '000333', name: '美的集团', action: 'sell', shares: 500, price: 54.80, amount: 27400, timestamp: Date.now() - 86400000 * 15, reason: '收益了结' },
  { id: 't-10', symbol: '600276', name: '恒瑞医药', action: 'buy', shares: 1000, price: 33.60, amount: 33600, timestamp: Date.now() - 86400000 * 18, reason: '创新药研发突破' },
  { id: 't-11', symbol: '000858', name: '五粮液', action: 'buy', shares: 300, price: 135.20, amount: 40560, timestamp: Date.now() - 86400000 * 25, reason: '估值修复建仓' },
  { id: 't-12', symbol: '300750', name: '宁德时代', action: 'sell', shares: 200, price: 165.80, amount: 33160, timestamp: Date.now() - 86400000 * 30, reason: '仓位减配' },
  { id: 't-13', symbol: '002594', name: '比亚迪', action: 'buy', shares: 300, price: 238.50, amount: 71550, timestamp: Date.now() - 86400000 * 35, reason: '新能源主线加仓' },
  { id: 't-14', symbol: '601012', name: '隆基绿能', action: 'buy', shares: 2000, price: 21.50, amount: 43000, timestamp: Date.now() - 86400000 * 42, reason: '光伏底部建仓' },
  { id: 't-15', symbol: '600519', name: '贵州茅台', action: 'buy', shares: 100, price: 1450.00, amount: 145000, timestamp: Date.now() - 86400000 * 50, reason: '核心资产建仓' },
];

type GroupMode = 'month' | 'week';

interface TradeTimelineProps {
  open: boolean;
  onClose: () => void;
}

export const TradeTimeline: React.FC<TradeTimelineProps> = ({ open, onClose }) => {
  const [groupMode, setGroupMode] = useState<GroupMode>('month');

  const groupedRecords = useMemo(() => {
    const groups: Record<string, TradeRecord[]> = {};
    const sorted = [...mockTradeRecords].sort((a, b) => b.timestamp - a.timestamp);

    for (const record of sorted) {
      const date = dayjs(record.timestamp);
      const key = groupMode === 'month'
        ? date.format('YYYY年M月')
        : `${date.format('YYYY')} 第${date.week()}周`;

      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    }

    return groups;
  }, [groupMode]);

  // 统计
  const stats = useMemo(() => {
    const buys = mockTradeRecords.filter(r => r.action === 'buy');
    const sells = mockTradeRecords.filter(r => r.action === 'sell');
    return {
      totalBuy: buys.reduce((s, r) => s + r.amount, 0),
      totalSell: sells.reduce((s, r) => s + r.amount, 0),
      buyCount: buys.length,
      sellCount: sells.length,
    };
  }, []);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} color="#6C63FF" />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#F0F2F7' }}>交易记录</span>
        </div>
      }
      width={520}
      placement="right"
      styles={{
        header: { background: '#171B26', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' },
        body: { background: '#0F1117', padding: '16px 20px' },
      }}
      extra={
        <Segmented
          size="small"
          value={groupMode}
          onChange={(v) => setGroupMode(v as GroupMode)}
          options={[
            { label: '按月', value: 'month' },
            { label: '按周', value: 'week' },
          ]}
          style={{ background: '#1E2335' }}
        />
      }
    >
      {/* 概览统计 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 20,
        padding: '12px 14px',
        background: '#1E2335',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <div style={{ fontSize: 10, color: '#4E5568', marginBottom: 2 }}>买入总计</div>
          <div style={{ fontSize: 15, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#00C896' }}>
            ¥{(stats.totalBuy / 10000).toFixed(1)}万
          </div>
          <div style={{ fontSize: 10, color: '#4E5568' }}>{stats.buyCount} 笔</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#4E5568', marginBottom: 2 }}>卖出总计</div>
          <div style={{ fontSize: 15, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#FF4D6A' }}>
            ¥{(stats.totalSell / 10000).toFixed(1)}万
          </div>
          <div style={{ fontSize: 10, color: '#4E5568' }}>{stats.sellCount} 笔</div>
        </div>
      </div>

      {/* 时间线 */}
      {Object.keys(groupedRecords).length === 0 ? (
        <Empty description="暂无交易记录" style={{ marginTop: 60 }} />
      ) : (
        Object.entries(groupedRecords).map(([group, records]) => (
          <div key={group} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#8B92A5',
              marginBottom: 12,
              paddingBottom: 6,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {group}
            </div>
            <Timeline
              items={records.map((record) => ({
                color: record.action === 'buy' ? '#00C896' : '#FF4D6A',
                children: (
                  <div style={{
                    padding: '8px 12px',
                    background: '#1E2335',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13, color: '#F0F2F7' }}>
                          {record.symbol}
                        </span>
                        <span style={{ fontSize: 12, color: '#8B92A5' }}>{record.name}</span>
                      </div>
                      <Tag
                        icon={record.action === 'buy' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        style={{
                          fontSize: 11,
                          margin: 0,
                          background: record.action === 'buy' ? 'rgba(0,200,150,0.12)' : 'rgba(255,77,106,0.12)',
                          color: record.action === 'buy' ? '#00C896' : '#FF4D6A',
                          border: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        {record.action === 'buy' ? '买入' : '卖出'}
                      </Tag>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#8B92A5' }}>
                      <span>数量: <span style={{ color: '#F0F2F7', fontFamily: "'JetBrains Mono', monospace" }}>{record.shares.toLocaleString()}</span></span>
                      <span>价格: <span style={{ color: '#F0F2F7', fontFamily: "'JetBrains Mono', monospace" }}>¥{record.price.toFixed(2)}</span></span>
                      <span>金额: <span style={{ color: record.action === 'buy' ? '#00C896' : '#FF4D6A', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                        ¥{(record.amount / 10000).toFixed(1)}万
                      </span></span>
                    </div>
                    {record.reason && (
                      <div style={{ fontSize: 10, color: '#4E5568', marginTop: 4 }}>
                        原因: {record.reason}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: '#4E5568', marginTop: 2 }}>
                      {dayjs(record.timestamp).format('M月D日 HH:mm')}
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        ))
      )}
    </Drawer>
  );
};