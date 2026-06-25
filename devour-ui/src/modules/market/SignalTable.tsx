/**
 * 信号扫描表格
 * 展示20条信号扫描结果，支持排序/筛选，置信度进度条列，操作列"→驾驶舱"
 * 支持过滤预设保存/快速切换
 */
import { useEffect, useMemo, useState } from 'react';
import { Table, Tag, Progress, Button, Select, Space, Tooltip, Input, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { TrendingUp, TrendingDown, ArrowRight, Filter, Bookmark, BookmarkPlus, Star } from 'lucide-react';
import { fetchSignals } from '../../api/market.api';
import type { MarketSignal } from '../../types/market';
import type { FilterPreset } from './MarketDiscovery';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  factor: { label: '因子', color: '#7B68EE' },
  technical: { label: '技术', color: '#F5A623' },
  fundamental: { label: '基本面', color: '#00C896' },
  event: { label: '事件', color: '#FF9800' },
  sentiment: { label: '情绪', color: '#FF4D6A' },
};

const STRENGTH_LABELS: Record<string, { label: string; color: string }> = {
  very_strong: { label: '极强', color: '#00C896' },
  strong: { label: '强', color: '#52c41a' },
  moderate: { label: '中', color: '#F5A623' },
  weak: { label: '弱', color: '#FF4D6A' },
};

interface SignalTableProps {
  onSendToCockpit?: (signal: MarketSignal) => void;
  presets?: FilterPreset[];
  onSavePreset?: () => void;
}

export default function SignalTable({ onSendToCockpit, presets = [], onSavePreset }: SignalTableProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSignals({ page: 1, pageSize: 50 })
      .then((data) => {
        if (!cancelled) setSignals(data);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('获取信号列表失败', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return signals.filter((s) => {
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (directionFilter !== 'all' && s.direction !== directionFilter) return false;
      return true;
    });
  }, [signals, typeFilter, directionFilter]);

  const columns: ColumnsType<MarketSignal> = [
    {
      title: '股票',
      dataIndex: 'symbol',
      width: 120,
      render: (sym, r) => (
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>
            {r.name}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            {sym} · {r.sector}
          </div>
        </div>
      ),
    },
    {
      title: '方向',
      dataIndex: 'direction',
      width: 64,
      align: 'center',
      sorter: (a, b) => a.direction.localeCompare(b.direction),
      render: (dir: string) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {dir === 'long' ? (
            <TrendingUp size={16} color="#00C896" />
          ) : (
            <TrendingDown size={16} color="#FF4D6A" />
          )}
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 72,
      render: (type: string) => {
        const t = TYPE_LABELS[type] ?? { label: type, color: '#666' };
        return <Tag style={{ borderColor: 'transparent', background: `${t.color}22`, color: t.color, fontSize: 11, margin: 0 }}>{t.label}</Tag>;
      },
    },
    {
      title: '强度',
      dataIndex: 'strength',
      width: 60,
      sorter: (a, b) => {
        const order: Record<string, number> = { very_strong: 4, strong: 3, moderate: 2, weak: 1 };
        return (order[b.strength] ?? 0) - (order[a.strength] ?? 0);
      },
      render: (s: string) => {
        const t = STRENGTH_LABELS[s] ?? { label: s, color: '#666' };
        return <span style={{ color: t.color, fontSize: 12, fontWeight: 600 }}>{t.label}</span>;
      },
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      width: 120,
      sorter: (a, b) => b.confidence - a.confidence,
      defaultSortOrder: 'ascend',
      render: (v: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            percent={v}
            size="small"
            showInfo={false}
            strokeColor={v >= 80 ? '#00C896' : v >= 65 ? '#F5A623' : '#FF4D6A'}
            trailColor="rgba(255,255,255,0.08)"
            style={{ flex: 1, minWidth: 60 }}
          />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--color-text-primary)', minWidth: 28, textAlign: 'right' }}>
            {v}%
          </span>
        </div>
      ),
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      width: 80,
      align: 'right',
      sorter: (a, b) => a.currentPrice - b.currentPrice,
      render: (v: number) => (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
          {v.toFixed(2)}
        </span>
      ),
    },
    {
      title: '预期收益',
      dataIndex: 'expectedReturn',
      width: 88,
      align: 'right',
      sorter: (a, b) => b.expectedReturn - a.expectedReturn,
      render: (v: number) => (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: v >= 0 ? 'var(--color-profit)' : 'var(--color-loss)',
          fontWeight: 600,
        }}>
          {v >= 0 ? '+' : ''}{(v * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      title: '触发因子',
      dataIndex: 'triggerFactors',
      width: 140,
      render: (factors: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {factors.map((f) => (
            <Tag key={f} style={{ fontSize: 10, margin: 0, background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }}>
              {f}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '发现时间',
      dataIndex: 'triggeredAt',
      width: 90,
      sorter: (a, b) => b.triggeredAt - a.triggeredAt,
      render: (v: number) => (
        <Tooltip title={dayjs(v).format('MM-DD HH:mm')}>
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {dayjs(v).fromNow()}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      width: 88,
      fixed: 'right',
      render: (_, r) => (
        <Button
          size="small"
          type="text"
          icon={<ArrowRight size={13} />}
          onClick={() => onSendToCockpit?.(r)}
          style={{ fontSize: 12, color: 'var(--color-text-secondary)', gap: 4 }}
        >
          驾驶舱
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 筛选栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Filter size={14} color="var(--color-text-tertiary)" />
        <Space size={8} wrap>
          <Select
            size="small"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 90 }}
            options={[
              { label: '全部类型', value: 'all' },
              { label: '因子', value: 'factor' },
              { label: '技术', value: 'technical' },
              { label: '基本面', value: 'fundamental' },
              { label: '事件', value: 'event' },
              { label: '情绪', value: 'sentiment' },
            ]}
          />
          <Select
            size="small"
            value={directionFilter}
            onChange={setDirectionFilter}
            style={{ width: 90 }}
            options={[
              { label: '全部方向', value: 'all' },
              { label: '做多', value: 'long' },
              { label: '做空', value: 'short' },
            ]}
          />
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            共 {filtered.length} 条信号
          </span>
        </Space>
        {/* 快速预设切换 */}
        {presets.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <Bookmark size={12} color="var(--color-text-tertiary)" />
            {presets.map((p) => (
              <Tag
                key={p.id}
                style={{
                  fontSize: 10,
                  margin: 0,
                  cursor: 'pointer',
                  background: 'rgba(108,99,255,0.08)',
                  borderColor: 'rgba(108,99,255,0.2)',
                  color: '#A78BFA',
                }}
                onClick={() => {
                  if (p.typeFilter && p.typeFilter !== 'all') setTypeFilter(p.typeFilter);
                  if (p.directionFilter && p.directionFilter !== 'all') setDirectionFilter(p.directionFilter);
                }}
              >
                {p.name}
              </Tag>
            ))}
          </div>
        )}
      </div>

      {/* 表格 */}
      <Spin spinning={loading}>
        <Table<MarketSignal>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          size="small"
          scroll={{ x: 960 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            size: 'small',
            style: { marginBottom: 0 },
          }}
          rowClassName={() => 'signal-table-row'}
          style={{
            '--ant-table-header-bg': 'var(--color-bg-elevated)',
            '--ant-table-body-bg': 'var(--color-bg-surface)',
          } as any}
        />
      </Spin>
    </div>
  );
}
