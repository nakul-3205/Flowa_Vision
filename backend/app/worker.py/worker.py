import json
import time
from services.llm_handler import generate_image_task
from services.cloudinary_uploader import upload_image_to_cloudinary
from services.encryption import encrypt_data
from lib.redis_client import redis

TASK_QUEUE = "task_queue"
TASK_RESULT_PREFIX = "task_result:"

def process_task(task_data: dict):
    """
    Process a single task from the queue:
    1. Run LLM to generate the image
    2. Upload image to Cloudinary
    3. Encrypt AI text and Cloudinary URL
    4. Store in Redis for frontend polling
    """
    task_id = task_data.get("task_id")
    try:
        print(f"[WORKER] Processing task: {task_id}")

        # 1. Generate image with AI
        llm_output = generate_image_task(
            platform=task_data.get("platform"),
            user_prompt=task_data.get("user_prompt"),
            image_base64=task_data.get("image_base64")
        )

        if not llm_output:
            raise ValueError("LLM did not return any output")

        # 2. Upload generated image to Cloudinary
        cloudinary_url = upload_image_to_cloudinary(llm_output)
        if not cloudinary_url:
            raise ValueError("Failed to upload image to Cloudinary")

        # 3. Encrypt AI text and Cloudinary URL
        encrypted_text = encrypt_data(llm_output)
        encrypted_image_url = encrypt_data(cloudinary_url)

        # 4. Store result in Redis
        result_payload = {
            "status": "completed",
            "task_id": task_id,
            "user_id": task_data.get("user_id"),
            "llm_output": encrypted_text,
            "image_url": encrypted_image_url
        }

        redis.set(f"{TASK_RESULT_PREFIX}{task_id}", json.dumps(result_payload))
        print(f"[WORKER] Task completed: {task_id}")

    except Exception as e:
        print(f"[WORKER ERROR] Task {task_id}: {e}")
        redis.set(
            f"{TASK_RESULT_PREFIX}{task_id}",
            json.dumps({"status": "failed", "error": str(e)})
        )


def worker_loop():
    """
    Main worker loop:
    - Polls the Redis queue continuously
    - Processes one task at a time
    """
    print("[WORKER] Started, polling task queue...")

    while True:
        # BLPOP blocks until a task is available or timeout
        task_entry = redis.blpop(TASK_QUEUE, timeout=5)

        if task_entry:
            _, raw_task = task_entry
            try:
                task_data = json.loads(raw_task)
                process_task(task_data)
            except Exception as e:
                print(f"[WORKER ERROR] Invalid task data: {e}")
        else:
            # No tasks available → wait a bit
            time.sleep(1)


if __name__ == "__main__":
    worker_loop()
