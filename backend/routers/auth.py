from fastapi import APIRouter, Depends, status
from backend.schemas.auth import (
    LoginRequest,
    TokenResponse,
    ActivationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)
from backend.schemas.common import MessageResponse
from backend.services.auth_service import AuthService
from backend.utils.permissions import get_current_user
from backend.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, summary="User Login")
def login(payload: LoginRequest):
    """
    Authenticate with email and password.
    Returns JWT access token with role and user details directly from MongoDB.
    """
    return AuthService.login(payload)


@router.post("/activate", response_model=MessageResponse, summary="First-Time Account Activation")
def activate_account(payload: ActivationRequest):
    """
    Activate an invited account using registered email and valid activation token.
    Sets user password and changes status to active.
    """
    return AuthService.activate_account(payload)


@router.post("/forgot-password", summary="Request Password Reset")
def forgot_password(payload: ForgotPasswordRequest):
    """
    Initiate password reset flow for registered email.
    Generates a secure temporary reset token.
    """
    return AuthService.forgot_password(payload)


@router.post("/reset-password", response_model=MessageResponse, summary="Reset Password with Token")
def reset_password(payload: ResetPasswordRequest):
    """
    Reset password using a valid reset token.
    """
    return AuthService.reset_password(payload)


@router.post("/change-password", response_model=MessageResponse, summary="Change Password")
def change_password(payload: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """
    Change account password for currently authenticated user.
    """
    return AuthService.change_password(current_user, payload)


@router.get("/me", summary="Current User Profile")
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Retrieve authentication and profile information for the current user.
    """
    db = get_db()
    emp = None
    if current_user.get("employee_id"):
        emp = db["employees"].find_one({"employee_id": current_user["employee_id"]})
        if emp and "_id" in emp:
            emp["id"] = str(emp.pop("_id"))

    # Mask sensitive password hash
    safe_user = {
        "user_id": current_user.get("user_id"),
        "email": current_user.get("email"),
        "role": current_user.get("role"),
        "employee_id": current_user.get("employee_id"),
        "status": current_user.get("status"),
        "first_login": current_user.get("first_login"),
        "created_at": current_user.get("created_at"),
    }

    return {
        "user": safe_user,
        "employee": emp,
    }
