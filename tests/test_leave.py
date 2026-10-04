import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db

client = TestClient(app)


def get_token(email: str, password: str = "Password123!") -> str:
    res = client.post("/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]


def test_leave_full_lifecycle():
    db = get_db()
    # Find employee under Manager 1 (EMP-MGR001)
    emp = db["employees"].find_one({"manager_id": "EMP-MGR001"})
    assert emp is not None

    emp_user = db["users"].find_one({"employee_id": emp["employee_id"]})
    emp_token = get_token(emp_user["email"])
    mgr_token = get_token("alexander.wright@company.com")

    # Clean existing future leaves for clean test run
    start_date = "2027-05-10"
    end_date = "2027-05-12"  # 3 days
    db["leave_requests"].delete_many({"employee_id": emp["employee_id"], "start_date": start_date})

    # Initial balance check
    bal_res = client.get("/leave/balance/my", headers={"Authorization": f"Bearer {emp_token}"})
    assert bal_res.status_code == 200
    initial_annual = bal_res.json()["annual"]

    # 1. Invalid date (end before start) -> 400
    bad_date_res = client.post(
        "/leave",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={
            "employee_id": emp["employee_id"],
            "leave_type": "Annual",
            "start_date": "2027-05-15",
            "end_date": "2027-05-10",
            "reason": "Invalid trip dates test",
        },
    )
    assert bad_date_res.status_code == 422 or bad_date_res.status_code == 400

    # 2. Valid leave request
    apply_res = client.post(
        "/leave",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={
            "employee_id": emp["employee_id"],
            "leave_type": "Annual",
            "start_date": start_date,
            "end_date": end_date,
            "reason": "Family vacation",
        },
    )
    assert apply_res.status_code == 201
    leave_data = apply_res.json()
    leave_id = leave_data["leave_id"]
    assert leave_data["total_days"] == 3
    assert leave_data["status"] == "Pending"

    # Verify balance has NOT yet been deducted while Pending
    bal_pending = client.get("/leave/balance/my", headers={"Authorization": f"Bearer {emp_token}"}).json()
    assert bal_pending["annual"] == initial_annual

    # 3. Overlapping leave prevention -> 409
    overlap_res = client.post(
        "/leave",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={
            "employee_id": emp["employee_id"],
            "leave_type": "Sick",
            "start_date": "2027-05-11",
            "end_date": "2027-05-13",
            "reason": "Overlapping request",
        },
    )
    assert overlap_res.status_code == 409
    assert "Overlapping leave request already exists" in overlap_res.json()["detail"]

    # 4. Manager approves leave -> balance reduced by 3 days
    appr_res = client.patch(
        f"/leave/{leave_id}/approve",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"comments": "Approved. Have a great vacation!"},
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "Approved"

    # Verify balance reduced
    bal_after = client.get("/leave/balance/my", headers={"Authorization": f"Bearer {emp_token}"}).json()
    assert bal_after["annual"] == initial_annual - 3

    # 5. Cancellation restores deducted days
    canc_res = client.patch(
        f"/leave/{leave_id}/cancel",
        headers={"Authorization": f"Bearer {emp_token}"},
    )
    assert canc_res.status_code == 200
    assert canc_res.json()["status"] == "Cancelled"

    # Verify balance restored
    bal_restored = client.get("/leave/balance/my", headers={"Authorization": f"Bearer {emp_token}"}).json()
    assert bal_restored["annual"] == initial_annual
