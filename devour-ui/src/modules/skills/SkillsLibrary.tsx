/**
 * SkillsLibrary — Skills 管理工作区
 *
 * 布局：左侧文件树（Tabs：我的 skills / 公用 skill）+ 右侧多 Tab 编辑/预览区。
 * - 左侧 antd Tree 呈现「文件夹 + 文件」，行内 icon+名称对齐；公共 skill 的复制按钮只挂在顶层文件夹。
 * - 右侧支持同时打开多个文件（editable-card Tabs），支持关闭单个/其他/左侧/右侧/全部。
 * - 文件默认「预览」：md 渲染、其它语言 Monaco 只读高亮；私有文件点「编辑」才进入可写。
 * - 公共 skill 只读、不可编辑；过大/非文本（后端 previewable=false）提示无法预览。
 */

import React from 'react';
import { Button, Dropdown, Empty, Spin, Tabs, Tag, Tooltip, Tree, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Eye,
  File as FileIcon,
  FileCode,
  FileText,
  Folder,
  MoreHorizontal,
  Pencil,
  Puzzle,
  Save,
} from 'lucide-react';
import {
  copySkill,
  fetchSkillFile,
  fetchSkillTree,
  saveSkillFile,
  type SkillFile,
  type SkillScope,
  type SkillTreeNode,
} from '../../api/skills.client';

const LEFT_WIDTH = 300;
const CODE_LANGS = ['markdown', 'sql', 'python', 'shell', 'javascript', 'typescript', 'json', 'yaml', 'ini', 'html', 'css'];

/** 单个已打开的文件 Tab 状态 */
interface OpenTab extends SkillFile {
  tabKey: string;     // `${scope}:${path}`
  draft: string;
  dirty: boolean;
  editing: boolean;   // 预览 / 编辑
}

/** 携带额外字段的树节点 */
type SkillDataNode = DataNode & { ext?: string; nodeType?: 'dir' | 'file'; topLevel?: boolean };

const tabKeyOf = (scope: SkillScope, path: string) => `${scope}:${path}`;

/** 文件/文件夹图标 */
function nodeIcon(isLeaf: boolean, ext: string) {
  if (!isLeaf) return <Folder size={14} color="#F5A623" />;
  if (ext === 'md') return <FileText size={14} color="#8B92A5" />;
  if (['py', 'sql', 'sh', 'bash', 'js', 'ts', 'json', 'yaml', 'yml'].includes(ext)) {
    return <FileCode size={14} color="#6C63FF" />;
  }
  return <FileIcon size={14} color="#8B92A5" />;
}

export default function SkillsLibrary() {
  const [scope, setScope] = React.useState<SkillScope>('private');
  const [trees, setTrees] = React.useState<Record<SkillScope, SkillTreeNode[]>>({ private: [], public: [] });
  const [treeLoading, setTreeLoading] = React.useState(false);

  const [openTabs, setOpenTabs] = React.useState<OpenTab[]>([]);
  const [activeKey, setActiveKey] = React.useState('');
  const [fileLoading, setFileLoading] = React.useState(false);
  const [savingKey, setSavingKey] = React.useState('');

  const saveActiveRef = React.useRef<() => void>(() => {});

  const loadTree = React.useCallback(async (sc: SkillScope) => {
    setTreeLoading(true);
    try {
      setTrees((prev) => ({ ...prev, [sc]: [] }));
      const tree = await fetchSkillTree(sc);
      setTrees((prev) => ({ ...prev, [sc]: tree }));
    } catch (e) {
      message.error(`加载 ${sc} 列表失败：${(e as Error).message}`);
    } finally {
      setTreeLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTree('private');
    loadTree('public');
  }, [loadTree]);

  const patchTab = React.useCallback((key: string, patch: Partial<OpenTab>) => {
    setOpenTabs((prev) => prev.map((t) => (t.tabKey === key ? { ...t, ...patch } : t)));
  }, []);

  const openFile = React.useCallback(async (sc: SkillScope, path: string) => {
    const key = tabKeyOf(sc, path);
    if (openTabs.some((t) => t.tabKey === key)) {
      setActiveKey(key);
      return;
    }
    setFileLoading(true);
    try {
      const file = await fetchSkillFile(sc, path);
      const tab: OpenTab = { ...file, tabKey: key, draft: file.content, dirty: false, editing: false };
      setOpenTabs((prev) => [...prev, tab]);
      setActiveKey(key);
    } catch (e) {
      message.error(`打开文件失败：${(e as Error).message}`);
    } finally {
      setFileLoading(false);
    }
  }, [openTabs]);

  const saveTab = React.useCallback(async (key: string) => {
    const tab = openTabs.find((t) => t.tabKey === key);
    if (!tab || !tab.editable || !tab.dirty) return;
    setSavingKey(key);
    try {
      await saveSkillFile(tab.scope, tab.path, tab.draft);
      patchTab(key, { content: tab.draft, dirty: false });
      message.success('已保存');
    } catch (e) {
      message.error(`保存失败：${(e as Error).message}`);
    } finally {
      setSavingKey('');
    }
  }, [openTabs, patchTab]);

  saveActiveRef.current = () => saveTab(activeKey);

  const handleCopy = React.useCallback(async (path: string) => {
    try {
      const newPath = await copySkill('public', path);
      await loadTree('private');
      message.success(`已复制到我的 Skills：${newPath}`);
    } catch (e) {
      message.error(`复制失败：${(e as Error).message}`);
    }
  }, [loadTree]);

  // ---- 关闭操作 ----
  const closeTab = React.useCallback((key: string) => {
    setOpenTabs((prev) => {
      const idx = prev.findIndex((t) => t.tabKey === key);
      const next = prev.filter((t) => t.tabKey !== key);
      setActiveKey((cur) => {
        if (cur !== key) return cur;
        const neighbor = next[idx] ?? next[idx - 1] ?? next[next.length - 1];
        return neighbor ? neighbor.tabKey : '';
      });
      return next;
    });
  }, []);

  const closeOps = React.useCallback((op: 'others' | 'left' | 'right' | 'all') => {
    setOpenTabs((prev) => {
      const idx = prev.findIndex((t) => t.tabKey === activeKey);
      if (op === 'all') { setActiveKey(''); return []; }
      if (idx < 0) return prev;
      let next = prev;
      if (op === 'others') next = [prev[idx]];
      if (op === 'left') next = prev.slice(idx);
      if (op === 'right') next = prev.slice(0, idx + 1);
      setActiveKey(activeKey);
      return next;
    });
  }, [activeKey]);

  // ---- 树 ----
  const toDataNodes = React.useCallback((nodes: SkillTreeNode[], depth = 0): SkillDataNode[] =>
    nodes.map((n) => ({
      key: n.key,
      title: n.title,
      isLeaf: n.isLeaf,
      nodeType: n.type,
      ext: n.ext,
      topLevel: depth === 0,
      children: n.children ? toDataNodes(n.children, depth + 1) : undefined,
    })), []);

  const renderTitle = React.useCallback((sc: SkillScope) => (raw: DataNode) => {
    const node = raw as SkillDataNode;
    const showCopy = sc === 'public' && node.nodeType === 'dir' && node.topLevel;
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, lineHeight: '24px' }}>
        <span style={{ display: 'inline-flex', flexShrink: 0 }}>{nodeIcon(!!node.isLeaf, node.ext ?? '')}</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.title as React.ReactNode}
        </span>
        {showCopy && (
          <Tooltip title="复制整个 skill 到我的 Skills">
            <span
              onClick={(e) => { e.stopPropagation(); handleCopy(String(node.key)); }}
              style={{ cursor: 'pointer', color: '#A78BFA', display: 'inline-flex', flexShrink: 0 }}
            >
              <Copy size={13} />
            </span>
          </Tooltip>
        )}
      </span>
    );
  }, [handleCopy]);

  const treePanel = (sc: SkillScope) => (
    <div style={{ height: '100%', overflow: 'auto', padding: '6px 4px' }}>
      {treeLoading && trees[sc].length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center' }}><Spin size="small" /></div>
      ) : trees[sc].length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: '#8B92A5' }}>暂无 skills</span>} />
      ) : (
        <Tree
          blockNode
          defaultExpandAll
          treeData={toDataNodes(trees[sc])}
          titleRender={renderTitle(sc)}
          onSelect={(_keys, info) => {
            if (info.node.isLeaf) openFile(sc, String(info.node.key));
          }}
        />
      )}
    </div>
  );

  const closeMenu = {
    items: [
      { key: 'others', label: '关闭其他' },
      { key: 'left', label: '关闭左侧' },
      { key: 'right', label: '关闭右侧' },
      { type: 'divider' as const },
      { key: 'all', label: '关闭全部', danger: true },
    ],
    onClick: ({ key }: { key: string }) => closeOps(key as 'others' | 'left' | 'right' | 'all'),
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: '#0F1117' }}>
      {/* 左：文件树（两 Tab） */}
      <div
        style={{
          width: LEFT_WIDTH,
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: '#171B26',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <Puzzle size={16} color="#6C63FF" />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#F0F2F7' }}>Skills</span>
        </div>
        <Tabs
          activeKey={scope}
          onChange={(k) => setScope(k as SkillScope)}
          className="fill-tabs"
          style={{ flex: 1, minHeight: 0 }}
          tabBarStyle={{ padding: '0 12px', margin: 0 }}
          items={[
            { key: 'private', label: '我的 skills', children: treePanel('private') },
            { key: 'public', label: '公用 skill', children: treePanel('public') },
          ]}
        />
      </div>

      {/* 右：多 Tab 编辑/预览 */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {fileLoading && openTabs.length === 0 ? (
          <Centered><Spin /></Centered>
        ) : openTabs.length === 0 ? (
          <Centered>
            <Puzzle size={40} color="rgba(108,99,255,0.4)" />
            <div style={{ fontSize: 15, color: '#F0F2F7', marginTop: 12 }}>从左侧选择文件打开</div>
            <div style={{ fontSize: 13, color: '#8B92A5', marginTop: 6, maxWidth: 420 }}>
              可同时打开多个文件，以 Tab 切换；默认预览，私有文件点「编辑」可修改保存。
            </div>
          </Centered>
        ) : (
          <Tabs
            type="editable-card"
            hideAdd
            activeKey={activeKey}
            onChange={setActiveKey}
            destroyInactiveTabPane
            className="fill-tabs"
            onEdit={(targetKey, action) => { if (action === 'remove') closeTab(String(targetKey)); }}
            style={{ flex: 1, minHeight: 0 }}
            tabBarStyle={{ margin: 0, padding: '0 8px', background: '#171B26' }}
            tabBarExtraContent={{
              right: (
                <Dropdown menu={closeMenu} trigger={['click']} placement="bottomRight">
                  <Button type="text" size="small" icon={<MoreHorizontal size={15} />} style={{ color: '#8B92A5' }} />
                </Dropdown>
              ),
            }}
            items={openTabs.map((tab) => ({
              key: tab.tabKey,
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {nodeIcon(true, tab.path.split('.').pop() ?? '')}
                  {tab.name}
                  {tab.dirty && <span style={{ color: '#F5A623' }}>●</span>}
                </span>
              ),
              children: (
                <FilePane
                  tab={tab}
                  saving={savingKey === tab.tabKey}
                  saveActiveRef={saveActiveRef}
                  onChange={(v) => patchTab(tab.tabKey, { draft: v, dirty: v !== tab.content })}
                  onToggleEdit={() => patchTab(tab.tabKey, { editing: !tab.editing })}
                  onSave={() => saveTab(tab.tabKey)}
                />
              ),
            }))}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// 单文件面板
// ============================================================

interface FilePaneProps {
  tab: OpenTab;
  saving: boolean;
  saveActiveRef: React.MutableRefObject<() => void>;
  onChange: (v: string) => void;
  onToggleEdit: () => void;
  onSave: () => void;
}

const FilePane: React.FC<FilePaneProps> = ({ tab, saving, saveActiveRef, onChange, onToggleEdit, onSave }) => {
  const toolbar = (
    <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#171B26', flexShrink: 0 }}>
      <Tag style={{ fontSize: 11 }} color={tab.editable ? 'purple' : 'default'}>{tab.language}</Tag>
      {!tab.editable && <Tag style={{ fontSize: 11 }}>只读</Tag>}
      <span style={{ fontSize: 12, color: tab.editing ? '#A78BFA' : '#8B92A5' }}>{tab.editing ? '编辑模式' : '预览模式'}</span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        {tab.editable && tab.previewable && (
          <Button
            type="text"
            size="small"
            icon={tab.editing ? <Eye size={13} /> : <Pencil size={13} />}
            onClick={onToggleEdit}
            style={{ color: '#8B92A5', fontSize: 12 }}
          >
            {tab.editing ? '预览' : '编辑'}
          </Button>
        )}
        {tab.editable && (
          <Button
            type={tab.dirty ? 'primary' : 'text'}
            size="small"
            icon={<Save size={13} />}
            loading={saving}
            disabled={!tab.dirty}
            onClick={onSave}
            style={tab.dirty ? undefined : { color: '#8B92A5', fontSize: 12 }}
          >
            保存
          </Button>
        )}
      </div>
    </div>
  );

  if (!tab.previewable) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {toolbar}
        <Centered>
          <FileIcon size={36} color="#4E5568" />
          <div style={{ fontSize: 14, color: '#F0F2F7', marginTop: 12 }}>无法预览</div>
          <div style={{ fontSize: 13, color: '#8B92A5', marginTop: 6 }}>{tab.reason}</div>
        </Centered>
      </div>
    );
  }

  const isMarkdown = tab.language === 'markdown';
  const monacoLang = CODE_LANGS.includes(tab.language) ? tab.language : 'plaintext';
  // 预览：md 渲染，其它语言 Monaco 只读高亮；编辑：Monaco 可写
  const showRendered = isMarkdown && !tab.editing;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {toolbar}
      <div style={{ flex: 1, minHeight: 0 }}>
        {showRendered ? (
          <MarkdownPreview markdown={tab.draft} />
        ) : (
          <Editor
            height="100%"
            path={`${tab.scope}/${tab.path}`}
            language={monacoLang}
            value={tab.draft}
            theme="vs-dark"
            onChange={(v) => onChange(v ?? '')}
            onMount={(editor, monaco) => {
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveActiveRef.current());
            }}
            options={{
              readOnly: !tab.editing,        // 默认预览=只读，点编辑才可写
              automaticLayout: true,         // 容器尺寸变化时自动重排，避免空白
              minimap: { enabled: false },
              fontSize: 13,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 14, bottom: 14 },
            }}
          />
        )}
      </div>
    </div>
  );
};

const Centered: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
    {children}
  </div>
);

/** Markdown 预览（暗色排版） */
function MarkdownPreview({ markdown }: { markdown: string }) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 32px', fontSize: 13, lineHeight: 1.8, color: '#F0F2F7' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 style={{ fontSize: 22, fontWeight: 600, color: '#F0F2F7', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8, marginBottom: 16 }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: 17, fontWeight: 600, color: '#F0F2F7', margin: '20px 0 10px' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 600, color: '#F0F2F7', margin: '16px 0 8px' }}>{children}</h3>,
          p: ({ children }) => <p style={{ margin: '8px 0', color: '#D4D9E8' }}>{children}</p>,
          strong: ({ children }) => <strong style={{ color: '#F0F2F7' }}>{children}</strong>,
          a: ({ children, href }) => <a href={href} style={{ color: '#A78BFA' }}>{children}</a>,
          code: ({ children, className }) => {
            const block = className?.includes('language-');
            return block ? (
              <pre style={{ background: '#1E2335', borderRadius: 6, padding: '12px 16px', overflowX: 'auto', margin: '12px 0' }}>
                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#A78BFA' }}>{children}</code>
              </pre>
            ) : (
              <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: '#1E2335', padding: '2px 6px', borderRadius: 4, color: '#A78BFA' }}>{children}</code>
            );
          },
          table: ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, margin: '12px 0' }}>{children}</table>,
          th: ({ children }) => <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#8B92A5' }}>{children}</th>,
          td: ({ children }) => <td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#F0F2F7' }}>{children}</td>,
          blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid #6C63FF', paddingLeft: 16, margin: '12px 0', color: '#8B92A5' }}>{children}</blockquote>,
          li: ({ children }) => <li style={{ color: '#D4D9E8', margin: '4px 0' }}>{children}</li>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
