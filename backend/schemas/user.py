from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field

RoleType = Literal["HR", "MANAGER", "EMPLOYEE"]
StatusType = Literal["invited", "active", "deactivated"]


class UserBase(BaseModel):
    email: EmailStr
    role: RoleType = "EMPLOYEE"
    employee_id: str | None = None
    status: StatusType = "invited"


class UserCreate(UserBase):
    password: str | None = None


class UserUpdate(BaseModel):
    role: RoleType | None = None
    status: StatusType | None = None


class UserResponse(BaseModel):
    user_id: str
    email: EmailStr
    role: RoleType
    employee_id: str | None = None
    status: StatusType
    first_login: bool
    created_at: str | None = None
    updated_at: str | None = None
