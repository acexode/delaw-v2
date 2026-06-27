"""Internal API routers (spec §5.6). All routes require the service secret."""

import json
from typing import Any


def format_sse(event: dict[str, Any]) -> str:
    """Serialise an event as a Server-Sent Events `data:` frame."""
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    # Disable proxy buffering so tokens flush immediately.
    "X-Accel-Buffering": "no",
}
