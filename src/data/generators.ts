import { ActivityEvent, TimeEntry } from '../types';

let idCounter = 0;

export function generateId(): string {
  idCounter += 1;
  return `id-${Date.now().toString(36)}-${idCounter.toString(36).padStart(4, '0')}`;
}

export function getRecentActivityEvents(
  events: ActivityEvent[],
  count: number,
): ActivityEvent[] {
  return [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, count);
}

export function getEntriesForEmployee(
  entries: TimeEntry[],
  employeeId: string,
): TimeEntry[] {
  return entries.filter((entry) => entry.employeeId === employeeId);
}

export function getEntriesInRange(
  entries: TimeEntry[],
  start: Date,
  end: Date,
): TimeEntry[] {
  return entries.filter((entry) => {
    const clockIn = new Date(entry.clockIn);
    return clockIn >= start && clockIn <= end;
  });
}

export function getCurrentShiftEntry(
  entries: TimeEntry[],
  employeeId: string,
): TimeEntry | null {
  return (
    entries.find(
      (entry) => entry.employeeId === employeeId && entry.clockOut === null,
    ) ?? null
  );
}
