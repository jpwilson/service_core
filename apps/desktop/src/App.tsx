import { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import {
  Clock,
  Users,
  Play,
  Square,
  Coffee,
  Activity,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Monitor,
} from 'lucide-react';
import {
  mockEmployees,
  mockTimeEntries,
  mockActivityEvents,
  getCurrentShiftEntry,
  getEntriesForEmployee,
  calculateHoursWorked,
  formatTime,
  formatHoursMinutes,
  formatCurrency,
  getInitials,
} from '@servicecore/shared';
import type { Employee, TimeEntry } from '@servicecore/shared';

type View = 'dashboard' | 'timeclock' | 'employees';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('emp-001');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Stats computed from mock data
  const stats = useMemo(() => {
    const activeShifts = mockTimeEntries.filter((e) => e.clockOut === null);
    const todayEntries = mockTimeEntries.filter((e) => {
      const d = new Date(e.clockIn);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });
    const pendingApprovals = mockTimeEntries.filter((e) => e.status === 'pending');
    const flaggedEntries = mockTimeEntries.filter((e) => e.flags.length > 0);

    let totalHoursToday = 0;
    for (const entry of todayEntries) {
      totalHoursToday += calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks);
    }

    return {
      activeShifts: activeShifts.length,
      todayEntries: todayEntries.length,
      pendingApprovals: pendingApprovals.length,
      flaggedEntries: flaggedEntries.length,
      totalHoursToday,
    };
  }, []);

  const selectedEmployee = mockEmployees.find((e) => e.id === selectedEmployeeId)!;
  const currentShift = getCurrentShiftEntry(mockTimeEntries, selectedEmployeeId);
  const employeeEntries = getEntriesForEmployee(mockTimeEntries, selectedEmployeeId);
  const recentEntries = employeeEntries.slice(-5).reverse();
  const recentActivity = mockActivityEvents.slice(0, 15);

  const handleClockIn = () => {
    toast.success(`${selectedEmployee.firstName} clocked in`);
  };

  const handleClockOut = () => {
    toast.success(`${selectedEmployee.firstName} clocked out`);
  };

  const handleStartBreak = () => {
    toast(`${selectedEmployee.firstName} started break`, { icon: '☕' });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-display">
      <Toaster position="top-right" />

      {/* Title bar area (draggable on macOS) */}
      <div className="bg-secondary-500 text-white px-4 py-2 flex items-center justify-between [-webkit-app-region:drag]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-primary-500" />
          <span className="font-bold text-sm tracking-wide">ServiceCore</span>
          <span className="text-white/40 text-xs flex items-center gap-1">
            <Monitor size={12} />
            Desktop
          </span>
        </div>
        <div className="text-white/70 text-sm tabular-nums [-webkit-app-region:no-drag]">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4">
        <div className="flex gap-1">
          {([
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'timeclock', label: 'Time Clock', icon: Clock },
            { id: 'employees', label: 'Employees', icon: Users },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentView === id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {currentView === 'dashboard' && (
          <DashboardView
            stats={stats}
            recentActivity={recentActivity}
          />
        )}
        {currentView === 'timeclock' && (
          <TimeClockView
            employee={selectedEmployee}
            currentShift={currentShift}
            recentEntries={recentEntries}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            onStartBreak={handleStartBreak}
            onSelectEmployee={setSelectedEmployeeId}
          />
        )}
        {currentView === 'employees' && (
          <EmployeesView
            employees={mockEmployees}
            entries={mockTimeEntries}
          />
        )}
      </main>
    </div>
  );
}

/* ---------- Dashboard View ---------- */

function DashboardView({
  stats,
  recentActivity,
}: {
  stats: {
    activeShifts: number;
    todayEntries: number;
    pendingApprovals: number;
    flaggedEntries: number;
    totalHoursToday: number;
  };
  recentActivity: typeof mockActivityEvents;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary-500">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Shifts"
          value={stats.activeShifts.toString()}
          icon={<Play size={20} className="text-green-500" />}
          color="green"
        />
        <StatCard
          label="Today's Hours"
          value={formatHoursMinutes(stats.totalHoursToday)}
          icon={<TrendingUp size={20} className="text-blue-500" />}
          color="blue"
        />
        <StatCard
          label="Pending Approvals"
          value={stats.pendingApprovals.toString()}
          icon={<Clock size={20} className="text-amber-500" />}
          color="amber"
        />
        <StatCard
          label="Flagged Entries"
          value={stats.flaggedEntries.toString()}
          icon={<AlertTriangle size={20} className="text-red-500" />}
          color="red"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto scrollbar-thin">
          {recentActivity.map((event) => {
            const employee = mockEmployees.find((e) => e.id === event.employeeId);
            if (!employee) return null;

            const typeLabels: Record<string, string> = {
              clock_in: 'Clocked in',
              clock_out: 'Clocked out',
              break_start: 'Started break',
              break_end: 'Ended break',
              note: 'Added note',
            };

            const typeColors: Record<string, string> = {
              clock_in: 'text-green-600 bg-green-50',
              clock_out: 'text-red-600 bg-red-50',
              break_start: 'text-amber-600 bg-amber-50',
              break_end: 'text-blue-600 bg-blue-50',
              note: 'text-gray-600 bg-gray-50',
            };

            return (
              <div key={event.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: employee.avatarColor }}
                >
                  {getInitials(employee.firstName, employee.lastName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    <span className="font-medium">{employee.firstName} {employee.lastName}</span>
                    {' '}{typeLabels[event.type] || event.type}
                  </p>
                  {event.details && (
                    <p className="text-xs text-gray-500 truncate">{event.details}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${typeColors[event.type] || ''}`}>
                  {formatTime(event.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const bgColors: Record<string, string> = {
    green: 'bg-green-50 border-green-100',
    blue: 'bg-blue-50 border-blue-100',
    amber: 'bg-amber-50 border-amber-100',
    red: 'bg-red-50 border-red-100',
  };

  return (
    <div className={`rounded-lg border p-4 ${bgColors[color] || 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

/* ---------- Time Clock View ---------- */

function TimeClockView({
  employee,
  currentShift,
  recentEntries,
  onClockIn,
  onClockOut,
  onStartBreak,
  onSelectEmployee,
}: {
  employee: Employee;
  currentShift: TimeEntry | null;
  recentEntries: TimeEntry[];
  onClockIn: () => void;
  onClockOut: () => void;
  onStartBreak: () => void;
  onSelectEmployee: (id: string) => void;
}) {
  const isClockedIn = currentShift !== null;
  const hoursWorked = currentShift
    ? calculateHoursWorked(currentShift.clockIn, currentShift.clockOut, currentShift.breaks)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary-500">Time Clock</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Select Employee
          </h3>
          <select
            value={employee.id}
            onChange={(e) => onSelectEmployee(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            {mockEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} - {emp.department}
              </option>
            ))}
          </select>

          <div className="mt-4 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: employee.avatarColor }}
            >
              {getInitials(employee.firstName, employee.lastName)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{employee.firstName} {employee.lastName}</p>
              <p className="text-sm text-gray-500">{employee.role} &middot; {employee.department}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-md p-2 text-center">
              <p className="text-gray-500">Rate</p>
              <p className="font-semibold text-gray-900">{formatCurrency(employee.hourlyRate)}/hr</p>
            </div>
            <div className="bg-gray-50 rounded-md p-2 text-center">
              <p className="text-gray-500">OT Rate</p>
              <p className="font-semibold text-gray-900">{formatCurrency(employee.overtimeRate)}/hr</p>
            </div>
          </div>
        </div>

        {/* Clock In/Out Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col items-center justify-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            isClockedIn ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <Clock size={36} className={isClockedIn ? 'text-green-600' : 'text-gray-400'} />
          </div>

          {isClockedIn && currentShift ? (
            <>
              <p className="text-sm text-gray-500 mb-1">Clocked in since</p>
              <p className="text-lg font-semibold text-gray-900 mb-1">{formatTime(currentShift.clockIn)}</p>
              <p className="text-3xl font-bold text-green-600 mb-4">{formatHoursMinutes(hoursWorked)}</p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={onStartBreak}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 text-amber-700 font-medium hover:bg-amber-100 transition-colors border border-amber-200"
                >
                  <Coffee size={16} />
                  Break
                </button>
                <button
                  onClick={onClockOut}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                >
                  <Square size={16} />
                  Clock Out
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-1">Not clocked in</p>
              <p className="text-lg font-semibold text-gray-400 mb-4">--:-- --</p>

              <button
                onClick={onClockIn}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors text-lg"
              >
                <Play size={20} />
                Clock In
              </button>
            </>
          )}
        </div>

        {/* Recent Shifts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Recent Shifts
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentEntries.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No recent entries</p>
            ) : (
              recentEntries.map((entry) => {
                const hours = calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks);
                return (
                  <div key={entry.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatTime(entry.clockIn)}
                        {entry.clockOut ? ` - ${formatTime(entry.clockOut)}` : ' - Active'}
                      </p>
                      <p className="text-xs text-gray-500">{entry.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatHoursMinutes(hours)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        entry.status === 'approved'
                          ? 'bg-green-50 text-green-700'
                          : entry.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Employees View ---------- */

function EmployeesView({
  employees,
  entries,
}: {
  employees: Employee[];
  entries: TimeEntry[];
}) {
  const [filterDept, setFilterDept] = useState<string>('all');

  const filtered = filterDept === 'all'
    ? employees
    : employees.filter((e) => e.department === filterDept);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-500">Employees</h1>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
        >
          <option value="all">All Departments</option>
          <option value="Drivers">Drivers</option>
          <option value="Service Crew">Service Crew</option>
          <option value="Office">Office</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Entries</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.map((emp) => {
              const empEntries = getEntriesForEmployee(entries, emp.id);
              const activeShift = getCurrentShiftEntry(entries, emp.id);

              return (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: emp.avatarColor }}
                      >
                        {getInitials(emp.firstName, emp.lastName)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {emp.firstName} {emp.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{emp.department}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{emp.role}</td>
                  <td className="px-5 py-3 text-sm text-gray-900 font-medium">{formatCurrency(emp.hourlyRate)}/hr</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{empEntries.length}</td>
                  <td className="px-5 py-3">
                    {activeShift ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        On Shift
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Off
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <ChevronRight size={16} className="text-gray-300" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
