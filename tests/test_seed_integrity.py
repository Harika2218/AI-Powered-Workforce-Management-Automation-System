from backend.database import get_db


def test_seed_integrity():
    db = get_db()
    total_users = db.users.count_documents({})
    hr_count = db.users.count_documents({"role": "HR"})
    manager_count = db.users.count_documents({"role": "MANAGER"})
    employee_count = db.users.count_documents({"role": "EMPLOYEE"})

    assert total_users == 200, f"Expected 200 users, got {total_users}"
    assert hr_count == 5, f"Expected 5 HR users, got {hr_count}"
    assert manager_count == 10, f"Expected 10 Manager users, got {manager_count}"
    assert employee_count == 185, f"Expected 185 Employee users, got {employee_count}"

    # Verify all employees have valid managers
    manager_employee_ids = set(
        doc["employee_id"] for doc in db.users.find({"role": "MANAGER"}, {"employee_id": 1})
    )
    assert len(manager_employee_ids) == 10

    managed_employees = list(db.employees.find({"manager_id": {"$ne": None}}))
    assert len(managed_employees) == 185

    for emp in managed_employees:
        assert emp["manager_id"] in manager_employee_ids, f"Invalid manager {emp['manager_id']} on {emp['employee_id']}"

    # Verify attendance records exist
    att_count = db.attendance.count_documents({})
    assert att_count > 4000, f"Expected >4000 attendance records, got {att_count}"

    # Verify leave requests exist
    leave_count = db.leave_requests.count_documents({})
    assert leave_count > 0, "Expected leave requests"

    # Verify payroll records exist
    payroll_count = db.payroll.count_documents({})
    assert payroll_count > 0, "Expected payroll records"

    # Verify performance records exist
    perf_count = db.performance.count_documents({})
    assert perf_count > 0, "Expected performance records"

    print("Phase 2 Seed Integrity Test: 100% PASSED!")


if __name__ == "__main__":
    test_seed_integrity()
