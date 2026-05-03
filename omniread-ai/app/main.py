from fastapi import FastAPI

from app.api.routes import router
from app.config import CONFIG

app = FastAPI(
    title="OmniRead AI Forecasting Service",
    version=CONFIG.get("model_version", "ensemble-v1.4"),
)

app.include_router(router)
