import json
import time
from lib.redis_client import redis

QUEUE_NAME = "task_queue"

def enqueue_job(job_id: str, image_base64: str, prompt: str, user_id: str):

    job = {
        "id": job_id,
        "image": image_base64,
        "prompt": prompt,
        "user_id": user_id,
        "created_at": time.time()
    }

    # Convert to JSON and push to queue
    redis.lpush(QUEUE_NAME, json.dumps(job))
    print(f"Job enqueued: {job_id}")
    return job
