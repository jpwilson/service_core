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
