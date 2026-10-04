from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.config import get_settings
from backend.database import get_db, init_db_indexes, close_db_connection

# Routers
from backend.routers import (
    auth,
    users,
    employees,
    attendance,
    leave,
    shifts,
    timesheets,
    payroll,
    performance,
    dashboards,
    analytics,
    notifications,
    audit,
    ai,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure MongoDB indexes exist
    init_db_indexes()
    yield
    # Shutdown: Close database client
    close_db_connection()


app = FastAPI(
    title="AI-Powered Workforce Management Automation System",
    description="Comprehensive, database-driven, secure backend for Workforce Management.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware for modern frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all feature routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(leave.router)
app.include_router(shifts.router)
app.include_router(timesheets.router)
app.include_router(payroll.router)
app.include_router(performance.router)
app.include_router(dashboards.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(audit.router)
app.include_router(ai.router)


@app.get("/", summary="System Root")
def root():
    return {
        "system": "AI-Powered Workforce Management Automation System",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs",
    }


@app.get("/health", summary="Health Check")
def health_check():
    """
    Verify application health and live MongoDB database connection.
    """
    try:
        db = get_db()
        db.command("ping")
        user_count = db["users"].count_documents({})
        emp_count = db["employees"].count_documents({})
        return {
            "status": "healthy",
            "database": "connected",
            "database_name": db.name,
            "total_users": user_count,
            "total_employees": emp_count,
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "database": "disconnected", "error": str(e)},
        )


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
