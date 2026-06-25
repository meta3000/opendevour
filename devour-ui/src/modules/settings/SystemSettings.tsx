/**
 * SystemSettings — 系统设置页面
 *
 * 包含 Tabs：
 * - 定时任务：SchedulerPanel（任务列表 + 调度管理）
 * - 其他设置（预留占位）
 */

import React from 'react';
import { Tabs, Typography } from 'antd';
import { ScheduleOutlined, SettingOutlined } from '@ant-design/icons';
import SchedulerPanel from './SchedulerPanel';

const { Title, Paragraph } = Typography;

const PlaceholderTab: React.FC<{ description?: string }> = ({
  description = '功能开发中，敬请期待',
}) => (
  <div style={{ padding: '48px 0', textAlign: 'center', color: '#8c8c8c' }}>
    <SettingOutlined style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
    <Paragraph type="secondary">{description}</Paragraph>
  </div>
);

const tabItems = [
  {
    key: 'scheduler',
    label: (
      <span>
        <ScheduleOutlined />
        定时任务
      </span>
    ),
    children: <SchedulerPanel />,
  },
  {
    key: 'api-keys',
    label: (
      <span>
        <SettingOutlined />
        API 密钥
      </span>
    ),
    children: <PlaceholderTab description="API 密钥配置，包含 LLM 服务商和数据源授权 Token" />,
  },
  {
    key: 'notifications',
    label: '通知偏好',
    children: <PlaceholderTab description="配置预警通知渠道（邮件、企业微信、钉钉等）" />,
  },
  {
    key: 'risk-rules',
    label: '风控规则',
    children: <PlaceholderTab description="配置全局风控阈值（最大回撤、集中度、波动率等）" />,
  },
];

export default function SystemSettings() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <Title level={4} style={{ marginBottom: 4 }}>
        系统设置
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        管理定时任务调度、API 密钥、风控规则及通知偏好
      </Paragraph>

      <Tabs
        defaultActiveKey="scheduler"
        items={tabItems}
        style={{ background: 'transparent' }}
      />
    </div>
  );
}
