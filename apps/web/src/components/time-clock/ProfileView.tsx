import { useMemo } from 'react';
import { Mail, Briefcase, DollarSign, Calendar, TrendingUp, Award } from 'lucide-react';
import type { Employee, TimeEntry } from '@servicecore/shared';
import { formatHoursMinutes, formatCurrency, calculateHoursWorked } from '@servicecore/shared';
import { subDays, parseISO, isAfter } from 'date-fns';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProfileViewProps {
  employee: Employee;
  entries: TimeEntry[];
}

export function ProfileView({ employee, entries }: ProfileViewProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const last30Days = subDays(new Date(), 30);
    const recentEntries = entries.filter((e) => isAfter(parseISO(e.clockIn), last30Days));
    const totalHours = recentEntries.reduce(
      (sum, e) => sum + calculateHoursWorked(e.clockIn, e.clockOut, e.breaks),
      0,
    );
    const overtimeHours = Math.max(0, totalHours - 160); // rough: 40hrs/week * 4 weeks
    const grossPay = totalHours * employee.hourlyRate + overtimeHours * (employee.overtimeRate - employee.hourlyRate);
    const avgDaily = recentEntries.length > 0 ? totalHours / Math.min(recentEntries.length, 22) : 0;

    return { totalHours, overtimeHours, grossPay, avgDaily, shiftCount: recentEntries.length };
  }, [entries, employee]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold mb-3"
          style={{ backgroundColor: employee.avatarColor }}
        >
          {employee.firstName[0]}{employee.lastName[0]}
        </div>
        <h2 className="text-lg font-bold text-secondary-500">
          {employee.firstName} {employee.lastName}
        </h2>
        <p className="text-sm text-gray-500">{employee.role}</p>
        <p className="text-xs text-gray-400">{employee.department}</p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-start gap-2.5">
          <Mail className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Email</p>
            <p className="text-xs font-medium text-secondary-500 break-all">{employee.email}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-start gap-2.5">
          <Calendar className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Hire Date</p>
            <p className="text-xs font-medium text-secondary-500">{employee.hireDate}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-start gap-2.5">
          <DollarSign className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Hourly Rate</p>
            <p className="text-xs font-medium text-secondary-500">${employee.hourlyRate}/hr</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-start gap-2.5">
          <Briefcase className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Department</p>
            <p className="text-xs font-medium text-secondary-500">{employee.department}</p>
          </div>
        </div>
      </div>

      {/* 30-Day Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-secondary-500 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-500" />
          Last 30 Days
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total Hours</p>
            <p className="text-lg font-bold text-secondary-500">{formatHoursMinutes(stats.totalHours)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Overtime</p>
            <p className="text-lg font-bold text-red-500">{formatHoursMinutes(stats.overtimeHours)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Gross Pay</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(stats.grossPay)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Shifts Worked</p>
            <p className="text-lg font-bold text-secondary-500">{stats.shiftCount}</p>
          </div>
        </div>
      </div>

      {/* Pay Rates */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-secondary-500 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary-500" />
          Pay Rates
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
            <span className="text-sm text-gray-600">Regular</span>
            <span className="text-sm font-bold text-secondary-500">{formatCurrency(employee.hourlyRate)}/hr</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
            <span className="text-sm text-gray-600">Overtime (1.5x)</span>
            <span className="text-sm font-bold text-primary-500">{formatCurrency(employee.overtimeRate)}/hr</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-sm text-gray-600">Double Time (2x)</span>
            <span className="text-sm font-bold text-red-500">{formatCurrency(employee.doubleTimeRate)}/hr</span>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
