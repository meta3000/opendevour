/**
 * AddPositionModal — 手动添加持仓弹窗
 *
 * 表单字段：股票代码、股票名称、持仓数量、成本价格
 * 提交后调用 addPosition API，成功后回调通知父组件刷新列表
 */

import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, AutoComplete, message } from 'antd';
import { addPosition } from '../../api/portfolio.api';
import { searchStocks } from '../../api/stocks.api';
import type { Holding } from '../../types/portfolio';
import type { StockInfo } from '../../api/stocks.api';

interface AddPositionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (holding: Holding) => void;
  portfolioId?: number;
}

const MODAL_STYLES = {
  content: { background: '#1E2335', border: '1px solid rgba(255,255,255,0.08)' },
  header: { background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  body: { padding: '20px 24px' },
};

const LABEL_STYLE: React.CSSProperties = { color: '#A0A6B8', fontSize: 12 };

export const AddPositionModal: React.FC<AddPositionModalProps> = ({
  open,
  onClose,
  onSuccess,
  portfolioId = 1,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [searching, setSearching] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const holding = await addPosition(portfolioId, {
        symbol: values.symbol.trim(),
        name: values.name?.trim() || undefined,
        quantity: values.quantity,
        avg_cost: values.avg_cost,
      });
      message.success(`持仓 ${values.symbol} 已添加`);
      form.resetFields();
      onSuccess(holding);
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return; // 表单验证错误，不提示
      message.error(`添加失败：${err?.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSearchResults([]);
    onClose();
  };

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

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      title="添加持仓"
      okText="确认添加"
      cancelText="取消"
      confirmLoading={submitting}
      width={440}
      styles={MODAL_STYLES}
      okButtonProps={{ style: { background: '#6C63FF', borderColor: '#6C63FF' } }}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        style={{ marginTop: 12 }}
      >
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

        <Form.Item
          label={<span style={LABEL_STYLE}>股票名称</span>}
          name="name"
        >
          <Input
            placeholder="如 平安银行（可选）"
            style={{ background: '#171B26', borderColor: 'rgba(255,255,255,0.12)', color: '#F0F2F7' }}
          />
        </Form.Item>

        <Form.Item
          label={<span style={LABEL_STYLE}>持仓数量（股）</span>}
          name="quantity"
          rules={[{ required: true, message: '请输入持仓数量' }]}
        >
          <InputNumber
            min={1}
            precision={0}
            placeholder="如 1000"
            style={{ width: '100%', background: '#171B26', borderColor: 'rgba(255,255,255,0.12)', color: '#F0F2F7' }}
          />
        </Form.Item>

        <Form.Item
          label={<span style={LABEL_STYLE}>成本价格（元）</span>}
          name="avg_cost"
          rules={[{ required: true, message: '请输入成本价格' }]}
        >
          <InputNumber
            min={0}
            precision={2}
            placeholder="如 12.50"
            style={{ width: '100%', background: '#171B26', borderColor: 'rgba(255,255,255,0.12)', color: '#F0F2F7' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
