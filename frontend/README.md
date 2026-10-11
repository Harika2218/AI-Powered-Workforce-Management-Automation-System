# AI-Powered Workforce Management Automation System - Frontend

Modern, enterprise-grade, data-driven HR Workforce Management frontend built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Recharts**.

* 🚀 **Live Production Deployment:** [https://ai-powered-workforce-management.vercel.app](https://ai-powered-workforce-management.vercel.app)

---

## 1. Architecture & Design Principles

```text
React 19 + TypeScript (Vite)
       │ (REST APIs + Bearer JWT)
       ▼
Axios Centralized API Layer
       │
       ▼
FastAPI Backend (Port 8000 / Render Cloud)
       │
       ▼
MongoDB Atlas (workforce_management)
```

- **Single Source of Truth**: 100% database-driven. Absolutely zero hardcoded/mock business statistics or placeholder counts.
- **Enterprise Design System**: Modern, spacious, high-contrast enterprise design system.

### Exact Color System

| Token | Hex | Role in Interface |
| :--- | :--- | :--- |
| **Primary Blue** | `#2563EB` | Primary navigation, key actions, selected states, benchmarks |
| **Deep Blue** | `#1D4ED8` | Hover states, active buttons, focused controls |
| **Light Blue** | `#EFF6FF` | Subtle highlights, active badges, soft cards |
| **Bright Green** | `#16A34A` | Positive metrics, successful check-ins, healthy statuses |
| **Clear Red** | `#DC2626` | Urgent alerts, anomalies, rejection states, errors |
| **Clear Amber** | `#D97706` | Pending approvals, warnings, review flags |
| **Page Canvas** | `#F8FAFC` | Primary light page background |
| **Card White** | `#FFFFFF` | Elevated cards, tables, forms, modals |
| **Charcoal / Primary Text** | `#172033` | Crisp, readable typography |
| **Muted Slate** | `#64748B` | Secondary captions, timestamps, column labels |
| **Border Slate** | `#E2E8F0` | Structural dividers and table borders |

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
