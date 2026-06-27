"""DeLaw AI service entrypoint.

Internal-only FastAPI service. It is never exposed to the public internet —
all AI requests are proxied through the Node.js API (spec §2.2, §5.6).
RAG endpoints under /internal are implemented in Sprint 2.
"""

from fastapi import FastAPI

app = FastAPI(title="DeLaw AI Service", version="1.0.0")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "delaw-ai-service"}
