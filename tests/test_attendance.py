import pytest
from datetime import datetime, date, timedelta, timezone
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db

client = TestClient(app)


def get_token(email: str, password: str = "Password123!") -> str:
    res = client.post("/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def employee_auth():
    db = get_db()
    emp_user = db["users"].find_one({"role": "EMPLOYEE", "status": "active", "password_hash": {"$ne": None}})
    token = get_token(emp_user["email"])
    return token, emp_user["employee_id"]


def test_attendance_workflow(employee_auth):
    token, emp_id = employee_auth
    db = get_db()

    # Clean up today's record for this employee to test full check-in/out cycle
    test_date = "2026-10-15"
    db["attendance"].delete_many({"employee_id": emp_id, "date": test_date})

    # 1. Check in
    ci_time = f"{test_date}T08:50:00Z"
    ci_res = client.post(
        "/attendance/check-in",
        headers={"Authorization": f"Bearer {token}"},
        json={"employee_id": emp_id, "timestamp": ci_time},
    )
    assert ci_res.status_code == 200
    ci_data = ci_res.json()
    assert ci_data["status"] == "Present"
    assert ci_data["late_minutes"] == 0

    # 2. Duplicate check-in prevention -> 409
    dup_res = client.post(
        "/attendance/check-in",
        headers={"Authorization": f"Bearer {token}"},
        json={"employee_id": emp_id, "timestamp": ci_time},
    )
    assert dup_res.status_code == 409
    assert "already checked in" in dup_res.json()["detail"]

    # 3. Check out (9.5 hours later -> 1.5 hours overtime)
    co_time = f"{test_date}T18:20:00Z"
    co_res = client.post(
        "/attendance/check-out",
        headers={"Authorization": f"Bearer {token}"},
        json={"employee_id": emp_id, "timestamp": co_time},
    )
    assert co_res.status_code == 200
    co_data = co_res.json()
    assert co_data["working_hours"] == 9.5
    assert co_data["overtime_hours"] == 1.5

    # 4. Duplicate checkout prevention -> 409
    dup_co_res = client.post(
        "/attendance/check-out",
        headers={"Authorization": f"Bearer {token}"},
        json={"employee_id": emp_id, "timestamp": co_time},
    )
    assert dup_co_res.status_code == 409


def test_invalid_checkout_without_checkin():
    # Use HR token and test checking out a date where employee never checked in
    hr_token = get_token("sarah.jenkins@company.com")
    db = get_db()
    emp = db["employees"].find_one({"employee_id": "EMP-HR001"})

    future_date = "2029-01-01"
    db["attendance"].delete_many({"employee_id": "EMP-HR001", "date": future_date})

    res = client.post(
        "/attendance/check-out",
        headers={"Authorization": f"Bearer {hr_token}"},
        json={"employee_id": "EMP-HR001", "timestamp": f"{future_date}T17:00:00Z"},
    )
    assert res.status_code == 400
    assert "No active check-in record found" in res.json()["detail"]


def test_attendance_anomaly_detection():
    hr_token = get_token("sarah.jenkins@company.com")
    res = client.get("/attendance/anomalies", headers={"Authorization": f"Bearer {hr_token}"})
    assert res.status_code == 200
    anomalies = res.json()
    assert isinstance(anomalies, list)
    assert len(anomalies) > 0
    first = anomalies[0]
    assert "anomaly_type" in first
    assert "severity" in first
    assert "employee_id" in first
