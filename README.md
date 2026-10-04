# AI-Powered Workforce Management Automation System - Backend

Production-grade, database-driven, secure monolithic backend built with **FastAPI**, **MongoDB (PyMongo)**, **Pydantic v2**, **Argon2id**, and **JWT**.

---

## 1. System Architecture

```text
Frontend Application
       │ (REST APIs + Bearer JWT)
       ▼
FastAPI Routers (61 endpoints across 14 modules)
       │
       ▼
Authentication & RBAC Enforcement (HR, MANAGER, EMPLOYEE)
       │
       ▼
Service Layer (Business Logic & Validations)
       │
       ▼
MongoDB Database (workforce_management)
```

### Modular Directory Structure

```text
backend/
├── main.py                   # FastAPI application initialization & lifespan management
├── config.py                 # Pydantic Settings reading .env configurations
├── database.py               # MongoDB connection client & index initializer
│
├── models/
│   └── base.py               # Document serialization & ISO formatting utilities
│
├── schemas/
│   ├── auth.py               # Login, activation, forgot/reset password schemas
│   ├── user.py               # User administrative schemas
│   ├── employee.py           # Employee CRUD & profile update schemas
│   ├── attendance.py         # Check-in, check-out, record & anomaly schemas
│   ├── leave.py              # Leave request & balance schemas
│   ├── shift.py              # Shift definition & assignment schemas
│   ├── timesheet.py          # Timesheet logging & review schemas
│   ├── payroll.py            # Payroll input & calculation schemas
│   ├── performance.py        # Performance evaluation & scoring schemas
│   ├── dashboard.py          # HR, Manager, and Employee dashboard models
│   ├── analytics.py          # Aggregated workforce analytics schemas
│   ├── notification.py       # Notification event & counter schemas
│   ├── audit.py              # Audit logging response schemas
│   └── ai.py                 # AI Assistant, Insights & Forecasting schemas
│
├── routers/
│   ├── auth.py               # /auth (login, activate, forgot-password, reset-password, me)
│   ├── users.py              # /users (system user administration)
│   ├── employees.py          # /employees (CRUD, search, filtering, pagination, status)
│   ├── attendance.py         # /attendance (check-in, check-out, history, anomalies)
│   ├── leave.py              # /leave (requests, approvals, rejections, cancellations)
│   ├── shifts.py             # /shifts (definitions, assignments, schedules)
│   ├── timesheets.py         # /timesheets (submissions, updates, manager reviews)
│   ├── payroll.py            # /payroll (inputs, calculations, statements)
│   ├── performance.py        # /performance (reviews, ratings, analytics)
│   ├── dashboards.py         # /dashboards (HR, Manager, Employee live aggregations)
│   ├── analytics.py          # /analytics (attendance, leave, demographics, overtime)
│   ├── notifications.py      # /notifications (unread counts, mark read)
│   ├── audit.py              # /audit-logs (administrative audit trail)
│   └── ai.py                 # /ai (HR Database Assistant, Insights, Forecasting)
│
├── services/                 # Pure business logic and database aggregation pipelines
│   ├── auth_service.py
│   ├── employee_service.py
│   ├── attendance_service.py
│   ├── leave_service.py
│   ├── shift_service.py
│   ├── timesheet_service.py
│   ├── payroll_service.py
│   ├── performance_service.py
│   ├── analytics_service.py
│   └── ai_service.py
│
├── utils/
│   ├── security.py           # Argon2id password hashing & JWT token management
│   ├── permissions.py        # RBAC dependencies & team boundary verifiers
│   └── helpers.py            # Working hour calculations, audit logging, notifications
│
├── seed/
│   └── seed_database.py      # Deterministic generator (exactly 200 synthetic users)
│
└── tests/                    # 32 automated Pytest test cases covering all modules
```

---

## 2. 200 Simulated Users & Organizational Structure

The database seed generator populates **exactly 200 synthetic users** with valid relationships:

| Role | Count | Permissions & Scope |
| :--- | :---: | :--- |
| **HR** | **5** | Organization-wide administration, payroll inputs, audit logs, workforce analytics |
| **MANAGER** | **10** | Team-scoped management (attendance, leave approval, shifts, timesheets, performance) |
| **EMPLOYEE** | **185** | Personal profile, self check-in/out, leave requests, timesheet submissions, personal dashboard |
| **Total** | **200** | **Fully connected relationships with zero orphan records** |

### Default Test Credentials

All seed accounts are initialized with password:
`Password123!`

- **HR Administrator**: `sarah.jenkins@company.com`
- **Engineering Director (Manager)**: `alexander.wright@company.com`
- **Engineering Manager (Manager)**: `elena.rostova@company.com`
- **Head of Data Science (Manager)**: `marcus.chen@company.com`
- **Finance Manager (Manager)**: `olivia.taylor@company.com`
- **Sample Employee**: `liam.smith@company.com` (or any employee in the directory)

---

## 3. Setup & Installation

### Prerequisites
- Python 3.11+
- MongoDB 6.0+ (running locally on `mongodb://localhost:27017`)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env` (pre-configured for local development):
```bash
cp .env.example .env
```

### 3. Seed Database
Reset and seed the database with exactly 200 users, 4,600 attendance records, leave requests, shifts, timesheets, payroll statements, and performance evaluations:
```bash
python -m backend.seed.seed_database --reset
```

### 4. Start Development Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

---

## 4. Running Automated Tests

Run the complete 32-test suite:
```bash
python -m pytest tests/ -v
```

Test coverage includes:
- **Authentication**: Valid login, invalid credentials, Argon2 hashing, token generation, first-time account activation, password reset.
- **RBAC Enforcement**: HR organization access, Manager team boundary verification (cannot access another manager's team), Employee privacy protection.
- **Attendance**: Clock in, duplicate check-in rejection, clock out, working hour & overtime calculation, anomaly detection.
- **Leave**: Balance checking, overlap prevention, manager approval (balance deducted), manager rejection (balance preserved), cancellation (balance restored).
- **Employee Management**: Provisioning invited users, duplicate rejection, search, pagination, status change.
- **Dashboards & Analytics**: Live MongoDB calculations for HR, Manager, and Employee dashboards.
- **AI Features**: HR natural language queries, unauthorized cross-employee query prevention, attendance insights, time-series workforce forecasting.

---

## 5. AI Features Specification

1. **HR Database Assistant (`POST /ai/assistant`)**:
   Translates natural language questions into database queries. Enforces strict RBAC: employees attempting to query private records of peers are denied with access violation alerts.
2. **Attendance Insights (`GET /ai/attendance-insights`)**:
   Automated detection of departmental overtime surges, chronic late arrival clusters, and week-over-week attendance stability trends calculated from MongoDB records.
3. **Workforce Forecasting (`GET /ai/workforce-forecast`)**:
   Empirical time-series projection analyzing historical onboarding velocity and headcount retention over time to forecast 6-month workforce requirements with upper and lower confidence intervals.
