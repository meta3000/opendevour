/**
 * 持仓明细表格
 * 全列展示（代码/名称/数量/成本价/现价/市值/盈亏额/盈亏比/操作），可展开行
 * 支持编辑、删除操作；空状态引导添加持仓
 */
import { useState } from 'react';
import { Table, Tag, Button, Tooltip, Popconfirm, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { TrendingUp, TrendingDown, Minus, Send, Eye, Pencil, Trash2, Plus } from 'lucide-react';
import type { Holding } from '../../types/portfolio';

const SIGNAL_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  buy: { label: '买入', icon: <TrendingUp size={12} />, color: '#00C896' },
  sell: { label: '卖出', icon: <TrendingDown size={12} />, color: '#FF4D6A' },
  hold: { label: '持有', icon: <Minus size={12} />, color: '#F5A623' },
};

interface HoldingsTableProps {
  holdings: Holding[];
  onSendToCockpit?: (holding: Holding) => void;
  onEdit?: (holding: Holding) => void;
  onDelete?: (holding: Holding) => void;
  onAdd?: () => void;
}

/** 格式化"几分钟前" */
function timeAgoLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  return `${Math.floor(hrs / 24)}天前`;
}

export default function HoldingsTable({ holdings, onSendToCockpit, onEdit, onDelete, onAdd }: HoldingsTableProps) {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const columns: ColumnsType<Holding> = [
    {
      title: '股票',
      dataIndex: 'symbol',
      width: 140,
      fixed: 'left',
      render: (sym, r) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
            {r.name || sym}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>
            {sym}{r.sector ? ` · ${r.sector}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: '数量',
      dataIndex: 'shares',
      width: 80,
      align: 'right',
      sorter: (a, b) => b.shares - a.shares,
      render: (v: number) => (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {v.toLocaleString()}
        </span>
      ),
    },
    {
      title: '成本价',
      dataIndex: 'costPrice',
      width: 80,
      align: 'right',
      render: (v: number) => (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {v.toFixed(2)}
        </span>
      ),
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      width: 100,
      align: 'right',
      render: (v: number, r) => (
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>
            {v.toFixed(2)}
          </span>
          {r.entryDate && (
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
              {timeAgoLabel(r.entryDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '市值',
      key: 'marketValue',
      width: 90,
      align: 'right',
      sorter: (a, b) => (b.shares * b.currentPrice) - (a.shares * a.currentPrice),
      render: (_, r) => {
        const mv = r.shares * r.currentPrice;
        return (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {mv >= 10000 ? `¥${(mv / 10000).toFixed(1)}万` : `¥${mv.toFixed(0)}`}
          </span>
        );
      },
    },
    {
      title: '盈亏额',
      dataIndex: 'pnlAmount',
      width: 90,
      align: 'right',
      sorter: (a, b) => b.pnlAmount - a.pnlAmount,
      render: (v: number) => (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 600,
          color: v >= 0 ? 'var(--color-profit)' : 'var(--color-loss)',
        }}>
          {v >= 0 ? '+' : ''}{Math.abs(v) >= 10000 ? `${(v / 10000).toFixed(1)}万` : v.toFixed(0)}
        </span>
      ),
    },
    {
      title: '盈亏比(%)',
      dataIndex: 'pnlPct',
      width: 90,
      align: 'right',
      sorter: (a, b) => b.pnlPct - a.pnlPct,
      render: (pct: number) => (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          fontWeight: 700,
          color: pct >= 0 ? 'var(--color-profit)' : 'var(--color-loss)',
        }}>
          {pct >= 0 ? '+' : ''}{(pct * 100).toFixed(2)}%
        </span>
      ),
    },
    {
      title: 'Agent 信号',
      dataIndex: 'agentSignal',
      width: 80,
      align: 'center',
      render: (sig: string | null) => {
        if (!sig) return <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>-</span>;
        const cfg = SIGNAL_CONFIG[sig];
        return (
          <Tag
            icon={cfg?.icon}
            style={{
              borderColor: 'transparent',
              background: `${cfg?.color}22`,
              color: cfg?.color,
              fontSize: 11,
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {cfg?.label}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Tooltip title="分析详情">
            <Button
              size="small"
              type="text"
              icon={<Eye size={13} />}
              style={{ color: 'var(--color-text-tertiary)' }}
            />
          </Tooltip>
          <Tooltip title="编辑持仓">
            <Button
              size="small"
              type="text"
              icon={<Pencil size={13} />}
              onClick={(e) => { e.stopPropagation(); onEdit?.(r); }}
              style={{ color: 'var(--color-accent-blue)' }}
            />
          </Tooltip>
          <Popconfirm
            title={`确认删除 ${r.name || r.symbol}？`}
            description="删除后不可恢复"
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={(e) => { e?.stopPropagation(); onDelete?.(r); }}
            onCancel={(e) => e?.stopPropagation()}
          >
            <Tooltip title="删除持仓">
              <Button
                size="small"
                type="text"
                icon={<Trash2 size={13} />}
                onClick={(e) => e.stopPropagation()}
                style={{ color: '#FF4D6A' }}
              />
            </Tooltip>
          </Popconfirm>
          <Tooltip title="发送至驾驶舱">
            <Button
              size="small"
              type="text"
              icon={<Send size={13} />}
              onClick={() => onSendToCockpit?.(r)}
              style={{ color: 'var(--color-accent-blue)' }}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // 空状态引导
  const emptyState = (
    <Empty
      description={
        <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>
          <div style={{ marginBottom: 8 }}>暂无持仓数据</div>
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={onAdd}
            style={{ background: 'var(--color-accent-blue)' }}
          >
            点击添加持仓
          </Button>
        </div>
      }
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
  );

  return (
    <div>
      {/* 表头区域：标题 + 添加按钮 */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>持仓明细</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {holdings.length > 0 ? `${holdings.length} 支持仓` : ''}
          </span>
        </div>
        {holdings.length > 0 && (
          <Button
            size="small"
            icon={<Plus size={13} />}
            onClick={onAdd}
            style={{ color: 'var(--color-accent-blue)', borderColor: 'rgba(108,99,255,0.4)' }}
          >
            添加持仓
          </Button>
        )}
      </div>

      <Table<Holding>
        columns={columns}
        dataSource={holdings}
        rowKey="id"
        size="small"
        scroll={{ x: 900 }}
        pagination={false}
        locale={{ emptyText: emptyState }}
        expandable={holdings.length > 0 ? {
          expandedRowKeys: expandedRows,
          onExpand: (expanded, r) => {
            setExpandedRows(expanded ? [r.id] : []);
          },
          expandedRowRender: (r) => (
            <div style={{ padding: '10px 20px', background: 'var(--color-bg-elevated)', borderRadius: 6, margin: '4px 0' }}>
              <div style={{ display: 'flex', gap: 32 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>持股数量</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>
                    {r.shares.toLocaleString()} 股
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>建仓日期</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{r.entryDate || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>市值</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                    ¥{((r.shares * r.currentPrice) / 10000).toFixed(1)}万
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>权重</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{r.weight.toFixed(2)}%</div>
                </div>
                {r.notes && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>备注</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{r.notes}</div>
                  </div>
                )}
              </div>
            </div>
          ),
        } : undefined}
      />
    </div>
  );
}
