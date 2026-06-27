import React, { useState, useEffect, useCallback } from 'react';
import { Drawer, List, Button, Typography, Space, Empty, message, Popconfirm, Spin } from 'antd';
import { Trash2, Eye } from 'lucide-react';
import type { SessionFile, SessionFileContent } from '../api/sessionFiles.api';
import { listSessionFiles, readSessionFile, deleteSessionFile } from '../api/sessionFiles.api';

const { Text, Title } = Typography;

interface SessionFilesProps {
  open: boolean;
  onClose: () => void;
  conversationId: string | null;
}

export const SessionFiles: React.FC<SessionFilesProps> = ({ open, onClose, conversationId }) => {
  const [files, setFiles] = useState<SessionFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<SessionFileContent | null>(null);

  const loadFiles = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const data = await listSessionFiles(conversationId);
      setFiles(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [conversationId]);

  useEffect(() => { if (open) loadFiles(); }, [open, loadFiles]);

  const handlePreview = async (filename: string) => {
    if (!conversationId) return;
    try {
      const data = await readSessionFile(conversationId, filename);
      setPreviewFile(data);
    } catch { message.error('读取文件失败'); }
  };

  const handleDelete = async (filename: string) => {
    if (!conversationId) return;
    try {
      await deleteSessionFile(conversationId, filename);
      message.success('文件已删除');
      loadFiles();
    } catch { message.error('删除失败'); }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Drawer
      title="会话文件"
      open={open}
      onClose={() => { onClose(); setPreviewFile(null); }}
      width={previewFile ? 640 : 400}
    >
      {previewFile ? (
        <div>
          <Button size="small" onClick={() => setPreviewFile(null)} style={{ marginBottom: 12 }}>← 返回</Button>
          <Title level={5}>{previewFile.filename}</Title>
          <div style={{ background: '#1a1d2e', borderRadius: 8, padding: 16, maxHeight: '70vh', overflow: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13 }}>
            {previewFile.content}
          </div>
        </div>
      ) : (
        <Spin spinning={loading}>
          {files.length === 0 ? <Empty description="暂无文件" /> : (
            <List
              dataSource={files}
              renderItem={(file) => (
                <List.Item actions={[
                  <Button key="view" size="small" type="text" icon={<Eye size={14} />} onClick={() => handlePreview(file.filename)} />,
                  <Popconfirm key="del" title="确认删除？" onConfirm={() => handleDelete(file.filename)}>
                    <Button size="small" type="text" danger icon={<Trash2 size={14} />} />
                  </Popconfirm>,
                ]}>
                  <List.Item.Meta
                    title={<Text style={{ fontSize: 13 }}>{file.filename}</Text>}
                    description={<Space size={12}><Text type="secondary" style={{ fontSize: 11 }}>{formatSize(file.size)}</Text></Space>}
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      )}
    </Drawer>
  );
};
