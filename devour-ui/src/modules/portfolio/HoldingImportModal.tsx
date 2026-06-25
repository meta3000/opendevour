/**
 * HoldingImportModal — 持仓导入对话框
 *
 * 支持 CSV 和 Excel 格式导入：
 * - 文件上传（antd Upload）
 * - CSV 格式解析（原生实现，不引入 Papa Parse）
 * - Excel 格式解析（项目已有 xlsx 依赖）
 * - 导入预览表格（确认映射关系后提交）
 * - 模板下载功能
 */

import React, { useState, useCallback } from 'react';
import { Modal, Upload, Button, Table, Select, Space, Steps, Alert, message } from 'antd';
import { Upload as UploadIcon, Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import type { UploadFile } from 'antd/es/upload/interface';
import * as XLSX from 'xlsx';
import type { Holding } from '../../types/portfolio';
import { importPositions } from '../../api/portfolio.api';

interface HoldingImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (holdings: Partial<Holding>[]) => void;
  portfolioId?: number; // 新增
}

/** CSV 解析（原生实现） */
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const result: string[][] = [];
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    result.push(row);
  }
  return result;
}

/** Excel 解析（使用 xlsx 库） */
function parseExcel(buffer: ArrayBuffer): string[][] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
}

/** 映射字段选项 */
const FIELD_OPTIONS = [
  { label: '股票代码 (symbol)', value: 'symbol' },
  { label: '股票名称 (name)', value: 'name' },
  { label: '行业 (sector)', value: 'sector' },
  { label: '权重 (weight)', value: 'weight' },
  { label: '持股数量 (shares)', value: 'shares' },
  { label: '成本价 (costPrice)', value: 'costPrice' },
  { label: '现价 (currentPrice)', value: 'currentPrice' },
  { label: '备注 (notes)', value: 'notes' },
  { label: '忽略', value: '__ignore__' },
];

/** 自动推断列映射 */
function autoDetectMapping(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {};
  const patterns: Record<string, RegExp> = {
    symbol: /代码|symbol|ticker|股票代码/i,
    name: /名称|name|股票名/i,
    sector: /行业|sector|板块/i,
    weight: /权重|weight|占比/i,
    shares: /数量|shares|持股|股数/i,
    costPrice: /成本|cost|买入价/i,
    currentPrice: /现价|当前|current|最新价/i,
    notes: /备注|notes|说明/i,
  };

  headers.forEach((header, idx) => {
    for (const [field, pattern] of Object.entries(patterns)) {
      if (pattern.test(header)) {
        mapping[idx] = field;
        break;
      }
    }
    if (!mapping[idx]) {
      mapping[idx] = '__ignore__';
    }
  });
  return mapping;
}

/** 生成 CSV 模板内容 */
function generateCSVTemplate(): string {
  return '股票代码,股票名称,行业,权重(%),持股数量,成本价,现价,备注\n600519,贵州茅台,消费,12.5,300,1420.00,1682.00,核心持仓\n300750,宁德时代,新能源,10.8,2000,164.20,183.42,\n';
}

/** 下载模板文件 */
function downloadTemplate() {
  const content = generateCSVTemplate();
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '持仓导入模板.csv';
  a.click();
  URL.revokeObjectURL(url);
  message.success('模板已下载');
}

export const HoldingImportModal: React.FC<HoldingImportModalProps> = ({
  open,
  onClose,
  onImport,
  portfolioId = 1,
}) => {
  const [step, setStep] = useState(0); // 0: 上传, 1: 映射预览, 2: 确认
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [colMapping, setColMapping] = useState<Record<number, string>>({});
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileRead = useCallback((file: File) => {
    setParseError(null);
    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onload = (e) => {
      try {
        let rows: string[][];
        if (isExcel) {
          rows = parseExcel(e.target!.result as ArrayBuffer);
        } else {
          rows = parseCSV(e.target!.result as string);
        }

        if (rows.length < 2) {
          setParseError('文件内容为空或只有表头');
          return;
        }

        setParsedData(rows);
        const headers = rows[0];
        setColMapping(autoDetectMapping(headers));
        setStep(1);
      } catch (err) {
        setParseError(`解析失败：${(err as Error).message}`);
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }, []);

  const handleUpload = useCallback((file: File) => {
    setFileList([{ uid: '-1', name: file.name, status: 'done', size: file.size }]);
    handleFileRead(file);
    return false; // 阻止自动上传
  }, [handleFileRead]);

  const handleMappingChange = (colIndex: number, field: string) => {
    setColMapping(prev => ({ ...prev, [colIndex]: field }));
  };

  // 将解析数据映射为持仓对象
  const mappedHoldings = React.useMemo(() => {
    if (parsedData.length < 2) return [];
    const headers = parsedData[0];
    const dataRows = parsedData.slice(1);

    return dataRows
      .map((row, rowIdx) => {
        const holding: Record<string, string | number> = {};
        Object.entries(colMapping).forEach(([colIdxStr, field]) => {
          if (field === '__ignore__') return;
          const colIdx = parseInt(colIdxStr, 10);
          const value = row[colIdx] ?? '';
          // 数值字段转换
          if (['weight', 'shares', 'costPrice', 'currentPrice'].includes(field)) {
            holding[field] = parseFloat(value) || 0;
          } else {
            holding[field] = value;
          }
        });
        return { id: `import-${rowIdx}`, ...holding } as unknown as Partial<Holding>;
      })
      .filter(h => h.symbol);
  }, [parsedData, colMapping]);

  // 预览表格列定义
  const previewColumns = React.useMemo(() => {
    if (parsedData.length === 0) return [];
    const headers = parsedData[0];
    return headers.map((header, idx) => ({
      title: (
        <Select
          size="small"
          value={colMapping[idx] || '__ignore__'}
          onChange={(v) => handleMappingChange(idx, v)}
          options={FIELD_OPTIONS}
          style={{ width: 140 }}
          popupMatchSelectWidth={160}
        />
      ),
      dataIndex: String(idx),
      key: String(idx),
      width: 120,
      render: (val: string) => (
        <span style={{ fontSize: 12, color: '#D4D9E8' }}>{val}</span>
      ),
    }));
  }, [parsedData, colMapping]);

  const previewData = React.useMemo(() => {
    if (parsedData.length < 2) return [];
    return parsedData.slice(1, 21).map((row, rIdx) => {
      const record: Record<string, string> = { key: String(rIdx) };
      row.forEach((cell, cIdx) => { record[String(cIdx)] = cell; });
      return record;
    });
  }, [parsedData]);

  const handleConfirmImport = async () => {
    if (mappedHoldings.length === 0) {
      message.warning('没有可导入的数据');
      return;
    }
    
    try {
      const result = await importPositions(portfolioId, mappedHoldings.map(h => ({
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

  const handleReset = () => {
    setStep(0);
    setFileList([]);
    setParsedData([]);
    setColMapping({});
    setParseError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title="导入持仓数据"
      width={780}
      footer={null}
      styles={{
        content: { background: '#1E2335', border: '1px solid rgba(255,255,255,0.08)' },
        header: { background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.06)' },
        body: { padding: '20px 24px' },
      }}
    >
      <Steps
        current={step}
        size="small"
        items={[
          { title: '上传文件' },
          { title: '字段映射' },
          { title: '确认导入' },
        ]}
        style={{ marginBottom: 20 }}
      />

      {/* Step 0: 上传 */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Upload.Dragger
            accept=".csv,.xlsx,.xls"
            fileList={fileList}
            beforeUpload={handleUpload}
            onRemove={() => { setFileList([]); setParsedData([]); setParseError(null); }}
            maxCount={1}
            style={{
              background: '#171B26',
              border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: 8,
            }}
          >
            <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <FileSpreadsheet size={32} color="#6C63FF" />
              <div style={{ fontSize: 14, color: '#F0F2F7', fontWeight: 500 }}>点击或拖拽文件到此处</div>
              <div style={{ fontSize: 12, color: '#8B92A5' }}>支持 CSV、Excel (.xlsx/.xls) 格式</div>
            </div>
          </Upload.Dragger>

          {parseError && (
            <Alert type="error" message={parseError} showIcon style={{ background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)' }} />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              size="small"
              icon={<Download size={13} />}
              onClick={downloadTemplate}
              style={{ color: '#A78BFA', borderColor: 'rgba(108,99,255,0.3)' }}
            >
              下载 CSV 模板
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: 映射预览 */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Alert
            type="info"
            message="请确认每列对应的字段映射关系，顶部下拉框可调整映射"
            showIcon={false}
            style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)', fontSize: 12, color: '#A78BFA' }}
          />
          <Table
            columns={previewColumns}
            dataSource={previewData}
            size="small"
            pagination={{ pageSize: 10, size: 'small' }}
            scroll={{ x: 'max-content' }}
            style={{
              '--ant-table-header-bg': '#252A3D',
              '--ant-table-body-bg': '#171B26',
            } as any}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setStep(0)} style={{ color: '#8B92A5' }}>返回</Button>
            <Button
              type="primary"
              onClick={() => setStep(2)}
              style={{ background: '#6C63FF' }}
            >
              下一步
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: 确认导入 */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={18} color="#00C896" />
            <span style={{ fontSize: 14, color: '#F0F2F7', fontWeight: 500 }}>
              已识别 {mappedHoldings.length} 条持仓记录
            </span>
          </div>

          {mappedHoldings.length > 0 && (
            <Table
              columns={[
                { title: '代码', dataIndex: 'symbol', width: 80, render: (v: string) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#F0F2F7' }}>{v}</span> },
                { title: '名称', dataIndex: 'name', width: 100, render: (v: string) => <span style={{ color: '#F0F2F7' }}>{v}</span> },
                { title: '行业', dataIndex: 'sector', width: 80, render: (v: string) => <span style={{ color: '#8B92A5', fontSize: 12 }}>{v || '-'}</span> },
                { title: '权重', dataIndex: 'weight', width: 60, align: 'right' as const, render: (v: number) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{v ? `${v}%` : '-'}</span> },
                { title: '成本', dataIndex: 'costPrice', width: 80, align: 'right' as const, render: (v: number) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{v ? `¥${v.toFixed(2)}` : '-'}</span> },
              ]}
              dataSource={mappedHoldings.map((h, i) => ({ key: i, ...h }))}
              size="small"
              pagination={{ pageSize: 8, size: 'small' }}
              style={{
                '--ant-table-header-bg': '#252A3D',
                '--ant-table-body-bg': '#171B26',
              } as any}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setStep(1)} style={{ color: '#8B92A5' }}>返回修改</Button>
            <Button
              type="primary"
              onClick={handleConfirmImport}
              icon={<CheckCircle size={14} />}
              style={{ background: '#00C896', borderColor: '#00C896' }}
            >
              确认导入 ({mappedHoldings.length} 条)
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};