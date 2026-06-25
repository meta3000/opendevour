/**
 * AlphaAgent · 应用根入口
 * 配置：ConfigProvider (dark) → XProvider → QueryClientProvider → App
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { XProvider } from '@ant-design/x';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import { antdTheme } from './theme/antd-theme';
import { ErrorBoundary } from './components/ErrorBoundary';
import './monaco';
import './theme/tokens.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30s 缓存
      gcTime: 5 * 60_000,      // 5min GC
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* antd ConfigProvider：暗色主题 + 中文国际化 */}
        <ConfigProvider theme={antdTheme} locale={zhCN}>
          {/* @ant-design/x XProvider：必须在应用根部，不能放在单个组件内 */}
          <XProvider>
            <App />
          </XProvider>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
