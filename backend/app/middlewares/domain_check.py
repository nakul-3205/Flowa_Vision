from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

ALLOWED_DOMAIN = "https://example.vercel.app"

class DomainCheckMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        if not origin or not origin.startswith(ALLOWED_DOMAIN):
            raise HTTPException(status_code=403, detail="Forbidden: Invalid origin")
        response = await call_next(request)
        return response
