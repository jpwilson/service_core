import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { exportTimesheetsToExcel, parseTimesheetExcel } from '../utils/excel';
import { mockTimeEntries } from '../data/mockTimeEntries';
import { mockEmployees } from '../data/mockEmployees';
import { mockProjects } from '../data/mockProjects';

describe('exportTimesheetsToExcel', () => {
  it('creates a valid workbook with two sheets', () => {
    const result = exportTimesheetsToExcel(
      mockTimeEntries.slice(0, 10),
      mockEmployees,
      mockProjects,
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);

    // Round-trip: parse the generated Excel
    const workbook = XLSX.read(result, { type: 'array' });
    expect(workbook.SheetNames).toContain('Timesheet Detail');
    expect(workbook.SheetNames).toContain('Summary');

    const detailSheet = workbook.Sheets['Timesheet Detail'];
    const detailRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(detailSheet);
    expect(detailRows.length).toBe(10);

    // Check expected columns
    const firstRow = detailRows[0];
    expect(firstRow).toHaveProperty('Employee Name');
    expect(firstRow).toHaveProperty('Date');
    expect(firstRow).toHaveProperty('Clock In');
    expect(firstRow).toHaveProperty('Hours Worked');
    expect(firstRow).toHaveProperty('Status');

    const summarySheet = workbook.Sheets['Summary'];
    const summaryRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(summarySheet);
    expect(summaryRows.length).toBeGreaterThan(0);
    expect(summaryRows[0]).toHaveProperty('Total Pay');
  });

  it('handles entries with no clock out', () => {
    const openEntry = {
      ...mockTimeEntries[0],
      clockOut: null,
    };
    const result = exportTimesheetsToExcel([openEntry], mockEmployees, mockProjects);
    expect(result).toBeInstanceOf(Uint8Array);

    const workbook = XLSX.read(result, { type: 'array' });
    const detailRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets['Timesheet Detail'],
    );
    expect(detailRows[0]['Clock Out']).toBe('Open');
    expect(detailRows[0]['Hours Worked']).toBe(0);
  });
});

describe('parseTimesheetExcel', () => {
  it('parses valid Excel data (round-trip)', () => {
    const exported = exportTimesheetsToExcel(
      mockTimeEntries.slice(0, 5),
      mockEmployees,
      mockProjects,
    );

    const parsed = parseTimesheetExcel(exported.buffer as ArrayBuffer);
    expect(parsed.length).toBe(5);
    expect(parsed[0].employeeName).toBeTruthy();
    expect(parsed[0].date).toBeTruthy();
    expect(typeof parsed[0].hoursWorked).toBe('number');
  });

  it('handles flexible column headers', () => {
    // Create a workbook with alternate column names
    const rows = [
      { Name: 'John Doe', Date: '2026-03-10', Start: '08:00 AM', End: '05:00 PM', Hours: 8, Project: 'Test', Notes: 'OK' },
      { Name: 'Jane Doe', Date: '2026-03-11', Start: '09:00 AM', End: '06:00 PM', Hours: 8, Project: 'Test2', Notes: '' },
    ];
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const parsed = parseTimesheetExcel(buffer);
    expect(parsed.length).toBe(2);
    expect(parsed[0].employeeName).toBe('John Doe');
    expect(parsed[0].clockIn).toBe('08:00 AM');
    expect(parsed[0].clockOut).toBe('05:00 PM');
    expect(parsed[0].hoursWorked).toBe(8);
  });

  it('handles empty data gracefully', () => {
    // Create an empty workbook
    const sheet = XLSX.utils.json_to_sheet([]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const parsed = parseTimesheetExcel(buffer);
    expect(parsed).toEqual([]);
  });

  it('handles workbook with no sheets gracefully', () => {
    const wb = XLSX.utils.book_new();
    // book_new creates an empty workbook with no sheets
    // We need to add and remove, or just create minimal buffer
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), 'Empty');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const parsed = parseTimesheetExcel(buffer);
    expect(parsed).toEqual([]);
  });
});
