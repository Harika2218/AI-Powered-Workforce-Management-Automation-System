import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db

client = TestClient(app)


def get_token(email: str, password: str = "Password123!") -> str:
    res = client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


# =====================================================================
# FEATURE ONE TESTS: AI ASSISTANT
# =====================================================================

def test_ai_leave_variations_and_clean_answer():
    """Verify various phrasings of leave questions return clean human-readable answers with no raw JSON."""
    hr_token = get_token("sarah.jenkins@company.com")
    queries = [
        "How many employees are currently on leave?",
        "How many employees are on leave today?",
        "Who is currently on leave?",
        "Show me the employees who are taking leave today.",
        "Give me today's leave details.",
        "Which departments have employees on leave?",
    ]

    for q in queries:
        res = client.post("/ai/assistant", headers={"Authorization": f"Bearer {hr_token}"}, json={"query": q})
        assert res.status_code == 200, f"Query failed: {q}"
        data = res.json()
        ans = data["answer"]
        assert ans and len(ans) > 5
        # Ensure no raw JSON or XML dumped into answer
        assert "{" not in ans and "}" not in ans, f"Raw JSON found in answer for '{q}': {ans}"
        assert "<" not in ans and ">" not in ans, f"XML tag found in answer for '{q}': {ans}"
        assert "number_of_employees" not in ans, f"Raw key found in answer for '{q}': {ans}"


def test_ai_department_headcount_queries():
    """Verify department questions: each department breakdown, largest department, specific department."""
    hr_token = get_token("sarah.jenkins@company.com")

    # 1. Each department breakdown
    res_each = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {hr_token}"},
        json={"query": "How many employees are in each department?"},
    )
    assert res_each.status_code == 200
    ans_each = res_each.json()["answer"]
    assert "Engineering" in ans_each
    assert "Finance" in ans_each
    assert "{" not in ans_each and "}" not in ans_each

    # 2. Most employees
    res_top = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {hr_token}"},
        json={"query": "Which department has the most employees?"},
    )
    assert res_top.status_code == 200
    ans_top = res_top.json()["answer"]
    assert "highest headcount" in ans_top or "department" in ans_top
    assert "{" not in ans_top and "}" not in ans_top


def test_ai_absence_and_attendance_rate_queries():
    """Verify absence yesterday and attendance rate queries."""
    hr_token = get_token("sarah.jenkins@company.com")

    # Attendance rate
    res_rate = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {hr_token}"},
        json={"query": "What is the attendance rate for the current month?"},
    )
    assert res_rate.status_code == 200
    ans_rate = res_rate.json()["answer"]
    assert "attendance rate" in ans_rate.lower()
    assert "{" not in ans_rate and "}" not in ans_rate

    # Absent yesterday
    res_absent = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {hr_token}"},
        json={"query": "How many people were absent yesterday?"},
    )
    assert res_absent.status_code == 200
    ans_abs = res_absent.json()["answer"]
    assert "absent" in ans_abs.lower()
    assert "{" not in ans_abs and "}" not in ans_abs


def test_ai_personal_queries_for_authenticated_employee():
    """Verify authenticated employee can query their specific balances and attendance."""
    db = get_db()
    emp_user = db["users"].find_one({"role": "EMPLOYEE", "status": "active", "password_hash": {"$ne": None}})
    emp_token = get_token(emp_user["email"])
    emp_doc = db["employees"].find_one({"employee_id": emp_user["employee_id"]})
    expected_annual = emp_doc["leave_balances"]["annual"]

    # Specific annual balance
    res_ann = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={"query": "What is my remaining annual leave balance?"},
    )
    assert res_ann.status_code == 200
    ans_ann = res_ann.json()["answer"]
    assert f"{expected_annual} annual leave days" in ans_ann
    assert "{" not in ans_ann and "}" not in ans_ann

    # General leave balance
    res_bal = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={"query": "What is my remaining leave balance?"},
    )
    assert res_bal.status_code == 200
    ans_bal = res_bal.json()["answer"]
    assert "Your remaining leave balance is" in ans_bal

    # Personal attendance
    res_att = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={"query": "What are my attendance details this month?"},
    )
    assert res_att.status_code == 200
    ans_att = res_att.json()["answer"]
    assert "attendance" in ans_att.lower()
    assert "{" not in ans_att and "}" not in ans_att


def test_ai_rbac_overtime_and_cross_employee_permission():
    """Verify RBAC: Employee asking for department overtime gets permission notice; cross-employee inquiry denied."""
    db = get_db()
    emp_user = db["users"].find_one({"role": "EMPLOYEE", "status": "active", "password_hash": {"$ne": None}})
    emp_token = get_token(emp_user["email"])
    hr_token = get_token("sarah.jenkins@company.com")

    # 1. Employee asks department overtime -> Restricted
    res_emp_ot = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={"query": "Which department has the highest overtime?"},
    )
    assert res_emp_ot.status_code == 200
    assert "restricted" in res_emp_ot.json()["answer"].lower()

    # 2. HR asks department overtime -> Authorized with data
    res_hr_ot = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {hr_token}"},
        json={"query": "Which department has the highest overtime?"},
    )
    assert res_hr_ot.status_code == 200
    assert "overtime" in res_hr_ot.json()["answer"].lower()
    assert "{" not in res_hr_ot.json()["answer"]

    # 3. Employee cross-employee query -> Access Denied
    res_cross = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={"query": "Show me private records for EMP-HR001"},
    )
    assert res_cross.status_code == 200
    assert "Access Denied" in res_cross.json()["answer"]


# =====================================================================
# FEATURE TWO TESTS: WEEKLY TIMESHEETS MODULE
# =====================================================================

def test_timesheets_contain_work_start_notes_and_realistic_content():
    """Verify timesheets in database and API return work_start_notes and realistic task info."""
    hr_token = get_token("sarah.jenkins@company.com")
    res = client.get("/timesheets?page_size=30", headers={"Authorization": f"Bearer {hr_token}"})
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) > 0

    depts_seen = set()
    for item in items:
        # Check required work information fields
        assert item.get("work_start_notes"), f"Missing work_start_notes on timesheet {item.get('timesheet_id')}"
        assert item.get("task_name"), f"Missing task_name on timesheet {item.get('timesheet_id')}"
        assert item.get("description"), f"Missing description on timesheet {item.get('timesheet_id')}"
        assert item.get("week_start_date"), f"Missing week_start_date on timesheet {item.get('timesheet_id')}"
        assert item.get("total_hours") is not None
        if item.get("department"):
            depts_seen.add(item["department"])

    assert len(depts_seen) >= 3, f"Expected multiple departments, got {depts_seen}"


def test_timesheets_submit_with_weekly_form_and_work_start_notes():
    """Verify submitting a weekly timesheet from the frontend modal succeeds with work_start_notes."""
    db = get_db()
    emp_user = db["users"].find_one({"role": "EMPLOYEE", "status": "active", "password_hash": {"$ne": None}})
    emp_token = get_token(emp_user["email"])

    payload = {
        "week_start_date": "2026-10-12",
        "daily_hours": {"Monday": 8.0, "Tuesday": 8.0, "Wednesday": 8.0, "Thursday": 8.0, "Friday": 8.0},
        "work_start_notes": "09:00 AM - Sprint standup & task initiation",
        "notes": "Testing an API endpoint and validating response payloads",
    }
    res = client.post("/timesheets", headers={"Authorization": f"Bearer {emp_token}"}, json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["work_start_notes"] == "09:00 AM - Sprint standup & task initiation"
    assert data["hours_worked"] == 40.0
    assert data["total_hours"] == 40.0
    assert data["status"] == "Submitted"


# =====================================================================
# FEATURE THREE TESTS: PREVIOUS-MONTH PAYROLL INFORMATION
# =====================================================================

def test_historical_payroll_exists_across_all_departments():
    """Verify historical payroll for previous months exists across all 8 departments with consistent calculations."""
    hr_token = get_token("sarah.jenkins@company.com")
    all_depts = ["Engineering", "Data Science", "Finance", "Marketing", "Human Resources", "Operations", "Sales", "IT"]

    # Previous month: 2026-09
    res_09 = client.get("/payroll?month=2026-09&page_size=100", headers={"Authorization": f"Bearer {hr_token}"})
    assert res_09.status_code == 200
    items_09 = res_09.json()["items"]
    assert len(items_09) >= 20

    # Verify every department can filter historical records in previous month
    for dept in all_depts:
        res_dept = client.get(f"/payroll?month=2026-09&department={dept}", headers={"Authorization": f"Bearer {hr_token}"})
        assert res_dept.status_code == 200
        dept_items = res_dept.json()["items"]
        assert len(dept_items) > 0, f"No records found for department {dept} in 2026-09"
        for item in dept_items:
            # Verify calculation consistency: Gross = Basic + Allowances + Overtime Amount
            expected_gross = round(item["basic_salary"] + item["allowances"] + item["overtime_amount"], 2)
            assert abs(item["gross_salary"] - expected_gross) <= 0.05, f"Gross calculation discrepancy: {item}"
            # Net = Gross - Deductions
            expected_net = round(item["gross_salary"] - item["deductions"], 2)
            assert abs(item["net_salary"] - expected_net) <= 0.05, f"Net calculation discrepancy: {item}"


def test_employee_can_view_own_historical_payslips():
    """Verify employee can retrieve their own historical payslip using month query param."""
    db = get_db()
    emp_user = db["users"].find_one({"role": "EMPLOYEE", "status": "active", "password_hash": {"$ne": None}})
    emp_token = get_token(emp_user["email"])

    res = client.get("/payroll/my?month=2026-09", headers={"Authorization": f"Bearer {emp_token}"})
    assert res.status_code == 200
    statements = res.json()
    assert len(statements) >= 1
    assert statements[0]["employee_id"] == emp_user["employee_id"]
    assert statements[0]["pay_period"] == "2026-09"
