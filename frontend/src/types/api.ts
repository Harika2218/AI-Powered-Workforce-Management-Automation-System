export type UserRole = 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  user_id: string;
  email: string;
  role: UserRole;
  employee_id: string | null;
  status: 'active' | 'inactive' | 'invited';
  first_login: boolean;
  created_at: string;
}

export interface Employee {
  id?: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  manager_id?: string | null;
  manager_name?: string | null;
  date_of_joining: string;
  employment_type: string;
  employment_status: 'Active' | 'Inactive' | 'On Leave';
  location?: string;
  salary?: number;
  allowances?: number;
  skills: string[];
  leave_balances?: {
    annual: number;
    sick: number;
    casual: number;
  };
  shift_id?: string;
  shift_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  employee: Employee | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  employee_id: string | null;
  email: string;
  full_name: string | null;
  first_login: boolean;
}

export interface AttendanceDistribution {
  present: number;
  absent: number;
  late: number;
  on_leave: number;
}

export interface AttendanceAnomaly {
  anomaly_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  date: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface HRDashboardData {
  total_employees: number;
  present_today: number;
  absent_today: number;
  on_leave_today: number;
  overtime_hours_today: number;
  total_departments: number;
  attendance_distribution: AttendanceDistribution;
  attendance_trend: Array<{ date: string; present: number; absent: number; on_leave: number }>;
  employees_by_department: Array<{ department: string; count: number }>;
  employment_status_distribution: Array<{ status: string; count: number }>;
  leave_distribution: Array<{ type: string; count: number }>;
  overtime_distribution: Array<{ department: string; overtime_hours: number }>;
  department_performance: Array<{ department: string; average_score: number }>;
  pending_approvals: {
    leave: number;
    timesheets: number;
  };
  recent_anomalies: AttendanceAnomaly[];
}

export interface ManagerDashboardData {
  team_size: number;
  present_today: number;
  absent_today: number;
  on_leave_today: number;
  pending_leave_count: number;
  overtime_hours_today: number;
  team_attendance_distribution: AttendanceDistribution;
  team_leave_distribution: Array<{ type: string; count: number }>;
  team_avg_working_hours: number;
  team_avg_performance: number;
  pending_timesheets_count: number;
}

export interface Shift {
  shift_id: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
}

export interface LeaveRecord {
  request_id?: string;
  leave_id?: string;
  employee_id: string;
  employee_name: string;
  department: string;
  leave_type: 'Annual' | 'Sick' | 'Casual' | 'annual' | 'sick' | 'casual' | string;
  start_date: string;
  end_date: string;
  days_count?: number;
  total_days?: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | string;
  manager_id?: string;
  decision_by?: string;
  decision_notes?: string;
  comments?: string;
  created_at?: string;
  applied_at?: string;
}

export interface EmployeeDashboardData {
  employee_id: string;
  employee_name: string;
  today_status: string;
  is_checked_in: boolean;
  is_checked_out: boolean;
  check_in_time: string | null;
  check_out_time: string | null;
  working_hours_today: number;
  overtime_hours_this_month: number;
  leave_balances: {
    annual: number;
    sick: number;
    casual: number;
  };
  upcoming_shift: Shift | null;
  recent_leave_requests: LeaveRecord[];
  unread_notifications_count: number;
  personal_attendance_trend: Array<{ date: string; hours: number; overtime: number; status: string }>;
}

export interface AttendanceRecord {
  attendance_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  working_hours: number;
  overtime_hours: number;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Half Day';
  work_mode?: 'office' | 'remote' | 'hybrid';
  notes?: string;
}

export interface TimesheetRecord {
  timesheet_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  daily_hours: Record<string, number>;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  notes?: string;
  manager_comments?: string;
  created_at: string;
}

export interface PayrollRecord {
  payroll_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  month: string; // YYYY-MM
  basic_salary: number;
  allowances: number;
  deductions: number;
  overtime_pay: number;
  gross_salary: number;
  net_salary: number;
  payment_status: 'PAID' | 'PROCESSED' | 'PENDING';
  calculated_at?: string;
}

export interface PerformanceReview {
  review_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  reviewer_id: string;
  reviewer_name: string;
  period: string; // e.g. Q3 2026
  overall_score: number; // 1-5 or 0-100
  goals_rating: number;
  strengths: string;
  areas_for_improvement: string;
  comments: string;
  status: 'DRAFT' | 'SUBMITTED' | 'FINALIZED';
  created_at: string;
}

export interface NotificationItem {
  notification_id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: 'leave' | 'timesheet' | 'attendance' | 'shift' | 'performance' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  log_id: string;
  timestamp: string;
  user_email: string;
  user_role: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  ip_address?: string;
}

export interface AIAssistantResponse {
  query: string;
  answer: string;
  data: any;
  confidence: number;
  suggestions: string[];
}
