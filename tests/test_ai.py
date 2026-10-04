import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db

client = TestClient(app)


def get_token(email: str, password: str = "Password123!") -> str:
    res = client.post("/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]


def test_ai_hr_assistant_department_query():
    hr_token = get_token("sarah.jenkins@company.com")
    res = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {hr_token}"},
        json={"query": "How many employees are in Engineering?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "DEPARTMENT_HEADCOUNT"
    assert "Engineering department" in data["answer"]
    assert data["data"]["active_count"] > 0


def test_ai_hr_assistant_personal_leave_balance():
    db = get_db()
    emp_user = db["users"].find_one({"role": "EMPLOYEE", "status": "active", "password_hash": {"$ne": None}})
    emp_token = get_token(emp_user["email"])

    res = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={"query": "What is my remaining leave balance?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "PERSONAL_LEAVE_BALANCE"
    assert "Your remaining leave balance is" in data["answer"]
    assert "annual" in data["data"]


def test_ai_hr_assistant_unauthorized_cross_employee_query():
    db = get_db()
    emp_user = db["users"].find_one({"role": "EMPLOYEE", "status": "active", "password_hash": {"$ne": None}})
    emp_token = get_token(emp_user["email"])
    my_id = emp_user["employee_id"]

    # Pick a different employee ID
    other_emp = db["employees"].find_one({"employee_id": {"$ne": my_id}})
    other_id = other_emp["employee_id"]

    # Employee tries to inspect another employee
    res = client.post(
        "/ai/assistant",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={"query": f"Show me the private details for {other_id}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "UNAUTHORIZED_ACCESS"
    assert "Access Denied" in data["answer"]


def test_ai_attendance_insights():
    hr_token = get_token("sarah.jenkins@company.com")
    res = client.get("/ai/attendance-insights", headers={"Authorization": f"Bearer {hr_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "insights" in data
    assert len(data["insights"]) > 0
    assert data["overall_health"] in ["Healthy", "Attention Needed", "Critical"]
    assert data["anomaly_count"] >= 0


def test_ai_workforce_forecasting():
    hr_token = get_token("sarah.jenkins@company.com")
    res = client.get("/ai/workforce-forecast", headers={"Authorization": f"Bearer {hr_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["current_headcount"] >= 200
    assert data["forecast_period_months"] == 6
    assert len(data["monthly_forecasts"]) == 6
    assert data["projected_headcount"] >= data["current_headcount"]
