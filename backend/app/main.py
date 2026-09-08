import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.api.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database tables on startup
    try:
        Base.metadata.create_all(bind=engine)

        # Lightweight migration: SQLite create_all() never alters existing tables,
        # so add columns introduced after the DB was first created (e.g. password_value).
        from sqlalchemy import text, inspect
        with engine.connect() as conn:
            inspector = inspect(engine)
            existing_cols = {c["name"] for c in inspector.get_columns("simulator_events")}
            if "password_value" not in existing_cols:
                conn.execute(text("ALTER TABLE simulator_events ADD COLUMN password_value VARCHAR(255)"))
                conn.commit()
                logger.info("Migration: added password_value column to simulator_events")

        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.warning(f"Database initialization exception: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-Stack Cybersecurity URL Analysis & Educational Phishing Simulator Platform",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router)

# Safe Global Exception Handler - Never expose raw stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred while processing your request. Please try again later.",
            "error_type": exc.__class__.__name__
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
