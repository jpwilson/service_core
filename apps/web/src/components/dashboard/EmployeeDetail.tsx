import { useMemo } from 'react';
import { X, Clock, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import type { TimesheetStatus } from '@servicecore/shared';
import {
  mockEmployees,
  mockTimeEntries,
  mockProjects,
  formatShortDate,
  formatTime,
  formatHoursMinutes,
  formatCurrency,
  getInitials,
  calculateHoursWorked,
} from '@servicecore/shared';

interface EmployeeDetailProps {
  employeeId: string;
  onClose: () => void;
}

const STATUS_STYLES: Record<TimesheetStatus, { bg: string; text: string }> = {
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
};

export function EmployeeDetail({ employeeId, onClose }: EmployeeDetailProps) {
  const employee = useMemo(
    () => mockEmployees.find((e) => e.id === employeeId),
    [employeeId],
  );

  const projectMap = useMemo(
    () => new Map(mockProjects.map((p) => [p.id, p])),
    [],
  );

  const entries = useMemo(() => {
    return mockTimeEntries
      .filter((e) => e.employeeId === employeeId)
      .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
  }, [employeeId]);

  const last15 = entries.slice(0, 15);

  const stats = useMemo(() => {
    if (entries.length === 0) {
      return { avgHoursDay: 0, avgHoursWeek: 0, otDays: 0, totalDays: 0, totalEarnings: 0 };
    }

    let totalHours = 0;
    let otDays = 0;

    for (const entry of entries) {
      const hours = calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks);
      totalHours += hours;
      if (entry.flags.includes('overtime')) otDays += 1;
    }

    const avgHoursDay = totalHours / entries.length;

    // Estimate weeks from total days span
    const oldestDate = new Date(entries[entries.length - 1].clockIn);
    const newestDate = new Date(entries[0].clockIn);
    const spanDays = Math.max(1, (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.max(1, spanDays / 7);
    const avgHoursWeek = totalHours / weeks;

    const rate = employee?.hourlyRate ?? 0;
    const otRate = employee?.overtimeRate ?? 0;

    let totalEarnings = 0;
    for (const entry of entries) {
      const hours = calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks);
      if (hours > 8 && entry.flags.includes('overtime')) {
        totalEarnings += 8 * rate + (hours - 8) * otRate;
      } else {
        totalEarnings += hours * rate;
      }
    }

    return {
      avgHoursDay,
      avgHoursWeek,
      otDays,
      totalDays: entries.length,
      totalEarnings,
    };
  }, [entries, employee]);

  if (!employee) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-gray-500">Employee not found.</p>
      </div>
    );
  }

  const DEPT_COLORS: Record<string, string> = {
    Drivers: 'bg-blue-100 text-blue-800',
    'Service Crew': 'bg-purple-100 text-purple-800',
    Office: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full text-white text-lg font-bold"
            style={{ backgroundColor: employee.avatarColor }}
          >
            {getInitials(employee.firstName, employee.lastName)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#0a1f44]">
              {employee.firstName} {employee.lastName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${DEPT_COLORS[employee.department] ?? 'bg-gray-100 text-gray-800'}`}
              >
                {employee.department}
              </span>
              <span className="text-sm text-gray-500">{employee.role}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={<Clock className="w-5 h-5 text-[#f89020]" />}
          label="Avg Hours/Day"
          value={formatHoursMinutes(stats.avgHoursDay)}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-[#f89020]" />}
          label="Avg Hours/Week"
          value={formatHoursMinutes(stats.avgHoursWeek)}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          label="OT Frequency"
          value={`${stats.otDays} of ${stats.totalDays} days`}
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          label="Total Earnings"
          value={formatCurrency(stats.totalEarnings)}
        />
      </div>

      {/* Clock-in/out History */}
      <div>
        <h3 className="text-sm font-semibold text-[#0a1f44] uppercase tracking-wide mb-3">
          Recent Clock History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">In</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Out</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Hours</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Project</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {last15.map((entry) => {
                const hours = calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks);
                const project = entry.projectId ? projectMap.get(entry.projectId) : null;
                const statusStyle = STATUS_STYLES[entry.status];

                return (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2 px-3 text-[#0a1f44] font-medium">
                      {formatShortDate(entry.clockIn)}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {formatTime(entry.clockIn)}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {entry.clockOut ? formatTime(entry.clockOut) : (
                        <span className="text-amber-600 font-medium">Active</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[#0a1f44] font-medium">
                      {formatHoursMinutes(hours)}
                    </td>
                    <td className="py-2 px-3 text-gray-500 truncate max-w-[150px]">
                      {project?.name ?? '--'}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-base font-semibold text-[#0a1f44]">{value}</p>
      </div>
    </div>
  );
}
