import random
from datetime import date, datetime, timedelta, timezone
from backend.database import get_db

DEPT_WORK_ACTIVITIES = {
    "Human Resources": [
        ("Attendance Validation", "08:45 AM - Morning HR standup & attendance sync", "Reviewing and validating employee attendance records and exceptions"),
        ("Workforce Reporting", "09:00 AM - Workforce analytics planning", "Preparing a department-level workforce report and headcount summary"),
        ("Onboarding Documentation", "09:15 AM - New hire onboarding review", "Updating employee onboarding documentation and compliance forms"),
        ("Leave Request Review", "09:00 AM - Leave portal queue triage", "Reviewing pending leave requests and statutory balance audits"),
        ("Performance Evaluation", "09:30 AM - Appraisal cycle checkpoint", "Updating employee performance review records and manager feedback"),
    ],
    "Engineering": [
        ("API Endpoint Testing", "09:00 AM - Engineering daily standup & sprint review", "Testing an API endpoint and validating response payloads against schema"),
        ("Database Optimization", "09:15 AM - Architecture & indexing sync", "Analysing database query latency and optimizing MongoDB aggregation pipelines"),
        ("Microservice Integration", "09:00 AM - Service interface review", "Integrating authentication middleware and token verification logic"),
        ("System Reliability Testing", "08:45 AM - CI/CD monitor check", "Running end-to-end regression tests and monitoring build latency"),
        ("Sprint Deliverables", "09:00 AM - Sprint backlog sprint review", "Refactoring database migration scripts and implementing data models"),
    ],
    "Data Science": [
        ("Attendance Trend Analysis", "09:00 AM - Analytics standup & metric check", "Analysing attendance trends and training forecasting models for shift optimization"),
        ("Predictive Modeling", "09:30 AM - Algorithm design session", "Evaluating feature importance weights for employee attrition predictions"),
        ("Pipeline Validation", "09:00 AM - ETL validation sync", "Validating aggregation pipelines for automated workforce analytics"),
        ("Metric Reporting", "09:15 AM - Metric baseline review", "Compiling model performance reports and drift evaluation benchmarks"),
    ],
    "Finance": [
        ("Payroll Reconciliation", "08:45 AM - Financial operations sync", "Reconciling monthly payroll tax withholdings and net disbursements"),
        ("Overtime Expense Audit", "09:00 AM - Compensation audit queue", "Auditing overtime compensation expenses across high-utilization departments"),
        ("Budget Forecasting", "09:15 AM - Financial planning review", "Compiling department operational expenses and variance reports"),
        ("Disbursement Verification", "09:00 AM - Banking ledger audit", "Verifying automated payroll transfers and regulatory withholdings"),
    ],
    "Marketing": [
        ("Recruitment Campaign Analysis", "09:00 AM - Campaign performance standup", "Analyzing employer branding metrics and applicant conversion funnels"),
        ("Workforce Communication", "09:30 AM - Internal communications review", "Drafting monthly organizational workforce updates and announcements"),
        ("Brand Outreach Review", "09:00 AM - Marketing media planning", "Coordinating digital talent attraction campaigns and candidate surveys"),
    ],
    "Operations": [
        ("Shift Coverage Validation", "08:30 AM - Shift roster inspection", "Validating shift coverage and emergency staffing allocations for operational continuity"),
        ("Timesheet Submission Audit", "09:00 AM - Timesheet queue review", "Validating timesheet submissions and overtime logs across operations teams"),
        ("Facility Operations Review", "08:45 AM - Facility health & safety check", "Monitoring workstation availability and physical workspace requirements"),
        ("Roster Optimization", "08:30 AM - Daily logistics briefing", "Adjusting operational rotations to minimize scheduling bottlenecks"),
    ],
    "Sales": [
        ("Enterprise Client Demos", "09:00 AM - Sales team pipeline briefing", "Conducting enterprise software product demonstrations for prospective partners"),
        ("CRM Data Synchronization", "09:30 AM - Pipeline data review", "Updating customer relationship management milestones and contract progress"),
        ("Outreach Strategy Planning", "09:00 AM - Account review session", "Aligning client onboarding timelines with engineering deployment schedules"),
    ],
    "IT": [
        ("Infrastructure Security Audit", "08:30 AM - Server security audit & patch review", "Configuring network security certificates and firewall rules"),
        ("Support Ticket Resolution", "09:00 AM - IT service desk triage", "Resolving internal hardware and software provisioning tickets for staff"),
        ("System Monitoring", "08:45 AM - Infrastructure health check", "Monitoring system uptime, database replica lag, and API latency metrics"),
    ],
}

def get_week_monday(d: date) -> str:
    # Monday is weekday 0
    monday = d - timedelta(days=d.weekday())
    return monday.isoformat()

def update_timesheets():
    db = get_db()
    emp_map = {e["employee_id"]: e for e in db.employees.find({})}
    timesheets = list(db.timesheets.find({}))
    print(f"Updating {len(timesheets)} timesheets with realistic work information...")

    updated_count = 0
    for idx, ts in enumerate(timesheets):
        emp = emp_map.get(ts["employee_id"], {})
        dept = emp.get("department", "Operations")
        dept_acts = DEPT_WORK_ACTIVITIES.get(dept, DEPT_WORK_ACTIVITIES["Operations"])
        task_name, start_notes, desc = dept_acts[idx % len(dept_acts)]

        ts_date_str = ts.get("date", "2026-09-18")
        try:
            ts_date = date.fromisoformat(ts_date_str)
        except Exception:
            ts_date = date(2026, 9, 18)
            ts_date_str = "2026-09-18"

        week_monday = get_week_monday(ts_date)
        hrs = ts.get("hours_worked", 8.0)

        update_fields = {
            "task_name": task_name,
            "project_name": f"{dept} Core Operations",
            "work_start_notes": start_notes,
            "description": desc,
            "notes": desc,
            "week_start_date": week_monday,
            "total_hours": hrs,
            "created_at": ts.get("created_at") or f"{ts_date_str}T08:30:00Z",
        }
        if "comments" in ts and ts["comments"]:
            update_fields["manager_comments"] = ts["comments"]

        db.timesheets.update_one({"_id": ts["_id"]}, {"$set": update_fields})
        updated_count += 1

    print(f"Successfully updated {updated_count} timesheet records.")

def update_historical_payroll():
    db = get_db()
    all_employees = list(db.employees.find({"employment_status": "Active"}))
    print(f"Processing historical payroll for {len(all_employees)} active employees across all departments...")

    # Historical periods to ensure exist across all departments
    # 2026-09 (previous month), 2026-08, 2026-07
    historical_periods = ["2026-09", "2026-08", "2026-07"]

    inserted_count = 0
    preserved_count = 0

    for period in historical_periods:
        for idx, emp in enumerate(all_employees):
            emp_id = emp["employee_id"]
            existing = db.payroll.find_one({"employee_id": emp_id, "pay_period": period})
            if existing:
                # Ensure calculations are consistent and fields are enriched
                basic = float(existing.get("basic_salary", emp.get("salary", 75000.0) / 12.0))
                allowance = float(existing.get("allowances", emp.get("allowances", 1000.0)))
                ot_hours = float(existing.get("overtime_hours", 0.0))
                ot_rate = round((basic / 160.0) * 1.5, 2)
                ot_amount = float(existing.get("overtime_amount", round(ot_hours * ot_rate, 2)))
                gross = round(basic + allowance + ot_amount, 2)
                deductions = float(existing.get("deductions", round(basic * 0.12, 2)))
                net = round(gross - deductions, 2)

                db.payroll.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {
                        "employee_name": emp["full_name"],
                        "department": emp["department"],
                        "month": period,
                        "basic_salary": round(basic, 2),
                        "allowances": round(allowance, 2),
                        "deductions": round(deductions, 2),
                        "overtime_hours": round(ot_hours, 1),
                        "overtime_amount": round(ot_amount, 2),
                        "gross_salary": gross,
                        "net_salary": net,
                        "status": existing.get("status") or "Finalized",
                        "payment_status": "PAID" if (existing.get("status") or "").upper() in ["FINALIZED", "PAID"] else "PROCESSED",
                    }}
                )
                preserved_count += 1
            else:
                # Idempotent insert for historical period
                basic = round(emp.get("salary", 75000.0) / 12.0, 2)
                allowance = round(emp.get("allowances", 1000.0), 2)
                deductions = round(basic * 0.12, 2)
                # Realistic overtime for ~25% of employees
                has_ot = (idx % 4 == 1)
                ot_hours = round(random.uniform(2.0, 8.5), 1) if has_ot else 0.0
                ot_rate = round((basic / 160.0) * 1.5, 2)
                ot_amount = round(ot_hours * ot_rate, 2)
                gross = round(basic + allowance + ot_amount, 2)
                net = round(gross - deductions, 2)

                doc = {
                    "payroll_id": f"PAY-{period.replace('-', '')}-{emp_id}",
                    "employee_id": emp_id,
                    "employee_name": emp["full_name"],
                    "department": emp["department"],
                    "pay_period": period,
                    "month": period,
                    "basic_salary": basic,
                    "allowances": allowance,
                    "deductions": deductions,
                    "overtime_hours": ot_hours,
                    "overtime_amount": ot_amount,
                    "gross_salary": gross,
                    "net_salary": net,
                    "status": "Finalized",
                    "payment_status": "PAID",
                    "processed_at": f"{period}-28T10:00:00Z",
                }
                db.payroll.insert_one(doc)
                inserted_count += 1

    print(f"Historical payroll update: {preserved_count} preserved/enriched, {inserted_count} new historical records created.")

def ensure_approved_leaves_today():
    db = get_db()
    today_str = date.today().isoformat()
    count_today = db.leave_requests.count_documents({
        "status": "Approved",
        "start_date": {"$lte": today_str},
        "end_date": {"$gte": today_str},
    })
    print(f"Approved leaves covering today ({today_str}): {count_today}")
    if count_today == 0:
        # Create approved leave records for today across representative departments
        employees = list(db.employees.find({"employment_status": "Active"}).limit(19))
        leave_types = ["Annual", "Casual", "Sick", "Annual"]
        inserted_leaves = []
        for i, emp in enumerate(employees):
            lt = leave_types[i % len(leave_types)]
            doc = {
                "leave_id": f"LR-{today_str.replace('-', '')}-{emp['employee_id']}",
                "employee_id": emp["employee_id"],
                "leave_type": lt,
                "start_date": (date.today() - timedelta(days=1)).isoformat(),
                "end_date": (date.today() + timedelta(days=2)).isoformat(),
                "days_count": 4,
                "reason": f"Scheduled {lt.lower()} leave request",
                "status": "Approved",
                "approved_by": emp.get("manager_id") or "EMP-HR001",
                "approved_at": f"{today_str}T08:00:00Z",
                "created_at": f"{today_str}T07:30:00Z",
            }
            # Check if already exists
            if not db.leave_requests.find_one({"employee_id": emp["employee_id"], "start_date": doc["start_date"]}):
                inserted_leaves.append(doc)
        if inserted_leaves:
            db.leave_requests.insert_many(inserted_leaves)
            print(f"Added {len(inserted_leaves)} approved leave records covering today.")

if __name__ == "__main__":
    update_timesheets()
    update_historical_payroll()
    ensure_approved_leaves_today()
    print("Feature updates completed successfully!")
