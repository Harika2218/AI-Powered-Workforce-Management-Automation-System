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
    suggestions: list[str] = []
    generated_at: str


class AIInsightItem(BaseModel):
    category: str
    headline: str
    description: str
    details: str | None = None
    severity: str  # "info", "warning", "critical"
    level: str | None = None  # "info", "warning", "alert"
    metric: str | None = None
    metric_value: Any = None


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
    projected_attrition_rate: float = 0.042
    historical_growth: list[dict[str, Any]] = []
    forecast_next_6_months: list[dict[str, Any]] = []
    monthly_forecasts: list[MonthlyForecast]
    methodology: str
    status_note: str
    generated_at: str
