import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db

client = TestClient(app)


def get_token(email: str, password: str = "Password123!") -> str:
    res = client.post("/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]


def test_timesheet_workflow():
    db = get_db()
    emp = db["employees"].find_one({"manager_id": "EMP-MGR001"})
    emp_user = db["users"].find_one({"employee_id": emp["employee_id"]})
    emp_token = get_token(emp_user["email"])
    mgr_token = get_token("alexander.wright@company.com")

    # 1. Submit timesheet
    ts_res = client.post(
        "/timesheets",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={
            "employee_id": emp["employee_id"],
            "date": "2026-10-01",
            "project_name": "API Modernization",
            "task_name": "Database schema definition",
            "hours_worked": 8.0,
            "description": "Implemented indexing and models",
        },
    )
    assert ts_res.status_code == 201
    ts_data = ts_res.json()
    ts_id = ts_data["timesheet_id"]
    assert ts_data["status"] == "Submitted"

    # 2. Manager approves timesheet
    appr_res = client.patch(
        f"/timesheets/{ts_id}/approve",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"comments": "Approved"},
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "Approved"


def test_shift_management_workflow():
    hr_token = get_token("sarah.jenkins@company.com")
    db = get_db()
    emp = db["employees"].find_one({"manager_id": "EMP-MGR001"})
    emp_user = db["users"].find_one({"employee_id": emp["employee_id"]})
    emp_token = get_token(emp_user["email"])

    # 1. List shifts
    list_res = client.get("/shifts", headers={"Authorization": f"Bearer {hr_token}"})
    assert list_res.status_code == 200
    shifts = list_res.json()
    assert len(shifts) >= 4  # Morning, General, Evening, Night

    # 2. Assign shift to employee
    assign_res = client.post(
        "/shifts/assign",
        headers={"Authorization": f"Bearer {hr_token}"},
        json={"employee_id": emp["employee_id"], "shift_id": "SHIFT-EVN"},
    )
    assert assign_res.status_code == 200

    # 3. Employee views assigned shift
    my_shift_res = client.get("/shifts/my", headers={"Authorization": f"Bearer {emp_token}"})
    assert my_shift_res.status_code == 200
    assert my_shift_res.json()["shift"]["shift_id"] == "SHIFT-EVN"


def test_payroll_input_and_calculation():
    hr_token = get_token("sarah.jenkins@company.com")
    db = get_db()
    emp = db["employees"].find_one({"manager_id": "EMP-MGR001"})
    emp_user = db["users"].find_one({"employee_id": emp["employee_id"]})
    emp_token = get_token(emp_user["email"])

    pay_payload = {
        "employee_id": emp["employee_id"],
        "pay_period": "2026-10",
        "basic_salary": 8000.0,
        "allowances": 1000.0,
        "deductions": 1200.0,
        "overtime_hours": 10.0,
        "overtime_rate": 75.0,  # 10 hrs * $75 = $750
    }
    # Expected gross = 8000 + 1000 + 750 = 9750
    # Expected net = 9750 - 1200 = 8550

    pay_res = client.post("/payroll", headers={"Authorization": f"Bearer {hr_token}"}, json=pay_payload)
    assert pay_res.status_code == 201
    pay_data = pay_res.json()
    assert pay_data["gross_salary"] == 9750.0
    assert pay_data["net_salary"] == 8550.0
    assert pay_data["status"] == "Calculated"

    # Employee views own payroll
    my_pay_res = client.get("/payroll/my?pay_period=2026-10", headers={"Authorization": f"Bearer {emp_token}"})
    assert my_pay_res.status_code == 200
    my_records = my_pay_res.json()
    assert len(my_records) == 1
    assert my_records[0]["net_salary"] == 8550.0


def test_notification_workflow():
    db = get_db()
    emp_user = db["users"].find_one({"role": "EMPLOYEE", "status": "active", "password_hash": {"$ne": None}})
    emp_token = get_token(emp_user["email"])

    # Fetch notifications
    notif_res = client.get("/notifications", headers={"Authorization": f"Bearer {emp_token}"})
    assert notif_res.status_code == 200
    data = notif_res.json()
    assert "unread_count" in data
    assert "items" in data

    # Mark all read
    read_res = client.patch("/notifications/read-all", headers={"Authorization": f"Bearer {emp_token}"})
    assert read_res.status_code == 200
    assert "Marked" in read_res.json()["message"]

    # Verify unread count is now 0
    after_res = client.get("/notifications", headers={"Authorization": f"Bearer {emp_token}"})
    assert after_res.json()["unread_count"] == 0


def test_user_administration_by_hr():
    hr_token = get_token("sarah.jenkins@company.com")

    # List system users
    users_res = client.get("/users?page=1&page_size=10", headers={"Authorization": f"Bearer {hr_token}"})
    assert users_res.status_code == 200
    data = users_res.json()
    assert data["total"] == 200
    assert len(data["items"]) == 10
    # Passwords must not be exposed
    for u in data["items"]:
        assert "password_hash" not in u
