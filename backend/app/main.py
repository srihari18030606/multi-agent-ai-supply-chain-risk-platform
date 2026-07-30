from fastapi import FastAPI
from sqlalchemy import text

from app.database.database import Base, engine
from app.models import *

from app.routers import (
    user,
    event,
    risk,
    prediction,
    recommendation,
    correlation,
    ai_log,
    system_log,
)

from app.services.scheduler import start_scheduler, stop_scheduler

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Supply Chain Risk Intelligence API",
    version="1.0.0",
)

# Register Routers
app.include_router(user.router)
app.include_router(event.router)
app.include_router(risk.router)
app.include_router(prediction.router)
app.include_router(recommendation.router)
app.include_router(correlation.router)
app.include_router(ai_log.router)
app.include_router(system_log.router)


# -----------------------------
# Application Startup
# -----------------------------
@app.on_event("startup")
def startup_event():
    start_scheduler()


# -----------------------------
# Application Shutdown
# -----------------------------
@app.on_event("shutdown")
def shutdown_event():
    stop_scheduler()


# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/")
def root():
    return {
        "message": "AI Supply Chain Risk Intelligence Backend is Running 🚀"
    }


# -----------------------------
# Database Health Check
# -----------------------------
@app.get("/health")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "database": "Connected Successfully ✅"
        }

    except Exception as e:
        return {
            "database": "Connection Failed ❌",
            "error": str(e)
        }