import warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="google.*")

from fastapi import FastAPI, Request
from app.api.v1.api import api_router
from app.core.config import settings
from app.api.v1.endpoints.whatsapp import (
    whatsapp_flow_endpoint,
    flow_crypto_health,
    flow_rotate_keys,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.post("/webhook/flow")
async def flow_alias(request: Request):
    """Alias for Meta Flow endpoint — forwards to the main flow handler."""
    return await whatsapp_flow_endpoint(request)

@app.get("/webhook/flow/health")
async def flow_health_alias():
    """Quick health-check: shows if private key is loaded and its fingerprint."""
    return await flow_crypto_health()

@app.post("/webhook/flow/rotate-keys")
async def flow_rotate_keys_alias():
    """Invalidate the cached private key so it reloads from disk on next request."""
    return await flow_rotate_keys()

@app.get("/")
def root():
    return {"message": "Welcome to the Healthcare AI Operating System API"}
