"""
Database Data Enrichment Script
Ensures all 12 modules have realistic, interconnected, persistent data in MongoDB:
- Activates all standard users (Sarah Jenkins, David Miller, etc.)
- Ensures attendance has records for current date (today)
- Diversifies performance reviews (Completed, Pending, Draft)
- Populates shift assignments for all employees across all 4 shifts
- Seeds realistic notifications for HR, Managers, and Employees
"""
from datetime import date, datetime, timedelta, timezone
import random
from backend.database import get_db

def enrich_database():
    db = get_db()
    today_str = date.today().isoformat()
    now_iso = datetime.now(timezone.utc).isoformat()

    print("1. Activating all standard users and employees...")
    db.users.update_many({"status": "deactivated"}, {"$set": {"status": "active"}})
    db.employees.update_many({"employment_status": "Inactive"}, {"$set": {"employment_status": "Active"}})

    print("2. Ensuring all employees have realistic shift assignments...")
    shifts_pool = ["SHIFT-GEN", "SHIFT-GEN", "SHIFT-MRN", "SHIFT-EVN", "SHIFT-NGT"]
    employees = list(db.employees.find({}))
    for i, emp in enumerate(employees):
        assigned_shift = shifts_pool[i % len(shifts_pool)]
        db.employees.update_one(
            {"_id": emp["_id"]},
            {"$set": {"shift_id": emp.get("shift_id") or assigned_shift}}
        )

    print("3. Ensuring attendance has records for today...")
    today_count = db.attendance.count_documents({"date": today_str})
    if today_count < 100:
        # Create attendance records for today from employees
        statuses = ["Present"] * 75 + ["Late"] * 10 + ["Absent"] * 8 + ["On Leave"] * 7
        new_records = []
        for i, emp in enumerate(employees):
            emp_id = emp["employee_id"]
            if db.attendance.find_one({"employee_id": emp_id, "date": today_str}):
                continue
            st = statuses[i % len(statuses)]
            is_late = (st == "Late")
            check_in = f"{today_str}T09:35:00+00:00" if is_late else f"{today_str}T08:55:00+00:00"
            check_out = f"{today_str}T17:30:00+00:00" if st in ["Present", "Late"] else None
            work_hours = 8.5 if st in ["Present", "Late"] else 0.0
            ot_hours = 0.5 if i % 7 == 0 and st in ["Present", "Late"] else 0.0

            rec = {
                "attendance_id": f"ATT-{today_str.replace('-', '')}-{emp_id}",
                "employee_id": emp_id,
                "date": today_str,
                "check_in": check_in if st in ["Present", "Late"] else None,
                "check_out": check_out,
                "working_hours": work_hours,
                "status": st,
                "late_minutes": 35 if is_late else 0,
                "overtime_hours": ot_hours,
                "created_at": now_iso,
            }
            new_records.append(rec)
        if new_records:
            db.attendance.insert_many(new_records)
            print(f"Inserted {len(new_records)} attendance records for today ({today_str})")

    print("4. Diversifying performance evaluation statuses...")
    perf_records = list(db.performance.find({}))
    for i, p in enumerate(perf_records):
        st = "Completed" if i % 10 < 7 else ("Pending" if i % 10 < 9 else "Draft")
        db.performance.update_one({"_id": p["_id"]}, {"$set": {"status": st}})

    print("5. Populating notifications for HR, Managers, and Employees...")
    # Clean previous notifications or add rich ones
    key_recipients = [
        ("USR-HR001", "HR"),
        ("USR-MGR001", "MANAGER"),
        ("USR-EMP0001", "EMPLOYEE"),
    ]

    sample_notifications = [
        {"title": "Pending Leave Approval", "message": "Alexander Wright submitted an annual leave request for review.", "type": "leave", "is_read": False, "days_ago": 0},
        {"title": "Timesheet Review Needed", "message": "Elena Rostova submitted a weekly timesheet (42.5 hrs, 2.5 hrs OT).", "type": "timesheet", "is_read": False, "days_ago": 1},
        {"title": "Attendance Anomaly Flagged", "message": "Multiple late check-ins detected in the Operations department today.", "type": "attendance", "is_read": False, "days_ago": 1},
        {"title": "Q3 Performance Appraisal Cycle", "message": "Q3 2026 performance evaluation reviews are now open for manager submission.", "type": "performance", "is_read": True, "days_ago": 2},
        {"title": "Shift Schedule Published", "message": "The revised roster for next week has been confirmed.", "type": "shift", "is_read": True, "days_ago": 3},
        {"title": "Payroll Calculation Completed", "message": "October 2026 monthly payroll statement drafts have been generated.", "type": "payroll", "is_read": True, "days_ago": 4},
        {"title": "System Compliance Notice", "message": "Bi-weekly audit logs backup completed with 0 errors.", "type": "system", "is_read": True, "days_ago": 5},
    ]

    for user_id, role in key_recipients:
        for idx, n in enumerate(sample_notifications):
            notif_id = f"NOTIF-{user_id[-6:]}-{idx+1:03d}"
            notif_time = (datetime.now(timezone.utc) - timedelta(days=n["days_ago"], hours=idx*2)).isoformat()
            db.notifications.update_one(
                {"notification_id": notif_id},
                {"$set": {
                    "notification_id": notif_id,
                    "user_id": user_id,
                    "title": n["title"],
                    "message": n["message"],
                    "type": n["type"],
                    "is_read": n["is_read"],
                    "created_at": notif_time,
                }},
                upsert=True
            )

    print("Data enrichment completed successfully!")

if __name__ == "__main__":
    enrich_database()
