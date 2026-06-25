/**
 * AlphaAgent · App 路由配置
 * react-router-dom v7，8个模块路由 + 默认重定向到驾驶舱
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AppShell } from './layout/AppShell';

// 懒加载各模块（支持代码分割）
const Cockpit           = React.lazy(() => import('./modules/cockpit/Cockpit'));
const MarketDiscovery   = React.lazy(() => import('./modules/market/MarketDiscovery'));
const Portfolio         = React.lazy(() => import('./modules/portfolio/Portfolio'));
const StrategyBuilder   = React.lazy(() => import('./modules/strategy/StrategyBuilder'));
const FactorLibrary     = React.lazy(() => import('./modules/factors/FactorLibrary'));
const SkillsLibrary     = React.lazy(() => import('./modules/skills/SkillsLibrary'));
const AgentOrchestration = React.lazy(() => import('./modules/agents/AgentOrchestration'));
const DataSources       = React.lazy(() => import('./modules/datasources/DataSources'));
const SystemSettings    = React.lazy(() => import('./modules/settings/SystemSettings'));

/** 加载态（全屏居中） */
const PageLoader = () => (
  <div
    style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Spin size="large" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* 默认跳转到驾驶舱 */}
          <Route index element={<Navigate to="/cockpit" replace />} />

          {/* 核心模块 */}
          <Route path="/cockpit"   element={<Suspense fallback={<PageLoader />}><Cockpit /></Suspense>} />
          <Route path="/market"    element={<Suspense fallback={<PageLoader />}><MarketDiscovery /></Suspense>} />
          <Route path="/portfolio" element={<Suspense fallback={<PageLoader />}><Portfolio /></Suspense>} />

          {/* 配置模块 */}
          <Route path="/strategy"  element={<Suspense fallback={<PageLoader />}><StrategyBuilder /></Suspense>} />
          <Route path="/factors"   element={<Suspense fallback={<PageLoader />}><FactorLibrary /></Suspense>} />
          <Route path="/skills"    element={<Suspense fallback={<PageLoader />}><SkillsLibrary /></Suspense>} />
          <Route path="/agents"    element={<Suspense fallback={<PageLoader />}><AgentOrchestration /></Suspense>} />

          {/* 系统模块 */}
          <Route path="/data"      element={<Suspense fallback={<PageLoader />}><DataSources /></Suspense>} />
          <Route path="/settings"  element={<Suspense fallback={<PageLoader />}><SystemSettings /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
