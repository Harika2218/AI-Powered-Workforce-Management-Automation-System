"""
Safe, repeatable targeted update to ensure complete and internally consistent
historical attendance records without resetting or regenerating the database.
"""
from datetime import datetime, timedelta
from backend.database import get_db


def clean_attendance_data():
    db = get_db()
    print("Auditing and cleaning historical attendance records...")

    # 1. Complete historical records on 2026-10-02 where check_out was omitted
    uncompleted_cursor = db.attendance.find({
        "date": "2026-10-02",
        "check_out": None,
        "status": {"$in": ["Present", "Late", "Half Day"]},
    })

    completed_count = 0
    for doc in uncompleted_cursor:
        ci_str = doc.get("check_in")
        if not ci_str:
            continue
        ci_dt = datetime.fromisoformat(ci_str.replace("Z", "+00:00"))
        # Standard 8h shift + any existing recorded overtime
        ot = float(doc.get("overtime_hours") or 0.0)
        wh = 8.0 + ot
        co_dt = ci_dt + timedelta(hours=wh)

        db.attendance.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {
                    "check_out": co_dt.isoformat(),
                    "working_hours": round(wh, 2),
                    "overtime_hours": round(ot, 2),
                }
            },
        )
        completed_count += 1
    print(f"Completed {completed_count} historical checkouts on 2026-10-02.")

    # 2. Synchronize working_hours and overtime_hours with exact timestamps
    sync_count = 0
    all_with_times = db.attendance.find({
        "check_in": {"$ne": None},
        "check_out": {"$ne": None},
        "status": {"$in": ["Present", "Late", "Half Day"]},
    })

    for doc in all_with_times:
        try:
            t1 = datetime.fromisoformat(doc["check_in"].replace("Z", "+00:00"))
            t2 = datetime.fromisoformat(doc["check_out"].replace("Z", "+00:00"))
            if t2 > t1:
                calc_wh = round((t2 - t1).total_seconds() / 3600.0, 2)
                calc_ot = round(max(0.0, calc_wh - 8.0), 2)
                curr_wh = doc.get("working_hours", 0.0)
                curr_ot = doc.get("overtime_hours", 0.0)
                if abs(calc_wh - curr_wh) > 0.01 or abs(calc_ot - curr_ot) > 0.01:
                    db.attendance.update_one(
                        {"_id": doc["_id"]},
                        {"$set": {"working_hours": calc_wh, "overtime_hours": calc_ot}},
                    )
                    sync_count += 1
        except Exception:
            pass
    print(f"Synchronized timestamps & hours for {sync_count} completed records.")

    # 3. Clean Absent / On Leave records
    absent_cleaned = 0
    absent_docs = db.attendance.find({
        "status": {"$in": ["Absent", "On Leave"]},
        "$or": [
            {"check_in": {"$ne": None}},
            {"check_out": {"$ne": None}},
            {"working_hours": {"$gt": 0}},
            {"overtime_hours": {"$gt": 0}},
        ],
    })
    for doc in absent_docs:
        db.attendance.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {
                    "check_in": None,
                    "check_out": None,
                    "working_hours": 0.0,
                    "overtime_hours": 0.0,
                    "late_minutes": 0,
                }
            },
        )
        absent_cleaned += 1
    print(f"Cleaned {absent_cleaned} absent/leave records.")
    print("Attendance data audit and clean completed successfully.")


if __name__ == "__main__":
    clean_attendance_data()
