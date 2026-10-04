from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from backend.database import get_db
from backend.config import get_settings
from backend.utils.security import (
    verify_password,
    hash_password,
    create_access_token,
    generate_secure_token,
)
from backend.utils.helpers import log_audit, create_notification, now_iso
from backend.schemas.auth import (
    LoginRequest,
    TokenResponse,
    ActivationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)


class AuthService:
    @staticmethod
    def login(req: LoginRequest) -> TokenResponse:
        db = get_db()
        email_clean = req.email.lower().strip()
        user = db["users"].find_one({"email": email_clean})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if user.get("status") == "deactivated":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated. Please contact your HR administrator.",
            )

        if user.get("status") == "invited" or not user.get("password_hash"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account has not been activated yet. Please activate your account first.",
            )

        if not verify_password(req.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        emp_doc = None
        if user.get("employee_id"):
            emp_doc = db["employees"].find_one({"employee_id": user["employee_id"]})

        full_name = emp_doc.get("full_name") if emp_doc else user.get("email")

        # Generate JWT token
        token_payload = {
            "sub": user["email"],
            "role": user["role"],
            "user_id": user["user_id"],
            "employee_id": user.get("employee_id"),
        }
        access_token = create_access_token(token_payload)

        # Log audit
        log_audit(
            user_id=user["user_id"],
            action="USER_LOGIN",
            entity_type="USER",
            entity_id=user["user_id"],
            metadata={"email": user["email"], "role": user["role"]},
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            role=user["role"],
            employee_id=user.get("employee_id"),
            email=user["email"],
            full_name=full_name,
            first_login=user.get("first_login", False),
        )

    @staticmethod
    def activate_account(req: ActivationRequest) -> dict:
        db = get_db()
        email_clean = req.email.lower().strip()
        user = db["users"].find_one({"email": email_clean})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found matching this email address",
            )

        token_doc = db["auth_tokens"].find_one({
            "email": email_clean,
            "token": req.token.strip(),
            "type": "activation",
            "used": False,
        })

        if not token_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired activation token",
            )

        expires_at = datetime.fromisoformat(token_doc["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Activation token has expired. Please request a new invitation from HR.",
            )

        # Hash new password
        pw_hash = hash_password(req.new_password)
        now_str = now_iso()

        db["users"].update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "password_hash": pw_hash,
                    "status": "active",
                    "first_login": False,
                    "updated_at": now_str,
                }
            },
        )

        # Mark token as used
        db["auth_tokens"].update_one({"_id": token_doc["_id"]}, {"$set": {"used": True, "used_at": now_str}})

        log_audit(
            user_id=user["user_id"],
            action="ACCOUNT_ACTIVATED",
            entity_type="USER",
            entity_id=user["user_id"],
            metadata={"email": user["email"]},
        )

        create_notification(
            user_id=user["user_id"],
            title="Account Successfully Activated",
            message="Your account is now fully active. You may now log in using your new password.",
            type="auth",
        )

        return {"message": "Account successfully activated. You can now log in."}

    @staticmethod
    def forgot_password(req: ForgotPasswordRequest) -> dict:
        db = get_db()
        settings = get_settings()
        email_clean = req.email.lower().strip()
        user = db["users"].find_one({"email": email_clean})

        if not user or user.get("status") == "deactivated":
            # Return uniform response to prevent user enumeration
            return {
                "message": "If an active account exists for this email, password reset instructions have been generated.",
                "reset_token": None,
            }

        reset_token = f"RESET-{generate_secure_token(16)}"
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=settings.RESET_TOKEN_EXPIRE_HOURS)).isoformat()

        db["auth_tokens"].insert_one({
            "token": reset_token,
            "email": email_clean,
            "type": "password_reset",
            "expires_at": expires_at,
            "used": False,
            "created_at": now_iso(),
        })

        log_audit(
            user_id=user["user_id"],
            action="PASSWORD_RESET_REQUESTED",
            entity_type="USER",
            entity_id=user["user_id"],
        )

        return {
            "message": "Password reset token generated successfully.",
            "reset_token": reset_token,  # Provided in prototype environment for testing
        }

    @staticmethod
    def reset_password(req: ResetPasswordRequest) -> dict:
        db = get_db()
        token_doc = db["auth_tokens"].find_one({
            "token": req.token.strip(),
            "type": "password_reset",
            "used": False,
        })

        if not token_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token",
            )

        expires_at = datetime.fromisoformat(token_doc["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset token has expired",
            )

        email = token_doc["email"]
        user = db["users"].find_one({"email": email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not found",
            )

        pw_hash = hash_password(req.new_password)
        now_str = now_iso()

        db["users"].update_one(
            {"_id": user["_id"]},
            {"$set": {"password_hash": pw_hash, "updated_at": now_str}},
        )

        db["auth_tokens"].update_one(
            {"_id": token_doc["_id"]},
            {"$set": {"used": True, "used_at": now_str}},
        )

        log_audit(
            user_id=user["user_id"],
            action="PASSWORD_RESET_COMPLETED",
            entity_type="USER",
            entity_id=user["user_id"],
        )

        create_notification(
            user_id=user["user_id"],
            title="Password Reset Successful",
            message="Your password was successfully updated. If you did not initiate this change, contact HR immediately.",
            type="auth",
        )

        return {"message": "Password has been successfully updated. You may now log in with your new password."}

    @staticmethod
    def change_password(current_user: dict, req: ChangePasswordRequest) -> dict:
        db = get_db()
        user = db["users"].find_one({"_id": current_user["_id"] if "_id" in current_user else {"$exists": True}})
        if not user:
            user = db["users"].find_one({"user_id": current_user["user_id"]})

        if not verify_password(req.old_password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password",
            )

        pw_hash = hash_password(req.new_password)
        now_str = now_iso()

        db["users"].update_one(
            {"user_id": user["user_id"]},
            {"$set": {"password_hash": pw_hash, "updated_at": now_str}},
        )

        log_audit(
            user_id=user["user_id"],
            action="PASSWORD_CHANGED",
            entity_type="USER",
            entity_id=user["user_id"],
        )

        return {"message": "Password changed successfully."}
