import { parseISO, differenceInMinutes, startOfDay, addDays, isWithinInterval } from 'date-fns';
import type { BreakEntry, Employee, TimeEntry, PayrollSummary } from '../types';

export function calculateBreakMinutes(breaks: BreakEntry[]): number {
  return breaks.reduce((total, brk) => {
    if (!brk.startTime) return total;
    const start = parseISO(brk.startTime);
    const end = brk.endTime ? parseISO(brk.endTime) : new Date();
    return total + differenceInMinutes(end, start);
  }, 0);
}

export function calculateHoursWorked(
  clockIn: string,
  clockOut: string | null,
  breaks: BreakEntry[]
): number {
  const start = parseISO(clockIn);
  const end = clockOut ? parseISO(clockOut) : new Date();
  const totalMinutes = differenceInMinutes(end, start);
  const breakMins = calculateBreakMinutes(breaks);
  return Math.max(0, (totalMinutes - breakMins) / 60);
}

export function calculateOvertimeHours(
  regularHours: number,
  dailyThreshold: number
): { regular: number; overtime: number } {
  if (regularHours <= dailyThreshold) {
    return { regular: regularHours, overtime: 0 };
  }
  return {
    regular: dailyThreshold,
    overtime: regularHours - dailyThreshold,
  };
}

export function calculateWeeklyOvertime(
  dailyHours: number[],
  weeklyThreshold: number
): { regular: number; overtime: number; doubleTime: number } {
  const totalHours = dailyHours.reduce((sum, h) => sum + h, 0);

  if (totalHours <= weeklyThreshold) {
    return { regular: totalHours, overtime: 0, doubleTime: 0 };
  }

  return {
    regular: weeklyThreshold,
    overtime: totalHours - weeklyThreshold,
    doubleTime: 0,
  };
}

export function calculatePayroll(
  employee: Employee,
  regularHours: number,
  overtimeHours: number,
  doubleTimeHours: number
): PayrollSummary {
  const regularPay = regularHours * employee.hourlyRate;
  const overtimePay = overtimeHours * employee.overtimeRate;
  const doubleTimePay = doubleTimeHours * employee.doubleTimeRate;

  return {
    employeeId: employee.id,
    regularHours,
    overtimeHours,
    doubleTimeHours,
    regularPay,
    overtimePay,
    doubleTimePay,
    totalPay: regularPay + overtimePay + doubleTimePay,
  };
}

export function calculateAttendanceRate(
  entries: TimeEntry[],
  totalWorkdays: number
): number {
  if (totalWorkdays === 0) return 0;
  const daysPresent = entries.length;
  return Math.min(100, (daysPresent / totalWorkdays) * 100);
}

export function getWeeklyHours(entries: TimeEntry[], weekStart: Date): number[] {
  const dailyTotals: number[] = [0, 0, 0, 0, 0, 0, 0];

  for (const entry of entries) {
    const clockInDate = parseISO(entry.clockIn);
    for (let i = 0; i < 7; i++) {
      const dayStart = startOfDay(addDays(weekStart, i));
      const dayEnd = startOfDay(addDays(weekStart, i + 1));
      if (isWithinInterval(clockInDate, { start: dayStart, end: dayEnd })) {
        dailyTotals[i] += calculateHoursWorked(
          entry.clockIn,
          entry.clockOut,
          entry.breaks
        );
        break;
      }
    }
  }

  return dailyTotals;
}

export function isLateArrival(clockIn: string, threshold: string = '07:00'): boolean {
  const clockInDate = parseISO(clockIn);
  const [thresholdHours, thresholdMinutes] = threshold.split(':').map(Number);
  const thresholdDate = startOfDay(clockInDate);
  thresholdDate.setHours(thresholdHours, thresholdMinutes, 0, 0);
  return clockInDate > thresholdDate;
}
