import { describe, it, expect } from 'vitest';
import { mockEmployees } from '../data/mockEmployees';
import { mockProjects } from '../data/mockProjects';
import { mockTimeEntries, mockActivityEvents } from '../data/mockTimeEntries';

describe('mockEmployees', () => {
  it('has 18 employees', () => {
    expect(mockEmployees.length).toBe(18);
  });

  it('has employees in all departments', () => {
    const departments = new Set(mockEmployees.map((e) => e.department));
    expect(departments.has('Drivers')).toBe(true);
    expect(departments.has('Service Crew')).toBe(true);
    expect(departments.has('Office')).toBe(true);
  });

  it('all employees have required fields', () => {
    mockEmployees.forEach((emp) => {
      expect(emp.id).toBeTruthy();
      expect(emp.firstName).toBeTruthy();
      expect(emp.lastName).toBeTruthy();
      expect(emp.email).toBeTruthy();
      expect(emp.hourlyRate).toBeGreaterThan(0);
      expect(emp.overtimeRate).toBeGreaterThan(emp.hourlyRate);
    });
  });

  it('has unique IDs', () => {
    const ids = mockEmployees.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('mockProjects', () => {
  it('has 7 projects', () => {
    expect(mockProjects.length).toBe(7);
  });

  it('all projects have required fields', () => {
    mockProjects.forEach((proj) => {
      expect(proj.id).toBeTruthy();
      expect(proj.name).toBeTruthy();
      expect(proj.client).toBeTruthy();
      expect(proj.budget).toBeGreaterThan(0);
    });
  });
});

describe('mockTimeEntries', () => {
  it('has time entries', () => {
    expect(mockTimeEntries.length).toBeGreaterThan(0);
  });

  it('entries reference valid employees', () => {
    const employeeIds = new Set(mockEmployees.map((e) => e.id));
    mockTimeEntries.forEach((entry) => {
      expect(employeeIds.has(entry.employeeId)).toBe(true);
    });
  });

  it('has some pending approvals', () => {
    const pending = mockTimeEntries.filter((e) => e.status === 'pending');
    expect(pending.length).toBeGreaterThanOrEqual(5);
  });

  it('clock-in is before clock-out when both exist', () => {
    mockTimeEntries
      .filter((e) => e.clockOut)
      .forEach((entry) => {
        expect(new Date(entry.clockIn).getTime()).toBeLessThan(
          new Date(entry.clockOut!).getTime()
        );
      });
  });
});

describe('mockActivityEvents', () => {
  it('has activity events', () => {
    expect(mockActivityEvents.length).toBeGreaterThan(0);
  });

  it('events have valid types', () => {
    const validTypes = ['clock_in', 'clock_out', 'break_start', 'break_end', 'note'];
    mockActivityEvents.forEach((event) => {
      expect(validTypes).toContain(event.type);
    });
  });
});
