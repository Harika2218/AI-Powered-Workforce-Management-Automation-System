import uuid
from datetime import datetime, date, timezone
from typing import Any
from fastapi import HTTPException, status
from pymongo import ASCENDING, DESCENDING
from backend.database import get_db
from backend.models.base import serialize_doc
from backend.utils.helpers import log_audit, calculate_working_hours, today_date_str, now_iso
from backend.utils.permissions import get_manager_team_ids, verify_employee_access
from backend.schemas.attendance import (
    CheckInRequest,
    CheckOutRequest,
    AttendanceAnomaly,
)


class AttendanceService:
    @staticmethod
    def check_in(current_user: dict, payload: CheckInRequest) -> dict:
        db = get_db()
        emp_id = payload.employee_id or current_user.get("employee_id")
        if not emp_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee ID required for check-in")

        # Verify permission
        verify_employee_access(current_user, emp_id)

        # Parse timestamp or default to now
        if payload.timestamp:
            try:
                check_in_dt = datetime.fromisoformat(payload.timestamp.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid ISO timestamp")
        else:
            check_in_dt = datetime.now(timezone.utc)

        target_date_str = check_in_dt.strftime("%Y-%m-%d")

        # Check for existing attendance record today
        existing = db["attendance"].find_one({"employee_id": emp_id, "date": target_date_str})
        if existing and existing.get("check_in"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Employee '{emp_id}' has already checked in today at {existing['check_in']}.",
            )

        # Retrieve employee shift to calculate late minutes
        emp = db["employees"].find_one({"employee_id": emp_id})
        shift_start_hour = 9
        shift_start_minute = 0
        if emp and emp.get("shift_id"):
            shift = db["shifts"].find_one({"shift_id": emp["shift_id"]})
            if shift and "start_time" in shift:
                parts = shift["start_time"].split(":")
                shift_start_hour = int(parts[0])
                shift_start_minute = int(parts[1])

        # Check late status
        expected_start = check_in_dt.replace(
            hour=shift_start_hour, minute=shift_start_minute, second=0, microsecond=0
        )
        late_minutes = 0
        att_status = "Present"
        if check_in_dt > expected_start:
            late_seconds = (check_in_dt - expected_start).total_seconds()
            late_minutes = int(max(0, late_seconds // 60))
            if late_minutes >= 10:
                att_status = "Late"

        # Check if on approved leave
        approved_leave = db["leave_requests"].find_one({
            "employee_id": emp_id,
            "status": "Approved",
            "start_date": {"$lte": target_date_str},
            "end_date": {"$gte": target_date_str},
        })
        if approved_leave:
            att_status = "On Leave"

        att_id = existing.get("attendance_id") if existing else f"ATT-{uuid.uuid4().hex[:10].upper()}"
        doc_data = {
            "attendance_id": att_id,
            "employee_id": emp_id,
            "date": target_date_str,
            "check_in": check_in_dt.isoformat(),
            "check_out": None,
            "working_hours": 0.0,
            "status": att_status,
            "late_minutes": late_minutes,
            "overtime_hours": 0.0,
        }

        if existing:
            db["attendance"].update_one({"_id": existing["_id"]}, {"$set": doc_data})
        else:
            db["attendance"].insert_one(doc_data)

        log_audit(
            user_id=current_user["user_id"],
            action="ATTENDANCE_CHECK_IN",
            entity_type="ATTENDANCE",
            entity_id=att_id,
            metadata={"employee_id": emp_id, "time": check_in_dt.isoformat(), "status": att_status},
        )

        return serialize_doc(db["attendance"].find_one({"attendance_id": att_id}))

    @staticmethod
    def check_out(current_user: dict, payload: CheckOutRequest) -> dict:
        db = get_db()
        emp_id = payload.employee_id or current_user.get("employee_id")
        if not emp_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee ID required for check-out")

        verify_employee_access(current_user, emp_id)

        if payload.timestamp:
            try:
                check_out_dt = datetime.fromisoformat(payload.timestamp.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid ISO timestamp")
        else:
            check_out_dt = datetime.now(timezone.utc)

        target_date_str = check_out_dt.strftime("%Y-%m-%d")

        existing = db["attendance"].find_one({"employee_id": emp_id, "date": target_date_str})
        if not existing or not existing.get("check_in"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot check out: No active check-in record found for '{emp_id}' on {target_date_str}.",
            )

        if existing.get("check_out"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Employee '{emp_id}' has already checked out today at {existing['check_out']}.",
            )

        check_in_dt = datetime.fromisoformat(existing["check_in"].replace("Z", "+00:00"))
        if check_out_dt < check_in_dt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Check-out time cannot be earlier than check-in time.",
            )

        # Working hours calculation
        working_hours, overtime_hours, _ = calculate_working_hours(
            check_in_dt=check_in_dt,
            check_out_dt=check_out_dt,
            standard_hours=8.0,
        )

        final_status = existing["status"]
        if working_hours < 5.0 and final_status not in ["On Leave"]:
            final_status = "Half Day"

        update_fields = {
            "check_out": check_out_dt.isoformat(),
            "working_hours": working_hours,
            "overtime_hours": overtime_hours,
            "status": final_status,
        }

        db["attendance"].update_one({"_id": existing["_id"]}, {"$set": update_fields})

        log_audit(
            user_id=current_user["user_id"],
            action="ATTENDANCE_CHECK_OUT",
            entity_type="ATTENDANCE",
            entity_id=existing["attendance_id"],
            metadata={"employee_id": emp_id, "working_hours": working_hours, "overtime_hours": overtime_hours},
        )

        return serialize_doc(db["attendance"].find_one({"attendance_id": existing["attendance_id"]}))

    @staticmethod
    def get_attendance(
        current_user: dict,
        employee_id: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        department: str | None = None,
        status_filter: str | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        db = get_db()
        query: dict[str, Any] = {}

        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")

        if role == "EMPLOYEE":
            query["employee_id"] = user_emp_id
        elif role == "MANAGER":
            team_ids = get_manager_team_ids(user_emp_id)
            allowed_ids = team_ids + [user_emp_id]
            if employee_id:
                if employee_id not in allowed_ids:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access outside team")
                query["employee_id"] = employee_id
            else:
                query["employee_id"] = {"$in": allowed_ids}
        elif role == "HR":
            if employee_id:
                query["employee_id"] = employee_id

        if date_from and date_to:
            query["date"] = {"$gte": date_from, "$lte": date_to}
        elif date_from:
            query["date"] = {"$gte": date_from}
        elif date_to:
            query["date"] = {"$lte": date_to}

        if status_filter:
            query["status"] = status_filter

        # Department filtering via join on employee collection
        if department:
            dept_emp_ids = [
                d["employee_id"]
                for d in db["employees"].find({"department": department}, {"employee_id": 1})
            ]
            if "employee_id" in query and isinstance(query["employee_id"], dict) and "$in" in query["employee_id"]:
                query["employee_id"]["$in"] = list(set(query["employee_id"]["$in"]).intersection(set(dept_emp_ids)))
            elif "employee_id" in query and isinstance(query["employee_id"], str):
                if query["employee_id"] not in dept_emp_ids:
                    return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}
            else:
                query["employee_id"] = {"$in": dept_emp_ids}

        total = db["attendance"].count_documents(query)
        skip = (page - 1) * page_size
        cursor = db["attendance"].find(query).sort([("date", DESCENDING), ("employee_id", ASCENDING)]).skip(skip).limit(page_size)

        # Pre-cache employee names & departments for response
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
            d["check_in_time"] = d.get("check_in")
            d["check_out_time"] = d.get("check_out")
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
    def detect_anomalies(current_user: dict, limit: int = 20) -> list[dict]:
        """
        Rule-based attendance anomaly detection:
        1. Excessive overtime (> 2.5 hours in a day)
        2. Repeated late arrivals (>= 3 late arrivals in recent records)
        3. Abnormally low working hours (< 4 hours when marked present)
        """
        db = get_db()
        role = current_user.get("role")
        user_emp_id = current_user.get("employee_id")

        match_emp: dict[str, Any] = {}
        if role == "MANAGER":
            team_ids = get_manager_team_ids(user_emp_id)
            match_emp["employee_id"] = {"$in": team_ids + [user_emp_id]}
        elif role == "EMPLOYEE":
            match_emp["employee_id"] = user_emp_id

        emp_map = {
            e["employee_id"]: (e["full_name"], e["department"])
            for e in db["employees"].find({}, {"employee_id": 1, "full_name": 1, "department": 1})
        }

        anomalies: list[dict] = []

        # 1. Excessive Overtime Anomaly
        ot_query = {"overtime_hours": {"$gte": 2.5}}
        ot_query.update(match_emp)
        ot_cursor = db["attendance"].find(ot_query).sort("date", DESCENDING).limit(10)
        for doc in ot_cursor:
            e_info = emp_map.get(doc["employee_id"], ("Employee", "Operations"))
            anomalies.append({
                "employee_id": doc["employee_id"],
                "employee_name": e_info[0],
                "department": e_info[1],
                "anomaly_type": "Excessive Overtime",
                "severity": "Medium" if doc["overtime_hours"] < 4.0 else "High",
                "reason": f"Logged {doc['overtime_hours']} hours overtime on {doc['date']}",
                "date": doc["date"],
            })

        # 2. Chronic Late Arrivals
        late_pipeline = [
            {"$match": {"status": "Late", **match_emp}},
            {"$group": {"_id": "$employee_id", "late_count": {"$sum": 1}, "latest_date": {"$max": "$date"}}},
            {"$match": {"late_count": {"$gte": 3}}},
            {"$sort": {"late_count": -1}},
            {"$limit": 10},
        ]
        late_results = list(db["attendance"].aggregate(late_pipeline))
        for res in late_results:
            emp_id = res["_id"]
            e_info = emp_map.get(emp_id, ("Employee", "Operations"))
            anomalies.append({
                "employee_id": emp_id,
                "employee_name": e_info[0],
                "department": e_info[1],
                "anomaly_type": "Chronic Late Arrival",
                "severity": "Medium",
                "reason": f"Reported late arrival {res['late_count']} times in the last 30 days",
                "date": res["latest_date"],
            })

        # 3. Abnormally Low Hours
        low_query = {"working_hours": {"$gt": 0, "$lt": 4.0}, "status": {"$in": ["Present", "Half Day"]}}
        low_query.update(match_emp)
        low_cursor = db["attendance"].find(low_query).sort("date", DESCENDING).limit(10)
        for doc in low_cursor:
            e_info = emp_map.get(doc["employee_id"], ("Employee", "Operations"))
            anomalies.append({
                "employee_id": doc["employee_id"],
                "employee_name": e_info[0],
                "department": e_info[1],
                "anomaly_type": "Abnormally Low Working Hours",
                "severity": "Low",
                "reason": f"Logged only {doc['working_hours']} working hours on {doc['date']}",
                "date": doc["date"],
            })

        # Return sorted by date
        anomalies.sort(key=lambda x: x["date"], reverse=True)
        return anomalies[:limit]
