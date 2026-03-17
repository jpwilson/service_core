import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatHoursMinutes,
  formatTime,
  formatDate,
  formatShortDate,
  getInitials,
  formatPercent,
} from '../utils/formatters';

describe('formatCurrency', () => {
  it('formats positive amounts', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats large amounts', () => {
    expect(formatCurrency(50000)).toBe('$50,000.00');
  });
});

describe('formatHoursMinutes', () => {
  it('formats whole hours', () => {
    expect(formatHoursMinutes(8)).toBe('8h 0m');
  });

  it('formats hours and minutes', () => {
    expect(formatHoursMinutes(8.5)).toBe('8h 30m');
  });

  it('formats zero', () => {
    expect(formatHoursMinutes(0)).toBe('0h 0m');
  });

  it('formats fractional hours', () => {
    expect(formatHoursMinutes(1.25)).toBe('1h 15m');
  });
});

describe('formatTime', () => {
  it('formats a date string to time', () => {
    const date = new Date(2023, 10, 14, 8, 24);
    const result = formatTime(date);
    expect(result).toMatch(/8:24\s*AM/i);
  });
});

describe('formatDate', () => {
  it('formats a date to full format', () => {
    const date = new Date(2023, 10, 14);
    const result = formatDate(date);
    expect(result).toContain('Nov');
    expect(result).toContain('14');
    expect(result).toContain('2023');
  });
});

describe('formatShortDate', () => {
  it('formats a date to short format', () => {
    const date = new Date(2023, 10, 14);
    const result = formatShortDate(date);
    expect(result).toContain('Nov');
    expect(result).toContain('14');
  });
});

describe('getInitials', () => {
  it('returns first letters of first and last name', () => {
    expect(getInitials('John', 'Doe')).toBe('JD');
  });

  it('handles single character names', () => {
    expect(getInitials('A', 'B')).toBe('AB');
  });
});

describe('formatPercent', () => {
  it('formats a percentage', () => {
    expect(formatPercent(94.5)).toBe('94.5%');
  });

  it('formats 100%', () => {
    expect(formatPercent(100)).toBe('100%');
  });
});
