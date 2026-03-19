export type Department = 'Drivers' | 'Service Crew' | 'Office';

export type BreakType = 'lunch' | 'rest' | 'other';

export type TimesheetStatus = 'pending' | 'approved' | 'rejected';

export type PayPeriodType = 'weekly' | 'bi-weekly' | 'semi-monthly';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  role: string;
  hourlyRate: number;
  overtimeRate: number;
  doubleTimeRate: number;
  hireDate: string;
  isActive: boolean;
  avatarColor: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  isActive: boolean;
  budget: number;
  startDate: string;
  endDate: string | null;
}

export interface BreakEntry {
  id: string;
  type: BreakType;
  startTime: string;
  endTime: string | null;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  projectId: string | null;
  clockIn: string;
  clockOut: string | null;
  breaks: BreakEntry[];
  notes: string;
  location: string;
  mileage: number | null;
  status: TimesheetStatus;
  flags: TimeEntryFlag[];
  isManualEdit: boolean;
}

export type TimeEntryFlag = 'overtime' | 'manual_edit' | 'location_mismatch' | 'missing_clockout' | 'late_arrival';

export interface ActivityEvent {
  id: string;
  employeeId: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'note';
  timestamp: string;
  location: string;
  details?: string;
}

export interface OvertimeRules {
  dailyThreshold: number;
  weeklyThreshold: number;
  overtimeMultiplier: number;
  doubleTimeMultiplier: number;
}

export interface BreakRules {
  autoDeductMinutes: number;
  afterHoursThreshold: number;
}

export interface AppSettings {
  payPeriodType: PayPeriodType;
  overtimeRules: OvertimeRules;
  breakRules: BreakRules;
  departments: Department[];
  geofenceEnabled: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PayrollSummary {
  employeeId: string;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  regularPay: number;
  overtimePay: number;
  doubleTimePay: number;
  totalPay: number;
}

// ============================================================================
// Extended types for complete normalized schema
// ============================================================================

export interface Customer {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  city: string | null;
  state: string | null;
  billingEmail: string | null;
  paymentTerms: string;
  isActive: boolean;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  geofenceRadiusMeters: number;
  locationType: 'job_site' | 'office' | 'warehouse' | 'yard';
  isActive: boolean;
}

export interface Vehicle {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  licensePlate: string | null;
  vehicleType: 'truck' | 'van' | 'trailer' | 'car';
  odometer: number | null;
  isActive: boolean;
}

export interface PayRate {
  id: string;
  employeeId: string;
  effectiveDate: string;
  endDate: string | null;
  hourlyRate: number;
  overtimeRate: number;
  doubleTimeRate: number;
  payType: 'hourly' | 'salary' | 'piece_rate';
  notes: string | null;
}

export interface PositionHistory {
  id: string;
  employeeId: string;
  departmentId: string | null;
  role: string;
  startDate: string;
  endDate: string | null;
  changeReason: string | null;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  estimatedHours: number | null;
  actualHours: number;
  status: 'open' | 'in_progress' | 'completed';
  sortOrder: number;
}

export interface Timesheet {
  id: string;
  employeeId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'processed';
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalDoubleTimeHours: number;
  totalBreakMinutes: number;
  totalMileage: number;
  grossPay: number;
  notes: string | null;
}

export interface MileageLog {
  id: string;
  employeeId: string;
  vehicleId: string | null;
  timeEntryId: string | null;
  date: string;
  startOdometer: number | null;
  endOdometer: number | null;
  totalMiles: number;
  purpose: string | null;
  routeFrom: string | null;
  routeTo: string | null;
  reimbursementRate: number;
  reimbursementAmount: number | null;
}

export type NotificationType =
  | 'timesheet_reminder'
  | 'approval_needed'
  | 'timesheet_approved'
  | 'timesheet_rejected'
  | 'overtime_alert'
  | 'missing_clockout'
  | 'schedule_change'
  | 'system_announcement';

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedType: string | null;
  relatedId: string | null;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  createdAt: string;
}

export interface ImportBatch {
  id: string;
  source: 'kronos' | 'excel' | 'csv' | 'ocr' | 'api';
  sourceFilename: string | null;
  sourceFormat: string | null;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
}

export interface PayPeriod {
  id: string;
  periodType: PayPeriodType;
  startDate: string;
  endDate: string;
  payDate: string | null;
  status: 'open' | 'closed' | 'processed';
}
