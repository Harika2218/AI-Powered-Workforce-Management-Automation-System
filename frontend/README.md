# AI-Powered Workforce Management Automation System - Frontend

Modern, enterprise-grade, data-driven HR Workforce Management frontend built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Recharts**.

---

## 1. Architecture & Design Principles

```text
React 19 + TypeScript (Vite)
       │ (REST APIs + Bearer JWT)
       ▼
Axios Centralized API Layer
       │
       ▼
FastAPI Backend (Port 8000)
       │
       ▼
MongoDB (workforce_management)
```

- **Single Source of Truth**: 100% database-driven. Absolutely zero hardcoded/mock business statistics or placeholder counts.
- **Enterprise Design System**: Inspired by the mature, spacious aesthetic of TCS CHROMA.

### Exact Color System

| Token | Hex | Role in Interface |
| :--- | :--- | :--- |
| **Warm Ivory** | `#F7F5F0` | Primary application canvas background |
| **Soft Sand** | `#EAE6DE` | Secondary surfaces, subtle pill containers |
| **Warm White** | `#FFFDF9` | Elevated cards, tables, modals |
| **Charcoal** | `#242321` | High-contrast primary typography |
| **Warm Gray** | `#78756F` | Secondary captions, timestamps, column labels |
| **Soft Stone** | `#D8D4CC` | Subtle border dividers |
| **Muted Sage** | `#71806B` | Primary accent, positive indicators, attendance |
| **Deep Olive** | `#46513F` | Active navigation, primary action buttons, key metrics |
| **Terracotta** | `#C8755A` | Urgent notifications, anomalies, absence alerts |
| **Soft Amber** | `#C99A52` | Warning states, pending actions, tardiness |

---

## 2. Role-Based Navigation & Modules

### HR Portal (`/hr/*`)
- **Overview**: Organization KPIs, attendance donut & 7-day trend, headcount by department, performance benchmark, attention alerts.
- **Workforce**: Paginated employee table, department filters, status toggles, profile details, and employee provisioning modal.
- **Attendance**: Real-time logs and rule-based anomaly detection (overtime spikes, chronic lateness).
- **Leave**: Organization leave records, pending approvals, and approval/rejection workflows.
- **Shifts**: Catalog of working shifts and roster assignment modal.
- **Timesheets**: Submitted hours reconciliation and review actions.
- **Payroll**: Salary registers, gross/net computations, and payroll calculation modal.
- **Performance**: Formal quarterly reviews and performance appraisal submissions.
- **Analytics**: Deep aggregate tabs for demographics, attendance velocity, leave, overtime, and department benchmarks.
- **AI Assistant**: Natural language query interface directly executing MongoDB aggregation pipelines, attendance insights, and 6-month growth forecasting.
- **Audit Logs**: Immutable event trail for all data modifications.
- **Notifications**: System announcements and unread badge drawer.

### Manager Portal (`/manager/*`)
- **Dashboard**: Direct reports team size, team attendance donut, leave distribution, working hours, and performance rating.
- **My Team**: Team roster scoped exclusively to the manager's assigned reports.
- **Attendance & Shifts**: Team roster timings and clock-in statuses.
- **Leave Approvals**: Direct approval/rejection actions for team time off.
- **Timesheets**: Verification of team weekly operational hours.
- **Performance**: Submitting appraisal evaluations for direct reports.

### Employee Portal (`/employee/*`)
- **Dashboard**: Today's attendance status, functional **Check-In** and **Check-Out** buttons, leave balance cards (Annual, Sick, Casual), assigned shift timings, and personal hours trend.
- **My Profile**: Contact information editing (phone, location, competencies) and password changing.
- **My Attendance**: Personal history of daily clock-in/out records and overtime.
- **My Leave**: Applying for time off with instant balance checking and cancellation capabilities.
- **My Shifts & Timesheets**: Logging weekly hours and monitoring manager decisions.

---

## 3. Running Locally

### Development Server
```bash
cd frontend
npm install
npm run dev
```
The application will launch on `http://127.0.0.1:5173/`. All API requests are proxied directly to the FastAPI backend running on `http://127.0.0.1:8000/`.

### Production Build
```bash
npm run build
```
Generates a type-checked, optimized production bundle inside `dist/`.

---

## 4. Test Credentials (Pre-Seeded)

- **HR**: `sarah.jenkins@company.com` | `Password123!`
- **Manager**: `alexander.wright@company.com` | `Password123!`
- **Employee**: `josiah.harris@company.com` | `Password123!`
- **Account Activation**: `priya.sharma@company.com` | Token: `ACTIVATE-HR-TEST`
