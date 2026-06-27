"""Internal auth (spec §5.6) — every route requires the shared service secret.

The Python AI service is never exposed publicly. The only legitimate caller is
the Node.js API, which presents the shared secret via the X-Service-Secret
header. A missing or incorrect secret is rejected with 403.
"""

import hmac

from fastapi import Header, HTTPException, status

from .config import get_settings


async def require_service_secret(
    x_service_secret: str | None = Header(default=None),
) -> None:
    expected = get_settings().ai_service_secret
    if not x_service_secret or not hmac.compare_digest(x_service_secret, expected):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing service secret.",
        )
