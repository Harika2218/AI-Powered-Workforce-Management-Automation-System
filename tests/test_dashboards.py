import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db

client = TestClient(app)


def get_token(email: str, password: str = "Password123!") -> str:
    res = client.post("/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]


def test_hr_dashboard_calculations():
    hr_token = get_token("sarah.jenkins@company.com")
    res = client.get("/dashboards/hr", headers={"Authorization": f"Bearer {hr_token}"})
    assert res.status_code == 200
    data = res.json()

    assert data["total_employees"] >= 200
    assert data["total_departments"] == 8
    assert "attendance_distribution" in data
    assert "attendance_trend" in data
    assert len(data["attendance_trend"]) > 0
    assert "employees_by_department" in data
    assert len(data["employees_by_department"]) == 8
    assert "pending_approvals" in data
    assert "recent_anomalies" in data


def test_manager_dashboard_calculations():
    mgr_token = get_token("alexander.wright@company.com")
    res = client.get("/dashboards/manager", headers={"Authorization": f"Bearer {mgr_token}"})
    assert res.status_code == 200
    data = res.json()

    assert data["team_size"] >= 15  # Manager 1 manages 18 or 19 employees
    assert "team_attendance_distribution" in data
    assert "team_leave_distribution" in data
    assert data["team_avg_working_hours"] > 0
    assert data["team_avg_performance"] >= 1.0


def test_employee_dashboard_calculations():
    db = get_db()
    emp_user = db["users"].find_one({"role": "EMPLOYEE", "status": "active", "password_hash": {"$ne": None}})
    emp_token = get_token(emp_user["email"])

    res = client.get("/dashboards/employee", headers={"Authorization": f"Bearer {emp_token}"})
    assert res.status_code == 200
    data = res.json()

    assert data["employee_id"] == emp_user["employee_id"]
    assert "leave_balances" in data
    assert "annual" in data["leave_balances"]
    assert "personal_attendance_trend" in data
    assert isinstance(data["personal_attendance_trend"], list)
