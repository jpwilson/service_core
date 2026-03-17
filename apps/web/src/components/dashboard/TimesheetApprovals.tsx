import { useState, useMemo } from 'react';
import { FileCheck, CheckCircle, XCircle, CheckCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { TimeEntry, TimeEntryFlag } from '@servicecore/shared';
import {
  mockEmployees,
  mockTimeEntries,
  mockProjects,
  formatShortDate,
  formatHoursMinutes,
  getInitials,
  calculateHoursWorked,
} from '@servicecore/shared';

const FLAG_STYLES: Record<TimeEntryFlag, { bg: string; text: string; label: string }> = {
  overtime: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Overtime' },
  manual_edit: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Manual Edit' },
  location_mismatch: { bg: 'bg-red-100', text: 'text-red-800', label: 'Location Mismatch' },
  late_arrival: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Late Arrival' },
  missing_clockout: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Missing Clock-Out' },
};

export function TimesheetApprovals() {
  const { approveTimesheet, rejectTimesheet, addToast, timesheetApprovals } = useAppStore();
  const [localStatuses, setLocalStatuses] = useState<Map<string, 'approved' | 'rejected'>>(new Map());

  const employeeMap = useMemo(
    () => new Map(mockEmployees.map((e) => [e.id, e])),
    [],
  );
  const projectMap = useMemo(
    () => new Map(mockProjects.map((p) => [p.id, p])),
    [],
  );

  const pendingEntries = useMemo(() => {
    return mockTimeEntries.filter((entry) => {
      if (entry.status !== 'pending') return false;
      const storeStatus = timesheetApprovals.get(entry.id);
      if (storeStatus && storeStatus !== 'pending') return false;
      return !localStatuses.has(entry.id);
    });
  }, [timesheetApprovals, localStatuses]);

  function handleApprove(entry: TimeEntry) {
    approveTimesheet(entry.id);
    setLocalStatuses((prev) => new Map(prev).set(entry.id, 'approved'));
    const emp = employeeMap.get(entry.employeeId);
    const name = emp ? `${emp.firstName} ${emp.lastName}` : 'Employee';
    addToast(`Approved timesheet for ${name}`, 'success');
  }

  function handleReject(entry: TimeEntry) {
    rejectTimesheet(entry.id);
    setLocalStatuses((prev) => new Map(prev).set(entry.id, 'rejected'));
    const emp = employeeMap.get(entry.employeeId);
    const name = emp ? `${emp.firstName} ${emp.lastName}` : 'Employee';
    addToast(`Rejected timesheet for ${name}`, 'error');
  }

  function handleBulkApprove() {
    for (const entry of pendingEntries) {
      approveTimesheet(entry.id);
    }
    setLocalStatuses((prev) => {
      const next = new Map(prev);
      for (const entry of pendingEntries) {
        next.set(entry.id, 'approved');
      }
      return next;
    });
    addToast(`Approved ${pendingEntries.length} timesheets`, 'success');
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#f89020]/10">
            <FileCheck className="w-5 h-5 text-[#f89020]" />
          </div>
          <h2 className="text-lg font-semibold text-[#0a1f44]">Timesheet Approvals</h2>
          {pendingEntries.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 text-xs font-bold text-white bg-[#f89020] rounded-full">
              {pendingEntries.length}
            </span>
          )}
        </div>
        {pendingEntries.length > 1 && (
          <button
            onClick={handleBulkApprove}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#f89020] hover:bg-[#e07d10] rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Approve All
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {pendingEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-lg font-medium text-[#0a1f44]">All timesheets approved</p>
            <p className="mt-1 text-sm text-gray-500">No pending entries require your attention.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingEntries.map((entry) => {
              const employee = employeeMap.get(entry.employeeId);
              const project = entry.projectId ? projectMap.get(entry.projectId) : null;
              const hours = calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks);

              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-white text-sm font-bold"
                    style={{ backgroundColor: employee?.avatarColor ?? '#6b7280' }}
                  >
                    {employee ? getInitials(employee.firstName, employee.lastName) : '??'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#0a1f44] truncate">
                        {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-sm text-gray-500">
                        {formatShortDate(entry.clockIn)}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-sm font-medium text-[#0a1f44]">
                        {formatHoursMinutes(hours)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {project && (
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {project.name}
                        </span>
                      )}
                      {entry.flags.map((flag) => {
                        const style = FLAG_STYLES[flag];
                        return (
                          <span
                            key={flag}
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${style.bg} ${style.text}`}
                          >
                            {style.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(entry)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(entry)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
