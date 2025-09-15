from fastapi import FastAPI
from routes.create_task import router as create_task_router
from routes.send_task import router as send_task_router
from middlewares.domain_check import DomainCheckMiddleware
from middlewares.hmac_verify import HMACVerifierMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# --- Global Middlewares ---
# app.add_middleware(DomainCheckMiddleware)
# app.add_middleware(HMACVerifierMiddleware)

# --- Routers ---
app.include_router(create_task_router, prefix="/tasks", tags=["Create Task"])
app.include_router(send_task_router, prefix="/tasks", tags=["Send Task"])
