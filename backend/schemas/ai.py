from typing import Any
from pydantic import BaseModel, Field


class AIAssistantQuery(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="Natural language HR workforce question")


class AIAssistantResponse(BaseModel):
    query: str
    intent: str
    answer: str
    data: Any = None
    confidence: float
    role_accessible: str
    generated_at: str


class AIInsightItem(BaseModel):
    category: str
    headline: str
    description: str
    severity: str  # "info", "warning", "critical"
    metric: str | None = None


class AIAttendanceInsightsResponse(BaseModel):
    insights: list[AIInsightItem]
    overall_health: str  # "Healthy", "Attention Needed", "Critical"
    anomaly_count: int
    generated_at: str


class MonthlyForecast(BaseModel):
    month: str
    projected_headcount: int
    lower_bound: int
    upper_bound: int


class AIWorkforceForecastResponse(BaseModel):
    current_headcount: int
    forecast_period_months: int
    projected_headcount: int
    growth_rate_pct: float
    monthly_forecasts: list[MonthlyForecast]
    methodology: str
    status_note: str
    generated_at: str
