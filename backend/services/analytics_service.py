from datetime import date, timedelta
from typing import Any
from backend.database import get_db
from backend.utils.permissions import get_manager_team_ids
from backend.services.attendance_service import AttendanceService
from backend.schemas.dashboard import (
    HRDashboardResponse,
    ManagerDashboardResponse,
    EmployeeDashboardResponse,
    AttendanceDistribution,
)
from backend.schemas.analytics import (
    AttendanceAnalyticsResponse,
    LeaveAnalyticsResponse,
    WorkforceAnalyticsResponse,
    OvertimeAnalyticsResponse,
)


class AnalyticsService:
    @staticmethod
    def get_hr_dashboard(current_user: dict) -> HRDashboardResponse:
        db = get_db()
        today_str = date.today().isoformat()

        # Total employees
        total_employees = db["employees"].count_documents({})
        departments = db["employees"].distinct("department")

        # Today's attendance counts
        today_records = list(db["attendance"].find({"date": today_str}))
        present_today = sum(1 for r in today_records if r.get("status") in ["Present", "Late", "Half Day"])
        absent_today = sum(1 for r in today_records if r.get("status") == "Absent")
        on_leave_today = sum(1 for r in today_records if r.get("status") == "On Leave")
        overtime_today = round(sum(r.get("overtime_hours", 0.0) for r in today_records), 2)

        # Fallback if no records generated for today yet (e.g. weekend): use latest available date
        if not today_records:
            latest = db["attendance"].find_one({}, sort=[("date", -1)])
            if latest:
                target_date = latest["date"]
                today_records = list(db["attendance"].find({"date": target_date}))
                present_today = sum(1 for r in today_records if r.get("status") in ["Present", "Late", "Half Day"])
                absent_today = sum(1 for r in today_records if r.get("status") == "Absent")
                on_leave_today = sum(1 for r in today_records if r.get("status") == "On Leave")
                overtime_today = round(sum(r.get("overtime_hours", 0.0) for r in today_records), 2)

        late_today = sum(1 for r in today_records if r.get("status") == "Late")

        # Attendance Distribution
        att_dist = AttendanceDistribution(
            present=present_today,
            absent=absent_today,
            late=late_today,
            on_leave=on_leave_today,
        )

        # 14 Days Attendance Trend
        trend_dates = [(date.today() - timedelta(days=i)).isoformat() for i in range(13, -1, -1)]
        trend_records = list(db["attendance"].find({"date": {"$in": trend_dates}}))
        trend_map = {d: {"date": d, "present": 0, "absent": 0, "late": 0, "leave": 0} for d in trend_dates}
        for r in trend_records:
            d_str = r.get("date")
            st = r.get("status")
            if d_str in trend_map:
                if st == "Present":
                    trend_map[d_str]["present"] += 1
                elif st == "Late":
                    trend_map[d_str]["late"] += 1
                    trend_map[d_str]["present"] += 1
                elif st == "Absent":
                    trend_map[d_str]["absent"] += 1
                elif st == "On Leave":
                    trend_map[d_str]["leave"] += 1

        attendance_trend = [trend_map[d] for d in trend_dates if trend_map[d]["present"] + trend_map[d]["absent"] + trend_map[d]["leave"] > 0]

        # Employees by Department
        dept_agg = list(db["employees"].aggregate([
            {"$group": {"_id": "$department", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]))
        employees_by_dept = [{"department": d["_id"], "count": d["count"]} for d in dept_agg]

        # Employment Status Distribution
        status_agg = list(db["employees"].aggregate([
            {"$group": {"_id": "$employment_status", "count": {"$sum": 1}}},
        ]))
        status_dist = [{"status": s["_id"], "count": s["count"]} for s in status_agg]

        # Leave Distribution
        leave_agg = list(db["leave_requests"].aggregate([
            {"$group": {"_id": "$leave_type", "count": {"$sum": 1}}},
        ]))
        leave_dist = [{"leave_type": l["_id"], "count": l["count"]} for l in leave_agg]

        # Overtime Distribution by Department
        ot_agg = list(db["attendance"].aggregate([
            {"$lookup": {"from": "employees", "localField": "employee_id", "foreignField": "employee_id", "as": "emp"}},
            {"$unwind": "$emp"},
            {"$group": {"_id": "$emp.department", "overtime_hours": {"$sum": "$overtime_hours"}}},
            {"$sort": {"overtime_hours": -1}},
        ]))
        ot_dist = [{"department": o["_id"], "overtime_hours": round(o["overtime_hours"], 2)} for o in ot_agg]

        # Department Performance
        perf_agg = list(db["performance"].aggregate([
            {"$match": {"status": "Completed"}},
            {"$lookup": {"from": "employees", "localField": "employee_id", "foreignField": "employee_id", "as": "emp"}},
            {"$unwind": "$emp"},
            {"$group": {"_id": "$emp.department", "average_score": {"$avg": "$overall_score"}}},
            {"$sort": {"average_score": -1}},
        ]))
        dept_perf = [{"department": p["_id"], "average_score": round(p["average_score"], 2)} for p in perf_agg]

        # Pending Approvals
        pending_leave = db["leave_requests"].count_documents({"status": "Pending"})
        pending_ts = db["timesheets"].count_documents({"status": "Submitted"})

        # Recent Anomalies
        anomalies = AttendanceService.detect_anomalies(current_user, limit=5)

        return HRDashboardResponse(
            total_employees=total_employees,
            present_today=present_today,
            absent_today=absent_today,
            on_leave_today=on_leave_today,
            overtime_hours_today=overtime_today,
            total_departments=len(departments),
            attendance_distribution=att_dist,
            attendance_trend=attendance_trend,
            employees_by_department=employees_by_dept,
            employment_status_distribution=status_dist,
            leave_distribution=leave_dist,
            overtime_distribution=ot_dist,
            department_performance=dept_perf,
            pending_approvals={"leave": pending_leave, "timesheets": pending_ts},
            recent_anomalies=anomalies,
        )

    @staticmethod
    def get_manager_dashboard(current_user: dict) -> ManagerDashboardResponse:
        db = get_db()
        mgr_id = current_user.get("employee_id")
        team_ids = get_manager_team_ids(mgr_id)

        team_size = len(team_ids)
        today_str = date.today().isoformat()

        # Team attendance today
        today_records = list(db["attendance"].find({"employee_id": {"$in": team_ids}, "date": today_str}))
        if not today_records:
            latest = db["attendance"].find_one({"employee_id": {"$in": team_ids}}, sort=[("date", -1)])
            if latest:
                today_records = list(db["attendance"].find({"employee_id": {"$in": team_ids}, "date": latest["date"]}))

        present = sum(1 for r in today_records if r.get("status") in ["Present", "Late", "Half Day"])
        absent = sum(1 for r in today_records if r.get("status") == "Absent")
        late = sum(1 for r in today_records if r.get("status") == "Late")
        on_leave = sum(1 for r in today_records if r.get("status") == "On Leave")
        ot_hours = round(sum(r.get("overtime_hours", 0.0) for r in today_records), 2)

        # Team pending leave
        pending_leave = db["leave_requests"].count_documents({"employee_id": {"$in": team_ids}, "status": "Pending"})

        # Team Leave distribution
        leave_agg = list(db["leave_requests"].aggregate([
            {"$match": {"employee_id": {"$in": team_ids}}},
            {"$group": {"_id": "$leave_type", "count": {"$sum": 1}}},
        ]))
        team_leave_dist = [{"leave_type": l["_id"], "count": l["count"]} for l in leave_agg]

        # Avg working hours across team over past 14 days
        hrs_agg = list(db["attendance"].aggregate([
            {"$match": {"employee_id": {"$in": team_ids}, "working_hours": {"$gt": 0}}},
            {"$group": {"_id": None, "avg_hrs": {"$avg": "$working_hours"}}},
        ]))
        avg_hrs = round(hrs_agg[0]["avg_hrs"], 2) if hrs_agg else 8.0

        # Avg performance score
        perf_agg = list(db["performance"].aggregate([
            {"$match": {"employee_id": {"$in": team_ids}, "status": "Completed"}},
            {"$group": {"_id": None, "avg_score": {"$avg": "$overall_score"}}},
        ]))
        avg_score = round(perf_agg[0]["avg_score"], 2) if perf_agg else 4.0

        # Pending timesheets
        pending_ts = db["timesheets"].count_documents({"employee_id": {"$in": team_ids}, "status": "Submitted"})

        return ManagerDashboardResponse(
            team_size=team_size,
            present_today=present,
            absent_today=absent,
            on_leave_today=on_leave,
            pending_leave_count=pending_leave,
            overtime_hours_today=ot_hours,
            team_attendance_distribution=AttendanceDistribution(present=present, absent=absent, late=late, on_leave=on_leave),
            team_leave_distribution=team_leave_dist,
            team_avg_working_hours=avg_hrs,
            team_avg_performance=avg_score,
            pending_timesheets_count=pending_ts,
        )

    @staticmethod
    def get_employee_dashboard(current_user: dict) -> EmployeeDashboardResponse:
        db = get_db()
        emp_id = current_user.get("employee_id")
        emp = db["employees"].find_one({"employee_id": emp_id})
        today_str = date.today().isoformat()

        today_att = db["attendance"].find_one({"employee_id": emp_id, "date": today_str})
        if not today_att:
            # Fallback to latest attendance record
            today_att = db["attendance"].find_one({"employee_id": emp_id}, sort=[("date", -1)])

        is_checked_in = bool(today_att and today_att.get("check_in"))
        is_checked_out = bool(today_att and today_att.get("check_out"))

        # Overtime this month
        month_prefix = today_str[:7]
        ot_records = db["attendance"].find({"employee_id": emp_id, "date": {"$regex": f"^{month_prefix}"}})
        month_ot = round(sum(r.get("overtime_hours", 0.0) for r in ot_records), 2)

        # Recent leave requests
        recent_leaves_cursor = db["leave_requests"].find({"employee_id": emp_id}).sort("applied_at", -1).limit(5)
        recent_leaves = []
        for l in recent_leaves_cursor:
            recent_leaves.append({
                "leave_id": l["leave_id"],
                "employee_id": l["employee_id"],
                "employee_name": emp["full_name"] if emp else "",
                "department": emp["department"] if emp else "",
                "leave_type": l["leave_type"],
                "start_date": l["start_date"],
                "end_date": l["end_date"],
                "total_days": l["total_days"],
                "reason": l["reason"],
                "status": l["status"],
                "applied_at": l["applied_at"],
                "reviewed_by": l.get("reviewed_by"),
                "reviewed_at": l.get("reviewed_at"),
                "comments": l.get("comments"),
            })

        # Upcoming shift
        shift_data = None
        if emp and emp.get("shift_id"):
            sh = db["shifts"].find_one({"shift_id": emp["shift_id"]})
            if sh:
                shift_data = {
                    "shift_id": sh["shift_id"],
                    "name": sh["name"],
                    "start_time": sh["start_time"],
                    "end_time": sh["end_time"],
                    "duration_hours": sh["duration_hours"],
                }

        # Unread notifications
        user_id = current_user.get("user_id")
        unread_notifs = db["notifications"].count_documents({"user_id": user_id, "is_read": False})

        # Personal attendance trend (last 14 records)
        att_trend = list(
            db["attendance"].find({"employee_id": emp_id}, {"date": 1, "status": 1, "working_hours": 1, "overtime_hours": 1, "_id": 0})
            .sort("date", -1)
            .limit(14)
        )
        att_trend.reverse()

        return EmployeeDashboardResponse(
            employee_id=emp_id or "",
            employee_name=emp.get("full_name", "") if emp else "",
            today_status=today_att.get("status", "Absent") if today_att else "Absent",
            is_checked_in=is_checked_in,
            is_checked_out=is_checked_out,
            check_in_time=today_att.get("check_in") if today_att else None,
            check_out_time=today_att.get("check_out") if today_att else None,
            working_hours_today=today_att.get("working_hours", 0.0) if today_att else 0.0,
            overtime_hours_this_month=month_ot,
            leave_balances=emp.get("leave_balances", {"annual": 18, "sick": 10, "casual": 7}) if emp else {},
            upcoming_shift=shift_data,
            recent_leave_requests=recent_leaves,
            unread_notifications_count=unread_notifs,
            personal_attendance_trend=att_trend,
        )

    @staticmethod
    def get_attendance_analytics(
        current_user: dict,
        date_from: str | None = None,
        date_to: str | None = None,
        department: str | None = None,
    ) -> AttendanceAnalyticsResponse:
        db = get_db()
        query: dict[str, Any] = {}
        if date_from and date_to:
            query["date"] = {"$gte": date_from, "$lte": date_to}
        elif date_from:
            query["date"] = {"$gte": date_from}
        elif date_to:
            query["date"] = {"$lte": date_to}

        if department:
            dept_emp_ids = [d["employee_id"] for d in db["employees"].find({"department": department}, {"employee_id": 1})]
            query["employee_id"] = {"$in": dept_emp_ids}

        records = list(db["attendance"].find(query))
        total = len(records)
        present = sum(1 for r in records if r.get("status") in ["Present", "Late"])
        absent = sum(1 for r in records if r.get("status") == "Absent")
        late = sum(1 for r in records if r.get("status") == "Late")
        half_day = sum(1 for r in records if r.get("status") == "Half Day")
        on_leave = sum(1 for r in records if r.get("status") == "On Leave")
        tot_ot = round(sum(r.get("overtime_hours", 0.0) for r in records), 2)
        avg_hrs = round(sum(r.get("working_hours", 0.0) for r in records) / max(1, present), 2)
        rate = round((present / max(1, total - on_leave)) * 100, 2) if total > 0 else 0.0

        # Department breakdown
        dept_pipeline = [
            {"$match": query},
            {"$lookup": {"from": "employees", "localField": "employee_id", "foreignField": "employee_id", "as": "emp"}},
            {"$unwind": "$emp"},
            {
                "$group": {
                    "_id": "$emp.department",
                    "total": {"$sum": 1},
                    "present": {"$sum": {"$cond": [{"$in": ["$status", ["Present", "Late"]]}, 1, 0]}},
                    "late": {"$sum": {"$cond": [{"$eq": ["$status", "Late"]}, 1, 0]}},
                    "absent": {"$sum": {"$cond": [{"$eq": ["$status", "Absent"]}, 1, 0]}},
                    "overtime_hours": {"$sum": "$overtime_hours"},
                }
            },
            {"$sort": {"present": -1}},
        ]
        dept_res = list(db["attendance"].aggregate(dept_pipeline))
        department_attendance = [
            {
                "department": d["_id"],
                "total": d["total"],
                "present": d["present"],
                "absent": d["absent"],
                "late": d["late"],
                "attendance_rate": round((d["present"] / max(1, d["total"])) * 100, 1),
                "overtime_hours": round(d["overtime_hours"], 2),
            }
            for d in dept_res
        ]

        # Daily trends
        trend_pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": "$date",
                    "present": {"$sum": {"$cond": [{"$in": ["$status", ["Present", "Late"]]}, 1, 0]}},
                    "absent": {"$sum": {"$cond": [{"$eq": ["$status", "Absent"]}, 1, 0]}},
                    "late": {"$sum": {"$cond": [{"$eq": ["$status", "Late"]}, 1, 0]}},
                    "on_leave": {"$sum": {"$cond": [{"$eq": ["$status", "On Leave"]}, 1, 0]}},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        trend_res = list(db["attendance"].aggregate(trend_pipeline))
        daily_trends = [
            {"date": t["_id"], "present": t["present"], "absent": t["absent"], "late": t["late"], "leave": t["on_leave"]}
            for t in trend_res
        ]

        return AttendanceAnalyticsResponse(
            total_records=total,
            attendance_rate=rate,
            present_count=present,
            absent_count=absent,
            late_count=late,
            half_day_count=half_day,
            on_leave_count=on_leave,
            avg_working_hours=avg_hrs,
            total_overtime_hours=tot_ot,
            department_attendance=department_attendance,
            daily_trends=daily_trends,
        )

    @staticmethod
    def get_leave_analytics(current_user: dict) -> LeaveAnalyticsResponse:
        db = get_db()
        total = db["leave_requests"].count_documents({})
        approved = db["leave_requests"].count_documents({"status": "Approved"})
        pending = db["leave_requests"].count_documents({"status": "Pending"})
        rejected = db["leave_requests"].count_documents({"status": "Rejected"})
        cancelled = db["leave_requests"].count_documents({"status": "Cancelled"})

        # Type distribution
        type_agg = list(db["leave_requests"].aggregate([
            {"$group": {"_id": "$leave_type", "count": {"$sum": 1}, "total_days": {"$sum": "$total_days"}}},
        ]))
        type_dist = [{"leave_type": t["_id"], "count": t["count"], "total_days": t["total_days"]} for t in type_agg]

        # Monthly trends
        monthly_agg = list(db["leave_requests"].aggregate([
            {"$project": {"month": {"$substr": ["$start_date", 0, 7]}, "total_days": 1, "status": 1}},
            {"$group": {"_id": "$month", "requests": {"$sum": 1}, "days_taken": {"$sum": "$total_days"}}},
            {"$sort": {"_id": 1}},
        ]))
        monthly_trends = [{"month": m["_id"], "requests": m["requests"], "days_taken": m["days_taken"]} for m in monthly_agg]

        # Department breakdown
        dept_leave_agg = list(db["leave_requests"].aggregate([
            {"$lookup": {"from": "employees", "localField": "employee_id", "foreignField": "employee_id", "as": "emp"}},
            {"$unwind": "$emp"},
            {"$group": {"_id": "$emp.department", "total_requests": {"$sum": 1}, "approved_requests": {"$sum": {"$cond": [{"$eq": ["$status", "Approved"]}, 1, 0]}}}},
            {"$sort": {"total_requests": -1}},
        ]))
        dept_breakdown = [{"department": d["_id"], "total_requests": d["total_requests"], "approved_requests": d["approved_requests"]} for d in dept_leave_agg]

        return LeaveAnalyticsResponse(
            total_requests=total,
            approved_count=approved,
            pending_count=pending,
            rejected_count=rejected,
            cancelled_count=cancelled,
            leave_type_distribution=type_dist,
            monthly_leave_trends=monthly_trends,
            department_leave_breakdown=dept_breakdown,
        )

    @staticmethod
    def get_workforce_analytics(current_user: dict) -> WorkforceAnalyticsResponse:
        db = get_db()
        total = db["employees"].count_documents({})
        active = db["employees"].count_documents({"employment_status": "Active"})
        inactive = db["employees"].count_documents({"employment_status": "Inactive"})
        on_leave = db["employees"].count_documents({"employment_status": "On Leave"})

        dept_agg = list(db["employees"].aggregate([
            {"$group": {"_id": "$department", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]))
        dept_dist = [{"department": d["_id"], "count": d["count"]} for d in dept_agg]

        emp_type_agg = list(db["employees"].aggregate([
            {"$group": {"_id": "$employment_type", "count": {"$sum": 1}}},
        ]))
        emp_type_dist = [{"type": t["_id"], "count": t["count"]} for t in emp_type_agg]

        # Tenure distribution (based on date_of_joining)
        now = date.today()
        tenure_dist = {"< 1 Year": 0, "1-2 Years": 0, "2+ Years": 0}
        for emp in db["employees"].find({}, {"date_of_joining": 1}):
            try:
                j_date = date.fromisoformat(emp["date_of_joining"])
                years = (now - j_date).days / 365.25
                if years < 1.0:
                    tenure_dist["< 1 Year"] += 1
                elif years < 2.0:
                    tenure_dist["1-2 Years"] += 1
                else:
                    tenure_dist["2+ Years"] += 1
            except Exception:
                tenure_dist["1-2 Years"] += 1

        tenure_list = [{"range": k, "count": v} for k, v in tenure_dist.items()]

        # Top skills aggregation
        skills_agg = list(db["employees"].aggregate([
            {"$unwind": "$skills"},
            {"$group": {"_id": "$skills", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 8},
        ]))
        top_skills = [{"skill": s["_id"], "count": s["count"]} for s in skills_agg]

        return WorkforceAnalyticsResponse(
            total_headcount=total,
            active_employees=active,
            inactive_employees=inactive,
            on_leave_employees=on_leave,
            department_distribution=dept_dist,
            employment_type_distribution=emp_type_dist,
            tenure_distribution=tenure_list,
            top_skills=top_skills,
        )

    @staticmethod
    def get_overtime_analytics(current_user: dict) -> OvertimeAnalyticsResponse:
        db = get_db()
        ot_pipeline = [
            {"$match": {"overtime_hours": {"$gt": 0}}},
            {"$group": {"_id": None, "total_hours": {"$sum": "$overtime_hours"}, "emp_set": {"$addToSet": "$employee_id"}}},
        ]
        ot_res = list(db["attendance"].aggregate(ot_pipeline))
        total_hours = round(ot_res[0]["total_hours"], 2) if ot_res else 0.0
        emp_count = len(ot_res[0]["emp_set"]) if ot_res else 0

        # Department overtime
        dept_ot_pipeline = [
            {"$match": {"overtime_hours": {"$gt": 0}}},
            {"$lookup": {"from": "employees", "localField": "employee_id", "foreignField": "employee_id", "as": "emp"}},
            {"$unwind": "$emp"},
            {"$group": {"_id": "$emp.department", "total_overtime": {"$sum": "$overtime_hours"}}},
            {"$sort": {"total_overtime": -1}},
        ]
        dept_ot_res = list(db["attendance"].aggregate(dept_ot_pipeline))
        dept_ot = [{"department": d["_id"], "overtime_hours": round(d["total_overtime"], 2)} for d in dept_ot_res]

        # Top overtime employees
        top_emp_pipeline = [
            {"$match": {"overtime_hours": {"$gt": 0}}},
            {"$group": {"_id": "$employee_id", "total_overtime": {"$sum": "$overtime_hours"}}},
            {"$sort": {"total_overtime": -1}},
            {"$limit": 5},
            {"$lookup": {"from": "employees", "localField": "_id", "foreignField": "employee_id", "as": "emp"}},
            {"$unwind": "$emp"},
        ]
        top_emp_res = list(db["attendance"].aggregate(top_emp_pipeline))
        top_employees = [
            {
                "employee_id": t["_id"],
                "employee_name": t["emp"]["full_name"],
                "department": t["emp"]["department"],
                "total_overtime_hours": round(t["total_overtime"], 2),
            }
            for t in top_emp_res
        ]

        # Daily overtime trend (last 14 days)
        trend_dates = [(date.today() - timedelta(days=i)).isoformat() for i in range(13, -1, -1)]
        daily_ot_pipeline = [
            {"$match": {"date": {"$in": trend_dates}}},
            {"$group": {"_id": "$date", "overtime_hours": {"$sum": "$overtime_hours"}}},
            {"$sort": {"_id": 1}},
        ]
        daily_ot_res = list(db["attendance"].aggregate(daily_ot_pipeline))
        daily_trend = [{"date": d["_id"], "overtime_hours": round(d["overtime_hours"], 2)} for d in daily_ot_res]

        return OvertimeAnalyticsResponse(
            total_overtime_hours=total_hours,
            employees_with_overtime=emp_count,
            department_overtime=dept_ot,
            top_overtime_employees=top_employees,
            daily_overtime_trend=daily_trend,
        )
