import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { mockEmployees } from '@servicecore/shared';
import { useAuth } from '../../auth/AuthContext';

// Use first 7 real employees (drivers + service crew)
const ALL_EMPLOYEES = mockEmployees
  .filter((e) => e.department === 'Drivers' || e.department === 'Service Crew')
  .slice(0, 7);

const EMPLOYEE_NAMES = ALL_EMPLOYEES.map((e) => `${e.firstName} ${e.lastName}`);

const JOB_SITES = ['Denver Metro', 'Boulder CU', 'Fort Collins', 'CO Springs', 'Arvada'] as const;
type JobSite = (typeof JOB_SITES)[number];

const SITE_ABBREV: Record<JobSite, string> = {
  'Denver Metro': 'DEN',
  'Boulder CU': 'BLD',
  'Fort Collins': 'FTC',
  'CO Springs': 'COS',
  'Arvada': 'ARV',
};

const SITE_COLORS: Record<JobSite, { bg: string; dot: string; text: string }> = {
  'Denver Metro': { bg: 'bg-blue-100', dot: 'bg-blue-500', text: 'text-blue-800' },
  'Boulder CU': { bg: 'bg-emerald-100', dot: 'bg-emerald-500', text: 'text-emerald-800' },
  'Fort Collins': { bg: 'bg-purple-100', dot: 'bg-purple-500', text: 'text-purple-800' },
  'CO Springs': { bg: 'bg-amber-100', dot: 'bg-amber-500', text: 'text-amber-800' },
  'Arvada': { bg: 'bg-rose-100', dot: 'bg-rose-500', text: 'text-rose-800' },
};

// Cycle order: site1 -> site2 -> ... -> Off -> site1 ...
const CYCLE_OPTIONS: (JobSite | null)[] = [...JOB_SITES, null];

type ScheduleGrid = Record<string, Record<number, JobSite | null>>;

function buildInitialSchedule(): ScheduleGrid {
  // Deterministic seed assignments — rotate through sites for each employee
  const seedPatterns: (JobSite | null)[][] = [
    ['Denver Metro', 'Denver Metro', 'Boulder CU', 'Denver Metro', 'Denver Metro', null, null],
    ['Boulder CU', 'Boulder CU', 'Boulder CU', 'Fort Collins', 'Boulder CU', null, null],
    ['Fort Collins', 'Fort Collins', 'Denver Metro', 'Fort Collins', 'Fort Collins', 'Denver Metro', null],
    ['CO Springs', 'CO Springs', 'CO Springs', 'CO Springs', 'Arvada', null, null],
    ['Arvada', 'Denver Metro', 'Arvada', 'Arvada', 'Arvada', null, null],
    ['Denver Metro', 'Fort Collins', 'Fort Collins', 'Denver Metro', null, 'CO Springs', null],
    ['CO Springs', 'Arvada', 'CO Springs', null, 'CO Springs', null, null],
  ];

  const grid: ScheduleGrid = {};
  for (let i = 0; i < EMPLOYEE_NAMES.length; i++) {
    const emp = EMPLOYEE_NAMES[i];
    grid[emp] = {};
    const row = seedPatterns[i % seedPatterns.length];
    for (let d = 0; d < 7; d++) {
      grid[emp][d] = row[d];
    }
  }
  return grid;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function Scheduling() {
  const { user } = useAuth();
  const isDriver = user?.role === 'driver';

  const [weekOffset, setWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleGrid>(buildInitialSchedule);

  const today = new Date();
  const weekStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Find the current user's employee name for driver filtering
  const currentEmployeeName = useMemo(() => {
    if (!isDriver || !user?.employeeId) return null;
    const emp = ALL_EMPLOYEES.find((e) => e.id === user.employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : null;
  }, [isDriver, user?.employeeId]);

  // Filter employees based on role
  const displayEmployees = useMemo(() => {
    if (isDriver && currentEmployeeName && EMPLOYEE_NAMES.includes(currentEmployeeName)) {
      return [currentEmployeeName];
    }
    return EMPLOYEE_NAMES;
  }, [isDriver, currentEmployeeName]);

  const handleCellClick = (employee: string, dayIndex: number) => {
    if (isDriver) return; // drivers can't edit
    setSchedule((prev) => {
      const current = prev[employee][dayIndex];
      const currentIdx = CYCLE_OPTIONS.indexOf(current);
      const nextIdx = (currentIdx + 1) % CYCLE_OPTIONS.length;
      return {
        ...prev,
        [employee]: { ...prev[employee], [dayIndex]: CYCLE_OPTIONS[nextIdx] },
      };
    });
  };

  // Today's assignment for driver summary card
  const todayDayIndex = useMemo(() => {
    if (weekOffset !== 0) return -1;
    const todayStr = format(today, 'yyyy-MM-dd');
    return days.findIndex((d) => format(d, 'yyyy-MM-dd') === todayStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const todaySite = useMemo(() => {
    if (!isDriver || !currentEmployeeName || todayDayIndex < 0) return null;
    const grid = schedule[currentEmployeeName];
    if (!grid) return null;
    return grid[todayDayIndex];
  }, [isDriver, currentEmployeeName, todayDayIndex, schedule]);

  // Stats
  const scheduledEmployees = displayEmployees.filter((emp) =>
    days.some((_, d) => schedule[emp]?.[d] !== null),
  ).length;

  const activeSites = new Set(
    displayEmployees.flatMap((emp) => days.map((_, d) => schedule[emp]?.[d]).filter(Boolean)),
  ).size;

  const gaps = displayEmployees.reduce((count, emp) => {
    for (let d = 0; d < 5; d++) {
      if (schedule[emp]?.[d] === null) count++;
    }
    return count;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-secondary-500">
            {isDriver ? 'My Schedule' : 'Dispatch Board'}
          </h2>
          <p className="text-sm text-gray-500">
            {isDriver
              ? 'Your weekly assignments'
              : 'Weekly scheduling \u2014 click any cell to cycle assignments'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-secondary-500 transition-colors"
          >
            This Week
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="ml-2 text-sm font-semibold text-secondary-500">
            {format(weekStart, 'MMM d')} &ndash; {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Driver: Today summary card */}
      {isDriver && weekOffset === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-50">
              <Calendar className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Today&apos;s Assignment</p>
              <p className="text-lg font-bold text-secondary-500">
                {todaySite ? todaySite : 'Off'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      {!isDriver && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-500">{scheduledEmployees}</p>
              <p className="text-xs text-gray-500">Employees Scheduled</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-500">{activeSites}</p>
              <p className="text-xs text-gray-500">Job Sites Active</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-500">{gaps}</p>
              <p className="text-xs text-gray-500">Gaps (Weekday)</p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase w-44">
                  Employee
                </th>
                {days.map((day, i) => {
                  const isToday =
                    weekOffset === 0 && format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                  const isWeekend = i >= 5;
                  return (
                    <th
                      key={i}
                      className={`text-center py-3 px-2 text-xs font-bold uppercase ${
                        isToday
                          ? 'text-primary-500'
                          : isWeekend
                            ? 'text-gray-400'
                            : 'text-gray-500'
                      }`}
                    >
                      <div>{format(day, 'EEE')}</div>
                      <div
                        className={`text-sm font-semibold mt-0.5 ${
                          isToday
                            ? 'bg-primary-500 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto'
                            : ''
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayEmployees.map((emp) => (
                <tr key={emp} className="hover:bg-gray-50/50">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-secondary-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getInitials(emp)}
                      </div>
                      <span className="text-sm font-medium text-secondary-500 truncate">
                        {emp}
                      </span>
                    </div>
                  </td>
                  {days.map((_, dayIdx) => {
                    const site = schedule[emp]?.[dayIdx] ?? null;
                    const isWeekend = dayIdx >= 5;
                    if (site === null) {
                      return (
                        <td key={dayIdx} className="py-2.5 px-1.5 text-center">
                          {isDriver ? (
                            <div
                              className={`w-full h-9 rounded-lg border border-dashed ${
                                isWeekend
                                  ? 'border-gray-100 bg-gray-50/50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <span className="text-[10px] text-gray-300 leading-9">
                                {isWeekend ? '' : 'OFF'}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCellClick(emp, dayIdx)}
                              className={`w-full h-9 rounded-lg border border-dashed transition-colors ${
                                isWeekend
                                  ? 'border-gray-100 bg-gray-50/50 hover:border-gray-300'
                                  : 'border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                              }`}
                              title="Click to assign"
                            >
                              <span className="text-[10px] text-gray-300">
                                {isWeekend ? '' : 'OFF'}
                              </span>
                            </button>
                          )}
                        </td>
                      );
                    }
                    const colors = SITE_COLORS[site];
                    return (
                      <td key={dayIdx} className="py-2.5 px-1.5 text-center">
                        {isDriver ? (
                          <div
                            className={`w-full h-9 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center gap-1.5 text-xs font-semibold`}
                            title={site}
                          >
                            <span className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} />
                            {SITE_ABBREV[site]}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCellClick(emp, dayIdx)}
                            className={`w-full h-9 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center gap-1.5 text-xs font-semibold transition-all hover:ring-2 hover:ring-offset-1 hover:ring-gray-300`}
                            title={`${site} \u2014 click to change`}
                          >
                            <span className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} />
                            {SITE_ABBREV[site]}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-secondary-500" />
          <span className="text-xs font-bold text-secondary-500 uppercase">Job Site Legend</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {JOB_SITES.map((site) => {
            const colors = SITE_COLORS[site];
            return (
              <div
                key={site}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.bg}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <span className={`text-xs font-semibold ${colors.text}`}>
                  {SITE_ABBREV[site]}
                </span>
                <span className={`text-xs ${colors.text} opacity-70`}>{site}</span>
              </div>
            );
          })}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-dashed border-gray-200">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="text-xs font-semibold text-gray-500">OFF</span>
            <span className="text-xs text-gray-400">Unassigned</span>
          </div>
        </div>
      </div>
    </div>
  );
}
