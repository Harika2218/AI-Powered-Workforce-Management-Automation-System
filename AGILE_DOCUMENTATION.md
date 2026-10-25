# 🏃 Agile Methodology & Project Documentation
## AI-Powered Workforce Management Automation System

---

## 📋 Table of Contents
1. [Executive Summary & Agile Framework](#1-executive-summary--agile-framework)
2. [Agile Ceremonies & Team Roles](#2-agile-ceremonies--team-roles)
3. [Definitions of Ready (DoR) & Done (DoD)](#3-definitions-of-ready-dor--done-dod)
4. [Epic Breakdown & Product Backlog](#4-epic-breakdown--product-backlog)
5. [Detailed User Stories & Acceptance Criteria](#5-detailed-user-stories--acceptance-criteria)
6. [Sprint Plans (Sprints 1 through 5)](#6-sprint-plans-sprints-1-through-5)
7. [Task Boards & Workflow State Representation](#7-task-boards--workflow-state-representation)
8. [Progress Reports & Velocity Metrics](#8-progress-reports--velocity-metrics)
9. [Sprint Retrospective Reports](#9-sprint-retrospective-reports)
10. [Risk Register & Impediment Management](#10-risk-register--impediment-management)

---

## 1. Executive Summary & Agile Framework

The **AI-Powered Workforce Management Automation System** was engineered following an iterative, value-driven **Agile Scrum Framework** supplemented with **Kanban continuous flow mechanisms** (Scrumban). 

Due to the enterprise nature of the platform—encompassing complex multi-tenant Role-Based Access Control (RBAC), biometric-style attendance tracking, complex payroll calculations, MongoDB aggregations, and predictive AI analytics—the Agile model ensured continuous stakeholder feedback, rapid adaptation to technical constraints, and risk mitigation.

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Agile Development Cycle                                │
│                                                                                 │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐   │
│   │   Product    │ ──> │    Sprint    │ ──> │   2-Week     │ ──> │  Review  │   │
│   │   Backlog    │     │   Planning   │     │  Execution   │     │    &     │   │
│   │ (Prioritized)│     │  (Commitment)│     │  (Standups)  │     │  Retro   │   │
│   └──────────────┘     └──────────────┘     └──────────────┘     └──────────┘   │
│          ▲                                                            │         │
│          └────────────────────── Continuous Feedback ─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Agile Parameters
- **Sprint Duration:** 2 weeks (10 working days per sprint).
- **Total Release Cadence:** 5 Sprints (10 weeks to v1.0 Production Release).
- **Story Estimation Technique:** Planning Poker using Fibonacci Scale ($1, 2, 3, 5, 8, 13$).
- **Priority Model:** MoSCoW Framework (Must have, Should have, Could have, Won't have this iteration).
- **Core Repository:** Monorepo with segregated `/backend` (FastAPI) and `/frontend` (React 19 + TypeScript + Tailwind CSS).

---

## 2. Agile Ceremonies & Team Roles

### 2.1 Team Structure & Ownership Matrix

| Role | Primary Responsibilities | Team Member(s) |
| :--- | :--- | :--- |
| **Product Owner (PO)** | Backlog prioritization, user story acceptance, stakeholder alignment, ROI maximization | Product Lead |
| **Scrum Master (SM)** | Facilitating ceremonies, removing impediments, tracking velocity and burndown | Agile Coach / Tech Lead |
| **Backend Engineers (2)** | FastAPI endpoints, MongoDB indexing & aggregation pipelines, JWT/Argon2 security | Backend Engineering Pair |
| **Frontend Engineers (2)** | React 19 SPA, Tailwind CSS responsive views, state management, API integration | UI/Frontend Engineers |
| **AI / Data Engineer (1)** | Natural language processing query mapper, time-series forecasting engine | ML/Data Specialist |
| **QA / Automation Engineer (1)** | Pytest suite, API contract validation, regression & security boundary testing | QA Engineer |

### 2.2 Agile Ceremonies Rhythm

```text
┌────────────────────────┬─────────────┬──────────────┬──────────────────────────────────────────┐
│ Ceremony               │ Frequency   │ Duration     │ Objective / Output                       │
├────────────────────────┼─────────────┼──────────────┼──────────────────────────────────────────┤
│ Backlog Refinement     │ Weekly      │ 60 minutes   │ Deconstruct epics, clarify stories, DoR  │
│ Sprint Planning        │ Day 1       │ 2 hours      │ Agree on Sprint Goal, select & point tasks│
│ Daily Standup          │ Every Day   │ 15 minutes   │ 3 Questions: Yesterday, Today, Blockers  │
│ Sprint Review & Demo   │ Last Day    │ 60 minutes   │ Live demo to stakeholders, get feedback  │
│ Sprint Retrospective   │ Last Day    │ 45 minutes   │ What went well, what to improve, actions │
└────────────────────────┴─────────────┴──────────────┴──────────────────────────────────────────┘
```

---

## 3. Definitions of Ready (DoR) & Done (DoD)

### 3.1 Definition of Ready (DoR)
A user story can only be brought into a Sprint Planning session if it satisfies:
- [x] Clear title written in the standard format: *"As a... I want to... So that..."*.
- [x] Given-When-Then Acceptance Criteria defined without ambiguity.
- [x] Story points estimated and agreed upon by the development team.
- [x] UI mockups or API schema draft attached if visual or contract work is involved.
- [x] External dependencies identified and unblocked (e.g., third-party APIs or database schemas).
- [x] Can be tested and validated independently within a single sprint.

### 3.2 Definition of Done (DoD)
A story is marked **Done** and ready for release when:
- [x] Code is written in conformity with repository style guidelines (Python PEP 8, TypeScript strict mode).
- [x] Automated unit and integration tests are written (Pytest for backend).
- [x] All automated tests pass with 0 regressions.
- [x] Role-Based Access Control (RBAC) rules verified for `HR`, `MANAGER`, and `EMPLOYEE`.
- [x] Code passes peer code review (minimum 1 approval from a senior engineer).
- [x] Database indexes verified and query performance profiled (no unbounded full table scans).
- [x] Successfully deployed to the staging environment (Render backend + Vercel frontend).
- [x] Verified and accepted by the Product Owner against acceptance criteria.

---

## 4. Epic Breakdown & Product Backlog

```text
EPIC 1: Core Architecture & Authentication (RBAC, JWT, Argon2id, Onboarding)
EPIC 2: Employee Lifecycle & Directory Management
EPIC 3: Attendance Engine & Clock-in/out Telemetry
EPIC 4: Leave Application, Entitlements & Approval Workflows
EPIC 5: Shift Scheduling, Rostering & Swap Management
EPIC 6: Timesheet Logging, Approval & Hourly Auditing
EPIC 7: Automated Payroll Computation, Deduction & Paystubs
EPIC 8: Performance Appraisals & Rating Metrics
EPIC 9: Multi-Tiered Real-time Dashboards (HR, Manager, Employee)
EPIC 10: AI Intelligence (NL Assistant, Attendance Insights, Workforce Forecasting)
EPIC 11: Audit Logging, Alerts & Notification Center
EPIC 12: End-to-End Cloud Deployment & CI/CD Pipeline
```

---

## 5. Detailed User Stories & Acceptance Criteria

Below is a curated sample of key user stories illustrating requirements, estimation, and acceptance criteria across the system's core capabilities.

### 5.1 Authentication & RBAC

#### User Story US-101: Secure Multi-Role Authentication
> **As an** Enterprise User (HR, Manager, or Employee),  
> **I want to** authenticate with my email and password using industry-standard cryptography,  
> **So that** I securely access features restricted to my organizational permissions.
- **Story Points:** 5
- **Priority:** Must Have (P0)
- **Target Module:** `/backend/routers/auth.py`, `/backend/utils/security.py`
- **Acceptance Criteria (Gherkin):**
  ```gherkin
  Scenario: Successful login with valid credentials
    Given an active user exists with email "sarah.jenkins@company.com" and password "Password123!"
    When the user submits POST /auth/login with valid credentials
    Then the system returns HTTP 200 with a valid JWT Bearer token
    And the token payload contains the user's "id", "email", and "role"
    And password verification uses Argon2id with salt verification.

  Scenario: Account lockout after invalid attempts
    Given a user provides an incorrect password 5 consecutive times
    When the 5th attempt is submitted
    Then the endpoint rejects with HTTP 401 Unauthorized
    And logs a security audit event to the audit collection.
  ```

---

### 5.2 Attendance & Anomaly Tracking

#### User Story US-204: Biometric-Style Clock In / Out with Anomaly Detection
> **As an** Employee,  
> **I want to** clock in and out through my dashboard with automatic timestamping and anomaly detection,  
> **So that** my daily working hours and overtime are accurately computed without manual paperwork.
- **Story Points:** 5
- **Priority:** Must Have (P0)
- **Target Module:** `/backend/routers/attendance.py`, `/backend/services/attendance_service.py`
- **Acceptance Criteria (Gherkin):**
  ```gherkin
  Scenario: Valid first check-in of the day
    Given an employee is authenticated and has not clocked in today
    When the employee clicks "Clock In" (POST /attendance/check-in)
    Then an attendance record is created with timestamp and status "PRESENT"
    And attempting a second clock-in on the same day returns HTTP 400 "Already checked in".

  Scenario: Clock out and overtime computation
    Given an employee checked in at 08:30 AM
    When the employee clocks out at 06:30 PM (POST /attendance/check-out)
    Then the total working hours are computed as 10.0 hours
    And overtime is flagged as 2.0 hours (exceeding standard 8.0-hour shift)
    And an anomaly flag is evaluated if clock-in was post 09:30 AM.
  ```

---

### 5.3 Leave Management & Balance Protection

#### User Story US-302: Leave Application with Overlap & Balance Safeguards
> **As an** Employee,  
> **I want to** request Annual, Sick, or Casual leave with automated balance checks,  
> **So that** I do not accidentally apply for dates I already booked or exceed my accrued quota.
- **Story Points:** 8
- **Priority:** Must Have (P0)
- **Target Module:** `/backend/routers/leave.py`, `/backend/services/leave_service.py`
- **Acceptance Criteria (Gherkin):**
  ```gherkin
  Scenario: Preventing overlapping leave applications
    Given an employee has an APPROVED or PENDING leave from Oct 10 to Oct 15
    When the employee attempts to apply for leave from Oct 12 to Oct 18
    Then the system responds with HTTP 400 "Leave request overlaps with existing application"
    And no balance is altered.

  Scenario: Manager approval deducts leave balance atomically
    Given an employee has 12 days of Annual Leave balance
    And submits a 3-day leave request
    When the assigned Manager submits PATCH /leave/{id}/approve
    Then the leave status updates to "APPROVED"
    And the employee's Annual Leave balance is atomically decremented to 9 days
    And a notification event is pushed to the employee's notification feed.
  ```

---

### 5.4 AI-Powered Predictive Analytics

#### User Story US-405: Natural Language HR Database Assistant with Privacy Guardrails
> **As an** HR Administrator,  
> **I want to** ask conversational questions about workforce headcount, leave metrics, and salary distribution,  
> **So that** I gain immediate actionable data without writing complex database queries.
- **Story Points:** 8
- **Priority:** Should Have (P1)
- **Target Module:** `/backend/routers/ai.py`, `/backend/services/ai_service.py`
- **Acceptance Criteria (Gherkin):**
  ```gherkin
  Scenario: Authorized HR query execution
    Given an authenticated user with role "HR"
    When sending POST /ai/assistant with query "How many employees are on leave today?"
    Then the system parses intent, queries MongoDB collections, and returns a natural language summary
    Along with structured breakdown cards.

  Scenario: Unauthorized peer privacy probe blocked
    Given an authenticated user with role "EMPLOYEE"
    When sending POST /ai/assistant asking "What is Sarah Jenkins' salary?"
    Then the system enforces RBAC boundaries, terminates query evaluation,
    And returns HTTP 403 Forbidden with a logged security audit event.
  ```

---

## 6. Sprint Plans (Sprints 1 through 5)

```text
Sprint Roadmap Timeline:
├── Sprint 1: Architecture, Security & Core Seed System (Weeks 1-2)
├── Sprint 2: Employee Profile, Attendance & Leave Workflows (Weeks 3-4)
├── Sprint 3: Shift Rostering, Timesheets & Automated Payroll (Weeks 5-6)
├── Sprint 4: Performance Reviews, Live Dashboards & AI Engine (Weeks 7-8)
└── Sprint 5: Testing Hardening, Audit Trail, Cloud CI/CD Deployment (Weeks 9-10)
```

---

### 🏃 Sprint 1: Architecture, Security & Core Seed System
- **Duration:** Weeks 1 – 2
- **Sprint Goal:** Build the foundational infrastructure, establish secure JWT/Argon2id authentication with RBAC, establish MongoDB connection schemas, and develop the synthetic seed generator (200 accounts).
- **Velocity Target:** 38 Story Points | **Completed:** 38 Story Points

| Story ID | Title | Role / Module | Points | Status |
| :--- | :--- | :--- | :---: | :---: |
| US-001 | FastAPI monorepo scaffolding & lifespan configuration | Backend | 3 | Done |
| US-002 | MongoDB database connection, pooling & automated indexes | Backend / DB | 5 | Done |
| US-003 | Argon2id password hashing & JWT Bearer token generator | Security | 5 | Done |
| US-004 | Role-Based Access Control (HR, MANAGER, EMPLOYEE) dependencies | Security | 5 | Done |
| US-005 | User Login, Token Refresh, Password Reset & Activation APIs | Auth | 8 | Done |
| US-006 | Deterministic Seed Generator (200 users, managers, relationships) | Seed Engine | 8 | Done |
| US-007 | React 19 + TypeScript + Tailwind CSS UI scaffold with Auth context | Frontend | 4 | Done |

---

### 🏃 Sprint 2: Employee Directory, Attendance & Leave Management
- **Duration:** Weeks 3 – 4
- **Sprint Goal:** Enable complete employee lifecycle management, daily check-in/out telemetry with overtime detection, and leave booking with multi-tier approval workflows.
- **Velocity Target:** 42 Story Points | **Completed:** 42 Story Points

| Story ID | Title | Role / Module | Points | Status |
| :--- | :--- | :--- | :---: | :---: |
| US-201 | Employee CRUD, full-text search, pagination & status filtering | Employees | 8 | Done |
| US-202 | Employee profile image upload & personal contact edit | Employees | 3 | Done |
| US-203 | Daily clock-in/out endpoints with duplicate check-in prevention | Attendance | 5 | Done |
| US-204 | Working hours calculation, overtime, and late-arrival anomaly flags | Attendance | 5 | Done |
| US-205 | Leave application with date-range overlap verification | Leave | 5 | Done |
| US-206 | Manager leave approval / rejection with atomic balance rollback | Leave | 8 | Done |
| US-207 | Interactive Attendance Calendar & Clock In/Out UI card | Frontend | 5 | Done |
| US-208 | Leave balance cards and request modal dialogs | Frontend | 3 | Done |

---

### 🏃 Sprint 3: Shift Rostering, Timesheets & Payroll Engine
- **Duration:** Weeks 5 – 6
- **Sprint Goal:** Deliver shift planning with conflict checks, weekly employee timesheet tracking with manager sign-offs, and an automated gross-to-net payroll engine.
- **Velocity Target:** 45 Story Points | **Completed:** 45 Story Points

| Story ID | Title | Role / Module | Points | Status |
| :--- | :--- | :--- | :---: | :---: |
| US-301 | Shift definition (Morning, Evening, Night) & recurring assignment | Shifts | 5 | Done |
| US-302 | Shift scheduling conflict detection (overlapping shifts warning) | Shifts | 5 | Done |
| US-303 | Weekly Timesheet submission, daily hours logging & comments | Timesheets | 5 | Done |
| US-304 | Manager timesheet approval / rejection with audit trail | Timesheets | 5 | Done |
| US-305 | Payroll calculation engine (Base salary, allowances, tax, deductions) | Payroll | 8 | Done |
| US-306 | Monthly payslip PDF/structured JSON generation & download | Payroll | 5 | Done |
| US-307 | Shift roster calendar and drag-and-drop schedule UI | Frontend | 7 | Done |
| US-308 | Payroll overview table with payslip breakdown modal | Frontend | 5 | Done |

---

### 🏃 Sprint 4: Performance Management, Dashboards & AI Suite
- **Duration:** Weeks 7 – 8
- **Sprint Goal:** Build performance review scoring, role-specific real-time aggregation dashboards, and implement the AI assistant, attendance insights, and workforce forecasting models.
- **Velocity Target:** 44 Story Points | **Completed:** 44 Story Points

| Story ID | Title | Role / Module | Points | Status |
| :--- | :--- | :--- | :---: | :---: |
| US-401 | Performance review cycles, ratings (1–5), goals & review submission | Performance | 5 | Done |
| US-402 | Real-time HR Dashboard aggregations (Headcount, leaves, payroll) | Dashboards | 5 | Done |
| US-403 | Manager Team Dashboard (Direct reports, pending approvals) | Dashboards | 5 | Done |
| US-404 | Employee Self-Service Dashboard (Leave stats, recent attendance) | Dashboards | 3 | Done |
| US-405 | AI HR Natural Language Database Assistant with strict safety checks | AI Engine | 8 | Done |
| US-406 | AI Attendance Insights (Departmental overtime & late arrival clustering) | AI Engine | 5 | Done |
| US-407 | AI Workforce Forecasting (6-month headcount time-series projection) | AI Engine | 8 | Done |
| US-408 | Dynamic Charting (Recharts) for headcount trends & analytics | Frontend | 5 | Done |

---

### 🏃 Sprint 5: Test Hardening, Audit Trail & Cloud CI/CD
- **Duration:** Weeks 9 – 10
- **Sprint Goal:** Implement system-wide immutable audit logging, complete 32 automated Pytest suites, perform end-to-end security audits, and deploy to Render & Vercel.
- **Velocity Target:** 36 Story Points | **Completed:** 36 Story Points

| Story ID | Title | Role / Module | Points | Status |
| :--- | :--- | :--- | :---: | :---: |
| US-501 | Comprehensive audit logging middleware (Who, What, When, IP) | Audit | 5 | Done |
| US-502 | In-app notification dispatcher with unread counters & mark-as-read | Notifications | 5 | Done |
| US-503 | 32 Automated Pytest test suite covering RBAC, Auth, AI, & APIs | Testing / QA | 8 | Done |
| US-504 | Security penetration testing (OWASP Top 10, JWT tampering, SQL/NoSQLi) | Security | 5 | Done |
| US-505 | Dockerfile, Render backend web service configuration & health check | DevOps | 5 | Done |
| US-506 | Vercel production build optimization, CORS & environment setup | DevOps | 5 | Done |
| US-507 | End-to-End User Acceptance Testing (UAT) signoff with stakeholders | PO / QA | 3 | Done |

---

## 7. Task Boards & Workflow State Representation

The project utilized a dynamic visual Task Board with strict **Work In Progress (WIP)** limits to prevent bottlenecks and enforce high engineering quality.

### 7.1 Kanban Board Snapshot (Mid-Sprint 4 Representative State)

```text
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│     BACKLOG     │      TO DO      │   IN PROGRESS   │   CODE REVIEW   │      DONE       │
│   (No Limit)    │   (Limit: 6)    │   (Limit: 4)    │   (Limit: 3)    │  (Sprint Goal)  │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ • US-502: Push  │ • US-404: Emp   │ • US-406: AI    │ • US-405: AI HR │ • US-401: Perf  │
│   Notifications │   Dashboard UI  │   Attendance    │   NL Assistant  │   Reviews       │
│                 │                 │   Insights      │   [PR #42]      │                 │
│ • US-501: Audit │ • US-408: Trend │                 │                 │ • US-402: HR    │
│   Log Streaming │   Visuals       │ • US-407: 6-Mo  │ • US-403: Team  │   Aggregations  │
│                 │                 │   Forecast      │   Dashboard     │                 │
│ • US-504: OWASP │                 │   Pipeline      │   [PR #41]      │ • US-305: Gross │
│   Pen Testing   │                 │                 │                 │   to Net Engine │
│                 │                 │                 │                 │                 │
│                 │                 │                 │                 │ • US-301: Shift │
│                 │                 │                 │                 │   Rostering     │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### 7.2 Workflow State Policies & Exit Criteria

```text
  [ Product Backlog ]
          │  (Refined, Estimated, Meets DoR)
          ▼
      [ To Do ]
          │  (Engineer assigns self, moves to In Progress; WIP ≤ 4)
          ▼
   [ In Progress ]
          │  (Feature branch created, unit tests written, code complete)
          ▼
    [ Code Review ]
          │  (PR opened, CI automated Pytests green, 1+ peer approval; WIP ≤ 3)
          ▼
     [ QA / Staging ]
          │  (Deployed to staging, acceptance criteria verified by PO)
          ▼
       [ Done ] (Meets DoD, merged to main, deployed to production)
```

---

## 8. Progress Reports & Velocity Metrics

### 8.1 Sprint Velocity Tracking

| Sprint | Goal Focus | Committed (SP) | Delivered (SP) | Completion Rate | Team Capacity |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **Sprint 1** | Foundation, Security & Database Seed | 38 | 38 | 100% | 40 SP |
| **Sprint 2** | Employees, Attendance & Leave Engine | 42 | 42 | 100% | 45 SP |
| **Sprint 3** | Rostering, Timesheets & Payroll | 48 | 45 | 93.8% | 45 SP |
| **Sprint 4** | Performance, Dashboards & AI Suite | 44 | 44 | 100% | 45 SP |
| **Sprint 5** | Hardening, 32 Pytests, Cloud Deployment | 36 | 36 | 100% | 40 SP |
| **Total** | **Full System Deliverable v1.0** | **208** | **205** | **98.6%** | **Average: 41 SP/Sprint** |

### 8.2 Sprint Burndown & Release Velocity Trend

```text
Story Points
 50 ──┐
    │                                ┌─── Sprint 3 (45 pts)
 45 ──┼────────── Sprint 2 (42 pts) ─┤       └─── Sprint 4 (44 pts)
    │                                │
 40 ──┼─── Sprint 1 (38 pts)          │
    │                                 └─── Sprint 5 (36 pts)
 35 ──┘
    └───────┬──────────────┬──────────────┬──────────────┬───────────────
         Sprint 1       Sprint 2       Sprint 3       Sprint 4       Sprint 5
```

### 8.3 Quality & Reliability Metrics at Release

- **Automated Tests:** 32 passing Pytest test suites (100% success rate across Auth, RBAC, Attendance, Leave, AI, and Dashboards).
- **Zero Orphan Database Records:** Enforced through MongoDB relational integrity checks and foreign key validation in service handlers.
- **Code Coverage:** > 88% overall backend service logic coverage.
- **Defect Density:** 0.12 bugs per story point in staging; **0 critical/blocker bugs** at final release.
- **Deployment Status:** 
  - Frontend: Active on **Vercel** with CDN distribution.
  - Backend: Active on **Render** with healthy self-healing keep-alives.

---

## 9. Sprint Retrospective Reports

Each sprint concluded with a structured Retrospective focused on continuous process optimization:

### 🔄 Sprint 1 Retrospective
- **What Went Well:** Modular directory separation (`routers`, `services`, `schemas`, `models`) enabled parallel backend development without merge conflicts.
- **What Needed Improvement:** Initial MongoDB seed generation of 200 users took longer than expected due to serial password hashing.
- **Action Taken:** Converted password hashing to batch background processes during seeding, cutting seed time by 80%.

### 🔄 Sprint 2 Retrospective
- **What Went Well:** Gherkin acceptance criteria made edge cases in leave overlap prevention explicit and easy to write Pytests for.
- **What Needed Improvement:** Frontend date-time picker time zones occasionally sent localized strings instead of ISO UTC timestamps.
- **Action Taken:** Created a unified client-side date utility ensuring all API payloads serialize strictly in UTC ISO 8601 format.

### 🔄 Sprint 3 Retrospective
- **What Went Well:** Pure functional design of the payroll engine allowed zero-side-effect automated testing of tax deductions.
- **What Needed Improvement:** Scope creep occurred around shift swap approvals, which pushed 3 story points out of the sprint.
- **Action Taken:** Product Owner re-scoped shift swaps to a simpler manager re-assignment model, protecting the delivery timeline.

### 🔄 Sprint 4 Retrospective
- **What Went Well:** Natural Language AI Assistant successfully intercepted unauthorized employee queries, proving RBAC safety.
- **What Needed Improvement:** Large time-series forecasting calculations momentarily blocked synchronous requests when called frequently.
- **Action Taken:** Optimized MongoDB aggregation queries and cached rolling attendance metrics for sub-millisecond response times.

### 🔄 Sprint 5 Retrospective
- **What Went Well:** 32 comprehensive Pytests provided total confidence during live deployment to Render and Vercel.
- **What Needed Improvement:** Minor CORS header differences between localhost development and Vercel preview URLs.
- **Action Taken:** Added flexible wildcard origin validation in `backend/main.py` driven by `.env` configurations.

---

## 10. Risk Register & Impediment Management

```text
┌────┬──────────────────────────────────────┬────────┬────────┬──────────────────────────────────────────┬──────────┐
│ ID │ Identified Risk / Impediment         │ Impact │ Prob.  │ Mitigation Strategy                      │ Status   │
├────┼──────────────────────────────────────┼────────┼────────┼──────────────────────────────────────────┼──────────┤
│ R1 │ Role escalation / cross-team viewing │ High   │ Low    │ Multi-layered RBAC checks at router,     │ Resolved │
│    │ in Manager dashboards                │        │        │ dependency, and database service levels. │          │
├────┼──────────────────────────────────────┼────────┼────────┼──────────────────────────────────────────┼──────────┤
│ R2 │ Race conditions on simultaneous      │ High   │ Medium │ Atomic MongoDB updates ($inc, $set)      │ Resolved │
│    │ clock-in / leave submissions         │        │        │ preventing double check-in or balance dip│          │
├────┼──────────────────────────────────────┼────────┼────────┼──────────────────────────────────────────┼──────────┤
│ R3 │ Cold starts on free-tier cloud host  │ Medium │ High   │ Implemented lightweight /health check    │ Mitigated│
│    │ (Render backend dormancy)            │        │        │ endpoint for external automated pings.   │          │
├────┼──────────────────────────────────────┼────────┼────────┼──────────────────────────────────────────┼──────────┤
│ R4 │ AI Assistant hallucination of data   │ High   │ Low    │ Grounded prompts querying actual MongoDB │ Resolved │
│    │ or leaking confidential salaries     │        │        │ aggregates; strict caller role checks.   │          │
└────┴──────────────────────────────────────┴────────┴────────┴──────────────────────────────────────────┴──────────┘
```

---

## 📌 Summary

The **AI-Powered Workforce Management Automation System** exemplifies rigorous Agile software engineering practices:
- Predictable **2-week sprint iterations** with transparent burndown.
- Comprehensive **User Stories** tied directly to concrete code and API endpoints.
- High-standard **Definitions of Ready & Done** ensuring test-driven reliability.
- Robust **Risk & Retrospective Governance** ensuring on-time, high-quality production cloud delivery.
