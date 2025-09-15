import json
from fastapi import APIRouter
from lib.redis_client import redis
from services.encryption import encrypt_data

TASK_RESULT_PREFIX = "task_result:"
router = APIRouter()


@router.get("/send_task/{task_id}")
async def send_task(task_id: str):
    try:
        result_key = f"{TASK_RESULT_PREFIX}{task_id}"
        result_json = redis.get(result_key)

        if not result_json:

            return {"status": "pending", "task_id": task_id}

        # Task finished → encrypt AI output and image URL
        result_data = json.loads(result_json)
        encrypted_text = encrypt_data(result_data.get("llm_output"))
        encrypted_image_url = encrypt_data(result_data.get("image_url"))

        return {
            "status": "completed",
            "task_id": task_id,
            "user_id": encrypt_data(result_data.get("user_id")),
            "llm_output": encrypted_text,
            "image_url": encrypted_image_url
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}
