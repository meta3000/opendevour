/**
 * 持仓管理模块 - 主页面
 * 布局：顶部工具栏 + 概览KPI + 左侧持仓表格 + 右侧分析面板
 * 增强：持仓导入/添加/编辑/删除 + 风险仪表盘动画 + 交易时间线视图 + 静默现价刷新
 */
import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Divider, Tooltip, message } from 'antd';
import { Upload, RefreshCw, Send, Briefcase, History } from 'lucide-react';
import HoldingsTable from './HoldingsTable';
import AnalysisPanel from './AnalysisPanel';
import { HoldingImportModal } from './HoldingImportModal';
import { AddPositionModal } from './AddPositionModal';
import { EditPositionModal } from './EditPositionModal';
import { TradeTimeline } from './TradeTimeline';
import { PortfolioSelector } from './PortfolioSelector';
import { AnimatedMetricCard } from '../../components/AnimatedMetricCard';
import type { Holding, RiskMetrics as RiskMetricsType } from '../../types/portfolio';
import { getHoldings, getRiskMetrics, refreshPrices, deletePosition, sendPortfolioToCockpit } from '../../api/portfolio.api';
import { mockRiskMetrics } from '../../mock/portfolio.mock';

const defaultRisk = mockRiskMetrics;

export default function Portfolio() {
  const [refreshing, setRefreshing] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [kpiKey, setKpiKey] = useState(0); // 用于触发动画重播
  const [currentPortfolioId, setCurrentPortfolioId] = useState<number>(1); // 当前选中的组合ID
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [risk, setRisk] = useState<RiskMetricsType>(defaultRisk);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [h, r] = await Promise.all([
        getHoldings(currentPortfolioId),
        getRiskMetrics(currentPortfolioId)
      ]);
      setHoldings(h);
      setRisk(r);
    } catch {
      // fallback to defaults — API layer already handles mock
    } finally {
      setLoading(false);
    }
  }, [currentPortfolioId]);

  useEffect(() => {
    fetchData();
    // 页面加载时静默刷新价格（不显示 loading，失败不影响展示）
    refreshPrices(currentPortfolioId).catch(() => {});
  }, [fetchData, currentPortfolioId]);

  const r = risk;

  const KPI_ITEMS = [
    {
      label: '组合净值',
      value: `¥${(r.navValue / 10000).toFixed(0)}万`,
      color: 'var(--color-text-primary)',
    },
    {
      label: '今日收益',
      value: `${r.todayReturn >= 0 ? '+' : ''}${(r.todayReturn * 100).toFixed(2)}%`,
      color: r.todayReturn >= 0 ? 'var(--color-profit)' : 'var(--color-loss)',
    },
    {
      label: '年化收益(YTD)',
      value: `${r.ytdReturn >= 0 ? '+' : ''}${(r.ytdReturn * 100).toFixed(2)}%`,
      color: r.ytdReturn >= 0 ? 'var(--color-profit)' : 'var(--color-loss)',
    },
    {
      label: '超额收益 α',
      value: `${r.alphaReturn >= 0 ? '+' : ''}${(r.alphaReturn * 100).toFixed(2)}%`,
      color: r.alphaReturn >= 0 ? 'var(--color-profit)' : 'var(--color-loss)',
    },
    {
      label: '夏普比率',
      value: r.sharpeRatio.toFixed(2),
      color: r.sharpeRatio >= 1.5 ? 'var(--color-profit)' : 'var(--color-text-primary)',
    },
    {
      label: '最大回撤',
      value: `${(r.maxDrawdown * 100).toFixed(2)}%`,
      color: 'var(--color-loss)',
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    setKpiKey((k) => k + 1); // 触发 KPI 动画重播
    try {
      await refreshPrices();
      await fetchData();
      message.success('持仓数据已同步');
    } catch {
      message.error('同步失败，请稍后重试');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendToCockpit = (holding: Holding) => {
    message.success(`${holding.name} 已发送至驾驶舱进行分析`);
  };

  const handleImport = (holdings: Partial<Holding>[]) => {
    message.success(`已导入 ${holdings.length} 条持仓记录`);
    setKpiKey((k) => k + 1);
    fetchData();
  };

  const handleAddSuccess = (_holding: Holding) => {
    setKpiKey((k) => k + 1);
    fetchData();
  };

  const handleEditSuccess = (_updated: Holding) => {
    setKpiKey((k) => k + 1);
    fetchData();
  };

  const handleDelete = async (holding: Holding) => {
    try {
      await deletePosition(currentPortfolioId, holding.id);
      message.success(`${holding.name || holding.symbol} 已删除`);
      setKpiKey((k) => k + 1);
      fetchData();
    } catch {
      message.error('删除失败，请稍后重试');
    }
  };

  const handleEdit = (holding: Holding) => {
    setEditingHolding(holding);
    setEditOpen(true);
  };

  const handleSendAllToCockpit = async () => {
    try {
      await sendPortfolioToCockpit();
      message.success('组合整体已发送至驾驶舱，Agent 正在分析...');
    } catch {
      message.error('发送失败，请稍后重试');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Topbar */}
      <div
        style={{
          height: 52,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0,
          background: 'var(--color-bg-base)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Briefcase size={16} color="var(--color-accent-blue)" />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>持仓管理</span>
          <PortfolioSelector value={currentPortfolioId} onChange={setCurrentPortfolioId} />
          <Divider type="vertical" style={{ borderColor: 'var(--color-border-subtle)', margin: '0 4px' }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {holdings.length} 支持仓 · {loading ? '加载中...' : '已同步'}
          </span>
        </div>

        <Space size={8}>
          <Tooltip title="导入持仓文件">
            <Button
              size="small"
              icon={<Upload size={13} />} 
              onClick={() => setImportOpen(true)}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              导入持仓
            </Button>
          </Tooltip>
          <Tooltip title="查看交易时间线">
            <Button
              size="small"
              icon={<History size={13} />}
              onClick={() => setTimelineOpen(true)}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              交易记录
            </Button>
          </Tooltip>
          <Tooltip title="同步券商实时数据">
            <Button
              size="small"
              icon={<RefreshCw size={13} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />}
              onClick={handleRefresh}
              loading={refreshing}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              同步券商
            </Button>
          </Tooltip>
          <Button
            size="small"
            type="primary"
            icon={<Send size={13} />}
            onClick={() => message.success('组合整体已发送至驾驶舱，Agent 正在分析...')}
            style={{ background: 'var(--color-accent-blue)' }}
          >
            发送至驾驶舱
          </Button>
        </Space>
      </div>

      {/* KPI 概览条 — 带计数动画 */}
      <div
        key={kpiKey}
        className="chart-fade-in"
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          gap: 24,
          flexShrink: 0,
          background: 'var(--color-bg-base)',
          overflowX: 'auto',
        }}
      >
        {KPI_ITEMS.map((k) => (
          <div key={k.label} style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{k.label}</div>
            <div style={{ fontSize: 16, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* 主内容：持仓表格 + 右侧分析 */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* 持仓表格（左侧） */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            minWidth: 0,
          }}
        >
          <div
            style={{
              background: 'var(--color-bg-surface)',
              borderRadius: 8,
              border: '1px solid var(--color-border-subtle)',
              padding: 16,
            }}
          >
            <HoldingsTable
                holdings={holdings}
                onSendToCockpit={handleSendToCockpit}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={() => setAddOpen(true)}
              />
          </div>
        </div>

        {/* 右侧分析 */}
        <AnalysisPanel riskMetrics={risk} />
      </div>

      {/* 持仓导入弹窗 */}
      <HoldingImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        portfolioId={currentPortfolioId}
      />

      {/* 添加持仓弹窗 */}
      <AddPositionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={handleAddSuccess}
        portfolioId={currentPortfolioId}
      />

      {/* 编辑持仓弹窗 */}
      <EditPositionModal
        open={editOpen}
        holding={editingHolding}
        onClose={() => { setEditOpen(false); setEditingHolding(null); }}
        onSuccess={handleEditSuccess}
      />

      {/* 交易时间线抽屉 */}
      <TradeTimeline
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
      />
    </div>
  );
}
