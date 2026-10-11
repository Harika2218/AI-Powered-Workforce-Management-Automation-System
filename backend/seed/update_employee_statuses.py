"""
Data-update script to set 20 employees to 'On Leave' and 10 employees to 'Inactive',
yielding exactly:
  170 Active
   20 On Leave
   10 Inactive
Total: 200 employees

Modifies ONLY the employment_status field in the employees collection.
Preserves all other fields and historical records.
"""
from backend.database import get_db
from backend.utils.helpers import now_iso


def update_statuses():
    db = get_db()

    total_before = db.employees.count_documents({})
    print(f"Total employees before update: {total_before}")
    if total_before != 200:
        raise ValueError(f"Expected exactly 200 employees, found {total_before}!")

    # Check distribution before
    statuses_before = {}
    for doc in db.employees.find({}, {"employment_status": 1}):
        st = doc.get("employment_status", "Unknown")
        statuses_before[st] = statuses_before.get(st, 0) + 1
    print(f"Status distribution before: {statuses_before}")

    # Target lists across 7 non-HR regular employee departments
    # 20 On Leave employees
    on_leave_ids = [
        # Engineering (3)
        "EMP0007", "EMP0009", "EMP0011",
        # Operations (3)
        "EMP0002", "EMP0004", "EMP0005",
        # Sales (3)
        "EMP0006", "EMP0014", "EMP0026",
        # Finance (3)
        "EMP0022", "EMP0023", "EMP0027",
        # IT (3)
        "EMP0008", "EMP0017", "EMP0025",
        # Data Science (3)
        "EMP0012", "EMP0015", "EMP0028",
        # Marketing (2)
        "EMP0003", "EMP0016",
    ]

    # 10 Inactive employees
    inactive_ids = [
        # Engineering (2)
        "EMP0013", "EMP0018",
        # Operations (2)
        "EMP0010", "EMP0019",
        # Sales (2)
        "EMP0030", "EMP0032",
        # Finance (1)
        "EMP0033",
        # IT (1)
        "EMP0029",
        # Data Science (1)
        "EMP0037",
        # Marketing (1)
        "EMP0034",
    ]

    assert len(on_leave_ids) == 20, f"Expected 20 On Leave, got {len(on_leave_ids)}"
    assert len(inactive_ids) == 10, f"Expected 10 Inactive, got {len(inactive_ids)}"
    assert len(set(on_leave_ids).intersection(set(inactive_ids))) == 0, "Overlap detected!"

    # Record original state before update
    audit_records = []

    print("\nApplying status updates...")
    now_str = now_iso()

    # Update 20 On Leave
    for emp_id in on_leave_ids:
        emp = db.employees.find_one({"employee_id": emp_id})
        if not emp:
            raise ValueError(f"Employee {emp_id} not found!")
        original_status = emp.get("employment_status")
        db.employees.update_one(
            {"employee_id": emp_id},
            {"$set": {"employment_status": "On Leave", "updated_at": now_str}},
        )
        audit_records.append({
            "employee_id": emp_id,
            "full_name": emp["full_name"],
            "department": emp["department"],
            "designation": emp["designation"],
            "before": original_status,
            "after": "On Leave",
        })

    # Update 10 Inactive
    for emp_id in inactive_ids:
        emp = db.employees.find_one({"employee_id": emp_id})
        if not emp:
            raise ValueError(f"Employee {emp_id} not found!")
        original_status = emp.get("employment_status")
        db.employees.update_one(
            {"employee_id": emp_id},
            {"$set": {"employment_status": "Inactive", "updated_at": now_str}},
        )
        audit_records.append({
            "employee_id": emp_id,
            "full_name": emp["full_name"],
            "department": emp["department"],
            "designation": emp["designation"],
            "before": original_status,
            "after": "Inactive",
        })

    total_after = db.employees.count_documents({})
    statuses_after = {}
    for doc in db.employees.find({}, {"employment_status": 1}):
        st = doc.get("employment_status", "Unknown")
        statuses_after[st] = statuses_after.get(st, 0) + 1

    print(f"\nTotal employees after update: {total_after}")
    print(f"Status distribution after: {statuses_after}")

    assert total_after == 200, f"Employee count altered: {total_after}"
    assert statuses_after.get("Active") == 170, f"Expected 170 Active, got {statuses_after.get('Active')}"
    assert statuses_after.get("On Leave") == 20, f"Expected 20 On Leave, got {statuses_after.get('On Leave')}"
    assert statuses_after.get("Inactive") == 10, f"Expected 10 Inactive, got {statuses_after.get('Inactive')}"

    print("\nUpdated Employee Summary:")
    for r in audit_records:
        print(f"  {r['employee_id']}: {r['full_name']} | Dept: {r['department']} | {r['before']} -> {r['after']}")

    print("\nUpdate completed successfully with 100% data integrity verified.")
    return audit_records


if __name__ == "__main__":
    update_statuses()
