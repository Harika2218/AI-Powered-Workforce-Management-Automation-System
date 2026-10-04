import requests

BASE_URL = "http://127.0.0.1:8000"

def test_flow():
    print("1. Testing Health...")
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("Health response:", r.json())

    print("\n2. Testing HR Login (sarah.jenkins@company.com)...")
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": "sarah.jenkins@company.com", "password": "Password123!"})
    assert r.status_code == 200, f"HR login failed: {r.text}"
    hr_token = r.json()["access_token"]
    print(f"HR Login Success! Role: {r.json()['role']}, Employee ID: {r.json()['employee_id']}")

    hr_headers = {"Authorization": f"Bearer {hr_token}"}

    print("\n3. Testing HR Dashboard endpoint (/dashboards/hr)...")
    r = requests.get(f"{BASE_URL}/dashboards/hr", headers=hr_headers)
    assert r.status_code == 200, f"HR dashboard failed: {r.text}"
    data = r.json()
    print(f"Total Staff: {data['total_employees']}, Present: {data['present_today']}, Absent: {data['absent_today']}, Overtime: {data['overtime_hours_today']} hrs")
    print(f"Attendance Distribution: {data['attendance_distribution']}")
    print(f"Pending Approvals: {data['pending_approvals']}")

    print("\n4. Testing AI Assistant (/ai/assistant)...")
    r = requests.post(f"{BASE_URL}/ai/assistant", headers=hr_headers, json={"query": "How many employees are in Engineering?"})
    assert r.status_code == 200, f"AI Assistant failed: {r.text}"
    ai_data = r.json()
    print(f"AI Answer: {ai_data['answer']}")

    print("\n5. Testing Employee Login (josiah.harris@company.com)...")
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": "josiah.harris@company.com", "password": "Password123!"})
    assert r.status_code == 200, f"Employee login failed: {r.text}"
    emp_token = r.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    print("\n6. Testing Employee Dashboard (/dashboards/employee)...")
    r = requests.get(f"{BASE_URL}/dashboards/employee", headers=emp_headers)
    assert r.status_code == 200, f"Employee dashboard failed: {r.text}"
    emp_data = r.json()
    print(f"Employee Name: {emp_data['employee_name']}, Status: {emp_data['today_status']}, Balances: {emp_data['leave_balances']}")

    print("\nALL BACKEND-FRONTEND API CONTRACTS PASSED VALIDATION PERFECTLY!")

if __name__ == "__main__":
    test_flow()
