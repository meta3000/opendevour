/**
 * EditPositionModal — 编辑持仓弹窗
 *
 * 可修改字段：股票名称、持仓数量、成本价格
 * 预填充当前值，提交后调用 updatePosition API
 */

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import { updatePosition } from '../../api/portfolio.api';
import type { Holding } from '../../types/portfolio';

interface EditPositionModalProps {
  open: boolean;
  holding: Holding | null;
  onClose: () => void;
  onSuccess: (updated: Holding) => void;
  portfolioId?: number;
}

const MODAL_STYLES = {
  content: { background: '#1E2335', border: '1px solid rgba(255,255,255,0.08)' },
  header: { background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  body: { padding: '20px 24px' },
};

const LABEL_STYLE: React.CSSProperties = { color: '#A0A6B8', fontSize: 12 };

export const EditPositionModal: React.FC<EditPositionModalProps> = ({
  open,
  holding,
  onClose,
  onSuccess,
  portfolioId = 1,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 打开弹窗时预填充当前值
  useEffect(() => {
    if (open && holding) {
      form.setFieldsValue({
        name: holding.name,
        quantity: holding.shares,
        avg_cost: holding.costPrice,
      });
    }
  }, [open, holding, form]);

  const handleOk = async () => {
    if (!holding) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const updated = await updatePosition(portfolioId, holding.id, {
        name: values.name?.trim() || undefined,
        quantity: values.quantity,
        avg_cost: values.avg_cost,
      });
      if (updated) {
        message.success(`${holding.symbol} 持仓已更新`);
        onSuccess(updated);
      }
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(`更新失败：${err?.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      title={`编辑持仓${holding ? ` — ${holding.symbol}` : ''}`}
      okText="保存修改"
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
        {/* 股票代码只读展示 */}
        <Form.Item label={<span style={LABEL_STYLE}>股票代码</span>}>
          <Input
            value={holding?.symbol ?? ''}
            disabled
            style={{ background: '#0F1219', borderColor: 'rgba(255,255,255,0.08)', color: '#6B7080' }}
          />
        </Form.Item>

        <Form.Item
          label={<span style={LABEL_STYLE}>股票名称</span>}
          name="name"
        >
          <Input
            placeholder="股票名称"
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
            style={{ width: '100%', background: '#171B26', borderColor: 'rgba(255,255,255,0.12)', color: '#F0F2F7' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
