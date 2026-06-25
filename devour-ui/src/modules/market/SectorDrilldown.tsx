/**
 * SectorDrilldown — 板块下钻抽屉
 *
 * 点击热力图板块 → 展开该板块个股列表
 * 个股列表支持排序（涨跌幅、成交量）
 * 点击个股 → 显示简要详情弹窗
 */

import React, { useMemo, useState } from 'react';
import { Drawer, Modal, Table, Tag, Button, Select, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowUp, ArrowDown, X, ArrowUpDown } from 'lucide-react';
import type { HeatmapNode } from '../../types/market';

interface SectorDrilldownProps {
  open: boolean;
  sector: string | null;
  stocks: HeatmapNode[];
  onClose: () => void;
}

type SortField = 'changeRate' | 'volume' | 'marketCap' | 'turnoverRate';
type SortOrder = 'asc' | 'desc';

const StockDetailModal: React.FC<{
  stock: HeatmapNode | null;
  open: boolean;
  onClose: () => void;
}> = ({ stock, open, onClose }) => {
  if (!stock) return null;
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={380}
      title={null}
      closable
      styles={{
        content: { background: '#1E2335', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 },
        header: { background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.06)' },
        body: { padding: '16px 20px' },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F2F7', fontFamily: "'JetBrains Mono', monospace" }}>
              {stock.name}
            </div>
            <div style={{ fontSize: 12, color: '#8B92A5' }}>{stock.symbol} · {stock.sector}</div>
          </div>
          <Tag
            style={{
              fontSize: 16,
              fontWeight: 700,
              padding: '4px 12px',
              border: 'none',
              background: stock.changeRate >= 0 ? 'rgba(0,200,150,0.12)' : 'rgba(255,77,106,0.12)',
              color: stock.changeRate >= 0 ? '#00C896' : '#FF4D6A',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {stock.changeRate >= 0 ? '+' : ''}{(stock.changeRate * 100).toFixed(2)}%
          </Tag>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: '现价', value: `¥${stock.price.toFixed(2)}`, color: '#F0F2F7' },
            { label: '成交量', value: `${stock.volume.toFixed(1)}万手`, color: '#F0F2F7' },
            { label: '流通市值', value: `${stock.marketCap.toFixed(1)}亿`, color: '#F0F2F7' },
            { label: '换手率', value: `${(stock.turnoverRate * 100).toFixed(2)}%`, color: stock.turnoverRate > 0.05 ? '#F5A623' : '#F0F2F7' },
          ].map((item) => (
            <div key={item.label} style={{ padding: '8px 10px', background: '#171B26', borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: '#4E5568', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* 简易K线占位（后端API接入后替换） */}
        <div style={{
          height: 120,
          background: '#171B26',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4E5568',
          fontSize: 12,
        }}>
          K线图表 · API 对接后渲染
        </div>
      </div>
    </Modal>
  );
};

export const SectorDrilldown: React.FC<SectorDrilldownProps> = ({
  open,
  sector,
  stocks,
  onClose,
}) => {
  const [sortField, setSortField] = useState<SortField>('changeRate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [detailStock, setDetailStock] = useState<HeatmapNode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const sorted = useMemo(() => {
    return [...stocks].sort((a, b) => {
      const diff = a[sortField] - b[sortField];
      return sortOrder === 'asc' ? diff : -diff;
    });
  }, [stocks, sortField, sortOrder]);

  const columns: ColumnsType<HeatmapNode> = [
    {
      title: '股票',
      dataIndex: 'symbol',
      width: 120,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#F0F2F7' }}>{r.name}</div>
          <div style={{ fontSize: 11, color: '#4E5568', fontFamily: "'JetBrains Mono', monospace" }}>{r.symbol}</div>
        </div>
      ),
    },
    {
      title: '现价',
      dataIndex: 'price',
      width: 80,
      align: 'right',
      render: (v: number) => (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#F0F2F7' }}>
          ¥{v.toFixed(2)}
        </span>
      ),
    },
    {
      title: '涨跌幅',
      dataIndex: 'changeRate',
      width: 90,
      align: 'right',
      render: (v: number) => (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          fontWeight: 600,
          color: v >= 0 ? '#00C896' : '#FF4D6A',
        }}>
          {v >= 0 ? '+' : ''}{(v * 100).toFixed(2)}%
          {v >= 0 ? <ArrowUp size={11} style={{ marginLeft: 2, verticalAlign: 'middle' }} /> : <ArrowDown size={11} style={{ marginLeft: 2, verticalAlign: 'middle' }} />}
        </span>
      ),
    },
    {
      title: '成交量',
      dataIndex: 'volume',
      width: 80,
      align: 'right',
      render: (v: number) => (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#8B92A5' }}>
          {v.toFixed(0)}万
        </span>
      ),
    },
    {
      title: '操作',
      width: 60,
      render: (_, r) => (
        <Button
          size="small"
          type="text"
          onClick={() => { setDetailStock(r); setDetailOpen(true); }}
          style={{ fontSize: 11, color: '#A78BFA' }}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={sector ? `${sector} · 板块个股` : '板块个股'}
        width={480}
        placement="right"
        styles={{
          header: { background: '#171B26', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' },
          body: { background: '#0F1117', padding: 0 },
          wrapper: {},
        }}
        extra={
          <Space size={8}>
            <span style={{ fontSize: 11, color: '#4E5568' }}>排序:</span>
            <Select
              size="small"
              value={sortField}
              onChange={setSortField}
              options={[
                { label: '涨跌幅', value: 'changeRate' },
                { label: '成交量', value: 'volume' },
                { label: '市值', value: 'marketCap' },
                { label: '换手率', value: 'turnoverRate' },
              ]}
              style={{ width: 88 }}
            />
            <Button
              size="small"
              type="text"
              icon={<ArrowUpDown size={12} />}
              onClick={() => setSortOrder((o) => o === 'asc' ? 'desc' : 'asc')}
              style={{ color: sortOrder === 'desc' ? '#A78BFA' : '#8B92A5', fontSize: 11 }}
            >
              {sortOrder === 'desc' ? '降序' : '升序'}
            </Button>
          </Space>
        }
      >
        <Table<HeatmapNode>
          columns={columns}
          dataSource={sorted}
          rowKey="symbol"
          size="small"
          pagination={false}
          scroll={{ y: 'calc(100vh - 160px)' }}
          style={{
            '--ant-table-header-bg': '#1E2335',
            '--ant-table-body-bg': '#0F1117',
          } as any}
        />
      </Drawer>

      <StockDetailModal
        stock={detailStock}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailStock(null); }}
      />
    </>
  );
};