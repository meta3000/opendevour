/**
 * 市场发现模块 - 主页面
 * 布局：顶部工具栏 + 上半部分（热力图 + 板块/资金侧边）+ 下半部分（信号表）
 * 增强：热力图板块下钻、信号实时更新指示器、过滤器预设保存
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Button, Select, Space, Tooltip, Divider, message, Tag, Drawer, Table, Modal } from 'antd';
import { RefreshCw, Layers, Send, Clock, Bookmark, BookmarkPlus } from 'lucide-react';
import HeatmapChart from './HeatmapChart';
import SectorRadar from './SectorRadar';
import CapitalFlow from './CapitalFlow';
import SignalTable from './SignalTable';
import { SectorDrilldown } from './SectorDrilldown';
import type { HeatmapNode, MarketSignal } from '../../types/market';

const STRATEGIES = [
  { label: '多因子选股V2', value: 'multi_factor_v2' },
  { label: '技术形态识别', value: 'technical_pattern' },
  { label: '基本面突破', value: 'fundamental_breakout' },
  { label: '事件驱动', value: 'event_driven' },
  { label: '板块轮动', value: 'sector_rotation' },
];

const TIME_RANGES = [
  { label: '今日', value: '1d' },
  { label: '本周', value: '5d' },
  { label: '本月', value: '20d' },
  { label: '近3月', value: '60d' },
];

// ---- 过滤器预设持久化 ----
const FILTER_PRESET_KEY = 'alpha-agent-market-filter-presets';

export interface FilterPreset {
  id: string;
  name: string;
  typeFilter: string;
  directionFilter: string;
  strategy: string;
  timeRange: string;
}

const loadPresets = (): FilterPreset[] => {
  try {
    const raw = localStorage.getItem(FILTER_PRESET_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const savePresets = (presets: FilterPreset[]) => {
  try { localStorage.setItem(FILTER_PRESET_KEY, JSON.stringify(presets)); } catch {}
};

export default function MarketDiscovery() {
  const [strategy, setStrategy] = useState('multi_factor_v2');
  const [timeRange, setTimeRange] = useState('1d');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // ---- 板块下钻 ----
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownSector, setDrilldownSector] = useState<string | null>(null);
  const [drilldownStocks, setDrilldownStocks] = useState<HeatmapNode[]>([]);

  // ---- 信号实时更新指示器 ----
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [newSignalCount, setNewSignalCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval>>();

  // ---- 过滤器预设 ----
  const [presets, setPresets] = useState<FilterPreset[]>(loadPresets);
  const [presetName, setPresetName] = useState('');

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdateTime(Date.now());
      setNewSignalCount(0);
      message.success('信号已更新');
    }, 1200);
  }, []);

  // 自动刷新
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        handleRefresh();
        setNewSignalCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
      }, 30000);
    } else {
      clearInterval(autoRefreshRef.current);
    }
    return () => clearInterval(autoRefreshRef.current);
  }, [autoRefresh, handleRefresh]);

  // 模拟新信号到达
  useEffect(() => {
    const timer = setInterval(() => {
      setNewSignalCount((prev) => prev + Math.random() > 0.7 ? 1 : 0);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleNodeClick = (node: HeatmapNode) => {
    setSelectedSymbol(node.symbol);
    // 打开板块下钻，当前点击节点作为该板块代表展示
    setDrilldownSector(node.sector);
    setDrilldownStocks([node]);
    setDrilldownOpen(true);
    message.info(`已选中 ${node.name}(${node.symbol})，可发送至驾驶舱进行深度分析`);
  };

  const handleSendToCockpit = (signal: MarketSignal) => {
    message.success(`信号 ${signal.name} 已发送至驾驶舱`);
  };

  // ---- 过滤器预设操作 ----
  const handleSavePreset = () => {
    const name = presetName.trim() || `预设 ${presets.length + 1}`;
    const preset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      typeFilter: 'all',
      directionFilter: 'all',
      strategy,
      timeRange,
    };
    const next = [...presets, preset];
    setPresets(next);
    savePresets(next);
    setPresetName('');
    message.success(`已保存过滤预设「${name}」`);
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    setStrategy(preset.strategy);
    setTimeRange(preset.timeRange);
    message.success(`已应用预设「${preset.name}」`);
  };

  const handleDeletePreset = (id: string) => {
    const next = presets.filter(p => p.id !== id);
    setPresets(next);
    savePresets(next);
    message.success('已删除预设');
  };

  const formatLastUpdate = (ts: number) => {
    const diff = Date.now() - ts;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}秒前`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟前`;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={16} color="var(--color-accent-blue)" />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>市场发现</span>
          <Divider type="vertical" style={{ borderColor: 'var(--color-border-subtle)', margin: '0 4px' }} />
          {/* 最后更新时间指示器 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} color="var(--color-text-tertiary)" />
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              更新于 {formatLastUpdate(lastUpdateTime)}
            </span>
            {newSignalCount > 0 && (
              <Tag
                className="signal-pulse-dot"
                style={{
                  fontSize: 10,
                  margin: 0,
                  padding: '0 6px',
                  background: 'rgba(108,99,255,0.15)',
                  color: '#A78BFA',
                  border: '1px solid rgba(108,99,255,0.3)',
                  borderRadius: 10,
                }}
              >
                +{newSignalCount}
              </Tag>
            )}
          </div>
        </div>

        <Space size={8}>
          {/* 过滤器预设 */}
          {presets.length > 0 && (
            <Select
              size="small"
              placeholder="快速预设"
              style={{ width: 100 }}
              options={presets.map(p => ({ label: p.name, value: p.id }))}
              onChange={(id) => {
                const preset = presets.find(p => p.id === id);
                if (preset) handleApplyPreset(preset);
              }}
              popupRender={(menu) => (
                <div>
                  {menu}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 8px' }}>
                    {presets.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                        <span style={{ fontSize: 11, color: '#8B92A5' }}>{p.name}</span>
                        <Button size="small" type="text" danger onClick={() => handleDeletePreset(p.id)} style={{ fontSize: 10 }}>
                          删除
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            />
          )}
          <Tooltip title="保存当前过滤条件为预设">
            <Button
              size="small"
              icon={<BookmarkPlus size={13} />}
              onClick={handleSavePreset}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              保存预设
            </Button>
          </Tooltip>
          <Select
            size="small"
            value={strategy}
            onChange={setStrategy}
            style={{ width: 130 }}
            options={STRATEGIES}
            prefix={<span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>策略:</span>}
          />
          <Select
            size="small"
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 80 }}
            options={TIME_RANGES}
          />
          <Tooltip title="刷新信号">
            <Button
              size="small"
              icon={<RefreshCw size={13} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />}
              onClick={handleRefresh}
              loading={refreshing}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              刷新
            </Button>
          </Tooltip>
          {/* 自动刷新按钮 */}
          <Button
            size="small"
            type={autoRefresh ? 'primary' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              fontSize: 11,
              background: autoRefresh ? 'rgba(108,99,255,0.15)' : 'transparent',
              borderColor: autoRefresh ? 'rgba(108,99,255,0.35)' : 'rgba(255,255,255,0.12)',
              color: autoRefresh ? '#A78BFA' : '#8B92A5',
            }}
          >
            {autoRefresh ? '自动刷新中' : '自动刷新'}
          </Button>
          {selectedSymbol && (
            <Button
              size="small"
              type="primary"
              icon={<Send size={13} />}
              onClick={() => {
                message.success(`${selectedSymbol} 已发送至驾驶舱`);
                setSelectedSymbol(null);
              }}
              style={{ background: 'var(--color-accent-blue)' }}
            >
              发送至驾驶舱
            </Button>
          )}
        </Space>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* 上半部分：热力图 + 侧边栏 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {/* 热力图（左，主要区域） */}
          <div
            style={{
              flex: '1 1 0',
              background: 'var(--color-bg-surface)',
              borderRadius: 8,
              border: '1px solid var(--color-border-subtle)',
              padding: 16,
              minWidth: 0,
            }}
          >
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>市场全景热力图</span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 11 }}>
                <span style={{ color: '#00C896' }}>■ 上涨</span>
                <span style={{ color: '#4A5568' }}>■ 平稳</span>
                <span style={{ color: '#FF4D6A' }}>■ 下跌</span>
                <span style={{ color: 'var(--color-text-tertiary)' }}>面积=市值</span>
                <span style={{ color: '#A78BFA', fontSize: 10 }}>点击板块可下钻</span>
              </div>
            </div>
            <HeatmapChart onNodeClick={handleNodeClick} />
          </div>

          {/* 右侧：板块轮动 + 资金流向 */}
          <div
            style={{
              width: 320,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
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
              <SectorRadar />
            </div>

            <div
              style={{
                background: 'var(--color-bg-surface)',
                borderRadius: 8,
                border: '1px solid var(--color-border-subtle)',
                padding: 16,
              }}
            >
              <CapitalFlow />
            </div>
          </div>
        </div>

        {/* 下半部分：信号扫描表格 */}
        <div
          style={{
            background: 'var(--color-bg-surface)',
            borderRadius: 8,
            border: '1px solid var(--color-border-subtle)',
            padding: 16,
          }}
        >
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>信号扫描列表</span>
              {newSignalCount > 0 && (
                <Tag className="signal-pulse-dot" style={{
                  fontSize: 10,
                  margin: 0,
                  background: 'rgba(108,99,255,0.15)',
                  color: '#A78BFA',
                  border: '1px solid rgba(108,99,255,0.3)',
                  borderRadius: 10,
                }}>
                  {newSignalCount} 条新信号
                </Tag>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              策略: {STRATEGIES.find((s) => s.value === strategy)?.label} · 时间窗口: {TIME_RANGES.find((t) => t.value === timeRange)?.label}
            </span>
          </div>
          <SignalTable onSendToCockpit={handleSendToCockpit} presets={presets} onSavePreset={handleSavePreset} />
        </div>
      </div>

      {/* 板块下钻抽屉 */}
      <SectorDrilldown
        open={drilldownOpen}
        sector={drilldownSector}
        stocks={drilldownStocks}
        onClose={() => { setDrilldownOpen(false); setDrilldownSector(null); }}
      />
    </div>
  );
}