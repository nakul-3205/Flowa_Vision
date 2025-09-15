import json
import uuid
import base64
import requests
from fastapi import APIRouter, Request
from lib.redis_client import redis
from services.encryption import decrypt_data
from middlewares.domain_check import DomainCheckMiddleware
from middlewares.hmac_verify import HMACVerifierMiddleware

TASK_QUEUE = "task_queue"
router = APIRouter()


@router.post("/create_task")
async def create_task(request: Request):
    try:

        payload = await request.json()


        decrypted_payload = decrypt_data(payload.get("encrypted_data"))

        # --- Generate unique task ID ---
        task_id = str(uuid.uuid4())
        user_id = decrypted_payload.get("user_id")
        user_prompt = decrypted_payload.get("user_prompt")
        platform = decrypted_payload.get("platform")
        cloudinary_url = decrypted_payload.get("image_url")  # optional

        # --- Convert Cloudinary URL to Base64 if exists ---
        image_base64 = None
        if cloudinary_url:
            resp = requests.get(cloudinary_url)
            image_base64 = base64.b64encode(resp.content).decode()

        # --- Push task into Redis queue ---
        task_data = {
            "task_id": task_id,
            "user_id": user_id,
            "user_prompt": user_prompt,
            "platform": platform,
            "image_base64": image_base64
        }
        redis.rpush(TASK_QUEUE, json.dumps(task_data))

        # --- Return immediately with task ID ---
        return {"status": "pending", "task_id": task_id}

    except Exception as e:
        return {"status": "error", "error": str(e)}
