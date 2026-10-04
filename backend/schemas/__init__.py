# Schemas module
from backend.schemas.common import MessageResponse, PaginatedResponse
from backend.schemas.auth import LoginRequest, TokenResponse, ActivationRequest, ForgotPasswordRequest, ResetPasswordRequest
from backend.schemas.user import UserResponse, UserCreate, UserUpdate
from backend.schemas.employee import EmployeeResponse, EmployeeCreate, EmployeeUpdate, EmployeeProfilePatch, EmployeeStatusUpdate
from backend.schemas.attendance import CheckInRequest, CheckOutRequest, AttendanceRecordResponse, AttendanceAnomaly
from backend.schemas.leave import LeaveCreate, LeaveReview, LeaveResponse, LeaveBalanceResponse
from backend.schemas.shift import ShiftCreate, ShiftUpdate, ShiftAssign, ShiftResponse, EmployeeShiftResponse
from backend.schemas.timesheet import TimesheetCreate, TimesheetUpdate, TimesheetReview, TimesheetResponse
from backend.schemas.payroll import PayrollCreate, PayrollUpdate, PayrollResponse
from backend.schemas.performance import PerformanceCreate, PerformanceUpdate, PerformanceResponse, PerformanceAnalytics
from backend.schemas.dashboard import HRDashboardResponse, ManagerDashboardResponse, EmployeeDashboardResponse
from backend.schemas.analytics import AttendanceAnalyticsResponse, LeaveAnalyticsResponse, WorkforceAnalyticsResponse, OvertimeAnalyticsResponse
from backend.schemas.notification import NotificationResponse, NotificationUnreadCount
from backend.schemas.audit import AuditLogResponse
from backend.schemas.ai import AIAssistantQuery, AIAssistantResponse, AIAttendanceInsightsResponse, AIWorkforceForecastResponse
