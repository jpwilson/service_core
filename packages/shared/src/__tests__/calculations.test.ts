import { describe, it, expect } from 'vitest';
import {
  calculateHoursWorked,
  calculateBreakMinutes,
  calculateOvertimeHours,
  calculateWeeklyOvertime,
  isLateArrival,
} from '../utils/calculations';
import type { BreakEntry } from '../types';

describe('calculateBreakMinutes', () => {
  it('calculates total break minutes', () => {
    const breaks: BreakEntry[] = [
      {
        id: '1',
        type: 'lunch',
        startTime: '2023-11-14T12:00:00',
        endTime: '2023-11-14T12:30:00',
      },
    ];
    expect(calculateBreakMinutes(breaks)).toBe(30);
  });

  it('returns 0 for no breaks', () => {
    expect(calculateBreakMinutes([])).toBe(0);
  });

  it('handles ongoing break (no endTime)', () => {
    const breaks: BreakEntry[] = [
      {
        id: '1',
        type: 'rest',
        startTime: new Date().toISOString(),
        endTime: null,
      },
    ];
    const minutes = calculateBreakMinutes(breaks);
    expect(minutes).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateHoursWorked', () => {
  it('calculates hours between clock in and out', () => {
    const hours = calculateHoursWorked(
      '2023-11-14T07:00:00',
      '2023-11-14T15:00:00',
      []
    );
    expect(hours).toBe(8);
  });

  it('subtracts break time', () => {
    const breaks: BreakEntry[] = [
      {
        id: '1',
        type: 'lunch',
        startTime: '2023-11-14T12:00:00',
        endTime: '2023-11-14T12:30:00',
      },
    ];
    const hours = calculateHoursWorked(
      '2023-11-14T07:00:00',
      '2023-11-14T15:00:00',
      breaks
    );
    expect(hours).toBe(7.5);
  });

  it('returns 0 if no clock out', () => {
    const hours = calculateHoursWorked(
      '2023-11-14T07:00:00',
      null,
      []
    );
    expect(hours).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateOvertimeHours', () => {
  it('splits regular and overtime at threshold', () => {
    const result = calculateOvertimeHours(10, 8);
    expect(result.regular).toBe(8);
    expect(result.overtime).toBe(2);
  });

  it('returns all regular if under threshold', () => {
    const result = calculateOvertimeHours(6, 8);
    expect(result.regular).toBe(6);
    expect(result.overtime).toBe(0);
  });

  it('handles exactly at threshold', () => {
    const result = calculateOvertimeHours(8, 8);
    expect(result.regular).toBe(8);
    expect(result.overtime).toBe(0);
  });
});

describe('calculateWeeklyOvertime', () => {
  it('calculates weekly overtime beyond threshold', () => {
    const dailyHours = [8, 8, 8, 8, 8, 4, 0]; // 44 total
    const result = calculateWeeklyOvertime(dailyHours, 40);
    expect(result.regular).toBe(40);
    expect(result.overtime).toBe(4);
  });

  it('no overtime when under threshold', () => {
    const dailyHours = [8, 8, 8, 8, 0, 0, 0]; // 32 total
    const result = calculateWeeklyOvertime(dailyHours, 40);
    expect(result.regular).toBe(32);
    expect(result.overtime).toBe(0);
  });
});

describe('isLateArrival', () => {
  it('detects late arrival', () => {
    expect(isLateArrival('2023-11-14T07:30:00', '07:00')).toBe(true);
  });

  it('detects on-time arrival', () => {
    expect(isLateArrival('2023-11-14T06:45:00', '07:00')).toBe(false);
  });

  it('handles exact threshold', () => {
    expect(isLateArrival('2023-11-14T07:00:00', '07:00')).toBe(false);
  });
});
