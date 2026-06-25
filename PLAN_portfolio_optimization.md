# AlphaAgent 持仓管理优化计划

## Context（背景）

根据三位研究员的深度分析，发现持仓管理模块存在以下核心问题需要解决：

1. **Bug修复**：前端导入和新增持仓功能无法正常工作，后端API报错
2. **投资组合概念缺失**：当前系统只有一个默认组合（硬编码portfolioId=1），不支持多组合管理
3. **股票数据缺失**：新建持仓时需要手动输入股票代码，没有从Tushare同步的股票列表供选择

### 当前问题分析

**后端问题：**
- `datetime.utcnow()` 在 Python 3.13+ 已弃用（H-2）
- Portfolio 模型缺少 `(portfolio_id, symbol)` 唯一约束（M-9）
- Position 表允许同一组合中重复添加同一只股票
- Tushare适配器性能问题：每次行情查询都附带全量股票名称查询（M-1）

**前端问题：**
- 导入弹窗的 `handleConfirmImport` 调用的是 Mock 回调而非真实 API（BUG-H5类似）
- AddPositionModal 使用硬编码 portfolioId=1
- Portfolio.tsx 顶部"发送至驾驶舱"按钮未调用真实API（BUG-M4）
- 页面加载时双重请求（BUG-M7）
- 所有持仓操作硬编码 portfolioId=1，不支持多组合切换

---

## 实施计划

### Phase 1: Bug修复（高优先级）

#### Task 1.1: 修复后端 datetime.utcnow() 弃用警告

**文件**: `/home/wang/workspace/opendevour/devour-service/src/devour_service/models/portfolio.py`

**修改内容**:
```python
from datetime import datetime, timezone

# 将所有 datetime.utcnow() 替换为 datetime.now(timezone.utc)
created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), comment="创建时间")
updated_at = Column(
    DateTime, 
    default=lambda: datetime.now(timezone.utc), 
    onupdate=lambda: datetime.now(timezone.utc), 
    comment="更新时间"
)
```

**影响范围**:
- `models/portfolio.py`: Portfolio、Position、Transaction 三个模型的时间戳字段
- `services/portfolio_service.py`: 第122行、176行、361行的手动更新

---

#### Task 1.2: 为 Position 表添加唯一约束

**文件**: `/home/wang/workspace/opendevour/devour-service/src/devour_service/models/portfolio.py`

**修改内容**:
```python
from sqlalchemy import UniqueConstraint

class Position(Base):
    __tablename__ = "positions"
    
    __table_args__ = (
        UniqueConstraint('portfolio_id', 'symbol', name='uq_portfolio_symbol'),
    )
    
    # ... 现有字段保持不变
```

**数据库迁移脚本**:
创建 `/home/wang/workspace/opendevour/devour-service/scripts/migrate_add_unique_constraint.sql`:
```sql
-- 先删除可能的重复数据
DELETE FROM positions 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM positions 
    GROUP BY portfolio_id, symbol
);

-- 添加唯一约束
ALTER TABLE positions ADD CONSTRAINT uq_portfolio_symbol UNIQUE (portfolio_id, symbol);
```

---

#### Task 1.3: 修复前端导入功能

**文件**: `/home/wang/workspace/opendevour/devour-ui/src/modules/portfolio/HoldingImportModal.tsx`

**问题**: 第236-244行的 `handleConfirmImport` 仅调用父组件传入的 `onImport` 回调（Mock行为），未调用真实API

**修改内容**:
```typescript
import { importPositions } from '../../api/portfolio.api';

// 新增 props
interface HoldingImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (holdings: Partial<Holding>[]) => void;
  portfolioId?: number; // 新增
}

const handleConfirmImport = async () => {
  if (mappedHoldings.length === 0) {
    message.warning('没有可导入的数据');
    return;
  }
  
  try {
    const result = await importPositions(portfolioId || 1, mappedHoldings.map(h => ({
      symbol: h.symbol!,
      name: h.name || '',
      quantity: h.shares || 0,
      avg_cost: h.costPrice || 0,
      current_price: h.currentPrice || 0,
      sector: h.sector || '',
    })));
    
    message.success(`成功导入 ${result.imported} 条持仓，跳过 ${result.skipped} 条`);
    if (result.errors.length > 0) {
      console.warn('导入错误:', result.errors);
    }
    
    // 转换回前端格式并通知父组件
    onImport(mappedHoldings);
    handleReset();
    onClose();
  } catch (err: any) {
    message.error(`导入失败：${err?.message || '未知错误'}`);
  }
};
```

**同步修改 Portfolio.tsx**:
```typescript
// 第272-276行，传递 portfolioId
<HoldingImportModal
  open={importOpen}
  onClose={() => setImportOpen(false)}
  onImport={handleImport}
  portfolioId={currentPortfolioId} // 新增
/>
```

---

#### Task 1.4: 修复 Portfolio.tsx 的双重请求和硬编码问题

**文件**: `/home/wang/workspace/opendevour/devour-ui/src/modules/portfolio/Portfolio.tsx`

**修改内容**:
```typescript
// 1. 添加当前组合状态
const [currentPortfolioId, setCurrentPortfolioId] = useState<number>(1);

// 2. 修复 fetchData，使用当前组合ID
const fetchData = useCallback(async () => {
  try {
    const [h, r] = await Promise.all([
      getHoldings(currentPortfolioId),
      getRiskMetrics(currentPortfolioId)
    ]);
    setHoldings(h);
    setRisk(r);
  } catch {
    // fallback to defaults
  } finally {
    setLoading(false);
  }
}, [currentPortfolioId]); // 添加依赖

// 3. 修复 useEffect，移除双重请求
useEffect(() => {
  fetchData();
  // 静默刷新价格（不阻塞UI）
  refreshPrices(currentPortfolioId).catch(() => {});
}, [fetchData, currentPortfolioId]);

// 4. 修复删除操作的硬编码
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

// 5. 修复顶部按钮调用真实API
<Button
  size="small"
  type="primary"
  icon={<Send size={13} />}
  onClick={handleSendAllToCockpit} // 改为调用真实函数
  style={{ background: 'var(--color-accent-blue)' }}
>
  发送至驾驶舱
</Button>
```

---

### Phase 2: 实现投资组合管理（中优先级）

#### Task 2.1: 后端 - 完善组合CRUD接口

**现状**: 后端已有完整的组合CRUD接口（`/api/portfolios`），但前端未使用

**需要补充的接口**:
```python
# /home/wang/workspace/opendevour/devour-service/src/devour_service/api/v1/portfolio.py

@router.get("/default", response_model=ApiResponse)
async def get_default_portfolio(db: AsyncSession = _db_dep) -> ApiResponse:
    """获取或创建默认组合（用于向后兼容）。"""
    portfolios = await portfolio_service.list_portfolios(db)
    if not portfolios:
        # 自动创建默认组合
        from ...schemas.portfolio import PortfolioCreate
        p = await portfolio_service.create_portfolio(
            db, 
            PortfolioCreate(name="默认组合", description="系统自动创建的默认组合")
        )
        await db.commit()
        return ok({
            "id": p.id,
            "name": p.name,
            "description": p.description,
        }, message="已创建默认组合")
    
    return ok({
        "id": portfolios[0].id,
        "name": portfolios[0].name,
        "description": portfolios[0].description,
    })
```

---

#### Task 2.2: 前端 - 添加组合选择器组件

**新建文件**: `/home/wang/workspace/opendevour/devour-ui/src/modules/portfolio/PortfolioSelector.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Select, Button, Modal, Form, Input, Space, Divider, message } from 'antd';
import { Plus } from 'lucide-react';
import type { PortfolioDTO } from '../../api/portfolio.api';
import { getPortfolios, createPortfolio, deletePortfolio } from '../../api/portfolio.api';

interface PortfolioSelectorProps {
  value: number;
  onChange: (portfolioId: number) => void;
}

export const PortfolioSelector: React.FC<PortfolioSelectorProps> = ({ value, onChange }) => {
  const [portfolios, setPortfolios] = useState<PortfolioDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    setLoading(true);
    try {
      const data = await getPortfolios();
      setPortfolios(data);
      // 如果当前选中的组合不存在，选中第一个
      if (data.length > 0 && !data.find(p => p.id === value)) {
        onChange(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: { name: string; description?: string }) => {
    try {
      const newPortfolio = await createPortfolio(values);
      await loadPortfolios();
      onChange(newPortfolio.id);
      setCreateModalOpen(false);
      form.resetFields();
    } catch (err: any) {
      message.error(`创建失败：${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (portfolios.length <= 1) {
      message.warning('至少保留一个组合');
      return;
    }
    try {
      await deletePortfolio(id);
      await loadPortfolios();
      if (value === id) {
        onChange(portfolios.find(p => p.id !== id)?.id || portfolios[0].id);
      }
    } catch (err: any) {
      message.error(`删除失败：${err.message}`);
    }
  };

  return (
    <Space>
      <Select
        value={value}
        onChange={onChange}
        loading={loading}
        style={{ width: 180 }}
        options={portfolios.map(p => ({ label: p.name, value: p.id }))}
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <Button
              type="text"
              icon={<Plus size={14} />}
              onClick={() => setCreateModalOpen(true)}
              style={{ width: '100%' }}
            >
              新建组合
            </Button>
          </>
        )}
      />
      
      <Modal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        title="新建投资组合"
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="组合名称" rules={[{ required: true }]}>
            <Input placeholder="如：成长股组合" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="可选" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
```

---

#### Task 2.3: 前端 - 扩展 portfolio.api.ts

**文件**: `/home/wang/workspace/opendevour/devour-ui/src/api/portfolio.api.ts`

**新增接口**:
```typescript
/** 获取所有投资组合 */
export async function getPortfolios(): Promise<PortfolioDTO[]> {
  if (USE_MOCK) {
    return [{ id: 1, name: '默认组合', description: '', created_at: null, updated_at: null }];
  }
  return request<PortfolioDTO[]>('/api/portfolios');
}

/** 创建投资组合 */
export async function createPortfolio(data: { name: string; description?: string }): Promise<PortfolioDTO> {
  if (USE_MOCK) {
    return { id: Date.now(), name: data.name, description: data.description || '', created_at: null, updated_at: null };
  }
  return request<PortfolioDTO>('/api/portfolios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 更新投资组合 */
export async function updatePortfolio(
  portfolioId: number,
  data: { name?: string; description?: string }
): Promise<PortfolioDTO> {
  if (USE_MOCK) {
    return { id: portfolioId, name: data.name || '默认组合', description: data.description || '', created_at: null, updated_at: null };
  }
  return request<PortfolioDTO>(`/api/portfolios/${portfolioId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** 删除投资组合 */
export async function deletePortfolio(portfolioId: number): Promise<void> {
  if (USE_MOCK) return;
  await request<null>(`/api/portfolios/${portfolioId}`, { method: 'DELETE' });
}
```

---

#### Task 2.4: 前端 - 集成组合选择器到 Portfolio.tsx

**文件**: `/home/wang/workspace/opendevour/devour-ui/src/modules/portfolio/Portfolio.tsx`

**修改顶部工具栏**:
```typescript
import { PortfolioSelector } from './PortfolioSelector';

// 在 Topbar 左侧添加组合选择器
<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
  <Briefcase size={16} color="var(--color-accent-blue)" />
  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>持仓管理</span>
  <PortfolioSelector value={currentPortfolioId} onChange={setCurrentPortfolioId} />
  <Divider type="vertical" style={{ borderColor: 'var(--color-border-subtle)', margin: '0 4px' }} />
  <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
    {holdings.length} 支持仓 · {loading ? '加载中...' : '已同步'}
  </span>
</div>
```

---

### Phase 3: 同步Tushare股票列表（中优先级）

#### Task 3.1: 后端 - 添加股票列表接口

**新建文件**: `/home/wang/workspace/opendevour/devour-service/src/devour_service/api/v1/stocks.py`

```python
"""股票基础信息接口。

端点前缀：/api/v1/stocks
"""

from fastapi import APIRouter, Depends, Query

from ...core.response import ApiResponse, ok
from ...datasources import get_datasource

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("", response_model=ApiResponse)
async def list_stocks(
    exchange: str | None = Query(None, description="交易所：SSE/SZSE"),
    keyword: str | None = Query(None, description="搜索关键词（代码或名称）"),
    limit: int = Query(100, ge=1, le=1000),
) -> ApiResponse:
    """获取A股股票列表（从Tushare同步）。"""
    ds = get_datasource()
    
    try:
        stocks = await ds.get_stock_list(exchange=exchange, keyword=keyword, limit=limit)
        return ok(stocks)
    except Exception as exc:
        return ok([], message=f"获取股票列表失败: {exc}")


@router.get("/search", response_model=ApiResponse)
async def search_stocks(
    keyword: str = Query(..., min_length=1, max_length=20, description="搜索关键词"),
    limit: int = Query(20, ge=1, le=100),
) -> ApiResponse:
    """模糊搜索股票（代码或名称）。"""
    ds = get_datasource()
    
    try:
        stocks = await ds.search_stocks(keyword, limit=limit)
        return ok(stocks)
    except Exception as exc:
        return ok([], message=f"搜索失败: {exc}")
```

---

#### Task 3.2: 后端 - 扩展TushareAdapter

**文件**: `/home/wang/workspace/opendevour/devour-service/src/devour_service/datasources/tushare_adapter.py`

**新增方法**:
```python
@async_ttl_cache(maxsize=4, ttl=3600)  # 缓存1小时
async def get_stock_list(
    self, 
    exchange: str | None = None, 
    keyword: str | None = None,
    limit: int = 100
) -> list[dict]:
    """获取A股股票列表。
    
    Args:
        exchange: 交易所过滤（SSE=上海，SZSE=深圳）
        keyword: 关键词过滤（代码或名称）
        limit: 返回数量限制
    
    Returns:
        [{"ts_code": "000001.SZ", "name": "平安银行", "industry": "银行"}, ...]
    """
    logger.info("[Tushare] get_stock_list 开始, exchange=%s, keyword=%s", exchange, keyword)
    pro = self._pro()
    
    try:
        df = await self._run_sync(
            pro.stock_basic,
            exchange=exchange or "",
            list_status="L",  # 仅上市状态正常的股票
            fields="ts_code,name,industry,list_date",
        )
        
        if df is None or df.empty:
            return []
        
        # 关键词过滤
        if keyword:
            mask = df["ts_code"].str.contains(keyword, case=False) | \
                   df["name"].str.contains(keyword, case=False)
            df = df[mask]
        
        # 限制数量
        df = df.head(limit)
        
        result = [
            {
                "ts_code": row["ts_code"],
                "name": row["name"],
                "industry": row.get("industry", ""),
                "list_date": str(row.get("list_date", "")),
            }
            for _, row in df.iterrows()
        ]
        
        logger.info("[Tushare] get_stock_list 完成, 返回 %d 条", len(result))
        return result
        
    except Exception as exc:
        logger.error("获取股票列表失败: %s", exc)
        return []


@async_ttl_cache(maxsize=16, ttl=300)
async def search_stocks(self, keyword: str, limit: int = 20) -> list[dict]:
    """模糊搜索股票。"""
    return await self.get_stock_list(keyword=keyword, limit=limit)
```

---

#### Task 3.3: 后端 - 注册路由

**文件**: `/home/wang/workspace/opendevour/devour-service/src/devour_service/api/router.py`

**修改**:
```python
from .v1 import market, decisions, scheduler, stocks  # 新增 stocks

api_router.include_router(stocks.router)  # 新增
```

---

#### Task 3.4: 前端 - 添加股票搜索API

**新建文件**: `/home/wang/workspace/opendevour/devour-ui/src/api/stocks.api.ts`

```typescript
/**
 * 股票基础信息 API
 */

import type { ApiResponse } from './types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface StockInfo {
  ts_code: string;
  name: string;
  industry?: string;
  list_date?: string;
}

/** 获取股票列表 */
export async function getStockList(params?: {
  exchange?: string;
  keyword?: string;
  limit?: number;
}): Promise<StockInfo[]> {
  if (USE_MOCK) {
    return [
      { ts_code: '000001.SZ', name: '平安银行', industry: '银行' },
      { ts_code: '600519.SH', name: '贵州茅台', industry: '白酒' },
      { ts_code: '300750.SZ', name: '宁德时代', industry: '新能源' },
    ];
  }
  
  const query = new URLSearchParams();
  if (params?.exchange) query.set('exchange', params.exchange);
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.limit) query.set('limit', String(params.limit));
  
  const res = await fetch(`/api/v1/stocks?${query.toString()}`);
  const json: ApiResponse = await res.json();
  return json.data as StockInfo[];
}

/** 搜索股票 */
export async function searchStocks(keyword: string, limit: number = 20): Promise<StockInfo[]> {
  if (USE_MOCK) {
    return getStockList({ keyword, limit });
  }
  
  const res = await fetch(`/api/v1/stocks/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`);
  const json: ApiResponse = await res.json();
  return json.data as StockInfo[];
}
```

---

#### Task 3.5: 前端 - 改造AddPositionModal支持股票搜索

**文件**: `/home/wang/workspace/opendevour/devour-ui/src/modules/portfolio/AddPositionModal.tsx`

**修改内容**:
```typescript
import { AutoComplete } from 'antd';
import { searchStocks } from '../../api/stocks.api';
import type { StockInfo } from '../../api/stocks.api';

// 在组件内部添加搜索状态
const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
const [searching, setSearching] = useState(false);

const handleSearch = async (keyword: string) => {
  if (!keyword || keyword.length < 1) {
    setSearchResults([]);
    return;
  }
  
  setSearching(true);
  try {
    const results = await searchStocks(keyword, 10);
    setSearchResults(results);
  } finally {
    setSearching(false);
  }
};

const handleStockSelect = (value: string, option: any) => {
  form.setFieldsValue({
    symbol: option.ts_code,
    name: option.name,
  });
};

// 替换股票代码输入框
<Form.Item
  label={<span style={LABEL_STYLE}>股票代码</span>}
  name="symbol"
  rules={[{ required: true, message: '请输入或选择股票代码' }]}
>
  <AutoComplete
    options={searchResults.map(s => ({
      value: s.ts_code,
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>{s.ts_code}</div>
          <div style={{ fontSize: 12, color: '#8B92A5' }}>{s.name} · {s.industry || '未知行业'}</div>
        </div>
      ),
      ts_code: s.ts_code,
      name: s.name,
    }))}
    onSearch={handleSearch}
    onSelect={handleStockSelect}
    placeholder="输入代码或名称搜索"
    notFoundContent={searching ? '搜索中...' : '无匹配结果'}
    style={{ background: '#171B26', borderColor: 'rgba(255,255,255,0.12)', color: '#F0F2F7' }}
  />
</Form.Item>
```

---

## 验证方案

### 1. 后端验证

```bash
# 启动后端服务
cd /home/wang/workspace/opendevour/devour-service
uv run python -m devour_service.main

# 测试组合CRUD
curl http://localhost:8000/api/portfolios
curl -X POST http://localhost:8000/api/portfolios -H "Content-Type: application/json" -d '{"name":"测试组合","description":"用于验证"}'

# 测试股票列表
curl "http://localhost:8000/api/v1/stocks?keyword=茅台&limit=5"

# 测试导入持仓
curl -X POST http://localhost:8000/api/portfolios/1/import \
  -H "Content-Type: application/json" \
  -d '{"records":[{"symbol":"600519.SH","name":"贵州茅台","quantity":100,"avg_cost":1500.0}]}'
```

### 2. 前端验证

```bash
# 启动前端开发服务器
cd /home/wang/workspace/opendevour/devour-ui
npm run dev

# 浏览器访问 http://localhost:5173/portfolio

# 验证步骤：
# 1. 页面加载时能看到默认组合的持仓列表
# 2. 点击"新建组合"按钮，创建新组合后能切换
# 3. 点击"添加持仓"，输入"茅台"能搜索到贵州茅台
# 4. 选择股票后提交，持仓列表立即刷新
# 5. 点击"导入持仓"，上传CSV文件，映射字段后能成功导入
# 6. 删除持仓后列表立即更新
# 7. 切换组合后，持仓列表和风险指标同步更新
```

### 3. 数据库验证

```bash
# 检查唯一约束是否生效
sqlite3 /home/wang/workspace/opendevour/devour-service/data/devour.db

# 执行
.schema positions
# 应该看到：CREATE UNIQUE INDEX uq_portfolio_symbol ON positions(portfolio_id, symbol);

# 尝试插入重复数据
INSERT INTO positions (portfolio_id, symbol, quantity, avg_cost) VALUES (1, '600519.SH', 100, 1500.0);
# 第二次执行应该报错：UNIQUE constraint failed
```

---

## 风险评估

| 风险项 | 概率 | 影响 | 缓解措施 |
|--------|------|------|----------|
| 唯一约束导致现有重复数据迁移失败 | 中 | 高 | 迁移脚本先清理重复数据，保留最早记录 |
| Tushare API限流导致股票搜索慢 | 低 | 中 | 已添加1小时缓存，首次加载后后续快速 |
| 前端组合切换时出现闪烁 | 低 | 低 | 使用React Query缓存，切换时显示loading |
| 导入大量持仓时超时 | 低 | 中 | 后端分批插入，前端显示进度条 |

---

## 相关文件清单

### 后端修改
1. `/home/wang/workspace/opendevour/devour-service/src/devour_service/models/portfolio.py` - 修复datetime、添加唯一约束
2. `/home/wang/workspace/opendevour/devour-service/src/devour_service/services/portfolio_service.py` - 修复datetime调用
3. `/home/wang/workspace/opendevour/devour-service/src/devour_service/api/v1/portfolio.py` - 添加默认组合接口
4. `/home/wang/workspace/opendevour/devour-service/src/devour_service/api/v1/stocks.py` - 新建股票列表接口
5. `/home/wang/workspace/opendevour/devour-service/src/devour_service/datasources/tushare_adapter.py` - 添加股票列表方法
6. `/home/wang/workspace/opendevour/devour-service/src/devour_service/api/router.py` - 注册stocks路由
7. `/home/wang/workspace/opendevour/devour-service/scripts/migrate_add_unique_constraint.sql` - 数据库迁移脚本

### 前端修改
1. `/home/wang/workspace/opendevour/devour-ui/src/api/portfolio.api.ts` - 添加组合CRUD接口
2. `/home/wang/workspace/opendevour/devour-ui/src/api/stocks.api.ts` - 新建股票搜索API
3. `/home/wang/workspace/opendevour/devour-ui/src/modules/portfolio/Portfolio.tsx` - 集成组合选择器、修复bug
4. `/home/wang/workspace/opendevour/devour-ui/src/modules/portfolio/PortfolioSelector.tsx` - 新建组合选择器组件
5. `/home/wang/workspace/opendevour/devour-ui/src/modules/portfolio/AddPositionModal.tsx` - 支持股票搜索
6. `/home/wang/workspace/opendevour/devour-ui/src/modules/portfolio/HoldingImportModal.tsx` - 修复导入功能

---

## 实施顺序建议

1. **Phase 1 (Bug修复)** - 1天
   - Task 1.1: datetime修复（30分钟）
   - Task 1.2: 唯一约束（1小时，含数据迁移）
   - Task 1.3: 导入功能修复（2小时）
   - Task 1.4: Portfolio.tsx修复（1小时）

2. **Phase 2 (投资组合)** - 1.5天
   - Task 2.1: 后端默认组合接口（30分钟）
   - Task 2.2: PortfolioSelector组件（3小时）
   - Task 2.3: portfolio.api.ts扩展（1小时）
   - Task 2.4: 集成到Portfolio.tsx（1小时）

3. **Phase 3 (股票列表)** - 1天
   - Task 3.1-3.3: 后端股票接口（3小时）
   - Task 3.4: 前端stocks.api.ts（1小时）
   - Task 3.5: AddPositionModal改造（2小时）

**总计**: 3.5个工作日

---

## 验收标准

✅ 所有高严重度Bug已修复（datetime、唯一约束、导入功能、双重请求）  
✅ 用户可以创建、切换、删除多个投资组合  
✅ 添加持仓时可以通过搜索选择股票，无需手动输入代码  
✅ 导入持仓功能可以正常上传CSV/Excel并写入数据库  
✅ 前后端API路径统一（要么都用`/api/v1/`，要么都不用）  
✅ 所有修改通过手动测试验证  
✅ 数据库迁移脚本可以安全执行（处理重复数据）
