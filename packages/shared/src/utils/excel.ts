import * as XLSX from 'xlsx';
import { parseISO, format, differenceInMinutes } from 'date-fns';
import type { TimeEntry, Employee, Project } from '../types';

export interface ParsedTimesheetRow {
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  hoursWorked: number;
  project: string;
  notes: string;
}

export function exportTimesheetsToExcel(
  entries: TimeEntry[],
  employees: Employee[],
  projects: Project[],
): Uint8Array {
  const employeeMap = new Map(employees.map((e) => [e.id, e]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // --- Sheet 1: Timesheet Detail ---
  const detailRows = entries.map((entry) => {
    const emp = employeeMap.get(entry.employeeId);
    const proj = entry.projectId ? projectMap.get(entry.projectId) : null;

    const clockIn = parseISO(entry.clockIn);
    const clockOut = entry.clockOut ? parseISO(entry.clockOut) : null;

    const breakMinutes = entry.breaks.reduce((total, brk) => {
      if (!brk.startTime) return total;
      const bStart = parseISO(brk.startTime);
      const bEnd = brk.endTime ? parseISO(brk.endTime) : new Date();
      return total + differenceInMinutes(bEnd, bStart);
    }, 0);

    const totalMinutes = clockOut ? differenceInMinutes(clockOut, clockIn) : 0;
    const hoursWorked = Math.round(Math.max(0, (totalMinutes - breakMinutes) / 60) * 100) / 100;

    return {
      'Employee Name': emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      'Date': format(clockIn, 'yyyy-MM-dd'),
      'Clock In': format(clockIn, 'hh:mm a'),
      'Clock Out': clockOut ? format(clockOut, 'hh:mm a') : 'Open',
      'Hours Worked': hoursWorked,
      'Break Minutes': breakMinutes,
      'Project': proj ? proj.name : 'N/A',
      'Notes': entry.notes || '',
      'Status': entry.status,
    };
  });

  const detailSheet = XLSX.utils.json_to_sheet(detailRows);

  // --- Sheet 2: Summary (per employee) ---
  const summaryMap = new Map<
    string,
    { regularHours: number; overtimeHours: number }
  >();

  for (const entry of entries) {
    const clockIn = parseISO(entry.clockIn);
    const clockOut = entry.clockOut ? parseISO(entry.clockOut) : null;
    if (!clockOut) continue;

    const breakMinutes = entry.breaks.reduce((total, brk) => {
      if (!brk.startTime) return total;
      const bStart = parseISO(brk.startTime);
      const bEnd = brk.endTime ? parseISO(brk.endTime) : new Date();
      return total + differenceInMinutes(bEnd, bStart);
    }, 0);

    const totalMinutes = differenceInMinutes(clockOut, clockIn);
    const hoursWorked = Math.max(0, (totalMinutes - breakMinutes) / 60);

    const existing = summaryMap.get(entry.employeeId) || {
      regularHours: 0,
      overtimeHours: 0,
    };

    const dailyThreshold = 8;
    if (hoursWorked > dailyThreshold) {
      existing.regularHours += dailyThreshold;
      existing.overtimeHours += hoursWorked - dailyThreshold;
    } else {
      existing.regularHours += hoursWorked;
    }

    summaryMap.set(entry.employeeId, existing);
  }

  const summaryRows = employees
    .filter((emp) => summaryMap.has(emp.id))
    .map((emp) => {
      const data = summaryMap.get(emp.id)!;
      const regularPay = Math.round(data.regularHours * emp.hourlyRate * 100) / 100;
      const otPay = Math.round(data.overtimeHours * emp.overtimeRate * 100) / 100;

      return {
        'Employee Name': `${emp.firstName} ${emp.lastName}`,
        'Department': emp.department,
        'Total Regular Hours': Math.round(data.regularHours * 100) / 100,
        'Total Overtime Hours': Math.round(data.overtimeHours * 100) / 100,
        'Hourly Rate': emp.hourlyRate,
        'Regular Pay': regularPay,
        'OT Pay': otPay,
        'Total Pay': Math.round((regularPay + otPay) * 100) / 100,
      };
    });

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

  // --- Build workbook ---
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Timesheet Detail');
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(output);
}

export function parseTimesheetExcel(data: ArrayBuffer): ParsedTimesheetRow[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  if (!rawRows || rawRows.length === 0) return [];

  return rawRows.map((row) => {
    return {
      employeeName: String(findValue(row, ['Employee Name', 'Employee', 'Name']) ?? ''),
      date: String(findValue(row, ['Date']) ?? ''),
      clockIn: String(findValue(row, ['Clock In', 'Start', 'Start Time', 'ClockIn']) ?? ''),
      clockOut: String(findValue(row, ['Clock Out', 'End', 'End Time', 'ClockOut']) ?? ''),
      hoursWorked: parseFloat(String(findValue(row, ['Hours Worked', 'Hours', 'Total Hours']) ?? '0')) || 0,
      project: String(findValue(row, ['Project', 'Project Name']) ?? ''),
      notes: String(findValue(row, ['Notes', 'Note', 'Comments']) ?? ''),
    };
  });
}

function findValue(
  row: Record<string, unknown>,
  candidates: string[],
): unknown | undefined {
  for (const key of candidates) {
    if (row[key] !== undefined) return row[key];
  }
  // Case-insensitive fallback
  const rowKeys = Object.keys(row);
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    const match = rowKeys.find((k) => k.toLowerCase() === lower);
    if (match && row[match] !== undefined) return row[match];
  }
  return undefined;
}
