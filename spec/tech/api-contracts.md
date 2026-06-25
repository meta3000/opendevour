# API 接口契约

本文档与 `src/api/` 目录代码保持同步，记录所有模块的 REST API 和 SSE 接口定义。

> **约定**：所有接口以 `/api` 为前缀，JSON 格式，暗色主题不影响接口设计。

## 通用规范

### 响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": 1735000000000,
  "requestId": "req-abc-123"
}
```

- `code = 0` 表示成功，非 0 为业务错误
- HTTP 状态码遵循 RESTful 语义（400/401/403/404/500）

### 分页参数

```
GET /api/xxx?page=1&pageSize=20
```

---

## 智能驾驶舱 API

### POST /api/chat/stream
**聊天流式接口（SSE）**

请求体：
```json
{
  "message": "分析宁德时代近期走势",
  "sessionId": "sess-abc123",
  "context": [{ "type": "symbol", "id": "300750", "label": "宁德时代" }],
  "enableThoughtChain": true
}
```

响应（text/event-stream）：
```
event: message
data: {"type":"thought_step","data":{"step":1,"title":"检索行情数据","status":"running"}}

event: message
data: {"type":"thought_step","data":{"step":1,"title":"检索行情数据","status":"success"}}

event: message
data: {"type":"token","data":{"delta":"宁德时代"}}

event: message
data: {"type":"rich_content","data":{"content":{"id":"c-001","type":"chart","title":"净值曲线",...}}}

event: message
data: {"type":"done","data":{"sessionId":"sess-abc123","totalTokens":1240}}
```

---

### GET /api/decisions/pending
**获取待确认决策列表**

响应：
```json
{
  "code": 0,
  "data": [
    {
      "id": "d-001",
      "symbol": "300750",
      "name": "宁德时代",
      "action": "buy",
      "confidence": 87,
      "targetPrice": 195.00,
      "stopLoss": 172.00,
      "positionSize": 5.0,
      "expectedPnl": 0.123,
      "reasoning": "动量因子强势，资金持续流入...",
      "createdAt": 1735000000000
    }
  ]
}
```

---

### POST /api/decisions/{decisionId}/confirm
**确认执行 Agent 决策**

请求体：
```json
{
  "action": "buy",
  "finalSize": 5.0,
  "note": "同意Agent建议"
}
```

---

### DELETE /api/decisions/{decisionId}
**驳回决策**

请求体（可选）：
```json
{ "reason": "市场环境不适合" }
```

---

## 市场发现 API

### GET /api/market/signals
**获取信号扫描列表（分页）**

查询参数：
```
strategy=multi_factor_v2
timeRange=1d
direction=long
type=factor
minConfidence=60
sector=新能源
page=1
pageSize=20
```

---

### POST /api/market/signals/{signalId}/send-to-cockpit
**将信号发送至驾驶舱**

响应：
```json
{ "code": 0, "data": { "sessionId": "sess-xyz" } }
```

---

### GET /api/market/heatmap
**获取市场热力图数据**

```
GET /api/market/heatmap?limit=100&sizeField=marketCap
```

---

### GET /api/market/sectors
**获取板块轮动数据**

```
GET /api/market/sectors?timeRange=1d
```

---

### GET /api/market/capital-flow
**获取资金流向数据**

```
GET /api/market/capital-flow?timeRange=1d&topN=8
```

---

### GET /api/market/kline/{symbol}
**获取个股 K 线数据**

```
GET /api/market/kline/300750?period=daily&timeRange=20d
```

---

## 持仓管理 API

### GET /api/portfolio/holdings
**获取持仓列表**

---

### POST /api/portfolio/holdings/import
**导入持仓文件（multipart/form-data）**

字段：`file`（.csv 或 .xlsx）

---

### POST /api/portfolio/holdings/sync-broker
**同步券商持仓**

请求体：
```json
{
  "brokerId": "eastmoney",
  "credentials": { "accountId": "12345", "token": "xxx" }
}
```

---

### PATCH /api/portfolio/holdings/{holdingId}
**更新持仓字段**

```json
{ "notes": "核心持仓，长期持有" }
```

---

### GET /api/portfolio/risk-metrics
**获取组合风险指标**

---

### GET /api/portfolio/factor-exposure
**获取因子暴露**

---

### GET /api/portfolio/correlation
**获取相关性矩阵**

```
GET /api/portfolio/correlation?symbols=600519,300750,600036&window=60
```

---

### GET /api/portfolio/attribution
**获取绩效归因**

```
GET /api/portfolio/attribution?startDate=2024-01-01&endDate=2024-12-31&granularity=all
```

---

### POST /api/portfolio/send-to-cockpit
**整体组合发送至驾驶舱**

---

### POST /api/portfolio/holdings/{holdingId}/send-to-cockpit
**单支持仓发送至驾驶舱**

---

## 公共 API

### GET /api/agents/status
**获取所有 Agent 运行状态**

```json
{
  "data": [
    { "agentId": "a-001", "name": "市场扫描Agent", "status": "running", "currentTask": "扫描新能源板块..." }
  ]
}
```

---

### GET /api/datasources/status
**获取数据源连接状态**

```json
{
  "data": [
    { "id": "ds-001", "name": "Wind数据", "connected": true, "latencyMs": 120 }
  ]
}
```
