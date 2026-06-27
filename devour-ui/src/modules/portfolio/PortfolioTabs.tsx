/**
 * PortfolioTabs - 投资组合 Tab 标签页组件
 *
 * 功能：
 * - Tab 标签页展示所有组合，替代 PortfolioSelector
 * - `+` 按钮新建组合
 * - 双击 Tab label 重命名
 * - 右键菜单删除组合（至少保留一个时禁用）
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Button, Modal, Form, Input, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import type { PortfolioDTO } from '../../api/portfolio.api';
import {
  getPortfolios,
  createPortfolio,
  deletePortfolio,
  updatePortfolio,
} from '../../api/portfolio.api';

interface PortfolioTabsProps {
  value: number;
  onChange: (portfolioId: number) => void;
}

/* ------------------------------------------------------------------ */
/*  暗色主题 Modal 样式（与 PortfolioSelector 保持一致）                   */
/* ------------------------------------------------------------------ */
const DARK_MODAL_STYLES = {
  content: { background: '#1E2335', border: '1px solid rgba(255,255,255,0.08)' },
  header: { background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  body: { padding: '20px 24px' },
};

const DARK_INPUT_STYLE = {
  background: '#171B26',
  borderColor: 'rgba(255,255,255,0.12)',
  color: '#F0F2F7',
};

const DARK_LABEL_STYLE = { color: '#A0A6B8', fontSize: 12 };

/* ------------------------------------------------------------------ */
/*  组件主体                                                           */
/* ------------------------------------------------------------------ */

export const PortfolioTabs: React.FC<PortfolioTabsProps> = ({ value, onChange }) => {
  const [portfolios, setPortfolios] = useState<PortfolioDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // 新建弹窗
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  // 重命名弹窗
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<PortfolioDTO | null>(null);
  const [renameForm] = Form.useForm();

  /* ---------- 数据加载 ---------- */

  const loadPortfolios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPortfolios();
      setPortfolios(data);
      // 如果当前选中组合不存在，切换到第一个
      if (data.length > 0 && !data.find(p => p.id === value)) {
        onChange(data[0].id);
      }
    } catch (err: any) {
      message.error(`加载组合列表失败：${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [value, onChange]);

  useEffect(() => {
    loadPortfolios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- 新建 ---------- */

  const handleCreate = async (vals: { name: string; description?: string }) => {
    try {
      const created = await createPortfolio(vals);
      await loadPortfolios();
      onChange(created.id);
      setCreateModalOpen(false);
      createForm.resetFields();
      message.success('组合创建成功');
    } catch (err: any) {
      message.error(`创建失败：${err.message}`);
    }
  };

  /* ---------- 重命名 ---------- */

  const openRename = (portfolio: PortfolioDTO) => {
    setRenameTarget(portfolio);
    renameForm.setFieldsValue({ name: portfolio.name });
    setRenameModalOpen(true);
  };

  const handleRename = async (vals: { name: string }) => {
    if (!renameTarget) return;
    try {
      await updatePortfolio(renameTarget.id, { name: vals.name });
      message.success('组合已重命名');
      setRenameModalOpen(false);
      renameForm.resetFields();
      setRenameTarget(null);
      await loadPortfolios();
    } catch (err: any) {
      message.error(`重命名失败：${err.message}`);
    }
  };

  /* ---------- 删除 ---------- */

  const handleDelete = async (id: number) => {
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
          message.success('组合已删除');
          // 若删除的是当前选中组合，切换到其他组合
          if (value === id) {
            const fallback = portfolios.find(p => p.id !== id);
            if (fallback) onChange(fallback.id);
          }
          await loadPortfolios();
        } catch (err: any) {
          message.error(`删除失败：${err.message}`);
        }
      },
    });
  };

  /* ---------- 右键菜单 ---------- */

  const buildContextMenu = (portfolio: PortfolioDTO): MenuProps['items'] => [
    {
      key: 'rename',
      label: '重命名',
      icon: <Edit2 size={13} />,
      onClick: (e) => { e.domEvent.stopPropagation(); openRename(portfolio); },
    },
    {
      key: 'delete',
      label: '删除组合',
      icon: <Trash2 size={13} />,
      danger: true,
      disabled: portfolios.length <= 1,
      onClick: (e) => { e.domEvent.stopPropagation(); handleDelete(portfolio.id); },
    },
  ];

  /* ---------- Tab items ---------- */

  const tabItems = portfolios.map(p => ({
    key: String(p.id),
    label: (
      <Dropdown
        menu={{ items: buildContextMenu(p) }}
        trigger={['contextMenu']}
      >
        <span
          onDoubleClick={(e) => { e.stopPropagation(); openRename(p); }}
          style={{ userSelect: 'none', padding: '0 2px' }}
        >
          {p.name}
        </span>
      </Dropdown>
    ),
  }));

  /* ---------- 渲染 ---------- */

  return (
    <>
      <Tabs
        activeKey={String(value)}
        onChange={(key) => onChange(Number(key))}
        loading={loading}
        items={tabItems}
        size="small"
        tabBarStyle={{
          marginBottom: 0,
          padding: '0 20px',
          background: 'var(--color-bg-base)',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0,
        }}
        tabBarExtraContent={
          <Button
            size="small"
            type="text"
            icon={<Plus size={14} />}
            onClick={() => setCreateModalOpen(true)}
            style={{ color: 'var(--color-text-secondary)', marginRight: 8 }}
          >
            新建
          </Button>
        }
      />

      {/* 新建组合弹窗 */}
      <Modal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        title="新建投资组合"
        onOk={() => createForm.submit()}
        styles={DARK_MODAL_STYLES}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label={<span style={DARK_LABEL_STYLE}>组合名称</span>}
            rules={[{ required: true, message: '请输入组合名称' }]}
          >
            <Input placeholder="如：成长股组合" style={DARK_INPUT_STYLE} />
          </Form.Item>
          <Form.Item
            name="description"
            label={<span style={DARK_LABEL_STYLE}>描述</span>}
          >
            <Input.TextArea placeholder="可选" rows={3} style={DARK_INPUT_STYLE} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重命名弹窗 */}
      <Modal
        open={renameModalOpen}
        onCancel={() => { setRenameModalOpen(false); setRenameTarget(null); }}
        title="重命名组合"
        onOk={() => renameForm.submit()}
        styles={DARK_MODAL_STYLES}
      >
        <Form form={renameForm} layout="vertical" onFinish={handleRename}>
          <Form.Item
            name="name"
            label={<span style={DARK_LABEL_STYLE}>组合名称</span>}
            rules={[{ required: true, message: '请输入组合名称' }]}
          >
            <Input placeholder="输入新名称" style={DARK_INPUT_STYLE} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
