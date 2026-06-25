"""AI 助手聊天接口（SSE）。

POST /api/chat/stream → text/event-stream
每条消息形如：
    event: message
    data: {"type":"token","data":{"delta":"..."}}
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse, ServerSentEvent

from ...schemas.chat import ChatStreamRequest
from ...services.chat_service import stream_chat

router = APIRouter(tags=["chat"])


@router.post("/chat/stream")
async def chat_stream(req: ChatStreamRequest) -> EventSourceResponse:
    """流式聊天接口。返回 SSE，逐条推送思考步骤与 token 增量。"""

    async def event_generator() -> AsyncIterator[ServerSentEvent]:
        async for chunk in stream_chat(req):
            # rich_chunk 使用专用事件名，前端可精确区分
            event_name = "rich_chunk" if chunk.type == "rich_chunk" else "message"
            yield ServerSentEvent(event=event_name, data=chunk.model_dump_json())

    return EventSourceResponse(event_generator())
