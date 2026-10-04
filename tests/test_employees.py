import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db

client = TestClient(app)


def get_token(email: str, password: str = "Password123!") -> str:
    res = client.post("/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]


def test_employee_provisioning_and_lifecycle():
    hr_token = get_token("sarah.jenkins@company.com")
    db = get_db()

    emp_id = "EMP-TEST999"
    email = "new.joiner999@company.com"
    db["employees"].delete_one({"employee_id": emp_id})
    db["users"].delete_one({"email": email})

    # 1. Provision new employee (HR only)
    create_payload = {
        "employee_id": emp_id,
        "first_name": "Marcus",
        "last_name": "Brody",
        "email": email,
        "phone": "+1 (555) 777-8888",
        "department": "Engineering",
        "designation": "Staff Engineer",
        "manager_id": "EMP-MGR001",
        "date_of_joining": "2026-10-01",
        "employment_type": "Full-Time",
        "employment_status": "Active",
        "location": "San Francisco, CA",
        "salary": 140000.0,
        "allowances": 2000.0,
        "skills": ["Python", "FastAPI", "MongoDB"],
        "leave_entitlement": {"annual": 20, "sick": 12, "casual": 8},
        "role": "EMPLOYEE",
        "shift_id": "SHIFT-GEN",
    }

    res = client.post("/employees", headers={"Authorization": f"Bearer {hr_token}"}, json=create_payload)
    assert res.status_code == 201
    created_emp = res.json()
    assert created_emp["employee_id"] == emp_id
    assert "activation_token" in created_emp

    # Verify linked user record created in invited state
    user_doc = db["users"].find_one({"email": email})
    assert user_doc is not None
    assert user_doc["status"] == "invited"
    assert user_doc["first_login"] is True

    # 2. Duplicate employee_id prevention -> 409
    dup_res = client.post("/employees", headers={"Authorization": f"Bearer {hr_token}"}, json=create_payload)
    assert dup_res.status_code == 409

    # 3. Search and pagination
    search_res = client.get("/employees?search=Brody", headers={"Authorization": f"Bearer {hr_token}"})
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total"] >= 1
    assert any(e["employee_id"] == emp_id for e in search_data["items"])

    # 4. Department filter
    dept_res = client.get("/employees?department=Engineering", headers={"Authorization": f"Bearer {hr_token}"})
    assert dept_res.status_code == 200
    assert all(e["department"] == "Engineering" for e in dept_res.json()["items"])

    # 5. Status update (Inactive deactivates user)
    stat_res = client.patch(
        f"/employees/{emp_id}/status",
        headers={"Authorization": f"Bearer {hr_token}"},
        json={"employment_status": "Inactive"},
    )
    assert stat_res.status_code == 200
    updated_user = db["users"].find_one({"email": email})
    assert updated_user["status"] == "deactivated"

    # Cleanup so test environment returns to exactly 200 simulated users
    db["employees"].delete_one({"employee_id": emp_id})
    db["users"].delete_one({"email": email})
    db["auth_tokens"].delete_many({"email": email})
