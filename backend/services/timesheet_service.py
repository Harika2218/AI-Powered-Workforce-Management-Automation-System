import uuid
from typing import Any
from fastapi import HTTPException, status
from pymongo import DESCENDING
from backend.database import get_db
from backend.models.base import serialize_doc
from backend.utils.helpers import log_audit, create_notification, now_iso
from backend.utils.permissions import get_manager_team_ids, verify_employee_access
from backend.schemas.timesheet import TimesheetCreate, TimesheetUpdate, TimesheetReview


class TimesheetService:
    @staticmethod
    def create_timesheet(current_user: dict, payload: TimesheetCreate) -> dict:
        db = get_db()
        emp_id = payload.employee_id or current_user.get("employee_id")
        if not emp_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee ID is required")

        verify_employee_access(current_user, emp_id)

        ts_id = f"TS-{uuid.uuid4().hex[:8].upper()}"
        doc = {
            "timesheet_id": ts_id,
            "employee_id": emp_id,
            "date": payload.date,
            "project_name": payload.project_name,
            "task_name": payload.task_name,
            "hours_worked": payload.hours_worked,
            "description": payload.description,
            "status": "Submitted",
            "approved_by": None,
            "reviewed_at": None,
            "comments": None,
            "created_at": now_iso(),
        }
        db["timesheets"].insert_one(doc)

        log_audit(
            user_id=current_user["user_id"],
            action="TIMESHEET_SUBMITTED",
            entity_type="TIMESHEET",
            entity_id=ts_id,
            metadata={"employee_id": emp_id, "hours": payload.hours_worked, "date": payload.date},
        )

        return serialize_doc(db["timesheets"].find_one({"timesheet_id": ts_id}))

    @staticmethod
    def update_timesheet(current_user: dict, timesheet_id: str, payload: TimesheetUpdate) -> dict:
        db = get_db()
        ts = db["timesheets"].find_one({"timesheet_id": timesheet_id})
        if not ts:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet record not found")

        verify_employee_access(current_user, ts["employee_id"])

        if ts["status"] == "Approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify a timesheet that has already been approved",
            )

        updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        if updates:
            updates["status"] = "Submitted"  # Resubmits if modified
            updates["updated_at"] = now_iso()
            db["timesheets"].update_one({"timesheet_id": timesheet_id}, {"$set": updates})

        log_audit(
            user_id=current_user["user_id"],
            action="TIMESHEET_UPDATED",
            entity_type="TIMESHEET",
            entity_id=timesheet_id,
            metadata=updates,
        )

        return serialize_doc(db["timesheets"].find_one({"timesheet_id": timesheet_id}))

    @staticmethod
    def approve_timesheet(current_user: dict, timesheet_id: str, review: TimesheetReview) -> dict:
        db = get_db()
        ts = db["timesheets"].find_one({"timesheet_id": timesheet_id})
        if not ts:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found")

        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")

        emp = db["employees"].find_one({"employee_id": ts["employee_id"]})
        if role == "MANAGER" and emp and emp.get("manager_id") != user_emp_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot approve timesheet outside your team")

        now_str = now_iso()
        db["timesheets"].update_one(
            {"timesheet_id": timesheet_id},
            {
                "$set": {
                    "status": "Approved",
                    "approved_by": user_emp_id or current_user["user_id"],
                    "reviewed_at": now_str,
                    "comments": review.comments,
                }
            },
        )

        log_audit(
            user_id=current_user["user_id"],
            action="TIMESHEET_APPROVED",
            entity_type="TIMESHEET",
            entity_id=timesheet_id,
            metadata={"employee_id": ts["employee_id"], "hours": ts["hours_worked"]},
        )

        target_user = db["users"].find_one({"employee_id": ts["employee_id"]})
        if target_user:
            create_notification(
                user_id=target_user["user_id"],
                title="Timesheet Approved",
                message=f"Your timesheet for {ts['date']} ({ts['hours_worked']} hrs) was approved.",
                type="timesheet",
            )

        return serialize_doc(db["timesheets"].find_one({"timesheet_id": timesheet_id}))

    @staticmethod
    def reject_timesheet(current_user: dict, timesheet_id: str, review: TimesheetReview) -> dict:
        db = get_db()
        ts = db["timesheets"].find_one({"timesheet_id": timesheet_id})
        if not ts:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found")

        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")

        emp = db["employees"].find_one({"employee_id": ts["employee_id"]})
        if role == "MANAGER" and emp and emp.get("manager_id") != user_emp_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot reject timesheet outside your team")

        now_str = now_iso()
        db["timesheets"].update_one(
            {"timesheet_id": timesheet_id},
            {
                "$set": {
                    "status": "Rejected",
                    "approved_by": user_emp_id or current_user["user_id"],
                    "reviewed_at": now_str,
                    "comments": review.comments,
                }
            },
        )

        log_audit(
            user_id=current_user["user_id"],
            action="TIMESHEET_REJECTED",
            entity_type="TIMESHEET",
            entity_id=timesheet_id,
            metadata={"employee_id": ts["employee_id"], "comments": review.comments},
        )

        target_user = db["users"].find_one({"employee_id": ts["employee_id"]})
        if target_user:
            create_notification(
                user_id=target_user["user_id"],
                title="Timesheet Rejected",
                message=f"Your timesheet for {ts['date']} requires revisions: {review.comments or 'Contact manager'}",
                type="timesheet",
            )

        return serialize_doc(db["timesheets"].find_one({"timesheet_id": timesheet_id}))

    @staticmethod
    def get_timesheets(
        current_user: dict,
        status_filter: str | None = None,
        employee_id: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
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
        if date_from and date_to:
            query["date"] = {"$gte": date_from, "$lte": date_to}
        elif date_from:
            query["date"] = {"$gte": date_from}
        elif date_to:
            query["date"] = {"$lte": date_to}

        total = db["timesheets"].count_documents(query)
        skip = (page - 1) * page_size
        cursor = db["timesheets"].find(query).sort("date", DESCENDING).skip(skip).limit(page_size)

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
            items.append(d)

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
