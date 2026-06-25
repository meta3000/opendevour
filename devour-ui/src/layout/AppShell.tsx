/**
 * AlphaAgent · AppShell 主布局
 * antd Layout：左侧可折叠 Sidebar + 右侧主内容区
 */

import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const { Content } = Layout;

export const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh', background: '#0F1117' }}>
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout style={{ background: '#0F1117', minWidth: 0 }}>
        <Content
          style={{
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 各页面通过 React Router Outlet 渲染 */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
