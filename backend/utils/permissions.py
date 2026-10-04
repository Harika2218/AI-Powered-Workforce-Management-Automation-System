from typing import Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.database import get_db
from backend.utils.security import decode_access_token

security_bearer = HTTPBearer(auto_error=True)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)) -> dict:
    """Dependency to retrieve and validate the currently authenticated user from the database."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload["sub"]
    db = get_db()
    user = db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.get("status") == "deactivated":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact HR.",
        )

    # Convert ObjectId to string for safe serialization
    if "_id" in user:
        user["id"] = str(user["_id"])

    return user


def require_role(allowed_roles: list[str]) -> Callable:
    """Dependency factory to enforce role-based access control (RBAC)."""
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of the following roles: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker


def require_hr(current_user: dict = Depends(get_current_user)) -> dict:
    """Enforces HR-only access."""
    if current_user.get("role") != "HR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: HR privileges required",
        )
    return current_user


def require_manager_or_hr(current_user: dict = Depends(get_current_user)) -> dict:
    """Enforces Manager or HR access."""
    if current_user.get("role") not in ["HR", "MANAGER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Manager or HR privileges required",
        )
    return current_user


def get_manager_team_ids(manager_employee_id: str) -> list[str]:
    """Retrieve all employee_ids directly reporting to this manager."""
    db = get_db()
    cursor = db["employees"].find({"manager_id": manager_employee_id}, {"employee_id": 1})
    return [doc["employee_id"] for doc in cursor]


def verify_employee_access(current_user: dict, target_employee_id: str) -> None:
    """
    Verify if the current user has authorization to view or act on target_employee_id.
    - HR: Organization-wide access.
    - MANAGER: Can access their own data or employees assigned to their team.
    - EMPLOYEE: Can ONLY access their own data.
    """
    user_role = current_user.get("role")
    user_emp_id = current_user.get("employee_id")

    # HR has organization-wide access
    if user_role == "HR":
        return

    # Employee can only access self
    if user_role == "EMPLOYEE":
        if user_emp_id != target_employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You can only access your own information",
            )
        return

    # Manager can access self or direct team members
    if user_role == "MANAGER":
        if user_emp_id == target_employee_id:
            return
        team_ids = get_manager_team_ids(user_emp_id)
        if target_employee_id not in team_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You can only access employees in your assigned team",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access forbidden",
    )
