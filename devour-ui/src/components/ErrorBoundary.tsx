/**
 * ErrorBoundary — 全局错误边界
 *
 * 防止单个组件渲染错误导致整棵 React 树卸载、整页空白。
 * 捕获后展示可读的错误信息与「重试 / 刷新」操作。
 */

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          height: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 40,
          background: '#0F1117',
          color: '#F0F2F7',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600 }}>页面出现错误</div>
        <div style={{ fontSize: 13, color: '#8B92A5', maxWidth: 560 }}>
          组件渲染时抛出异常，已被错误边界拦截，未影响其它功能。
        </div>
        <pre
          style={{
            maxWidth: 720,
            maxHeight: 220,
            overflow: 'auto',
            background: '#1E2335',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 12,
            color: '#FF8FA3',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
          }}
        >
          {error.message}
        </pre>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              background: 'rgba(108,99,255,0.15)',
              color: '#A78BFA',
              border: '1px solid rgba(108,99,255,0.35)',
              cursor: 'pointer',
            }}
          >
            重试
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              background: '#6C63FF',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }
}
