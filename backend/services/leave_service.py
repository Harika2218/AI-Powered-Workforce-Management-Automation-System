import uuid
from datetime import datetime, timezone
from typing import Any
from fastapi import HTTPException, status
from pymongo import DESCENDING
from backend.database import get_db
from backend.models.base import serialize_doc
from backend.utils.helpers import log_audit, create_notification, count_days_inclusive, now_iso
from backend.utils.permissions import get_manager_team_ids, verify_employee_access
from backend.schemas.leave import LeaveCreate, LeaveReview


class LeaveService:
    @staticmethod
    def apply_leave(current_user: dict, payload: LeaveCreate) -> dict:
        db = get_db()
        emp_id = payload.employee_id or current_user.get("employee_id")
        if not emp_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee ID is required")

        verify_employee_access(current_user, emp_id)

        # 1. Date validation
        try:
            start_dt = datetime.strptime(payload.start_date, "%Y-%m-%d").date()
            end_dt = datetime.strptime(payload.end_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid date format, expected YYYY-MM-DD")

        if end_dt < start_dt:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date cannot be earlier than start date")

        # 2. Check for overlapping requests
        overlap = db["leave_requests"].find_one({
            "employee_id": emp_id,
            "status": {"$in": ["Pending", "Approved"]},
            "$or": [
                {"start_date": {"$lte": payload.end_date}, "end_date": {"$gte": payload.start_date}},
            ],
        })
        if overlap:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Overlapping leave request already exists ({overlap['leave_type']} from {overlap['start_date']} to {overlap['end_date']} - {overlap['status']})",
            )

        # 3. Check leave balance
        emp = db["employees"].find_one({"employee_id": emp_id})
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        total_days = count_days_inclusive(payload.start_date, payload.end_date)
        leave_key = payload.leave_type.lower()
        current_balance = emp.get("leave_balances", {}).get(leave_key, 0)

        if total_days > current_balance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient {payload.leave_type} leave balance. Requested: {total_days} days, Available: {current_balance} days.",
            )

        leave_id = f"LEV-{uuid.uuid4().hex[:8].upper()}"
        now_str = now_iso()

        leave_doc = {
            "leave_id": leave_id,
            "employee_id": emp_id,
            "leave_type": payload.leave_type,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "total_days": total_days,
            "reason": payload.reason,
            "status": "Pending",
            "applied_at": now_str,
            "reviewed_by": None,
            "reviewed_at": None,
            "comments": None,
        }
        db["leave_requests"].insert_one(leave_doc)

        log_audit(
            user_id=current_user["user_id"],
            action="LEAVE_REQUESTED",
            entity_type="LEAVE",
            entity_id=leave_id,
            metadata={"employee_id": emp_id, "days": total_days, "type": payload.leave_type},
        )

        # Notify manager if exists
        if emp.get("manager_id"):
            mgr_user = db["users"].find_one({"employee_id": emp["manager_id"]})
            if mgr_user:
                create_notification(
                    user_id=mgr_user["user_id"],
                    title="New Leave Request Pending Approval",
                    message=f"{emp['full_name']} requested {total_days} days {payload.leave_type} leave.",
                    type="leave",
                )

        return serialize_doc(db["leave_requests"].find_one({"leave_id": leave_id}))

    @staticmethod
    def approve_leave(current_user: dict, leave_id: str, review: LeaveReview) -> dict:
        db = get_db()
        leave = db["leave_requests"].find_one({"leave_id": leave_id})
        if not leave:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

        if leave["status"] != "Pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Leave request is already {leave['status']}",
            )

        # Check permission: HR or manager of this employee
        emp = db["employees"].find_one({"employee_id": leave["employee_id"]})
        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")

        if role == "EMPLOYEE":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employees cannot approve leave requests")
        if role == "MANAGER" and emp and emp.get("manager_id") != user_emp_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only approve leave for your direct team")

        # Verify balance again before deducting
        leave_key = leave["leave_type"].lower()
        current_balance = emp.get("leave_balances", {}).get(leave_key, 0)
        if leave["total_days"] > current_balance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee has insufficient balance ({current_balance} days available, needs {leave['total_days']})",
            )

        new_balance = current_balance - leave["total_days"]
        now_str = now_iso()

        # Deduct balance from employee
        db["employees"].update_one(
            {"employee_id": leave["employee_id"]},
            {"$set": {f"leave_balances.{leave_key}": new_balance, "updated_at": now_str}},
        )

        # Update leave request
        db["leave_requests"].update_one(
            {"leave_id": leave_id},
            {
                "$set": {
                    "status": "Approved",
                    "reviewed_by": user_emp_id or current_user["user_id"],
                    "reviewed_at": now_str,
                    "comments": review.comments,
                }
            },
        )

        log_audit(
            user_id=current_user["user_id"],
            action="LEAVE_APPROVED",
            entity_type="LEAVE",
            entity_id=leave_id,
            metadata={"employee_id": leave["employee_id"], "deducted_days": leave["total_days"], "new_balance": new_balance},
        )

        # Notify employee
        target_user = db["users"].find_one({"employee_id": leave["employee_id"]})
        if target_user:
            create_notification(
                user_id=target_user["user_id"],
                title="Leave Request Approved",
                message=f"Your {leave['leave_type']} leave from {leave['start_date']} to {leave['end_date']} has been approved.",
                type="leave",
            )

        return serialize_doc(db["leave_requests"].find_one({"leave_id": leave_id}))

    @staticmethod
    def reject_leave(current_user: dict, leave_id: str, review: LeaveReview) -> dict:
        db = get_db()
        leave = db["leave_requests"].find_one({"leave_id": leave_id})
        if not leave:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

        if leave["status"] != "Pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Leave request is already {leave['status']}",
            )

        emp = db["employees"].find_one({"employee_id": leave["employee_id"]})
        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")

        if role == "EMPLOYEE":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employees cannot reject leave requests")
        if role == "MANAGER" and emp and emp.get("manager_id") != user_emp_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only review leave for your direct team")

        now_str = now_iso()
        db["leave_requests"].update_one(
            {"leave_id": leave_id},
            {
                "$set": {
                    "status": "Rejected",
                    "reviewed_by": user_emp_id or current_user["user_id"],
                    "reviewed_at": now_str,
                    "comments": review.comments,
                }
            },
        )

        log_audit(
            user_id=current_user["user_id"],
            action="LEAVE_REJECTED",
            entity_type="LEAVE",
            entity_id=leave_id,
            metadata={"employee_id": leave["employee_id"], "reason": review.comments},
        )

        target_user = db["users"].find_one({"employee_id": leave["employee_id"]})
        if target_user:
            create_notification(
                user_id=target_user["user_id"],
                title="Leave Request Rejected",
                message=f"Your {leave['leave_type']} leave request has been rejected. Comments: {review.comments or 'None'}",
                type="leave",
            )

        return serialize_doc(db["leave_requests"].find_one({"leave_id": leave_id}))

    @staticmethod
    def cancel_leave(current_user: dict, leave_id: str) -> dict:
        db = get_db()
        leave = db["leave_requests"].find_one({"leave_id": leave_id})
        if not leave:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

        verify_employee_access(current_user, leave["employee_id"])

        if leave["status"] in ["Cancelled", "Rejected"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel a request that is already {leave['status']}",
            )

        now_str = now_iso()
        # If it was already Approved, restore the balance!
        if leave["status"] == "Approved":
            leave_key = leave["leave_type"].lower()
            db["employees"].update_one(
                {"employee_id": leave["employee_id"]},
                {"$inc": {f"leave_balances.{leave_key}": leave["total_days"]}, "$set": {"updated_at": now_str}},
            )

        db["leave_requests"].update_one(
            {"leave_id": leave_id},
            {"$set": {"status": "Cancelled", "updated_at": now_str}},
        )

        log_audit(
            user_id=current_user["user_id"],
            action="LEAVE_CANCELLED",
            entity_type="LEAVE",
            entity_id=leave_id,
            metadata={"employee_id": leave["employee_id"], "restored_days": leave["total_days"] if leave["status"] == "Approved" else 0},
        )

        return serialize_doc(db["leave_requests"].find_one({"leave_id": leave_id}))

    @staticmethod
    def get_leaves(
        current_user: dict,
        status_filter: str | None = None,
        employee_id: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        db = get_db()
        query: dict[str, Any] = {}
        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")

        if role == "EMPLOYEE":
            query["employee_id"] = user_emp_id
        elif role == "MANAGER":
            team_ids = get_manager_team_ids(user_emp_id)
            allowed = team_ids + [user_emp_id]
            if employee_id:
                if employee_id not in allowed:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access outside team")
                query["employee_id"] = employee_id
            else:
                query["employee_id"] = {"$in": allowed}
        elif role == "HR":
            if employee_id:
                query["employee_id"] = employee_id

        if status_filter:
            query["status"] = status_filter

        total = db["leave_requests"].count_documents(query)
        skip = (page - 1) * page_size
        cursor = db["leave_requests"].find(query).sort("applied_at", DESCENDING).skip(skip).limit(page_size)

        emp_map = {
            e["employee_id"]: (e["full_name"], e["department"])
            for e in db["employees"].find({}, {"employee_id": 1, "full_name": 1, "department": 1})
        }

        items = []
        for doc in cursor:
            d = serialize_doc(doc)
            emp_info = emp_map.get(d["employee_id"], (None, None))
            d["employee_name"] = emp_info[0]
            d["department"] = emp_info[1]
            d["request_id"] = d.get("leave_id")
            d["days_count"] = d.get("total_days")
            items.append(d)

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    @staticmethod
    def get_leave_balance(current_user: dict, employee_id: str | None = None) -> dict:
        emp_id = employee_id or current_user.get("employee_id")
        if not emp_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee ID required")

        verify_employee_access(current_user, emp_id)
        db = get_db()
        emp = db["employees"].find_one({"employee_id": emp_id})
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        balances = emp.get("leave_balances", {"annual": 18, "sick": 10, "casual": 7})
        return {
            "employee_id": emp_id,
            "annual": balances.get("annual", 0),
            "sick": balances.get("sick", 0),
            "casual": balances.get("casual", 0),
        }
