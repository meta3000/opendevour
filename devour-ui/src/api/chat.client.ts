/**
 * AlphaAgent · AI 助手聊天 SSE 客户端
 *
 * 调用后端 `POST /api/chat/stream`，解析 `event: message` + `data: {chunk}` 的 SSE 流，
 * 按 chunk 类型回调。契约见 ./cockpit.api.ts 与 spec/tech/api-contracts.md。
 */

import type {
  ChatStreamRequest,
  ThoughtStepData,
  DoneData,
  ErrorData,
  ToolCallData,
} from './cockpit.api';
import type { WorkbenchContent, RichChunk } from '../types/workbench';

export interface StreamChatHandlers {
  /** 思考链步骤 */
  onThought?: (step: ThoughtStepData) => void;
  /** token 增量：full=已累积全文，delta=本次增量 */
  onToken?: (full: string, delta: string) => void;
  /** 工具调用事件 */
  onToolCall?: (data: ToolCallData) => void;
  /** 富内容推送（后续后端产出图表/报告等） */
  onRich?: (content: WorkbenchContent) => void;
  /** 结构化富内容 chunk（图表规格/数据表格/风险预警/决策集/工具结果） */
  onRichChunk?: (chunk: RichChunk) => void;
  /** 流正常结束 */
  onDone?: (data: DoneData) => void;
  /** 业务错误 chunk */
  onError?: (err: ErrorData) => void;
}

/** 从一段 SSE 事件块中提取拼接后的 data 负载 */
function extractData(block: string): string | null {
  const dataLines = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).replace(/^ /, ''));
  return dataLines.length ? dataLines.join('\n') : null;
}

/** 从一段 SSE 事件块中提取 event 类型 */
function extractEvent(block: string): string | null {
  const eventLine = block
    .split('\n')
    .find((line) => line.startsWith('event:'));
  return eventLine ? eventLine.slice(6).replace(/^ /, '') : null;
}

/**
 * 发起流式聊天。返回最终拼接的完整文本。
 * 网络层错误会 throw；业务 error chunk 通过 onError 回调并继续直到 done。
 */
export async function streamChat(
  req: ChatStreamRequest,
  handlers: StreamChatHandlers,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`后端响应异常：HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // 归一化 CRLF：sse-starlette 用 \r\n 分隔，统一成 \n 便于按 \n\n 切分事件
    buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n');

    let sepIndex: number;
    // SSE 事件以空行（\n\n）分隔
    while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      const payload = extractData(block);
      if (!payload) continue; // 忽略注释/心跳/纯 event 行
      
      // 提取 SSE event 类型，用于区分 rich_chunk 与普通 message
      const eventType = extractEvent(block);
      
      let chunk: { type: string; data: any };
      try {
        chunk = JSON.parse(payload);
      } catch {
        continue;
      }
      
      // rich_chunk 专用事件处理
      if (eventType === 'rich_chunk' || chunk.type === 'rich_chunk') {
        const richData = chunk.data as { type: string; content: unknown };
        handlers.onRichChunk?.({ type: richData.type as RichChunk['type'], content: richData.content });
        continue;
      }
      
      switch (chunk.type) {
        case 'thought_step':
          handlers.onThought?.(chunk.data as ThoughtStepData);
          break;
        case 'token': {
          const delta = (chunk.data?.delta as string) ?? '';
          full += delta;
          handlers.onToken?.(full, delta);
          break;
        }
        case 'tool_call':
          handlers.onToolCall?.(chunk.data as ToolCallData);
          break;
        case 'rich_content':
          if (chunk.data?.content) handlers.onRich?.(chunk.data.content as WorkbenchContent);
          break;
        case 'done':
          handlers.onDone?.(chunk.data as DoneData);
          break;
        case 'error':
          handlers.onError?.(chunk.data as ErrorData);
          break;
        default:
          break;
      }
    }
  }

  return full;
}
