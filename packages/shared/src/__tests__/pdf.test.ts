import { describe, it, expect } from 'vitest';
import { generatePayrollReport } from '../utils/pdf';
import { mockEmployees } from '../data/mockEmployees';
import { mockTimeEntries } from '../data/mockTimeEntries';
import { mockProjects } from '../data/mockProjects';

describe('generatePayrollReport', () => {
  const dateRange = {
    start: new Date('2026-03-01'),
    end: new Date('2026-03-16'),
  };

  it('returns a non-empty Uint8Array', () => {
    const result = generatePayrollReport(
      mockEmployees,
      mockTimeEntries,
      mockProjects,
      dateRange,
    );
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('starts with PDF magic bytes (%PDF)', () => {
    const result = generatePayrollReport(
      mockEmployees,
      mockTimeEntries,
      mockProjects,
      dateRange,
    );
    // %PDF in ASCII: 0x25 0x50 0x44 0x46
    const header = String.fromCharCode(result[0], result[1], result[2], result[3]);
    expect(header).toBe('%PDF');
  });

  it('produces output for an empty entries list', () => {
    const result = generatePayrollReport(
      mockEmployees,
      [],
      mockProjects,
      dateRange,
    );
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    const header = String.fromCharCode(result[0], result[1], result[2], result[3]);
    expect(header).toBe('%PDF');
  });
});
