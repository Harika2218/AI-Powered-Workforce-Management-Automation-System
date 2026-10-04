from pydantic import BaseModel
from typing import Any, Generic, TypeVar

T = TypeVar("T")


class MessageResponse(BaseModel):
    message: str
    detail: str | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
