# backend/agent/streaming_utils.py
import json
import asyncio
from typing import AsyncGenerator, Dict, Any

MIN_TOKEN_DELAY_SECONDS = 0.015  # 15ms feels smooth and human
THINKING_MIN_SECONDS = 0.5

def format_sse_event(event_type: str, data: Dict[str, Any]) -> str:
    """Format SSE according to spec"""
    payload_str = json.dumps(data, ensure_ascii=False)
    return f"event: {event_type}\ndata: {payload_str}\n\n"

async def throttle_tokens(text: str, chunk_size: int = 3) -> AsyncGenerator[str, None]:
    """Yields small token chunks to simulate natural typewriter feel"""
    for i in range(0, len(text), chunk_size):
        chunk = text[i:i + chunk_size]
        yield chunk
        await asyncio.sleep(MIN_TOKEN_DELAY_SECONDS)
