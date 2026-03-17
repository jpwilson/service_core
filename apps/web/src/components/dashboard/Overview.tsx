import { useMemo } from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  DollarSign,
  UserCheck,
  FileCheck,
} from 'lucide-react';
import { isToday, parseISO } from 'date-fns';
import { useAppStore } from '../../store/useAppStore';
import {
  mockEmployees,
  mockTimeEntries,
  formatCurrency,
  calculateHoursWorked,
  calculateOvertimeHours,
  calculatePayroll,
} from '@servicecore/shared';
import { MetricCard } from '../shared/MetricCard';
import { TeamFeed } from './TeamFeed';
import { PayrollReportButton } from '../features/reports/PayrollReportButton';

export function Overview() {
  const dateRange = useAppStore((s) => s.dateRange);

  const metrics = useMemo(() => {
    // Filter entries within the current pay period
    const periodEntries = mockTimeEntries.filter((entry) => {
      const clockIn = parseISO(entry.clockIn);
      return clockIn >= dateRange.start && clockIn <= dateRange.end;
    });

    // 1. Active employees: clocked in today with no clockOut
    const activeEmployees = mockTimeEntries.filter(
      (entry) =>
        entry.clockOut === null && isToday(parseISO(entry.clockIn)),
    ).length;

    // 2. Total hours in current period
    let totalHours = 0;
    let totalOvertimeHours = 0;

    // Per-employee aggregation for payroll
    const employeeHours = new Map<
      string,
      { regular: number; overtime: number }
    >();

    for (const entry of periodEntries) {
      const hours = calculateHoursWorked(
        entry.clockIn,
        entry.clockOut,
        entry.breaks,
      );
      totalHours += hours;

      const { regular, overtime } = calculateOvertimeHours(hours, 8);
      totalOvertimeHours += overtime;

      const existing = employeeHours.get(entry.employeeId) ?? {
        regular: 0,
        overtime: 0,
      };
      employeeHours.set(entry.employeeId, {
        regular: existing.regular + regular,
        overtime: existing.overtime + overtime,
      });
    }

    // 4. Estimated payroll
    let totalPayroll = 0;
    for (const [empId, hours] of employeeHours) {
      const employee = mockEmployees.find((e) => e.id === empId);
      if (!employee) continue;
      const summary = calculatePayroll(
        employee,
        hours.regular,
        hours.overtime,
        0,
      );
      totalPayroll += summary.totalPay;
    }

    // 5. Attendance rate
    // Calculate workdays in date range, then compare unique employee-days
    const totalWorkdays = Math.max(
      1,
      Math.ceil(
        (dateRange.end.getTime() - dateRange.start.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    const activeEmployeeCount = mockEmployees.filter((e) => e.isActive).length;
    const expectedEntries = totalWorkdays * activeEmployeeCount;
    const attendanceRate = Math.min(
      100,
      (periodEntries.length / expectedEntries) * 100,
    );

    // 6. Pending approvals
    const pendingApprovals = periodEntries.filter(
      (entry) => entry.status === 'pending',
    ).length;

    return {
      activeEmployees,
      totalHours,
      totalOvertimeHours,
      totalPayroll,
      attendanceRate,
      pendingApprovals,
    };
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex justify-end">
        <PayrollReportButton />
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Active Employees"
          value={metrics.activeEmployees}
          subtitle="Currently clocked in"
          icon={<Users className="w-5 h-5" />}
        />
        <MetricCard
          title="Hours This Period"
          value={`${Math.round(metrics.totalHours).toLocaleString()}h`}
          subtitle="Current pay period"
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricCard
          title="Overtime Hours"
          value={`${metrics.totalOvertimeHours.toFixed(1)}h`}
          subtitle="Daily OT (>8h)"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={metrics.totalOvertimeHours > 50 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Est. Payroll"
          value={formatCurrency(metrics.totalPayroll)}
          subtitle="Estimated for period"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricCard
          title="Attendance Rate"
          value={`${metrics.attendanceRate.toFixed(1)}%`}
          subtitle="Period average"
          icon={<UserCheck className="w-5 h-5" />}
        />
        <MetricCard
          title="Pending Approvals"
          value={metrics.pendingApprovals}
          subtitle="Timesheets awaiting review"
          icon={<FileCheck className="w-5 h-5" />}
          variant={metrics.pendingApprovals > 5 ? 'warning' : 'default'}
        />
      </div>

      {/* Team activity feed */}
      <TeamFeed />
    </div>
  );
}
