from fastapi import FastAPI
from sqlalchemy import text
from fastapi.staticfiles import StaticFiles
import os

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
    auth,
)

from app.services.scheduler import start_scheduler, stop_scheduler

# Create all database tables
Base.metadata.create_all(bind=engine)

# app = FastAPI(
#     title="AI Supply Chain Risk Intelligence API",
#     version="1.0.0",
# )

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI Supply Chain Risk Intelligence API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(auth.router)

# Ensure uploads directory exists and mount it
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# -----------------------------
# Application Startup
# -----------------------------
@app.on_event("startup")
def startup_event():
    start_scheduler()
    
    # Create default admin if DB is empty
    from app.database.database import SessionLocal, engine
    from app.crud.user import get_users, create_user
    from app.schemas.user import UserCreate
    
    # Safe SQLite migration for new columns
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)"))
    except Exception:
        pass # Column might already exist
        
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255)"))
    except Exception:
        pass

    db = SessionLocal()
    try:
        users = get_users(db)
        if len(users) == 0:
            create_user(db, UserCreate(
                username="Admin",
                email="admin@supplysentry.com",
                password="admin",
                role="admin"
            ))
            print("Default admin user created: admin@supplysentry.com / admin")
    finally:
        db.close()


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