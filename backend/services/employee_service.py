import uuid
from typing import Any
from fastapi import HTTPException, status
from pymongo import ASCENDING, DESCENDING
from backend.database import get_db
from backend.models.base import serialize_doc
from backend.utils.helpers import log_audit, create_notification, now_iso
from backend.utils.permissions import get_manager_team_ids, verify_employee_access
from backend.utils.security import generate_secure_token
from backend.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeProfilePatch,
    EmployeeStatusUpdate,
)


class EmployeeService:
    @staticmethod
    def get_employees(
        current_user: dict,
        search: str | None = None,
        department: str | None = None,
        status_filter: str | None = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "employee_id",
        sort_order: str = "asc",
    ) -> dict[str, Any]:
        db = get_db()
        query: dict[str, Any] = {}

        # RBAC Filtering
        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")

        if role == "MANAGER":
            team_ids = get_manager_team_ids(user_emp_id)
            # Manager sees team members plus themselves
            query["employee_id"] = {"$in": team_ids + [user_emp_id]}
        elif role == "EMPLOYEE":
            # Employees only see directory without sensitive salary, or can only fetch themselves
            # Let directory view exist for search/collaboration, but sensitive data masked
            pass

        if department:
            query["department"] = department
        if status_filter:
            query["employment_status"] = status_filter
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"first_name": search_regex},
                {"last_name": search_regex},
                {"full_name": search_regex},
                {"email": search_regex},
                {"employee_id": search_regex},
                {"designation": search_regex},
            ]

        total = db["employees"].count_documents(query)
        sort_dir = ASCENDING if sort_order.lower() == "asc" else DESCENDING
        skip = (page - 1) * page_size

        cursor = db["employees"].find(query).sort(sort_by, sort_dir).skip(skip).limit(page_size)

        items = []
        for doc in cursor:
            doc = serialize_doc(doc)
            # Mask salary if user is employee or manager inspecting another employee outside HR
            if role == "EMPLOYEE" and doc["employee_id"] != user_emp_id:
                doc["salary"] = None
                doc["allowances"] = None
            elif role == "MANAGER" and doc["employee_id"] != user_emp_id:
                doc["salary"] = None
                doc["allowances"] = None
            items.append(doc)

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    @staticmethod
    def get_employee_by_id(current_user: dict, employee_id: str) -> dict:
        verify_employee_access(current_user, employee_id)
        db = get_db()
        emp = db["employees"].find_one({"employee_id": employee_id})
        if not emp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee '{employee_id}' not found",
            )
        emp = serialize_doc(emp)

        # Mask salary if manager viewing team member (only HR or self can see salary)
        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")
        if role == "MANAGER" and employee_id != user_emp_id:
            emp["salary"] = None
            emp["allowances"] = None

        return emp

    @staticmethod
    def create_employee(current_user: dict, payload: EmployeeCreate) -> dict:
        db = get_db()
        # Verify employee_id unique
        if db["employees"].find_one({"employee_id": payload.employee_id}):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Employee ID '{payload.employee_id}' already exists",
            )
        # Verify email unique
        email_clean = payload.email.lower().strip()
        if db["employees"].find_one({"email": email_clean}) or db["users"].find_one({"email": email_clean}):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email address '{payload.email}' is already in use",
            )
        # Verify manager_id exists if provided
        if payload.manager_id:
            mgr = db["employees"].find_one({"employee_id": payload.manager_id})
            if not mgr:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Specified manager_id '{payload.manager_id}' does not exist",
                )

        now_str = now_iso()
        emp_doc = {
            "employee_id": payload.employee_id,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "full_name": f"{payload.first_name} {payload.last_name}",
            "email": email_clean,
            "phone": payload.phone,
            "department": payload.department,
            "designation": payload.designation,
            "manager_id": payload.manager_id,
            "date_of_joining": payload.date_of_joining,
            "employment_type": payload.employment_type,
            "employment_status": payload.employment_status,
            "location": payload.location,
            "salary": payload.salary,
            "allowances": payload.allowances,
            "skills": payload.skills,
            "leave_balances": payload.leave_entitlement.model_dump(),
            "shift_id": payload.shift_id,
            "created_at": now_str,
            "updated_at": now_str,
        }
        db["employees"].insert_one(emp_doc)

        # Create corresponding User record with status='invited' and first_login=True
        user_id = f"USR-{payload.employee_id}"
        db["users"].insert_one({
            "user_id": user_id,
            "email": email_clean,
            "password_hash": None,
            "role": payload.role,
            "employee_id": payload.employee_id,
            "status": "invited",
            "first_login": True,
            "created_at": now_str,
            "updated_at": now_str,
        })

        # Generate activation token
        activation_token = f"ACTIVATE-{generate_secure_token(12)}"
        from datetime import timedelta, timezone, datetime
        db["auth_tokens"].insert_one({
            "token": activation_token,
            "email": email_clean,
            "type": "activation",
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "used": False,
            "created_at": now_str,
        })

        log_audit(
            user_id=current_user["user_id"],
            action="EMPLOYEE_CREATED",
            entity_type="EMPLOYEE",
            entity_id=payload.employee_id,
            metadata={"email": email_clean, "role": payload.role, "department": payload.department},
        )

        created_emp = serialize_doc(db["employees"].find_one({"employee_id": payload.employee_id}))
        created_emp["activation_token"] = activation_token
        return created_emp

    @staticmethod
    def update_employee(current_user: dict, employee_id: str, payload: EmployeeUpdate) -> dict:
        db = get_db()
        emp = db["employees"].find_one({"employee_id": employee_id})
        if not emp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee '{employee_id}' not found",
            )

        update_dict = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        if "first_name" in update_dict or "last_name" in update_dict:
            first = update_dict.get("first_name", emp["first_name"])
            last = update_dict.get("last_name", emp["last_name"])
            update_dict["full_name"] = f"{first} {last}"

        if "manager_id" in update_dict and update_dict["manager_id"]:
            mgr = db["employees"].find_one({"employee_id": update_dict["manager_id"]})
            if not mgr:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Manager '{update_dict['manager_id']}' does not exist",
                )

        update_dict["updated_at"] = now_iso()
        db["employees"].update_one({"employee_id": employee_id}, {"$set": update_dict})

        # Sync email to users collection if updated
        if "email" in update_dict:
            db["users"].update_one(
                {"employee_id": employee_id},
                {"$set": {"email": update_dict["email"], "updated_at": update_dict["updated_at"]}},
            )

        log_audit(
            user_id=current_user["user_id"],
            action="EMPLOYEE_UPDATED",
            entity_type="EMPLOYEE",
            entity_id=employee_id,
            metadata=update_dict,
        )

        return serialize_doc(db["employees"].find_one({"employee_id": employee_id}))

    @staticmethod
    def patch_own_profile(current_user: dict, payload: EmployeeProfilePatch) -> dict:
        db = get_db()
        emp_id = current_user.get("employee_id")
        if not emp_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has no linked employee profile")

        update_dict = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        if not update_dict:
            return serialize_doc(db["employees"].find_one({"employee_id": emp_id}))

        update_dict["updated_at"] = now_iso()
        db["employees"].update_one({"employee_id": emp_id}, {"$set": update_dict})

        log_audit(
            user_id=current_user["user_id"],
            action="PROFILE_SELF_UPDATED",
            entity_type="EMPLOYEE",
            entity_id=emp_id,
            metadata=update_dict,
        )

        return serialize_doc(db["employees"].find_one({"employee_id": emp_id}))

    @staticmethod
    def update_status(current_user: dict, employee_id: str, payload: EmployeeStatusUpdate) -> dict:
        db = get_db()
        emp = db["employees"].find_one({"employee_id": employee_id})
        if not emp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee '{employee_id}' not found",
            )

        now_str = now_iso()
        db["employees"].update_one(
            {"employee_id": employee_id},
            {"$set": {"employment_status": payload.employment_status, "updated_at": now_str}},
        )

        # If deactivated, deactivate user account as well
        user_status = "deactivated" if payload.employment_status == "Inactive" else "active"
        db["users"].update_one(
            {"employee_id": employee_id},
            {"$set": {"status": user_status, "updated_at": now_str}},
        )

        log_audit(
            user_id=current_user["user_id"],
            action="EMPLOYEE_STATUS_CHANGED",
            entity_type="EMPLOYEE",
            entity_id=employee_id,
            metadata={"employment_status": payload.employment_status, "user_status": user_status},
        )

        return serialize_doc(db["employees"].find_one({"employee_id": employee_id}))
