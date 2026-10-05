from typing import Literal
from pydantic import BaseModel, Field

ReviewStatus = Literal["Draft", "Pending", "Completed"]


class PerformanceCreate(BaseModel):
    employee_id: str
    review_period: str | None = Field(default=None, description="e.g. 2026-Q1, 2026-Annual")
    period: str | None = Field(default=None, description="Alias for review_period")
    overall_score: float = Field(..., ge=1.0, le=5.0, description="Score from 1.0 to 5.0")
    goals_rating: float | None = Field(default=4.0, ge=1.0, le=5.0)
    goals: list[str] | str | None = []
    strengths: list[str] | str | None = []
    areas_for_improvement: list[str] | str | None = []
    manager_comments: str | None = None
    comments: str | None = None
    status: ReviewStatus = "Completed"


class PerformanceUpdate(BaseModel):
    overall_score: float | None = Field(default=None, ge=1.0, le=5.0)
    goals: list[str] | str | None = None
    strengths: list[str] | str | None = None
    areas_for_improvement: list[str] | str | None = None
    manager_comments: str | None = None
    comments: str | None = None
    status: ReviewStatus | None = None


class PerformanceResponse(BaseModel):
    review_id: str
    employee_id: str
    employee_name: str | None = None
    department: str | None = None
    review_period: str
    period: str | None = None
    overall_score: float
    goals_rating: float | None = None
    goals: list[str] | str = []
    strengths: list[str] | str = []
    areas_for_improvement: list[str] | str = []
    manager_comments: str | None = ""
    comments: str | None = ""
    status: ReviewStatus
    reviewer_id: str | None = None
    reviewer_name: str | None = None
    updated_at: str | None = None


class PerformanceAnalytics(BaseModel):
    average_score: float
    total_reviews: int
    department_averages: list[dict]
    score_distribution: dict[str, int]  # e.g. "1-2": 5, "2-3": 15, "3-4": 80, "4-5": 100
