import hmac
import hashlib
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
import base64
import os

SECRET = os.environ.get("PYTHON_BACKEND_SECRET", "")

class HMACVerifierMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        signature = request.headers.get("x-signature")
        timestamp = request.headers.get("x-timestamp")

        if not signature or not timestamp:
            raise HTTPException(status_code=400, detail="Missing signature or timestamp")

        # Check timestamp for replay attacks (optional, 5 minutes tolerance)
        now = int(time.time() * 1000)
        req_time = int(timestamp)
        if abs(now - req_time) > 5 * 60 * 1000:
            raise HTTPException(status_code=400, detail="Timestamp too old or invalid")

        body = await request.body()
        expected_hmac = hmac.new(SECRET.encode(), f"{timestamp}.{body.decode()}".encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(expected_hmac, signature):
            raise HTTPException(status_code=403, detail="Invalid HMAC signature")

        response = await call_next(request)
        return response
