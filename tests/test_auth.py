import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["total_users"] == 200


def test_login_valid_hr():
    response = client.post("/auth/login", json={
        "email": "sarah.jenkins@company.com",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" == "access_token" in data
    assert data["role"] == "HR"
    assert data["email"] == "sarah.jenkins@company.com"
    assert data["employee_id"] == "EMP-HR001"


def test_login_invalid_password():
    response = client.post("/auth/login", json={
        "email": "sarah.jenkins@company.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_login_unknown_email():
    response = client.post("/auth/login", json={
        "email": "unknown.user999@company.com",
        "password": "Password123!"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_protected_endpoint_without_token():
    response = client.get("/employees")
    assert response.status_code == 401 or response.status_code == 403


def test_account_activation_workflow():
    db = get_db()
    test_email = "test.activation.user@company.com"

    # Set up dedicated invited user and activation token
    db["users"].delete_many({"email": test_email})
    db["auth_tokens"].delete_many({"email": test_email})

    db["users"].insert_one({
        "user_id": "USR-ACT-TEST",
        "email": test_email,
        "password_hash": None,
        "role": "EMPLOYEE",
        "employee_id": "EMP-ACT01",
        "status": "invited",
        "first_login": True,
    })

    from datetime import datetime, timezone, timedelta
    test_token = "ACTIVATE-TEST-TOKEN-999"
    db["auth_tokens"].insert_one({
        "token": test_token,
        "email": test_email,
        "type": "activation",
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "used": False,
    })

    # Try activating with wrong token -> 400
    bad_res = client.post("/auth/activate", json={
        "email": test_email,
        "token": "INVALID-TOKEN-1234",
        "new_password": "NewSecurePassword123!",
        "confirm_password": "NewSecurePassword123!"
    })
    assert bad_res.status_code == 400

    # Try activating with mismatched passwords -> 422
    mismatch_res = client.post("/auth/activate", json={
        "email": test_email,
        "token": test_token,
        "new_password": "NewSecurePassword123!",
        "confirm_password": "DifferentPassword123!"
    })
    assert mismatch_res.status_code == 422

    # Valid activation
    act_res = client.post("/auth/activate", json={
        "email": test_email,
        "token": test_token,
        "new_password": "NewSecurePassword123!",
        "confirm_password": "NewSecurePassword123!"
    })
    assert act_res.status_code == 200
    assert "successfully activated" in act_res.json()["message"]

    # Verify user can now log in with the new password
    login_res = client.post("/auth/login", json={
        "email": test_email,
        "password": "NewSecurePassword123!"
    })
    assert login_res.status_code == 200
    assert login_res.json()["email"] == test_email

    # Clean up test user
    db["users"].delete_many({"email": test_email})
    db["auth_tokens"].delete_many({"email": test_email})


def test_forgot_and_reset_password_workflow():
    db = get_db()
    test_email = "alexander.wright@company.com"

    # Request reset token
    forgot_res = client.post("/auth/forgot-password", json={"email": test_email})
    assert forgot_res.status_code == 200
    reset_token = forgot_res.json()["reset_token"]
    assert reset_token is not None

    # Reset password
    reset_res = client.post("/auth/reset-password", json={
        "token": reset_token,
        "new_password": "UpdatedManagerPassword123!",
        "confirm_password": "UpdatedManagerPassword123!"
    })
    assert reset_res.status_code == 200

    # Verify login with new password
    new_login = client.post("/auth/login", json={
        "email": test_email,
        "password": "UpdatedManagerPassword123!"
    })
    assert new_login.status_code == 200
    assert new_login.json()["role"] == "MANAGER"

    # Restore standard password for subsequent tests
    client.post("/auth/change-password", headers={"Authorization": f"Bearer {new_login.json()['access_token']}"}, json={
        "old_password": "UpdatedManagerPassword123!",
        "new_password": "Password123!",
        "confirm_password": "Password123!"
    })
