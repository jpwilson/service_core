import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Clock,
  Users,
  DollarSign,
  FolderOpen,
  UserCheck,
  Search,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from 'lucide-react';
import type { Employee, Project, Department } from '@servicecore/shared';
import {
  mockEmployees,
  mockTimeEntries,
  mockProjects,
  formatCurrency,
  formatHoursMinutes,
  formatShortDate,
  calculateHoursWorked,
} from '@servicecore/shared';
import { ChartCard } from '../shared/ChartCard';
import {
  format,
  parseISO,
  subDays,
  startOfDay,
  isSameDay,
  isWithinInterval,
} from 'date-fns';

// --------------- Constants ---------------
const PRIMARY = '#f89020';
const SECONDARY = '#0a1f44';
const GREEN = '#10b981';
const RED = '#ef4444';
const TODAY = new Date('2026-03-16T12:00:00');
const DAILY_OT_THRESHOLD = 8;

const TABS = [
  { label: 'Hours Overview', icon: Clock },
  { label: 'Attendance', icon: UserCheck },
  { label: 'Labor Costs', icon: DollarSign },
  { label: 'Projects', icon: FolderOpen },
  { label: 'Employees', icon: Users },
] as const;

type SortKey = 'name' | 'hours' | 'employees' | 'avgHours' | 'cost';
type SortDir = 'asc' | 'desc';

// --------------- Component ---------------
export function Analytics() {
  const [activeTab, setActiveTab] = useState(0);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [projectSortKey, setProjectSortKey] = useState<SortKey>('hours');
  const [projectSortDir, setProjectSortDir] = useState<SortDir>('desc');

  // ===== Shared computed data =====

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    mockEmployees.forEach((e) => map.set(e.id, e));
    return map;
  }, []);

  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    mockProjects.forEach((p) => map.set(p.id, p));
    return map;
  }, []);

  // Pre-calculate hours for every entry
  const entryHours = useMemo(() => {
    return mockTimeEntries.map((entry) => ({
      entry,
      hours: calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks),
    }));
  }, []);

  // =====================================================================
  //  TAB 1: Hours Overview
  // =====================================================================

  const employeeHoursData = useMemo(() => {
    const empTotals = new Map<string, { regular: number; overtime: number }>();
    entryHours.forEach(({ entry, hours }) => {
      const prev = empTotals.get(entry.employeeId) || { regular: 0, overtime: 0 };
      const reg = Math.min(hours, DAILY_OT_THRESHOLD);
      const ot = Math.max(0, hours - DAILY_OT_THRESHOLD);
      empTotals.set(entry.employeeId, {
        regular: prev.regular + reg,
        overtime: prev.overtime + ot,
      });
    });

    return Array.from(empTotals.entries())
      .map(([id, vals]) => {
        const emp = employeeMap.get(id);
        return {
          name: emp ? `${emp.firstName} ${emp.lastName.charAt(0)}.` : id,
          regular: parseFloat(vals.regular.toFixed(1)),
          overtime: parseFloat(vals.overtime.toFixed(1)),
          total: parseFloat((vals.regular + vals.overtime).toFixed(1)),
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [entryHours, employeeMap]);

  const dailyHoursData = useMemo(() => {
    const days: { date: string; label: string; hours: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = subDays(TODAY, i);
      const dayStart = startOfDay(day);
      let total = 0;
      entryHours.forEach(({ entry, hours }) => {
        if (isSameDay(parseISO(entry.clockIn), dayStart)) {
          total += hours;
        }
      });
      days.push({
        date: format(day, 'yyyy-MM-dd'),
        label: format(day, 'MMM d'),
        hours: parseFloat(total.toFixed(1)),
      });
    }
    return days;
  }, [entryHours]);

  const departmentHoursData = useMemo(() => {
    const deptMap = new Map<Department, number>();
    entryHours.forEach(({ entry, hours }) => {
      const emp = employeeMap.get(entry.employeeId);
      if (!emp) return;
      deptMap.set(emp.department, (deptMap.get(emp.department) || 0) + hours);
    });
    const colors: Record<Department, string> = {
      Drivers: PRIMARY,
      'Service Crew': SECONDARY,
      Office: GREEN,
    };
    return Array.from(deptMap.entries()).map(([dept, hours]) => ({
      name: dept,
      value: parseFloat(hours.toFixed(1)),
      color: colors[dept] || '#6b7280',
    }));
  }, [entryHours, employeeMap]);

  // =====================================================================
  //  TAB 2: Attendance & Patterns
  // =====================================================================

  const heatmapData = useMemo(() => {
    const last14 = Array.from({ length: 14 }, (_, i) => subDays(TODAY, 13 - i));
    return mockEmployees.map((emp) => {
      const dayValues = last14.map((day) => {
        const dayStart = startOfDay(day);
        let totalHours = 0;
        entryHours.forEach(({ entry, hours }) => {
          if (entry.employeeId === emp.id && isSameDay(parseISO(entry.clockIn), dayStart)) {
            totalHours += hours;
          }
        });
        return parseFloat(totalHours.toFixed(1));
      });
      return { employee: emp, days: dayValues, dates: last14 };
    });
  }, [entryHours]);

  const avgStartTimeData = useMemo(() => {
    const empStarts = new Map<string, number[]>();
    mockTimeEntries.forEach((entry) => {
      const clockIn = parseISO(entry.clockIn);
      const decimalHour = clockIn.getHours() + clockIn.getMinutes() / 60;
      const prev = empStarts.get(entry.employeeId) || [];
      prev.push(decimalHour);
      empStarts.set(entry.employeeId, prev);
    });
    return mockEmployees.map((emp) => {
      const starts = empStarts.get(emp.id) || [];
      const avg = starts.length > 0 ? starts.reduce((a, b) => a + b, 0) / starts.length : 0;
      return {
        name: `${emp.firstName} ${emp.lastName.charAt(0)}.`,
        avgStart: parseFloat(avg.toFixed(2)),
      };
    });
  }, []);

  const attendanceStats = useMemo(() => {
    let lateCount = 0;
    let totalEntries = 0;
    const workdays = new Set<string>();

    mockTimeEntries.forEach((entry) => {
      totalEntries++;
      if (entry.flags.includes('late_arrival')) lateCount++;
      const dateKey = format(parseISO(entry.clockIn), 'yyyy-MM-dd');
      workdays.add(dateKey);
    });

    const totalWorkdays = workdays.size;
    const avgAttendance =
      totalWorkdays > 0
        ? parseFloat(((totalEntries / (mockEmployees.length * totalWorkdays)) * 100).toFixed(1))
        : 0;

    return { lateCount, avgAttendance };
  }, []);

  // =====================================================================
  //  TAB 3: Labor Cost Analysis
  // =====================================================================

  const laborCostByProject = useMemo(() => {
    const projCosts = new Map<string, number>();
    entryHours.forEach(({ entry, hours }) => {
      if (!entry.projectId) return;
      const emp = employeeMap.get(entry.employeeId);
      if (!emp) return;
      const reg = Math.min(hours, DAILY_OT_THRESHOLD);
      const ot = Math.max(0, hours - DAILY_OT_THRESHOLD);
      const cost = reg * emp.hourlyRate + ot * emp.overtimeRate;
      projCosts.set(entry.projectId, (projCosts.get(entry.projectId) || 0) + cost);
    });
    return Array.from(projCosts.entries())
      .map(([id, cost]) => {
        const proj = projectMap.get(id);
        return {
          name: proj ? proj.name.substring(0, 25) : id,
          cost: parseFloat(cost.toFixed(2)),
        };
      })
      .sort((a, b) => b.cost - a.cost);
  }, [entryHours, employeeMap, projectMap]);

  const weeklyPayrollTrend = useMemo(() => {
    const weeks: { label: string; cost: number }[] = [];
    for (let w = 11; w >= 0; w--) {
      const weekEnd = subDays(TODAY, w * 7);
      const weekStart = subDays(weekEnd, 6);
      let weekCost = 0;
      entryHours.forEach(({ entry, hours }) => {
        const clockIn = parseISO(entry.clockIn);
        if (isWithinInterval(clockIn, { start: startOfDay(weekStart), end: weekEnd })) {
          const emp = employeeMap.get(entry.employeeId);
          if (!emp) return;
          const reg = Math.min(hours, DAILY_OT_THRESHOLD);
          const ot = Math.max(0, hours - DAILY_OT_THRESHOLD);
          weekCost += reg * emp.hourlyRate + ot * emp.overtimeRate;
        }
      });
      weeks.push({
        label: formatShortDate(weekStart),
        cost: parseFloat(weekCost.toFixed(2)),
      });
    }
    return weeks;
  }, [entryHours, employeeMap]);

  const costStats = useMemo(() => {
    let totalCost = 0;
    let totalHours = 0;
    let totalOtCost = 0;

    entryHours.forEach(({ entry, hours }) => {
      const emp = employeeMap.get(entry.employeeId);
      if (!emp) return;
      const reg = Math.min(hours, DAILY_OT_THRESHOLD);
      const ot = Math.max(0, hours - DAILY_OT_THRESHOLD);
      totalCost += reg * emp.hourlyRate + ot * emp.overtimeRate;
      totalHours += hours;
      totalOtCost += ot * emp.overtimeRate;
    });

    return {
      avgCostPerHour: totalHours > 0 ? totalCost / totalHours : 0,
      totalOtCost,
    };
  }, [entryHours, employeeMap]);

  const overtimeBreakdown = useMemo(() => {
    const empOt = new Map<string, { otHours: number; otCost: number }>();
    entryHours.forEach(({ entry, hours }) => {
      const emp = employeeMap.get(entry.employeeId);
      if (!emp) return;
      const ot = Math.max(0, hours - DAILY_OT_THRESHOLD);
      if (ot > 0) {
        const prev = empOt.get(entry.employeeId) || { otHours: 0, otCost: 0 };
        empOt.set(entry.employeeId, {
          otHours: prev.otHours + ot,
          otCost: prev.otCost + ot * emp.overtimeRate,
        });
      }
    });
    return Array.from(empOt.entries())
      .map(([id, vals]) => {
        const emp = employeeMap.get(id);
        return {
          name: emp ? `${emp.firstName} ${emp.lastName}` : id,
          department: emp?.department || '',
          otHours: parseFloat(vals.otHours.toFixed(1)),
          otCost: parseFloat(vals.otCost.toFixed(2)),
        };
      })
      .sort((a, b) => b.otCost - a.otCost);
  }, [entryHours, employeeMap]);

  // =====================================================================
  //  TAB 4: Project Time Allocation
  // =====================================================================

  const projectAllocation = useMemo(() => {
    const projData = new Map<
      string,
      { hours: number; employees: Set<string>; cost: number }
    >();
    entryHours.forEach(({ entry, hours }) => {
      if (!entry.projectId) return;
      const emp = employeeMap.get(entry.employeeId);
      if (!emp) return;
      const prev = projData.get(entry.projectId) || {
        hours: 0,
        employees: new Set<string>(),
        cost: 0,
      };
      const reg = Math.min(hours, DAILY_OT_THRESHOLD);
      const ot = Math.max(0, hours - DAILY_OT_THRESHOLD);
      prev.hours += hours;
      prev.employees.add(entry.employeeId);
      prev.cost += reg * emp.hourlyRate + ot * emp.overtimeRate;
      projData.set(entry.projectId, prev);
    });

    return Array.from(projData.entries()).map(([id, data]) => {
      const proj = projectMap.get(id);
      const empCount = data.employees.size;
      return {
        id,
        name: proj ? proj.name : id,
        hours: parseFloat(data.hours.toFixed(1)),
        employeeCount: empCount,
        avgHours: empCount > 0 ? parseFloat((data.hours / empCount).toFixed(1)) : 0,
        cost: parseFloat(data.cost.toFixed(2)),
      };
    });
  }, [entryHours, employeeMap, projectMap]);

  const sortedProjectAllocation = useMemo(() => {
    const sorted = [...projectAllocation];
    sorted.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (projectSortKey) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          return projectSortDir === 'asc'
            ? (aVal as string).localeCompare(bVal as string)
            : (bVal as string).localeCompare(aVal as string);
        case 'hours':
          aVal = a.hours;
          bVal = b.hours;
          break;
        case 'employees':
          aVal = a.employeeCount;
          bVal = b.employeeCount;
          break;
        case 'avgHours':
          aVal = a.avgHours;
          bVal = b.avgHours;
          break;
        case 'cost':
          aVal = a.cost;
          bVal = b.cost;
          break;
        default:
          aVal = a.hours;
          bVal = b.hours;
      }
      return projectSortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [projectAllocation, projectSortKey, projectSortDir]);

  const projectBarData = useMemo(() => {
    return [...projectAllocation]
      .sort((a, b) => b.hours - a.hours)
      .map((p) => ({ name: p.name.substring(0, 25), hours: p.hours }));
  }, [projectAllocation]);

  // =====================================================================
  //  TAB 5: Employee Details
  // =====================================================================

  const employeeDetails = useMemo(() => {
    return mockEmployees.map((emp) => {
      const empEntries = entryHours.filter(({ entry }) => entry.employeeId === emp.id);
      const totalHours = empEntries.reduce((sum, { hours }) => sum + hours, 0);
      const otHours = empEntries.reduce(
        (sum, { hours }) => sum + Math.max(0, hours - DAILY_OT_THRESHOLD),
        0
      );

      // Count unique days worked
      const daysWorked = new Set(
        empEntries.map(({ entry }) => format(parseISO(entry.clockIn), 'yyyy-MM-dd'))
      ).size;
      const avgHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;

      // Punctuality: % of entries without late_arrival flag
      const onTimeCount = empEntries.filter(
        ({ entry }) => !entry.flags.includes('late_arrival')
      ).length;
      const punctuality = empEntries.length > 0 ? (onTimeCount / empEntries.length) * 100 : 100;

      // Total pay
      let pay = 0;
      empEntries.forEach(({ hours }) => {
        const reg = Math.min(hours, DAILY_OT_THRESHOLD);
        const ot = Math.max(0, hours - DAILY_OT_THRESHOLD);
        pay += reg * emp.hourlyRate + ot * emp.overtimeRate;
      });

      return {
        employee: emp,
        totalHours: parseFloat(totalHours.toFixed(1)),
        otHours: parseFloat(otHours.toFixed(1)),
        avgHoursPerDay: parseFloat(avgHoursPerDay.toFixed(1)),
        punctuality: parseFloat(punctuality.toFixed(1)),
        totalPay: parseFloat(pay.toFixed(2)),
        daysWorked,
      };
    });
  }, [entryHours]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employeeDetails;
    const q = employeeSearch.toLowerCase();
    return employeeDetails.filter(
      (d) =>
        d.employee.firstName.toLowerCase().includes(q) ||
        d.employee.lastName.toLowerCase().includes(q)
    );
  }, [employeeDetails, employeeSearch]);

  const selectedEmployeeDetail = useMemo(() => {
    if (!selectedEmployeeId) return null;
    const detail = employeeDetails.find((d) => d.employee.id === selectedEmployeeId);
    if (!detail) return null;

    const emp = detail.employee;
    const empEntries = entryHours
      .filter(({ entry }) => entry.employeeId === emp.id)
      .sort(
        (a, b) =>
          parseISO(b.entry.clockIn).getTime() - parseISO(a.entry.clockIn).getTime()
      );

    // Last 14 days sparkline
    const sparkline = Array.from({ length: 14 }, (_, i) => {
      const day = subDays(TODAY, 13 - i);
      const dayStart = startOfDay(day);
      let dayHours = 0;
      empEntries.forEach(({ entry, hours }) => {
        if (isSameDay(parseISO(entry.clockIn), dayStart)) {
          dayHours += hours;
        }
      });
      return { day: format(day, 'MMM d'), hours: parseFloat(dayHours.toFixed(1)) };
    });

    // Avg hours/week
    const totalHours = detail.totalHours;
    const weeksSpan = Math.max(1, detail.daysWorked / 5);
    const avgHoursWeek = totalHours / weeksSpan;

    // OT frequency: % of days with OT
    const daysWithOt = new Set<string>();
    empEntries.forEach(({ entry, hours }) => {
      if (hours > DAILY_OT_THRESHOLD) {
        daysWithOt.add(format(parseISO(entry.clockIn), 'yyyy-MM-dd'));
      }
    });
    const otFrequency =
      detail.daysWorked > 0 ? (daysWithOt.size / detail.daysWorked) * 100 : 0;

    // Last 10 clock entries
    const lastEntries = empEntries.slice(0, 10).map(({ entry, hours }) => ({
      date: format(parseISO(entry.clockIn), 'MMM d, yyyy'),
      clockIn: format(parseISO(entry.clockIn), 'hh:mm a'),
      clockOut: entry.clockOut ? format(parseISO(entry.clockOut), 'hh:mm a') : 'Active',
      hours: parseFloat(hours.toFixed(1)),
    }));

    return {
      ...detail,
      sparkline,
      avgHoursWeek: parseFloat(avgHoursWeek.toFixed(1)),
      otFrequency: parseFloat(otFrequency.toFixed(1)),
      lastEntries,
    };
  }, [selectedEmployeeId, employeeDetails, entryHours]);

  // ===== Helpers =====

  function toggleProjectSort(key: SortKey) {
    if (projectSortKey === key) {
      setProjectSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setProjectSortKey(key);
      setProjectSortDir('desc');
    }
  }

  function heatmapColor(hours: number): string {
    if (hours === 0) return 'bg-gray-100';
    if (hours < 6) return 'bg-amber-200';
    if (hours <= 8) return 'bg-green-300';
    if (hours <= 10) return 'bg-green-500';
    return 'bg-red-400';
  }

  function formatDecimalTime(decimal: number): string {
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  }

  const SortIcon = ({ sortKey }: { sortKey: SortKey }) => {
    if (projectSortKey !== sortKey)
      return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400 inline" />;
    return projectSortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 ml-1 text-[#f89020] inline" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1 text-[#f89020] inline" />
    );
  };

  // =====================================================================
  //  RENDER
  // =====================================================================

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeTab === idx;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#f89020] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: Hours Overview ==================== */}
      {activeTab === 0 && (
        <div className="space-y-6">
          {/* Stacked bar: employee hours */}
          <ChartCard
            title="Top 10 Employees by Total Hours"
            subtitle="Regular vs overtime hours for the period"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeHoursData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatHoursMinutes(Number(value)),
                    name === 'regular' ? 'Regular' : 'Overtime',
                  ]}
                />
                <Legend />
                <Bar dataKey="regular" stackId="a" fill={PRIMARY} name="Regular" radius={[0, 0, 0, 0]} />
                <Bar dataKey="overtime" stackId="a" fill={RED} name="Overtime" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line chart: daily total hours */}
            <ChartCard
              title="Daily Company Hours"
              subtitle="Total hours worked across all employees (last 30 days)"
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyHoursData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                  />
                  <Tooltip
                    formatter={(value) => [formatHoursMinutes(Number(value)), 'Total Hours']}
                    labelFormatter={(label) => label}
                  />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke={PRIMARY}
                    strokeWidth={2}
                    dot={{ r: 2, fill: PRIMARY }}
                    activeDot={{ r: 5, fill: PRIMARY }}
                    fill="url(#hoursGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Pie chart: hours by department */}
            <ChartCard
              title="Hours by Department"
              subtitle="Distribution of total hours across departments"
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentHoursData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine
                  >
                    {departmentHoursData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatHoursMinutes(Number(value)), 'Hours']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: Attendance ==================== */}
      {activeTab === 1 && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Late Arrivals</p>
                  <p className="text-2xl font-bold text-[#0a1f44]">{attendanceStats.lateCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Attendance Rate</p>
                  <p className="text-2xl font-bold text-[#0a1f44]">
                    {attendanceStats.avgAttendance}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <ChartCard
            title="Attendance Heatmap"
            subtitle="Hours worked per employee per day (last 14 days)"
          >
            <div className="overflow-x-auto">
              {/* Date headers */}
              <div className="flex">
                <div className="w-28 flex-shrink-0" />
                {heatmapData[0]?.dates.map((d, i) => (
                  <div
                    key={i}
                    className="w-9 flex-shrink-0 text-center text-[10px] text-gray-500 pb-1"
                  >
                    {format(d, 'M/d')}
                  </div>
                ))}
              </div>
              {/* Rows */}
              {heatmapData.map((row) => (
                <div key={row.employee.id} className="flex items-center">
                  <div className="w-28 flex-shrink-0 text-xs text-gray-700 truncate pr-2 py-0.5">
                    {row.employee.lastName}
                  </div>
                  {row.days.map((hours, i) => (
                    <div
                      key={i}
                      className={`w-8 h-7 m-0.5 rounded-sm flex-shrink-0 ${heatmapColor(hours)}`}
                      title={`${row.employee.firstName} ${row.employee.lastName} - ${format(row.dates[i], 'MMM d')}: ${formatHoursMinutes(hours)}`}
                    />
                  ))}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
                <span>Less</span>
                <div className="w-5 h-4 rounded-sm bg-gray-100" />
                <div className="w-5 h-4 rounded-sm bg-amber-200" />
                <div className="w-5 h-4 rounded-sm bg-green-300" />
                <div className="w-5 h-4 rounded-sm bg-green-500" />
                <div className="w-5 h-4 rounded-sm bg-red-400" />
                <span>More</span>
              </div>
            </div>
          </ChartCard>

          {/* Average start time */}
          <ChartCard
            title="Average Start Time by Employee"
            subtitle="Decimal hours (e.g. 7.5 = 7:30 AM)"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={avgStartTimeData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={[4, 10]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{
                    value: 'Hour (decimal)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#6b7280', fontSize: 12 },
                  }}
                />
                <Tooltip
                  formatter={(value) => [formatDecimalTime(Number(value)), 'Avg Start']}
                />
                <ReferenceLine y={7} stroke={RED} strokeDasharray="3 3" label={{ value: '7:00 AM', fill: RED, fontSize: 10 }} />
                <Bar dataKey="avgStart" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ==================== TAB 3: Labor Costs ==================== */}
      {activeTab === 2 && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-50">
                  <TrendingUp className="w-5 h-5 text-[#f89020]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Cost / Hour</p>
                  <p className="text-2xl font-bold text-[#0a1f44]">
                    {formatCurrency(costStats.avgCostPerHour)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total OT Cost</p>
                  <p className="text-2xl font-bold text-[#0a1f44]">
                    {formatCurrency(costStats.totalOtCost)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Labor cost by project (horizontal bars) */}
            <ChartCard
              title="Labor Cost by Project"
              subtitle="Total labor cost allocated to each project"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={laborCostByProject}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    width={150}
                  />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Cost']} />
                  <Bar dataKey="cost" fill={PRIMARY} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Weekly payroll trend */}
            <ChartCard
              title="Weekly Payroll Trend"
              subtitle="Total payroll cost per week (last 12 weeks)"
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={weeklyPayrollTrend}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    interval={1}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Payroll']} />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke={PRIMARY}
                    strokeWidth={2}
                    dot={{ r: 3, fill: PRIMARY }}
                    activeDot={{ r: 5, fill: PRIMARY }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* OT breakdown table */}
          <ChartCard title="Overtime Cost Breakdown" subtitle="Per-employee overtime details">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-2 font-semibold text-[#0a1f44]">Employee</th>
                    <th className="pb-2 font-semibold text-[#0a1f44]">Department</th>
                    <th className="pb-2 font-semibold text-[#0a1f44] text-right">OT Hours</th>
                    <th className="pb-2 font-semibold text-[#0a1f44] text-right">OT Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {overtimeBreakdown.map((row) => (
                    <tr
                      key={row.name}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 text-gray-700">{row.name}</td>
                      <td className="py-2 text-gray-500">{row.department}</td>
                      <td className="py-2 text-right text-gray-700">
                        {formatHoursMinutes(row.otHours)}
                      </td>
                      <td className="py-2 text-right font-medium text-red-600">
                        {formatCurrency(row.otCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      )}

      {/* ==================== TAB 4: Projects ==================== */}
      {activeTab === 3 && (
        <div className="space-y-6">
          {/* Horizontal bar chart: hours per project */}
          <ChartCard
            title="Hours per Project"
            subtitle="Total hours allocated to each project"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={projectBarData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ value: 'Hours', position: 'insideBottom', offset: -2, style: { fill: '#6b7280', fontSize: 12 } }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  width={150}
                />
                <Tooltip formatter={(value) => [formatHoursMinutes(Number(value)), 'Hours']} />
                <Bar dataKey="hours" fill={PRIMARY} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Sortable project table */}
          <ChartCard title="Project Allocation Details" subtitle="Click column headers to sort">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th
                      className="pb-2 font-semibold text-[#0a1f44] cursor-pointer select-none"
                      onClick={() => toggleProjectSort('name')}
                    >
                      Project <SortIcon sortKey="name" />
                    </th>
                    <th
                      className="pb-2 font-semibold text-[#0a1f44] text-right cursor-pointer select-none"
                      onClick={() => toggleProjectSort('hours')}
                    >
                      Total Hours <SortIcon sortKey="hours" />
                    </th>
                    <th
                      className="pb-2 font-semibold text-[#0a1f44] text-right cursor-pointer select-none"
                      onClick={() => toggleProjectSort('employees')}
                    >
                      # Employees <SortIcon sortKey="employees" />
                    </th>
                    <th
                      className="pb-2 font-semibold text-[#0a1f44] text-right cursor-pointer select-none"
                      onClick={() => toggleProjectSort('avgHours')}
                    >
                      Avg Hrs/Employee <SortIcon sortKey="avgHours" />
                    </th>
                    <th
                      className="pb-2 font-semibold text-[#0a1f44] text-right cursor-pointer select-none"
                      onClick={() => toggleProjectSort('cost')}
                    >
                      Est. Cost <SortIcon sortKey="cost" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProjectAllocation.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2.5 text-gray-700 font-medium">{row.name}</td>
                      <td className="py-2.5 text-right text-gray-700">
                        {formatHoursMinutes(row.hours)}
                      </td>
                      <td className="py-2.5 text-right text-gray-600">{row.employeeCount}</td>
                      <td className="py-2.5 text-right text-gray-600">
                        {formatHoursMinutes(row.avgHours)}
                      </td>
                      <td className="py-2.5 text-right font-medium text-[#0a1f44]">
                        {formatCurrency(row.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      )}

      {/* ==================== TAB 5: Employees ==================== */}
      {activeTab === 4 && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees by name..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f89020]/30 focus:border-[#f89020]"
            />
          </div>

          {/* Employee table */}
          <ChartCard title="Employee Overview" subtitle="Click a row to view details">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-2 font-semibold text-[#0a1f44]">Name</th>
                    <th className="pb-2 font-semibold text-[#0a1f44]">Department</th>
                    <th className="pb-2 font-semibold text-[#0a1f44] text-right">Avg Hrs/Day</th>
                    <th className="pb-2 font-semibold text-[#0a1f44] text-right">Total Hours</th>
                    <th className="pb-2 font-semibold text-[#0a1f44] text-right">OT Hours</th>
                    <th className="pb-2 font-semibold text-[#0a1f44] text-right">Punctuality</th>
                    <th className="pb-2 font-semibold text-[#0a1f44] text-right">Total Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((row) => {
                    const isSelected = selectedEmployeeId === row.employee.id;
                    return (
                      <tr
                        key={row.employee.id}
                        onClick={() =>
                          setSelectedEmployeeId(
                            isSelected ? null : row.employee.id
                          )
                        }
                        className={`border-b border-gray-100 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#f89020]/10 border-[#f89020]/20'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-2.5 font-medium text-gray-800">
                          {row.employee.firstName} {row.employee.lastName}
                        </td>
                        <td className="py-2.5 text-gray-600">{row.employee.department}</td>
                        <td className="py-2.5 text-right text-gray-700">
                          {row.avgHoursPerDay}h
                        </td>
                        <td className="py-2.5 text-right text-gray-700">
                          {formatHoursMinutes(row.totalHours)}
                        </td>
                        <td className="py-2.5 text-right text-red-600">
                          {formatHoursMinutes(row.otHours)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`${
                              row.punctuality >= 95
                                ? 'text-green-600'
                                : row.punctuality >= 85
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}
                          >
                            {row.punctuality}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-medium text-[#0a1f44]">
                          {formatCurrency(row.totalPay)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Employee detail panel */}
          {selectedEmployeeDetail && (
            <ChartCard
              title={`${selectedEmployeeDetail.employee.firstName} ${selectedEmployeeDetail.employee.lastName}`}
              subtitle={`${selectedEmployeeDetail.employee.department} - ${selectedEmployeeDetail.employee.role}`}
            >
              <div className="space-y-5">
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Avg Hours/Day</p>
                    <p className="text-lg font-bold text-[#0a1f44]">
                      {selectedEmployeeDetail.avgHoursPerDay}h
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Avg Hours/Week</p>
                    <p className="text-lg font-bold text-[#0a1f44]">
                      {selectedEmployeeDetail.avgHoursWeek}h
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">OT Frequency</p>
                    <p className="text-lg font-bold text-red-600">
                      {selectedEmployeeDetail.otFrequency}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Total Earnings</p>
                    <p className="text-lg font-bold text-[#0a1f44]">
                      {formatCurrency(selectedEmployeeDetail.totalPay)}
                    </p>
                  </div>
                </div>

                {/* Sparkline */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Daily Hours (Last 14 Days)
                  </p>
                  <ResponsiveContainer width={200} height={60}>
                    <LineChart data={selectedEmployeeDetail.sparkline}>
                      <Line
                        type="monotone"
                        dataKey="hours"
                        stroke={PRIMARY}
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Tooltip
                        formatter={(value) => [
                          formatHoursMinutes(Number(value)),
                          'Hours',
                        ]}
                        labelFormatter={(label) => label}
                        contentStyle={{ fontSize: 11 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Last 10 entries */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Recent Clock Entries
                  </p>
                  <div className="space-y-1">
                    {selectedEmployeeDetail.lastEntries.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs py-1.5 px-3 rounded-md bg-gray-50"
                      >
                        <span className="text-gray-600 w-24">{entry.date}</span>
                        <span className="text-green-700 font-medium w-20 text-center">
                          {entry.clockIn}
                        </span>
                        <span className="text-gray-400 mx-1">-</span>
                        <span
                          className={`font-medium w-20 text-center ${
                            entry.clockOut === 'Active'
                              ? 'text-[#f89020]'
                              : 'text-red-600'
                          }`}
                        >
                          {entry.clockOut}
                        </span>
                        <span className="text-[#0a1f44] font-semibold w-14 text-right">
                          {entry.hours}h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}
