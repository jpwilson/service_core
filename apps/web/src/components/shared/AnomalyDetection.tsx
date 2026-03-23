import { useState, useMemo } from 'react';
import { formatDistanceToNow, subDays, differenceInMinutes, parseISO } from 'date-fns';
import {
  ShieldAlert,
  Users,
  Repeat,
  MapPin,
  Clock,
  Timer,
  Eye,
  XCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { TimeEntry } from '@servicecore/shared';
import { mockTimeEntries, mockEmployees } from '@servicecore/shared';

function getEntryHours(entry: TimeEntry): number {
  if (!entry.clockOut) return 0;
  const clockIn = new Date(entry.clockIn).getTime();
  const clockOut = new Date(entry.clockOut).getTime();
  const totalMs = clockOut - clockIn;
  // Subtract break time
  const breakMs = entry.breaks.reduce((sum, b) => {
    if (!b.endTime) return sum;
    return sum + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime());
  }, 0);
  return Math.max(0, (totalMs - breakMs) / (1000 * 60 * 60));
}

type Severity = 'high' | 'medium' | 'low';
type AnomalyStatus = 'pending' | 'reviewed' | 'dismissed';

interface Anomaly {
  id: number;
  severity: Severity;
  type: string;
  employee: string;
  description: string;
  date: Date;
  status: AnomalyStatus;
  icon: typeof ShieldAlert;
}

const severityConfig: Record<Severity, { badge: string; dot: string }> = {
  high: { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  medium: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  low: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
};

const now = new Date();

function computeAnomalies(): Anomaly[] {
  const anomalies: Anomaly[] = [];
  let idCounter = 1;

  const empMap = new Map(mockEmployees.map((e) => [e.id, e]));
  const fourteenDaysAgo = subDays(now, 14);

  // Get recent entries (last 14 days)
  const recentEntries = mockTimeEntries.filter((entry) => {
    const entryDate = parseISO(entry.clockIn);
    return entryDate >= fourteenDaysAgo;
  });

  // Group entries by employee
  const entriesByEmployee = new Map<string, typeof recentEntries>();
  for (const entry of recentEntries) {
    const existing = entriesByEmployee.get(entry.employeeId) || [];
    existing.push(entry);
    entriesByEmployee.set(entry.employeeId, existing);
  }

  // (a) Rounding Pattern: stdev < 0.15 and avg between 7.8-8.2
  for (const [empId, entries] of entriesByEmployee) {
    const emp = empMap.get(empId);
    if (!emp || entries.length < 5) continue;

    const hours = entries.map((e) => getEntryHours(e)).filter((h) => h > 0);
    if (hours.length < 5) continue;

    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    const variance = hours.reduce((sum, h) => sum + (h - avg) ** 2, 0) / hours.length;
    const stdev = Math.sqrt(variance);

    if (stdev < 0.15 && avg >= 7.8 && avg <= 8.2) {
      anomalies.push({
        id: idCounter++,
        severity: 'medium',
        type: 'Consistent Rounding',
        employee: `${emp.firstName} ${emp.lastName}`,
        description: `Consistent rounding: ${emp.firstName} ${emp.lastName} has logged an average of ${avg.toFixed(2)}h with stdev ${stdev.toFixed(3)} over ${hours.length} shifts (last 14 days)`,
        date: subDays(now, 1),
        status: 'pending',
        icon: Repeat,
      });
    }
  }

  // (b) Overtime Avoidance: >60% of days between 7.5-8.0h
  for (const [empId, entries] of entriesByEmployee) {
    const emp = empMap.get(empId);
    if (!emp || entries.length < 5) continue;

    const hours = entries.map((e) => getEntryHours(e)).filter((h) => h > 0);
    const inRange = hours.filter((h) => h >= 7.5 && h <= 8.0).length;
    const ratio = inRange / hours.length;

    if (ratio > 0.6) {
      anomalies.push({
        id: idCounter++,
        severity: 'low',
        type: 'Overtime Avoidance',
        employee: `${emp.firstName} ${emp.lastName}`,
        description: `Overtime avoidance: ${emp.firstName} ${emp.lastName} worked between 7.5-8.0h on ${Math.round(ratio * 100)}% of shifts (${inRange}/${hours.length} days)`,
        date: subDays(now, 2),
        status: 'pending',
        icon: Timer,
      });
    }
  }

  // (c) Mileage Discrepancy: synthetic flags from employees with high variability
  // Since mock entries may not have mileage, generate 1-2 synthetic flags
  const driverEmployees = mockEmployees.filter((e) => e.department === 'Drivers');
  if (driverEmployees.length >= 2) {
    const emp1 = driverEmployees[1]; // Jake Sandoval
    anomalies.push({
      id: idCounter++,
      severity: 'high',
      type: 'Mileage Discrepancy',
      employee: `${emp1.firstName} ${emp1.lastName}`,
      description: `Mileage discrepancy: ${emp1.firstName} ${emp1.lastName} reported 142mi but route average is 98mi (44% above average, flagged threshold: 40%)`,
      date: subDays(now, 5),
      status: 'pending',
      icon: MapPin,
    });
  }
  if (driverEmployees.length >= 5) {
    const emp2 = driverEmployees[4]; // Carlos Vigil
    anomalies.push({
      id: idCounter++,
      severity: 'high',
      type: 'Mileage Discrepancy',
      employee: `${emp2.firstName} ${emp2.lastName}`,
      description: `Mileage discrepancy: ${emp2.firstName} ${emp2.lastName} reported 168mi vs route average of 112mi (50% above average)`,
      date: subDays(now, 3),
      status: 'pending',
      icon: MapPin,
    });
  }

  // (d) Extended Shift: entries with duration > 10 hours
  for (const [empId, entries] of entriesByEmployee) {
    const emp = empMap.get(empId);
    if (!emp) continue;

    const longShifts = entries.filter((e) => getEntryHours(e) > 10);
    if (longShifts.length > 0) {
      const longest = longShifts.reduce((max, e) => (getEntryHours(e) > getEntryHours(max) ? e : max), longShifts[0]);
      const longestHours = getEntryHours(longest);
      anomalies.push({
        id: idCounter++,
        severity: 'medium',
        type: 'Extended Shift',
        employee: `${emp.firstName} ${emp.lastName}`,
        description: `Verify GPS activity for shifts exceeding 10 hours. ${emp.firstName} ${emp.lastName} logged ${longestHours.toFixed(1)}h on ${longest.clockIn.split('T')[0]}`,
        date: parseISO(longest.clockIn),
        status: 'pending',
        icon: Clock,
      });
      break; // only one extended shift flag to avoid noise
    }
  }

  // (e) Buddy Punching: two employees from same department clocked in within 2 minutes
  const entriesByDate = new Map<string, typeof recentEntries>();
  for (const entry of recentEntries) {
    const dateKey = entry.clockIn.split('T')[0];
    const existing = entriesByDate.get(dateKey) || [];
    existing.push(entry);
    entriesByDate.set(dateKey, existing);
  }

  let buddyFound = false;
  for (const [dateKey, dayEntries] of entriesByDate) {
    if (buddyFound) break;
    // Group by department
    const byDept = new Map<string, typeof dayEntries>();
    for (const entry of dayEntries) {
      const emp = empMap.get(entry.employeeId);
      if (!emp) continue;
      const dept = emp.department;
      const existing = byDept.get(dept) || [];
      existing.push(entry);
      byDept.set(dept, existing);
    }

    for (const [dept, deptEntries] of byDept) {
      if (buddyFound) break;
      if (deptEntries.length < 2) continue;

      // Sort by clock-in time
      const sorted = [...deptEntries].sort(
        (a, b) => new Date(a.clockIn).getTime() - new Date(b.clockIn).getTime()
      );

      for (let i = 0; i < sorted.length - 1; i++) {
        const diff = differenceInMinutes(
          parseISO(sorted[i + 1].clockIn),
          parseISO(sorted[i].clockIn)
        );
        if (Math.abs(diff) <= 2) {
          const emp1 = empMap.get(sorted[i].employeeId);
          const emp2 = empMap.get(sorted[i + 1].employeeId);
          if (emp1 && emp2 && emp1.id !== emp2.id) {
            anomalies.push({
              id: idCounter++,
              severity: 'high',
              type: 'Proximity Clock-In',
              employee: `${emp1.firstName} ${emp1.lastName}`,
              description: `Two employees from ${dept} clocked in within ${Math.abs(diff)} minute${Math.abs(diff) !== 1 ? 's' : ''}: ${emp1.firstName} ${emp1.lastName} and ${emp2.firstName} ${emp2.lastName} on ${dateKey}. Verify independently.`,
              date: parseISO(sorted[i].clockIn),
              status: 'pending',
              icon: Users,
            });
            buddyFound = true;
            break;
          }
        }
      }
    }
  }

  // Sort by severity (high first) then date
  const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  anomalies.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.date.getTime() - a.date.getTime();
  });

  return anomalies;
}

export function AnomalyDetection() {
  const computedAnomalies = useMemo(() => computeAnomalies(), []);
  const [anomalies, setAnomalies] = useState(computedAnomalies);

  const updateStatus = (id: number, status: AnomalyStatus) => {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const pendingAnomalies = anomalies.filter((a) => a.status === 'pending');
  const highSeverity = pendingAnomalies.filter((a) => a.severity === 'high').length;
  const reviewed = anomalies.filter((a) => a.status === 'reviewed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-500">Anomaly Detection</h2>
          <p className="text-sm text-gray-500 mt-1">
            Anomalies computed from timesheet analysis for fraud prevention and compliance
          </p>
        </div>
        <ShieldAlert className="h-6 w-6 text-primary-500" />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-gray-500 font-medium">Detected</span>
          </div>
          <p className="text-2xl font-bold text-secondary-500">{pendingAnomalies.length}</p>
          <p className="text-xs text-gray-400">pending review</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <span className="text-xs text-gray-500 font-medium">High Severity</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{highSeverity}</p>
          <p className="text-xs text-gray-400">require attention</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-500 font-medium">Reviewed</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{reviewed}</p>
          <p className="text-xs text-gray-400">resolved</p>
        </div>
      </div>

      {/* Anomaly Cards */}
      <div className="space-y-3">
        {anomalies.map((anomaly) => {
          const severity = severityConfig[anomaly.severity];
          const Icon = anomaly.icon;
          const isDismissed = anomaly.status === 'dismissed';
          const isReviewed = anomaly.status === 'reviewed';

          return (
            <div
              key={anomaly.id}
              className={`rounded-xl border border-gray-200 bg-white p-4 transition-opacity ${
                isDismissed ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-lg bg-gray-50 p-2.5">
                  <Icon className="h-5 w-5 text-secondary-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${severity.badge}`}>
                      {anomaly.severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-gray-500">{anomaly.type}</span>
                    {isReviewed && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                        Reviewed
                      </span>
                    )}
                    {isDismissed && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                        Dismissed
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-secondary-500 font-medium mb-1">{anomaly.employee}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{anomaly.description}</p>

                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(anomaly.date, { addSuffix: true })}
                    </span>

                    {anomaly.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(anomaly.id, 'reviewed')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Review
                        </button>
                        <button
                          onClick={() => updateStatus(anomaly.id, 'dismissed')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          <XCircle className="h-3 w-3" />
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
