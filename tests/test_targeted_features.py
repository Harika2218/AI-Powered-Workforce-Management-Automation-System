import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db

client = TestClient(app)


def get_token(role: str = "HR") -> str:
    db = get_db()
    if role == "HR":
        email = "sarah.jenkins@company.com"
    elif role == "MANAGER":
        email = "alexander.wright@company.com"
    else:
        emp_user = db["users"].find_one({"role": "EMPLOYEE", "password_hash": {"$ne": None}})
        email = emp_user["email"]

    resp = client.post("/auth/login", json={"email": email, "password": "Password123!"})
    assert resp.status_code == 200, f"Login failed for {role}: {resp.text}"
    return resp.json()["access_token"]


def test_workforce_departments():
    token = get_token("HR")
    resp = client.get("/employees/departments", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    depts = resp.json()
    assert isinstance(depts, list)
    assert len(depts) >= 8
    assert "Engineering" in depts
    assert "Data Science" in depts


def test_workforce_create_employee_auto_id():
    token = get_token("HR")
    unique_email = f"test.auto.{datetime.now().timestamp()}@company.com"
    payload = {
        "first_name": "TestAuto",
        "last_name": "User",
        "email": unique_email,
        "department": "Engineering",
        "designation": "QA Lead",
        "salary": 75000,
        "phone": "+1-555-123-4567",
        "location": "Boston, MA",
        "skills": ["Python", "FastAPI"],
        "date_of_joining": "2026-10-11",
    }
    resp = client.post("/employees", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["employee_id"].startswith("EMP")
    assert data["email"] == unique_email
    assert data["full_name"] == "TestAuto User"
    assert "activation_token" in data

    # Verify directory listing includes new employee
    list_resp = client.get(f"/employees?search={unique_email}", headers={"Authorization": f"Bearer {token}"})
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert any(emp["email"] == unique_email for emp in items)

    # Clean up test employee
    db = get_db()
    db.employees.delete_one({"email": unique_email})
    db.users.delete_one({"email": unique_email})


def test_workforce_create_employee_duplicate_rejection():
    token = get_token("HR")
    # Duplicate email using existing active HR employee
    payload = {
        "first_name": "Duplicate",
        "last_name": "Email",
        "email": "sarah.jenkins@company.com",
        "department": "Engineering",
        "designation": "Engineer",
        "salary": 60000,
        "date_of_joining": "2026-10-11",
    }
    resp = client.post("/employees", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 409


def test_workforce_directory_filtering():
    token = get_token("HR")
    # Filter by department
    resp = client.get("/employees?department=Finance&page_size=50", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert all(e["department"] == "Finance" for e in data["items"])
    assert data["total"] > 0

    # Filter combined with status
    resp_active = client.get("/employees?department=Finance&status=Active&page_size=50", headers={"Authorization": f"Bearer {token}"})
    assert resp_active.status_code == 200
    assert all(e["employment_status"] == "Active" for e in resp_active.json()["items"])


def test_shift_creation_and_overnight_duration():
    token = get_token("HR")
    # Standard shift
    shift_name = f"Test Normal {int(datetime.now().timestamp())}"
    resp = client.post(
        "/shifts",
        json={"name": shift_name, "start_time": "08:00", "end_time": "16:30"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["duration_hours"] == 8.5
    assert data["shift_id"].startswith("SHIFT-")

    # Overnight shift (22:00 to 06:00 -> exactly 8.0 hours across midnight)
    overnight_name = f"Test Overnight {int(datetime.now().timestamp())}"
    resp_on = client.post(
        "/shifts",
        json={"name": overnight_name, "start_time": "22:00", "end_time": "06:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp_on.status_code == 201, resp_on.text
    data_on = resp_on.json()
    assert data_on["duration_hours"] == 8.0

    # Identical start/end time must be rejected
    resp_bad = client.post(
        "/shifts",
        json={"name": "Bad Shift", "start_time": "09:00", "end_time": "09:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp_bad.status_code == 400

    # Clean up test shifts
    db = get_db()
    db.shifts.delete_one({"shift_id": data["shift_id"]})
    db.shifts.delete_one({"shift_id": data_on["shift_id"]})


def test_shift_assignment_workflow():
    hr_token = get_token("HR")
    emp_token = get_token("EMPLOYEE")

    db = get_db()
    emp_user = db["users"].find_one({"role": "EMPLOYEE", "password_hash": {"$ne": None}})
    emp_id = emp_user["employee_id"]

    # Assign evening shift to employee
    assign_resp = client.post(
        "/shifts/assignments",
        json={"employee_id": emp_id, "shift_id": "SHIFT-EVN"},
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert assign_resp.status_code == 200

    # Verify employee view
    my_shift = client.get("/shifts/my", headers={"Authorization": f"Bearer {emp_token}"})
    assert my_shift.status_code == 200
    res_data = my_shift.json()
    assert (res_data.get("shift") or {}).get("shift_id") == "SHIFT-EVN"


def test_attendance_check_in_check_out_and_date_query():
    emp_token = get_token("EMPLOYEE")
    hr_token = get_token("HR")
    db = get_db()
    emp_user = db["users"].find_one({"role": "EMPLOYEE", "password_hash": {"$ne": None}})
    emp_id = emp_user["employee_id"]

    # Clean any test record today for employee
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    db.attendance.delete_many({"employee_id": emp_id, "date": today_str})

    # 1. Clock in
    ci_time = f"{today_str}T09:00:00Z"
    ci_resp = client.post(
        "/attendance/check-in",
        json={"employee_id": emp_id, "timestamp": ci_time},
        headers={"Authorization": f"Bearer {emp_token}"},
    )
    assert ci_resp.status_code == 200, ci_resp.text
    ci_data = ci_resp.json()
    assert ci_data["date"] == today_str
    assert ci_data["check_out"] is None
    assert ci_data["status"] in ["Present", "Late"]

    # 2. Duplicate check-in rejection
    ci_dup = client.post(
        "/attendance/check-in",
        json={"employee_id": emp_id},
        headers={"Authorization": f"Bearer {emp_token}"},
    )
    assert ci_dup.status_code == 409

    # 3. Query attendance for today via HR endpoint
    query_resp = client.get(
        f"/attendance?date_from={today_str}&date_to={today_str}",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert query_resp.status_code == 200
    items = query_resp.json()["items"]
    emp_rec = next((r for r in items if r["employee_id"] == emp_id), None)
    assert emp_rec is not None
    assert emp_rec["employee_name"] is not None
    assert emp_rec["department"] is not None
    assert emp_rec["check_out"] is None

    # 4. Clock out with valid 8.5h duration
    co_time = f"{today_str}T17:30:00Z"
    co_resp = client.post(
        "/attendance/check-out",
        json={"employee_id": emp_id, "timestamp": co_time},
        headers={"Authorization": f"Bearer {emp_token}"},
    )
    assert co_resp.status_code == 200, co_resp.text
    co_data = co_resp.json()
    assert co_data["check_out"] is not None
    assert co_data["working_hours"] == 8.5
    assert co_data["overtime_hours"] == 0.5

    # Clean up test attendance record
    db.attendance.delete_many({"employee_id": emp_id, "date": today_str})
