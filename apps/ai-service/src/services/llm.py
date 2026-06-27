"""Anthropic Claude client wrapper (spec §5.4)."""

from __future__ import annotations

from collections.abc import AsyncIterator
from functools import lru_cache

from anthropic import AsyncAnthropic

from ..config import get_settings


@lru_cache
def _client() -> AsyncAnthropic:
    return AsyncAnthropic(api_key=get_settings().anthropic_api_key)


async def stream_text(
    *,
    system: str,
    messages: list[dict[str, str]],
    model: str,
    max_tokens: int,
) -> AsyncIterator[str]:
    async with _client().messages.stream(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=messages,
    ) as stream:
        async for delta in stream.text_stream:
            yield delta


async def complete(
    *,
    system: str,
    messages: list[dict[str, str]],
    model: str,
    max_tokens: int,
) -> str:
    message = await _client().messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=messages,
    )
    return "".join(block.text for block in message.content if block.type == "text")
