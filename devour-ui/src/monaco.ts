/**
 * Monaco 本地化配置
 *
 * 默认 @monaco-editor/react 从 jsDelivr CDN 加载 Monaco，受网络/代理影响不稳定。
 * 这里改为使用随应用打包的本地 monaco-editor，并配置 Vite worker，确保离线/代理环境可用。
 */

import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// 语法高亮（monarch）在主线程，编辑器 worker 足够支撑高亮与编辑；
// 各语言的高级智能提示 worker 此处统一回退到 editor.worker（不影响高亮）。
self.MonacoEnvironment = {
  getWorker: () => new editorWorker(),
};

loader.config({ monaco });
