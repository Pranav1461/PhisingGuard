from fastapi import APIRouter
from backend.app.api.health import router as health_router
from backend.app.api.analyze import router as analyze_router
from backend.app.api.simulator import router as simulator_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(analyze_router)
api_router.include_router(simulator_router)
