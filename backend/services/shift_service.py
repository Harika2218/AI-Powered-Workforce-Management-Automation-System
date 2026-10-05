from fastapi import HTTPException, status
from backend.database import get_db
from backend.models.base import serialize_doc
from backend.utils.helpers import log_audit, create_notification, now_iso
from backend.utils.permissions import get_manager_team_ids
from backend.schemas.shift import ShiftCreate, ShiftUpdate, ShiftAssign


class ShiftService:
    @staticmethod
    def get_all_shifts() -> list[dict]:
        db = get_db()
        cursor = db["shifts"].find({})
        return [serialize_doc(doc) for doc in cursor]

    @staticmethod
    def create_shift(current_user: dict, payload: ShiftCreate) -> dict:
        db = get_db()
        if db["shifts"].find_one({"shift_id": payload.shift_id}):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Shift ID already exists")

        doc = payload.model_dump()
        db["shifts"].insert_one(doc)

        log_audit(
            user_id=current_user["user_id"],
            action="SHIFT_CREATED",
            entity_type="SHIFT",
            entity_id=payload.shift_id,
            metadata=doc,
        )

        return serialize_doc(db["shifts"].find_one({"shift_id": payload.shift_id}))

    @staticmethod
    def update_shift(current_user: dict, shift_id: str, payload: ShiftUpdate) -> dict:
        db = get_db()
        shift = db["shifts"].find_one({"shift_id": shift_id})
        if not shift:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")

        updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        if updates:
            db["shifts"].update_one({"shift_id": shift_id}, {"$set": updates})

        log_audit(
            user_id=current_user["user_id"],
            action="SHIFT_UPDATED",
            entity_type="SHIFT",
            entity_id=shift_id,
            metadata=updates,
        )

        return serialize_doc(db["shifts"].find_one({"shift_id": shift_id}))

    @staticmethod
    def assign_shift(current_user: dict, payload: ShiftAssign) -> dict:
        db = get_db()
        emp = db["employees"].find_one({"employee_id": payload.employee_id})
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

        shift = db["shifts"].find_one({"shift_id": payload.shift_id})
        if not shift:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift definition not found")

        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")
        if role == "MANAGER" and emp.get("manager_id") != user_emp_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Managers can only assign shifts to their own team")

        db["employees"].update_one(
            {"employee_id": payload.employee_id},
            {"$set": {"shift_id": payload.shift_id, "updated_at": now_iso()}},
        )

        log_audit(
            user_id=current_user["user_id"],
            action="SHIFT_ASSIGNED",
            entity_type="SHIFT",
            entity_id=payload.shift_id,
            metadata={"employee_id": payload.employee_id, "shift_id": payload.shift_id},
        )

        target_user = db["users"].find_one({"employee_id": payload.employee_id})
        if target_user:
            create_notification(
                user_id=target_user["user_id"],
                title="Shift Assignment Updated",
                message=f"You have been assigned to shift: {shift['name']} ({shift['start_time']} - {shift['end_time']})",
                type="shift",
            )

        return {
            "message": f"Successfully assigned shift '{shift['name']}' to employee {payload.employee_id}",
            "shift": serialize_doc(shift),
        }

    @staticmethod
    def get_my_shift(current_user: dict) -> dict:
        db = get_db()
        emp_id = current_user.get("employee_id")
        emp = db["employees"].find_one({"employee_id": emp_id})
        if not emp or not emp.get("shift_id"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No shift assigned")

        shift = db["shifts"].find_one({"shift_id": emp["shift_id"]})
        return {
            "employee_id": emp_id,
            "employee_name": emp["full_name"],
            "department": emp["department"],
            "shift": serialize_doc(shift),
        }

    @staticmethod
    def get_team_shifts(current_user: dict) -> list[dict]:
        db = get_db()
        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")

        shifts_cache = {s["shift_id"]: serialize_doc(s) for s in db["shifts"].find({})}
        default_shift = shifts_cache.get("SHIFT-GEN") or next(iter(shifts_cache.values()), None)

        if role == "HR":
            cursor = db["employees"].find({})
        else:
            team_ids = get_manager_team_ids(user_emp_id)
            cursor = db["employees"].find({"employee_id": {"$in": team_ids + [user_emp_id]}})

        result = []
        for emp in cursor:
            sh = shifts_cache.get(emp.get("shift_id")) or default_shift
            result.append({
                "employee_id": emp["employee_id"],
                "employee_name": emp["full_name"],
                "department": emp["department"],
                "shift": sh,
            })
        return result
