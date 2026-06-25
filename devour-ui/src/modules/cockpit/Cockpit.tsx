/**
 * Cockpit — 智能驾驶舱
 *
 * 双区域布局：
 * CENTER flex:1：WorkbenchPanel（上下文作为默认 Tab + AI 输出工作台）
 * RIGHT  可拖拽：ChatPanel（@ant-design/x 2.5 助手模式组合）
 *
 * 上下文不再作为独立列展示；AI 助手可关闭、悬浮唤起并支持拖拽宽度。
 */

import type React from 'react';
import { Button, Layout, Tooltip } from 'antd';
import { Bot } from 'lucide-react';
import { WorkbenchPanel } from './WorkbenchPanel';
import { ChatPanel } from './ChatPanel';
import { MIN_CHAT_WIDTH, useCockpitStore } from '../../stores/cockpit.store';

export default function Cockpit() {
  const { chatOpen, setChatOpen, chatWidth, setChatWidth } = useCockpitStore();

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = chatWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      setChatWidth(startWidth + delta);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Layout
      style={{
        height: '100%',
        background: '#0F1117',
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      {/* CENTER — 主工作台，上下文作为默认 Tab */}
      <Layout.Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
          background: '#0F1117',
        }}
      >
        <WorkbenchPanel
          assistantOpen={chatOpen}
          onOpenAssistant={() => setChatOpen(true)}
        />
      </Layout.Content>

      {/* RIGHT — AI 助手面板，可关闭和拖拽宽度 */}
      {chatOpen ? (
        <div
          style={{
            width: chatWidth,
            minWidth: MIN_CHAT_WIDTH,
            flexShrink: 0,
            position: 'relative',
            background: '#171B26',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '-12px 0 30px rgba(0,0,0,0.18)',
            transition: 'box-shadow 0.2s ease',
          }}
        >
          <div
            aria-label="拖拽调整 AI 助手宽度"
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              left: -4,
              top: 0,
              width: 8,
              height: '100%',
              cursor: 'col-resize',
              zIndex: 2,
              background: 'transparent',
            }}
          />
          <ChatPanel onClose={() => setChatOpen(false)} />
        </div>
      ) : (
        <Tooltip title="唤起 AI 助手" placement="left">
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<Bot size={18} />}
            onClick={() => setChatOpen(true)}
            style={{
              position: 'absolute',
              right: 24,
              bottom: 24,
              zIndex: 10,
              width: 48,
              height: 48,
              background: '#6C63FF',
              boxShadow: '0 12px 32px rgba(108,99,255,0.35)',
            }}
          />
        </Tooltip>
      )}
    </Layout>
  );
}
