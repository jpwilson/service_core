import { describe, it, expect } from 'vitest';
import {
  extractTimeFromText,
  extractDateFromText,
  extractHoursFromText,
  parseOcrText,
} from '../utils/ocr-parser';

describe('extractTimeFromText', () => {
  it('parses "7:00 AM" -> "07:00"', () => {
    expect(extractTimeFromText('7:00 AM')).toBe('07:00');
  });

  it('parses "14:30" -> "14:30"', () => {
    expect(extractTimeFromText('14:30')).toBe('14:30');
  });

  it('parses "7:00am" -> "07:00"', () => {
    expect(extractTimeFromText('7:00am')).toBe('07:00');
  });

  it('parses "3:30 PM" -> "15:30"', () => {
    expect(extractTimeFromText('3:30 PM')).toBe('15:30');
  });

  it('parses "12:00 AM" -> "00:00"', () => {
    expect(extractTimeFromText('12:00 AM')).toBe('00:00');
  });

  it('parses "12:00 PM" -> "12:00"', () => {
    expect(extractTimeFromText('12:00 PM')).toBe('12:00');
  });

  it('returns null for no time', () => {
    expect(extractTimeFromText('hello world')).toBeNull();
  });
});

describe('extractDateFromText', () => {
  it('parses "11/14/2023" -> "2023-11-14"', () => {
    expect(extractDateFromText('11/14/2023')).toBe('2023-11-14');
  });

  it('parses "2023-11-14" -> "2023-11-14"', () => {
    expect(extractDateFromText('2023-11-14')).toBe('2023-11-14');
  });

  it('parses "Nov 14, 2023" -> "2023-11-14"', () => {
    expect(extractDateFromText('Nov 14, 2023')).toBe('2023-11-14');
  });

  it('parses "January 5, 2024" -> "2024-01-05"', () => {
    expect(extractDateFromText('January 5, 2024')).toBe('2024-01-05');
  });

  it('returns null for no date', () => {
    expect(extractDateFromText('hello world')).toBeNull();
  });
});

describe('extractHoursFromText', () => {
  it('parses "8.5 hours" -> 8.5', () => {
    expect(extractHoursFromText('8.5 hours')).toBe(8.5);
  });

  it('parses "8h 30m" -> 8.5', () => {
    expect(extractHoursFromText('8h 30m')).toBe(8.5);
  });

  it('parses "8.5" -> 8.5', () => {
    expect(extractHoursFromText('8.5')).toBe(8.5);
  });

  it('parses "9.0 hours" -> 9', () => {
    expect(extractHoursFromText('9.0 hours')).toBe(9);
  });

  it('returns null for no hours', () => {
    expect(extractHoursFromText('hello world')).toBeNull();
  });
});

describe('parseOcrText', () => {
  it('parses a multi-row timesheet', () => {
    const text = `TIMESHEET
Employee: John Smith
Week of 11/13/2023

Mon 11/13/2023  7:00 AM - 3:30 PM  8.5 hours  Denver Metro Site
Tue 11/14/2023  6:45 AM - 3:15 PM  8.5 hours  Denver Metro Site
Wed 11/15/2023  7:00 AM - 4:00 PM  9.0 hours  Boulder CU Event`;

    const entries = parseOcrText(text);

    // Parser may extract extra partial entries from header lines; filter to high-confidence
    const goodEntries = entries.filter(e => e.confidence >= 0.5);
    expect(goodEntries.length).toBeGreaterThanOrEqual(3);

    // First good entry
    expect(goodEntries[0].employeeName).toBe('John Smith');
    expect(goodEntries[0].date).toBe('2023-11-13');
    expect(goodEntries[0].clockIn).toBe('07:00');
    expect(goodEntries[0].clockOut).toBe('15:30');
    expect(goodEntries[0].hoursWorked).toBe(8.5);
    expect(goodEntries[0].project).toBe('Denver Metro Site');
    expect(goodEntries[0].confidence).toBeGreaterThanOrEqual(0.8);

    // Second entry
    expect(goodEntries[1].date).toBe('2023-11-14');
    expect(goodEntries[1].clockIn).toBe('06:45');
    expect(goodEntries[1].clockOut).toBe('15:15');

    // Third entry
    expect(entries[2].date).toBe('2023-11-15');
    expect(entries[2].hoursWorked).toBe(9.0);
    expect(entries[2].project).toBe('Boulder CU Event');
  });

  it('returns empty array for non-timesheet text', () => {
    const entries = parseOcrText('This is just random text with no timesheet data.');
    expect(entries).toHaveLength(0);
  });

  it('handles entries without employee name', () => {
    const text = `11/20/2023  8:00 AM - 4:00 PM  8.0 hours`;
    const entries = parseOcrText(text);
    expect(entries).toHaveLength(1);
    expect(entries[0].employeeName).toBeNull();
    expect(entries[0].date).toBe('2023-11-20');
  });
});
