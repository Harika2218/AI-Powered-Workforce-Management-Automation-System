from typing import Literal
from pydantic import BaseModel, Field

ReviewStatus = Literal["Draft", "Completed"]


class PerformanceCreate(BaseModel):
    employee_id: str
    review_period: str = Field(..., min_length=4, max_length=20, description="e.g. 2026-Q1, 2026-Annual")
    overall_score: float = Field(..., ge=1.0, le=5.0, description="Score from 1.0 to 5.0")
    goals: list[str] = []
    strengths: list[str] = []
    areas_for_improvement: list[str] = []
    manager_comments: str = Field(..., min_length=3, max_length=1000)
    status: ReviewStatus = "Completed"


class PerformanceUpdate(BaseModel):
    overall_score: float | None = Field(default=None, ge=1.0, le=5.0)
    goals: list[str] | None = None
    strengths: list[str] | None = None
    areas_for_improvement: list[str] | None = None
    manager_comments: str | None = None
    status: ReviewStatus | None = None


class PerformanceResponse(BaseModel):
    review_id: str
    employee_id: str
    employee_name: str | None = None
    department: str | None = None
    review_period: str
    overall_score: float
    goals: list[str]
    strengths: list[str]
    areas_for_improvement: list[str]
    manager_comments: str
    status: ReviewStatus
    reviewer_id: str | None = None
    updated_at: str | None = None


class PerformanceAnalytics(BaseModel):
    average_score: float
    total_reviews: int
    department_averages: list[dict]
    score_distribution: dict[str, int]  # e.g. "1-2": 5, "2-3": 15, "3-4": 80, "4-5": 100
