from fastapi import APIRouter, Depends
from backend.schemas.ai import (
    AIAssistantQuery,
    AIAssistantResponse,
    AIAttendanceInsightsResponse,
    AIWorkforceForecastResponse,
)
from backend.services.ai_service import AIService
from backend.utils.permissions import get_current_user, require_manager_or_hr

router = APIRouter(prefix="/ai", tags=["AI Features"])


@router.post("/assistant", response_model=AIAssistantResponse, summary="AI Feature 1: HR Database Assistant")
def ask_hr_assistant(payload: AIAssistantQuery, current_user: dict = Depends(get_current_user)):
    """
    Intelligent HR Assistant querying real MongoDB records:
    1. Identifies caller role and checks authorization.
    2. Queries live backend data for headcount, leave, attendance, overtime, or team stats.
    3. Prevents unauthorized cross-employee queries.
    """
    return AIService.answer_hr_query(current_user, payload.query)


@router.get("/attendance-insights", response_model=AIAttendanceInsightsResponse, summary="AI Feature 2: Attendance Insights")
def get_attendance_insights(current_user: dict = Depends(require_manager_or_hr)):
    """
    Automated attendance insights:
    Detects overtime spikes, chronic late arrivals, and rate trends calculated dynamically from database records.
    """
    return AIService.generate_attendance_insights(current_user)


@router.get("/workforce-forecast", response_model=AIWorkforceForecastResponse, summary="AI Feature 3: Workforce Forecasting")
def get_workforce_forecast(current_user: dict = Depends(require_manager_or_hr)):
    """
    Lightweight time-series forecasting based on historical joining velocity and headcount growth.
    """
    return AIService.forecast_workforce()
