/**
 * PlaceholderPage — 未开发模块占位页
 * 显示模块图标 + 名称 + 描述，样式统一
 */
import React from 'react';

interface PlaceholderPageProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, icon, description }) => (
  <div
    style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      background: '#0F1117',
      color: '#8B92A5',
    }}
  >
    {icon}
    <div style={{ fontSize: 18, fontWeight: 600, color: '#F0F2F7' }}>{title}</div>
    {description && (
      <div style={{ fontSize: 13, color: '#8B92A5', maxWidth: 360, textAlign: 'center' }}>
        {description}
      </div>
    )}
    <div
      style={{
        marginTop: 8,
        fontSize: 11,
        padding: '4px 12px',
        borderRadius: 20,
        background: 'rgba(108,99,255,0.12)',
        color: '#6C63FF',
        border: '1px solid rgba(108,99,255,0.35)',
      }}
    >
      模块开发中
    </div>
  </div>
);
