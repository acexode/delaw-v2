"""DeLaw AI service entrypoint (spec §5).

Internal-only FastAPI service. It is never exposed to the public internet — all
AI requests are proxied through the Node.js API, which authenticates with the
shared service secret. Run with: `uvicorn src.main:app`.
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI

from . import db
from .routers import chat, citations, documents, ingest, research


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await db.connect()
    try:
        yield
    finally:
        await db.disconnect()


app = FastAPI(title="DeLaw AI Service", version="1.0.0", lifespan=lifespan)

app.include_router(research.router)
app.include_router(citations.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(ingest.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "delaw-ai-service"}
