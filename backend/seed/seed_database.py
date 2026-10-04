import argparse
import logging
import random
import uuid
from datetime import datetime, date, timedelta, timezone
from backend.database import get_db, init_db_indexes
from backend.utils.security import hash_password, generate_secure_token

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

DEPARTMENTS = [
    "Engineering",
    "Data Science",
    "Finance",
    "Marketing",
    "Human Resources",
    "Operations",
    "Sales",
    "IT",
]

SHIFTS_DATA = [
    {"shift_id": "SHIFT-GEN", "name": "General", "start_time": "09:00", "end_time": "17:00", "duration_hours": 8.0},
    {"shift_id": "SHIFT-MRN", "name": "Morning", "start_time": "07:00", "end_time": "15:00", "duration_hours": 8.0},
    {"shift_id": "SHIFT-EVN", "name": "Evening", "start_time": "15:00", "end_time": "23:00", "duration_hours": 8.0},
    {"shift_id": "SHIFT-NGT", "name": "Night", "start_time": "23:00", "end_time": "07:00", "duration_hours": 8.0},
]

HR_PROFILES = [
    ("Sarah", "Jenkins", "sarah.jenkins@company.com", "VP of People & Culture"),
    ("David", "Miller", "david.miller@company.com", "Senior HR Business Partner"),
    ("Rachel", "Adams", "rachel.adams@company.com", "Talent Acquisition Lead"),
    ("Carlos", "Mendez", "carlos.mendez@company.com", "HR Operations Specialist"),
    ("Priya", "Sharma", "priya.sharma@company.com", "People Analytics Specialist"),
]

MANAGER_PROFILES = [
    ("Alexander", "Wright", "alexander.wright@company.com", "Engineering", "Software Engineering Director"),
    ("Elena", "Rostova", "elena.rostova@company.com", "Engineering", "Principal Engineering Manager"),
    ("Marcus", "Chen", "marcus.chen@company.com", "Data Science", "Head of Data Science"),
    ("Olivia", "Taylor", "olivia.taylor@company.com", "Finance", "Finance Controller & Manager"),
    ("Liam", "Gallagher", "liam.gallagher@company.com", "Marketing", "Marketing Director"),
    ("Sophia", "Patel", "sophia.patel@company.com", "Operations", "Operations Manager"),
    ("Noah", "Williams", "noah.williams@company.com", "Operations", "Infrastructure & Logistics Lead"),
    ("Emma", "Davis", "emma.davis@company.com", "Sales", "Enterprise Sales Director"),
    ("James", "Wilson", "james.wilson@company.com", "Sales", "Regional Sales Manager"),
    ("Aria", "Takahashi", "aria.takahashi@company.com", "IT", "IT Systems & Support Manager"),
]

FIRST_NAMES = [
    "Liam", "Emma", "Noah", "Olivia", "William", "Ava", "James", "Isabella",
    "Oliver", "Sophia", "Benjamin", "Mia", "Elijah", "Charlotte", "Lucas", "Amelia",
    "Mason", "Harper", "Logan", "Evelyn", "Alexander", "Abigail", "Ethan", "Emily",
    "Jacob", "Elizabeth", "Michael", "Mila", "Daniel", "Ella", "Henry", "Avery",
    "Jackson", "Sofia", "Sebastian", "Camila", "Aiden", "Aria", "Matthew", "Scarlett",
    "Samuel", "Victoria", "David", "Madison", "Joseph", "Luna", "Carter", "Grace",
    "Owen", "Chloe", "Wyatt", "Penelope", "John", "Layla", "Jack", "Riley",
    "Luke", "Zoey", "Jayden", "Nora", "Dylan", "Lily", "Grayson", "Eleanor",
    "Levi", "Hannah", "Isaac", "Lillian", "Gabriel", "Addison", "Julian", "Aubrey",
    "Mateo", "Ellie", "Anthony", "Stella", "Jaxon", "Natalie", "Lincoln", "Zoe",
    "Joshua", "Leah", "Christopher", "Hazel", "Andrew", "Violet", "Theodore", "Aurora",
    "Caleb", "Savannah", "Ryan", "Audrey", "Asher", "Brooklyn", "Nathan", "Bella",
    "Thomas", "Claire", "Leo", "Skylar", "Isaiah", "Lucy", "Charles", "Paisley",
    "Josiah", "Everly", "Hudson", "Anna", "Christian", "Caroline", "Hunter", "Nova",
    "Connor", "Genesis", "Eli", "Emilia", "Ezra", "Kennedy", "Aaron", "Samantha",
    "Landon", "Maya", "Adrian", "Willow", "Jonathan", "Kinsley", "Nolan", "Naomi",
    "Jeremiah", "Aaliyah", "Easton", "Elena", "Elias", "Sarah", "Colton", "Ariana",
    "Cameron", "Allison", "Carson", "Gabriella", "Robert", "Alice", "Angel", "Madelyn",
    "Maverick", "Cora", "Nicholas", "Ruby", "Dominic", "Eva", "Jaxson", "Serenity",
    "Greyson", "Autumn", "Adam", "Adeline", "Ian", "Hailey", "Austin", "Gianna",
    "Santiago", "Valentina", "Jordan", "Isla", "Cooper", "Eliana", "Brayden", "Quinn"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
    "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
    "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
    "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
    "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
    "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
    "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza",
    "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers",
    "Long", "Ross", "Foster", "Jimenez", "Powell", "Jenkins", "Perry", "Russell",
    "Sullivan", "Bell", "Coleman", "Butler", "Henderson", "Barnes", "Gonzales", "Fisher",
    "Vasquez", "Simmons", "Romero", "Jordan", "Patterson", "Alexander", "Hamilton", "Graham"
]

ROLE_DESIGNATIONS = {
    "Engineering": ["Senior Software Engineer", "Full Stack Developer", "Backend Engineer", "Frontend Developer", "DevOps Engineer", "QA Engineer"],
    "Data Science": ["Data Scientist", "Machine Learning Engineer", "BI Analyst", "Data Engineer"],
    "Finance": ["Financial Analyst", "Accountant", "Budget Analyst", "Payroll Specialist"],
    "Marketing": ["Digital Marketing Specialist", "Content Strategist", "SEO Analyst", "Brand Manager"],
    "Operations": ["Operations Specialist", "Supply Chain Analyst", "Process Engineer", "Logistics Coordinator"],
    "Sales": ["Account Executive", "Sales Development Rep", "Customer Success Manager", "Solutions Consultant"],
    "IT": ["Systems Administrator", "Network Engineer", "Cybersecurity Analyst", "IT Helpdesk Specialist"],
}

SKILLS_POOL = [
    "Python", "FastAPI", "MongoDB", "React", "Docker", "SQL", "Data Analysis",
    "Git", "REST APIs", "Project Management", "Agile", "Customer Relations",
    "Financial Modeling", "Negotiation", "Cloud Computing", "Linux", "DevOps",
    "Problem Solving", "Strategic Planning", "Communication"
]

CITIES = ["New York, NY", "San Francisco, CA", "Austin, TX", "Seattle, WA", "Chicago, IL", "Boston, MA"]


def seed_database(reset: bool = True) -> None:
    """
    Seed the MongoDB database with exactly 200 users:
    - 5 HR users
    - 10 Manager users
    - 185 Employee users
    With fully consistent attendance, leave, shift, timesheet, payroll, and performance records.
    """
    random.seed(42)  # Deterministic seed for reproducible testing
    db = get_db()

    collections = [
        "users", "employees", "attendance", "leave_requests", "shifts",
        "timesheets", "payroll", "performance", "notifications", "audit_logs",
        "auth_tokens", "holidays", "knowledge_documents", "attendance_anomalies",
        "shift_assignments", "system_settings", "integration_configs", "training",
        "departments", "projects", "leave_balances", "integration_logs"
    ]

    if reset:
        logger.info("Reset flag enabled. Clearing collections...")
        for col in collections:
            try:
                db[col].drop()
            except Exception as e:
                logger.debug(f"Drop {col} note: {e}")

    logger.info("Initializing database indexes...")
    init_db_indexes()

    # Pre-hash standard password once to save CPU
    standard_password_hash = hash_password("Password123!")

    # 1. Insert Shifts
    logger.info("Seeding shifts...")
    db["shifts"].insert_many(SHIFTS_DATA)

    all_users = []
    all_employees = []
    now_iso = datetime.now(timezone.utc).isoformat()

    # 2. Generate 5 HR Users
    logger.info("Generating 5 HR users...")
    hr_ids = []
    for idx, (first_name, last_name, email, desig) in enumerate(HR_PROFILES, start=1):
        emp_id = f"EMP-HR{idx:03d}"
        hr_ids.append(emp_id)
        user_id = f"USR-HR{idx:03d}"

        # 4 active, 1 invited for first-time login testing
        status = "invited" if idx == 5 else "active"
        first_login = True if idx == 5 else False

        user_doc = {
            "user_id": user_id,
            "email": email,
            "password_hash": standard_password_hash if status == "active" else None,
            "role": "HR",
            "employee_id": emp_id,
            "status": status,
            "first_login": first_login,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        all_users.append(user_doc)

        emp_doc = {
            "employee_id": emp_id,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": f"{first_name} {last_name}",
            "email": email,
            "phone": f"+1 (555) 100-00{idx:02d}",
            "department": "Human Resources",
            "designation": desig,
            "manager_id": None,
            "date_of_joining": "2023-01-15",
            "employment_type": "Full-Time",
            "employment_status": "Active",
            "location": "New York, NY",
            "salary": 95000.0 + (idx * 5000),
            "allowances": 1500.0,
            "skills": ["HRIS", "Talent Management", "Labor Relations", "Strategic Planning"],
            "leave_balances": {"annual": 18, "sick": 10, "casual": 7},
            "shift_id": "SHIFT-GEN",
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        all_employees.append(emp_doc)

        # If invited, insert an activation token
        if status == "invited":
            db["auth_tokens"].insert_one({
                "token": "ACTIVATE-HR-TEST",
                "email": email,
                "type": "activation",
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                "used": False,
            })

    # 3. Generate 10 Manager Users
    logger.info("Generating 10 Manager users...")
    manager_ids = []
    manager_objects = []
    for idx, (first_name, last_name, email, dept, desig) in enumerate(MANAGER_PROFILES, start=1):
        emp_id = f"EMP-MGR{idx:03d}"
        manager_ids.append(emp_id)
        user_id = f"USR-MGR{idx:03d}"

        user_doc = {
            "user_id": user_id,
            "email": email,
            "password_hash": standard_password_hash,
            "role": "MANAGER",
            "employee_id": emp_id,
            "status": "active",
            "first_login": False,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        all_users.append(user_doc)

        emp_doc = {
            "employee_id": emp_id,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": f"{first_name} {last_name}",
            "email": email,
            "phone": f"+1 (555) 200-00{idx:02d}",
            "department": dept,
            "designation": desig,
            "manager_id": None,
            "date_of_joining": "2023-03-01",
            "employment_type": "Full-Time",
            "employment_status": "Active",
            "location": random.choice(CITIES),
            "salary": 110000.0 + (idx * 3000),
            "allowances": 2000.0,
            "skills": random.sample(SKILLS_POOL, 4) + ["Team Leadership", "People Management"],
            "leave_balances": {"annual": 16, "sick": 9, "casual": 6},
            "shift_id": "SHIFT-GEN",
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        all_employees.append(emp_doc)
        manager_objects.append((emp_id, dept))

    # 4. Generate 185 Employee Users
    logger.info("Generating 185 Employee users distributed across 10 managers...")
    # Distribution: 5 managers manage 19, 5 managers manage 18 => 5*19 + 5*18 = 95 + 90 = 185 employees
    manager_quotas = [19 if i % 2 == 0 else 18 for i in range(10)]
    assert sum(manager_quotas) == 185

    assigned_manager_indices = []
    for mgr_idx, quota in enumerate(manager_quotas):
        assigned_manager_indices.extend([mgr_idx] * quota)

    random.shuffle(assigned_manager_indices)

    emp_counter = 1
    used_emails = {u["email"] for u in all_users}

    for i in range(185):
        mgr_idx = assigned_manager_indices[i]
        mgr_id, dept = manager_objects[mgr_idx]

        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        base_email = f"{first_name.lower()}.{last_name.lower()}@company.com"
        email = base_email
        email_inc = 1
        while email in used_emails:
            email = f"{first_name.lower()}.{last_name.lower()}{email_inc}@company.com"
            email_inc += 1
        used_emails.add(email)

        emp_id = f"EMP{emp_counter:04d}"
        user_id = f"USR-EMP{emp_counter:04d}"
        emp_counter += 1

        # Make the last 2 employees "invited" to test activation workflow
        is_invited = (i >= 183)
        status = "invited" if is_invited else "active"
        first_login = True if is_invited else False

        user_doc = {
            "user_id": user_id,
            "email": email,
            "password_hash": None if is_invited else standard_password_hash,
            "role": "EMPLOYEE",
            "employee_id": emp_id,
            "status": status,
            "first_login": first_login,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        all_users.append(user_doc)

        if is_invited:
            db["auth_tokens"].insert_one({
                "token": f"ACTIVATE-EMP-{emp_id}",
                "email": email,
                "type": "activation",
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                "used": False,
            })

        designations = ROLE_DESIGNATIONS.get(dept, ["Staff Specialist"])
        desig = random.choice(designations)
        shift = random.choice(["SHIFT-GEN", "SHIFT-GEN", "SHIFT-GEN", "SHIFT-MRN", "SHIFT-EVN"])

        # Realistic joining dates from 2024 to early 2026
        join_days_ago = random.randint(100, 800)
        join_date = (date.today() - timedelta(days=join_days_ago)).isoformat()

        emp_doc = {
            "employee_id": emp_id,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": f"{first_name} {last_name}",
            "email": email,
            "phone": f"+1 (555) {random.randint(300, 999)}-{random.randint(1000, 9999)}",
            "department": dept,
            "designation": desig,
            "manager_id": mgr_id,
            "date_of_joining": join_date,
            "employment_type": random.choice(["Full-Time", "Full-Time", "Full-Time", "Contract"]),
            "employment_status": "Active",
            "location": random.choice(CITIES),
            "salary": float(random.randint(60, 110) * 1000),
            "allowances": float(random.choice([500, 800, 1000, 1200])),
            "skills": random.sample(SKILLS_POOL, random.randint(3, 5)),
            "leave_balances": {
                "annual": random.randint(8, 18),
                "sick": random.randint(5, 10),
                "casual": random.randint(3, 7)
            },
            "shift_id": shift,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        all_employees.append(emp_doc)

    logger.info(f"Inserting {len(all_users)} total users and {len(all_employees)} employee records...")
    db["users"].insert_many(all_users)
    db["employees"].insert_many(all_employees)

    # 5. Generate 30 Days Attendance History for realistic dashboards and analytics
    logger.info("Generating 30 days of consistent attendance history...")
    attendance_records = []
    today = date.today()

    # Pre-select some employees for approved leaves so leave & attendance match
    approved_leave_map = {}  # (employee_id, date_str) -> True
    leave_records = []

    # Create approved & pending leaves
    leave_id_counter = 1
    for emp in all_employees[:100]:  # subset has leave history
        # 1-2 leave requests per employee
        req_count = random.choice([0, 1, 1, 2])
        for _ in range(req_count):
            l_id = f"LEV-{leave_id_counter:05d}"
            leave_id_counter += 1
            l_type = random.choice(["Annual", "Sick", "Casual"])
            offset = random.randint(-25, 10)
            l_start = today + timedelta(days=offset)
            duration = random.randint(1, 3)
            l_end = l_start + timedelta(days=duration - 1)
            status = random.choice(["Approved", "Approved", "Pending", "Rejected"])

            leave_doc = {
                "leave_id": l_id,
                "employee_id": emp["employee_id"],
                "leave_type": l_type,
                "start_date": l_start.isoformat(),
                "end_date": l_end.isoformat(),
                "total_days": duration,
                "reason": f"Scheduled {l_type.lower()} leave for personal matters",
                "status": status,
                "applied_at": (datetime.now(timezone.utc) - timedelta(days=35 - offset)).isoformat(),
                "reviewed_by": emp["manager_id"] or "EMP-HR001",
                "reviewed_at": (datetime.now(timezone.utc) - timedelta(days=33 - offset)).isoformat() if status in ["Approved", "Rejected"] else None,
                "comments": f"{status} by management" if status in ["Approved", "Rejected"] else None,
            }
            leave_records.append(leave_doc)

            if status == "Approved":
                # Mark days in approved_leave_map
                curr = l_start
                while curr <= l_end:
                    approved_leave_map[(emp["employee_id"], curr.isoformat())] = True
                    curr += timedelta(days=1)

    db["leave_requests"].insert_many(leave_records)

    # Attendance generation for 30 days
    att_counter = 1
    for day_offset in range(30, -1, -1):
        target_date = today - timedelta(days=day_offset)
        target_date_str = target_date.isoformat()
        is_weekend = target_date.weekday() >= 5  # Saturday or Sunday

        for emp in all_employees:
            emp_id = emp["employee_id"]

            # If weekend, no attendance required
            if is_weekend:
                continue

            # Check if employee has approved leave for this date
            if (emp_id, target_date_str) in approved_leave_map:
                att_status = "On Leave"
                check_in_str = None
                check_out_str = None
                working_hours = 0.0
                late_mins = 0
                ot_hours = 0.0
            else:
                # 90% Present, 4% Late, 3% Half Day, 3% Absent
                rand_val = random.random()
                if rand_val < 0.88:
                    att_status = "Present"
                    # Check in between 08:45 and 09:00
                    ci_minute = random.randint(45, 59)
                    ci_hour = 8
                    check_in_dt = datetime(target_date.year, target_date.month, target_date.day, ci_hour, ci_minute, 0)
                    # Stay 8 to 9.5 hours
                    work_duration_hours = round(random.uniform(8.0, 9.5), 2)
                    co_dt = check_in_dt + timedelta(hours=work_duration_hours)
                    check_in_str = check_in_dt.isoformat()
                    check_out_str = co_dt.isoformat()
                    working_hours = work_duration_hours
                    late_mins = 0
                    ot_hours = round(max(0.0, work_duration_hours - 8.0), 2)
                elif rand_val < 0.94:
                    att_status = "Late"
                    # Check in between 09:15 and 09:50
                    ci_minute = random.randint(15, 50)
                    check_in_dt = datetime(target_date.year, target_date.month, target_date.day, 9, ci_minute, 0)
                    work_duration_hours = round(random.uniform(7.5, 8.5), 2)
                    co_dt = check_in_dt + timedelta(hours=work_duration_hours)
                    check_in_str = check_in_dt.isoformat()
                    check_out_str = co_dt.isoformat()
                    working_hours = work_duration_hours
                    late_mins = ci_minute
                    ot_hours = round(max(0.0, work_duration_hours - 8.0), 2)
                elif rand_val < 0.97:
                    att_status = "Half Day"
                    check_in_dt = datetime(target_date.year, target_date.month, target_date.day, 9, 0, 0)
                    work_duration_hours = 4.0
                    co_dt = check_in_dt + timedelta(hours=work_duration_hours)
                    check_in_str = check_in_dt.isoformat()
                    check_out_str = co_dt.isoformat()
                    working_hours = 4.0
                    late_mins = 0
                    ot_hours = 0.0
                else:
                    att_status = "Absent"
                    check_in_str = None
                    check_out_str = None
                    working_hours = 0.0
                    late_mins = 0
                    ot_hours = 0.0

            # Special case for "today": keep checkout open for currently checked-in staff
            if day_offset == 0:
                if att_status in ["Present", "Late"]:
                    # 60% haven't checked out yet because it's current work hours
                    if random.random() < 0.6:
                        check_out_str = None
                        working_hours = 4.5

            attendance_records.append({
                "attendance_id": f"ATT-{att_counter:07d}",
                "employee_id": emp_id,
                "date": target_date_str,
                "check_in": check_in_str,
                "check_out": check_out_str,
                "working_hours": working_hours,
                "status": att_status,
                "late_minutes": late_mins,
                "overtime_hours": ot_hours,
            })
            att_counter += 1

    logger.info(f"Inserting {len(attendance_records)} attendance records...")
    db["attendance"].insert_many(attendance_records)

    # 6. Generate Timesheets (last 2 weeks for employees)
    logger.info("Generating realistic timesheets...")
    timesheets = []
    ts_counter = 1
    for day_offset in range(14, 0, -1):
        ts_date = today - timedelta(days=day_offset)
        if ts_date.weekday() >= 5:
            continue
        ts_date_str = ts_date.isoformat()
        # 40 employees per day have submitted timesheets
        for emp in all_employees[:40]:
            ts_id = f"TS-{ts_counter:06d}"
            ts_counter += 1
            st = "Approved" if day_offset > 3 else "Submitted"
            timesheets.append({
                "timesheet_id": ts_id,
                "employee_id": emp["employee_id"],
                "date": ts_date_str,
                "project_name": f"{emp['department']} Core Operations",
                "task_name": "Sprint deliverables and maintenance",
                "hours_worked": 8.0,
                "description": "Completed scheduled technical tasks and team collaboration",
                "status": st,
                "approved_by": emp["manager_id"] or "EMP-HR001" if st == "Approved" else None,
                "reviewed_at": now_iso if st == "Approved" else None,
                "comments": "Great work" if st == "Approved" else None,
            })
    db["timesheets"].insert_many(timesheets)

    # 7. Generate Payroll Records for recent pay periods
    logger.info("Generating payroll records...")
    payroll_records = []
    pay_counter = 1
    pay_periods = ["2026-08", "2026-09"]
    for period in pay_periods:
        for emp in all_employees:
            basic = emp["salary"] / 12.0
            allowance = emp["allowances"]
            deductions = round(basic * 0.12, 2)  # Standard 12% deductions
            ot_hours = round(random.uniform(0, 8), 1) if random.random() < 0.3 else 0.0
            ot_rate = round((basic / 160.0) * 1.5, 2)
            ot_amount = round(ot_hours * ot_rate, 2)
            gross = round(basic + allowance + ot_amount, 2)
            net = round(gross - deductions, 2)

            payroll_records.append({
                "payroll_id": f"PAY-{pay_counter:06d}",
                "employee_id": emp["employee_id"],
                "pay_period": period,
                "basic_salary": round(basic, 2),
                "allowances": round(allowance, 2),
                "deductions": deductions,
                "overtime_hours": ot_hours,
                "overtime_amount": ot_amount,
                "gross_salary": gross,
                "net_salary": net,
                "status": "Finalized",
                "processed_at": f"{period}-28T10:00:00Z",
            })
            pay_counter += 1
    db["payroll"].insert_many(payroll_records)

    # 8. Generate Performance Reviews
    logger.info("Generating performance reviews...")
    performance_records = []
    perf_counter = 1
    for emp in all_employees:
        perf_id = f"PERF-{perf_counter:05d}"
        perf_counter += 1
        score = round(random.uniform(3.2, 4.9), 1)
        performance_records.append({
            "review_id": perf_id,
            "employee_id": emp["employee_id"],
            "review_period": "2026-Q1",
            "overall_score": score,
            "goals": ["Deliver Q1 milestones on time", "Mentor junior peers", "Improve team process"],
            "strengths": ["Strong problem solving", "Reliable delivery", "Constructive teamwork"],
            "areas_for_improvement": ["Document edge cases earlier", "Cross-department visibility"],
            "manager_comments": "Consistent and high quality contributor throughout this cycle.",
            "status": "Completed",
            "reviewer_id": emp["manager_id"] or "EMP-HR001",
            "updated_at": "2026-04-02T12:00:00Z",
        })
    db["performance"].insert_many(performance_records)

    # 9. Generate Seed Notifications
    logger.info("Generating seed notifications...")
    notifications = []
    for emp in all_employees[:30]:
        user_match = next((u for u in all_users if u["employee_id"] == emp["employee_id"]), None)
        if user_match:
            notifications.append({
                "notification_id": f"NOTIF-{uuid.uuid4().hex[:10].upper()}",
                "user_id": user_match["user_id"],
                "title": "Welcome to Workforce Automation",
                "message": "Your profile and shift schedules have been configured in the system.",
                "type": "system",
                "is_read": False,
                "created_at": now_iso,
            })
    db["notifications"].insert_many(notifications)

    # 10. Generate Audit Log Entry
    db["audit_logs"].insert_one({
        "log_id": f"AUDIT-SEED-{uuid.uuid4().hex[:8].upper()}",
        "user_id": "SYSTEM",
        "action": "SYSTEM_DATABASE_SEEDED",
        "entity_type": "DATABASE",
        "entity_id": "ALL",
        "timestamp": now_iso,
        "metadata": {
            "total_users": len(all_users),
            "hr_users": len(hr_ids),
            "manager_users": len(manager_ids),
            "employee_users": 185,
        }
    })

    logger.info("=" * 60)
    logger.info("SEED DATA GENERATION COMPLETE")
    logger.info(f"Total Users: {len(all_users)} (HR: 5, Managers: 10, Employees: 185)")
    logger.info(f"Total Employees: {len(all_employees)}")
    logger.info(f"Total Attendance Records: {len(attendance_records)}")
    logger.info(f"Total Leave Requests: {len(leave_records)}")
    logger.info(f"Total Timesheets: {len(timesheets)}")
    logger.info(f"Total Payroll Records: {len(payroll_records)}")
    logger.info(f"Total Performance Reviews: {len(performance_records)}")
    logger.info("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed database for Workforce Management System")
    parser.add_argument("--reset", action="store_true", default=True, help="Clear existing collections before seeding")
    args = parser.parse_args()
    seed_database(reset=args.reset)
