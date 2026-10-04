import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db

client = TestClient(app)


def get_token(email: str, password: str = "Password123!") -> str:
    res = client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def hr_token():
    return get_token("sarah.jenkins@company.com")


@pytest.fixture(scope="module")
def manager1_token():
    return get_token("alexander.wright@company.com")


@pytest.fixture(scope="module")
def manager2_token():
    return get_token("elena.rostova@company.com")


@pytest.fixture(scope="module")
def employee_token():
    # Pick the first active employee
    db = get_db()
    emp_user = db["users"].find_one({"role": "EMPLOYEE", "status": "active", "password_hash": {"$ne": None}})
    return get_token(emp_user["email"]), emp_user["employee_id"]


def test_hr_can_access_audit_logs(hr_token):
    res = client.get("/audit-logs", headers={"Authorization": f"Bearer {hr_token}"})
    assert res.status_code == 200
    assert "items" in res.json()


def test_manager_cannot_access_audit_logs(manager1_token):
    res = client.get("/audit-logs", headers={"Authorization": f"Bearer {manager1_token}"})
    assert res.status_code == 403


def test_employee_cannot_access_audit_logs(employee_token):
    token, _ = employee_token
    res = client.get("/audit-logs", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


def test_hr_dashboard_access(hr_token, manager1_token, employee_token):
    # HR allowed
    res_hr = client.get("/dashboards/hr", headers={"Authorization": f"Bearer {hr_token}"})
    assert res_hr.status_code == 200

    # Manager forbidden from HR dashboard
    res_mgr = client.get("/dashboards/hr", headers={"Authorization": f"Bearer {manager1_token}"})
    assert res_mgr.status_code == 403

    # Employee forbidden from HR dashboard
    tok_emp, _ = employee_token
    res_emp = client.get("/dashboards/hr", headers={"Authorization": f"Bearer {tok_emp}"})
    assert res_emp.status_code == 403


def test_manager_team_boundary_enforcement(manager1_token, manager2_token):
    db = get_db()
    # Find an employee under Manager 1
    m1_emp = db["employees"].find_one({"manager_id": "EMP-MGR001"})
    # Find an employee under Manager 2
    m2_emp = db["employees"].find_one({"manager_id": "EMP-MGR002"})

    assert m1_emp is not None and m2_emp is not None

    # Manager 1 accesses their own team employee -> 200
    res_m1_own = client.get(f"/employees/{m1_emp['employee_id']}", headers={"Authorization": f"Bearer {manager1_token}"})
    assert res_m1_own.status_code == 200

    # Manager 1 attempts to access Manager 2's team employee -> 403 Forbidden!
    res_m1_other = client.get(f"/employees/{m2_emp['employee_id']}", headers={"Authorization": f"Bearer {manager1_token}"})
    assert res_m1_other.status_code == 403
    assert "assigned team" in res_m1_other.json()["detail"]


def test_employee_cannot_access_another_employee_profile(employee_token):
    tok, my_emp_id = employee_token
    db = get_db()

    # Find another employee
    other = db["employees"].find_one({"employee_id": {"$ne": my_emp_id}})
    assert other is not None

    # Employee accesses own profile -> 200
    res_self = client.get(f"/employees/{my_emp_id}", headers={"Authorization": f"Bearer {tok}"})
    assert res_self.status_code == 200

    # Employee accesses other profile -> 403 Forbidden!
    res_other = client.get(f"/employees/{other['employee_id']}", headers={"Authorization": f"Bearer {tok}"})
    assert res_other.status_code == 403
    assert "only access your own" in res_other.json()["detail"]
