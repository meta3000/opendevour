/**
 * PortfolioSelector - 投资组合选择器组件
 * 
 * 功能：
 * - 下拉选择现有组合
 * - 新建组合
 * - 删除组合（至少保留一个）
 */

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
    } catch (err: any) {
      message.error(`加载组合列表失败：${err.message}`);
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
      message.success('组合创建成功');
    } catch (err: any) {
      message.error(`创建失败：${err.message}`);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发 Select 的 onChange
    
    if (portfolios.length <= 1) {
      message.warning('至少保留一个组合');
      return;
    }
    
    Modal.confirm({
      title: '确认删除',
      content: '删除组合将同时删除该组合下的所有持仓和交易记录，此操作不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deletePortfolio(id);
          await loadPortfolios();
          if (value === id) {
            onChange(portfolios.find(p => p.id !== id)?.id || portfolios[0].id);
          }
          message.success('组合已删除');
        } catch (err: any) {
          message.error(`删除失败：${err.message}`);
        }
      },
    });
  };

  return (
    <Space>
      <Select
        value={value}
        onChange={onChange}
        loading={loading}
        style={{ width: 180 }}
        options={portfolios.map(p => ({ 
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{p.name}</span>
              {portfolios.length > 1 && (
                <Button
                  size="small"
                  type="text"
                  danger
                  style={{ padding: '0 4px', height: 'auto' }}
                  onClick={(e) => handleDelete(p.id, e)}
                >
                  ×
                </Button>
              )}
            </div>
          ),
          value: p.id 
        }))}
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
        placeholder="选择组合"
      />
      
      <Modal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        title="新建投资组合"
        onOk={() => form.submit()}
        styles={{
          content: { background: '#1E2335', border: '1px solid rgba(255,255,255,0.08)' },
          header: { background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.06)' },
          body: { padding: '20px 24px' },
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item 
            name="name" 
            label={<span style={{ color: '#A0A6B8', fontSize: 12 }}>组合名称</span>} 
            rules={[{ required: true, message: '请输入组合名称' }]}
          >
            <Input 
              placeholder="如：成长股组合" 
              style={{ background: '#171B26', borderColor: 'rgba(255,255,255,0.12)', color: '#F0F2F7' }}
            />
          </Form.Item>
          <Form.Item 
            name="description" 
            label={<span style={{ color: '#A0A6B8', fontSize: 12 }}>描述</span>}
          >
            <Input.TextArea 
              placeholder="可选" 
              rows={3}
              style={{ background: '#171B26', borderColor: 'rgba(255,255,255,0.12)', color: '#F0F2F7' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
