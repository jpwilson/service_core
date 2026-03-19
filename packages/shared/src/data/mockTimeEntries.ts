import {
  subDays,
  addHours,
  addMinutes,
  isWeekend,
  startOfDay,
} from 'date-fns';
import {
  TimeEntry,
  TimeEntryFlag,
  BreakEntry,
  ActivityEvent,
} from '../types';
import { mockEmployees } from './mockEmployees';
import { mockProjects } from './mockProjects';

// ---------- Deterministic seed-based random ----------
let seed = 42;
function seededRandom(): number {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function randomInt(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

// ---------- Constants ----------
// Use current date so dashboard metrics (isToday, active employees) always work
const now = new Date();
const TODAY = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
const DAYS_TO_GENERATE = 30;
const projectIds = mockProjects.map((p) => p.id);

const locations: Record<string, string[]> = {
  Drivers: [
    'Denver, CO',
    'Boulder, CO',
    'Fort Collins, CO',
    'Colorado Springs, CO',
    'Arvada, CO',
    'Greeley, CO',
    'Longmont, CO',
  ],
  'Service Crew': [
    'Denver, CO',
    'Boulder, CO',
    'Fort Collins, CO',
    'Colorado Springs, CO',
    'Arvada, CO',
    'Greeley, CO',
    'Longmont, CO',
  ],
  Office: ['Denver HQ, CO'],
};

const noteOptions = [
  '',
  '',
  '',
  'Completed route ahead of schedule',
  'Traffic delay on I-25',
  'Equipment maintenance required',
  'Client requested additional units',
  'Weather delay - snow',
  'Restocked truck supplies',
  'Training new crew member',
  'Unit repair on site',
  'Route change due to road closure',
];

// ---------- ID generation ----------
let entryCounter = 0;
function nextEntryId(): string {
  entryCounter += 1;
  return `te-${entryCounter.toString().padStart(5, '0')}`;
}

let breakCounter = 0;
function nextBreakId(): string {
  breakCounter += 1;
  return `brk-${breakCounter.toString().padStart(5, '0')}`;
}

let eventCounter = 0;
function nextEventId(): string {
  eventCounter += 1;
  return `evt-${eventCounter.toString().padStart(5, '0')}`;
}

// ---------- Employee patterns ----------
// Defines per-employee tendencies: some are reliable, some have OT, some have attendance issues
interface EmployeePattern {
  typicalStartHour: number; // e.g. 6 for 6 AM
  typicalStartVariance: number; // minutes of variance
  typicalHours: number; // target work hours
  overtimeChance: number; // 0-1
  absenceChance: number; // 0-1 per day chance of missing
  weekendChance: number; // 0-1 chance of working weekends
  lateChance: number; // 0-1 chance of arriving late
  mileageMin: number | null;
  mileageMax: number | null;
}

const employeePatterns: Record<string, EmployeePattern> = {
  'emp-001': { typicalStartHour: 6, typicalStartVariance: 10, typicalHours: 9, overtimeChance: 0.35, absenceChance: 0.02, weekendChance: 0.1, lateChance: 0.02, mileageMin: 60, mileageMax: 140 },
  'emp-002': { typicalStartHour: 6, typicalStartVariance: 15, typicalHours: 8.5, overtimeChance: 0.2, absenceChance: 0.05, weekendChance: 0.05, lateChance: 0.08, mileageMin: 50, mileageMax: 120 },
  'emp-003': { typicalStartHour: 6, typicalStartVariance: 20, typicalHours: 8, overtimeChance: 0.15, absenceChance: 0.04, weekendChance: 0.05, lateChance: 0.05, mileageMin: 45, mileageMax: 110 },
  'emp-004': { typicalStartHour: 6, typicalStartVariance: 25, typicalHours: 8, overtimeChance: 0.1, absenceChance: 0.08, weekendChance: 0.02, lateChance: 0.15, mileageMin: 40, mileageMax: 100 },
  'emp-005': { typicalStartHour: 5, typicalStartVariance: 10, typicalHours: 9.5, overtimeChance: 0.4, absenceChance: 0.01, weekendChance: 0.15, lateChance: 0.01, mileageMin: 70, mileageMax: 160 },
  'emp-006': { typicalStartHour: 6, typicalStartVariance: 15, typicalHours: 8, overtimeChance: 0.15, absenceChance: 0.06, weekendChance: 0.05, lateChance: 0.1, mileageMin: 50, mileageMax: 115 },
  'emp-007': { typicalStartHour: 7, typicalStartVariance: 10, typicalHours: 9, overtimeChance: 0.3, absenceChance: 0.02, weekendChance: 0.25, lateChance: 0.02, mileageMin: null, mileageMax: null },
  'emp-008': { typicalStartHour: 7, typicalStartVariance: 15, typicalHours: 8, overtimeChance: 0.15, absenceChance: 0.05, weekendChance: 0.2, lateChance: 0.06, mileageMin: null, mileageMax: null },
  'emp-009': { typicalStartHour: 7, typicalStartVariance: 20, typicalHours: 8, overtimeChance: 0.1, absenceChance: 0.07, weekendChance: 0.15, lateChance: 0.1, mileageMin: null, mileageMax: null },
  'emp-010': { typicalStartHour: 7, typicalStartVariance: 25, typicalHours: 7.5, overtimeChance: 0.05, absenceChance: 0.1, weekendChance: 0.1, lateChance: 0.18, mileageMin: null, mileageMax: null },
  'emp-011': { typicalStartHour: 7, typicalStartVariance: 10, typicalHours: 8.5, overtimeChance: 0.25, absenceChance: 0.03, weekendChance: 0.2, lateChance: 0.03, mileageMin: null, mileageMax: null },
  'emp-012': { typicalStartHour: 7, typicalStartVariance: 20, typicalHours: 8, overtimeChance: 0.08, absenceChance: 0.06, weekendChance: 0.15, lateChance: 0.08, mileageMin: null, mileageMax: null },
  'emp-013': { typicalStartHour: 7, typicalStartVariance: 15, typicalHours: 8, overtimeChance: 0.1, absenceChance: 0.05, weekendChance: 0.12, lateChance: 0.06, mileageMin: null, mileageMax: null },
  'emp-014': { typicalStartHour: 8, typicalStartVariance: 10, typicalHours: 8.5, overtimeChance: 0.2, absenceChance: 0.02, weekendChance: 0.05, lateChance: 0.01, mileageMin: null, mileageMax: null },
  'emp-015': { typicalStartHour: 7, typicalStartVariance: 10, typicalHours: 8, overtimeChance: 0.15, absenceChance: 0.03, weekendChance: 0.05, lateChance: 0.03, mileageMin: null, mileageMax: null },
  'emp-016': { typicalStartHour: 8, typicalStartVariance: 15, typicalHours: 8, overtimeChance: 0.1, absenceChance: 0.04, weekendChance: 0.02, lateChance: 0.05, mileageMin: null, mileageMax: null },
  'emp-017': { typicalStartHour: 8, typicalStartVariance: 10, typicalHours: 8, overtimeChance: 0.12, absenceChance: 0.03, weekendChance: 0.02, lateChance: 0.03, mileageMin: null, mileageMax: null },
  'emp-018': { typicalStartHour: 8, typicalStartVariance: 20, typicalHours: 8, overtimeChance: 0.05, absenceChance: 0.05, weekendChance: 0.01, lateChance: 0.07, mileageMin: null, mileageMax: null },
};

// ---------- Generation ----------
const allTimeEntries: TimeEntry[] = [];
const allActivityEvents: ActivityEvent[] = [];

let pendingCount = 0;
const MAX_PENDING = 8;

for (let dayOffset = DAYS_TO_GENERATE; dayOffset >= 0; dayOffset--) {
  const date = subDays(TODAY, dayOffset);
  const isWeekendDay = isWeekend(date);
  const isRecent = dayOffset <= 3;

  for (const employee of mockEmployees) {
    const pattern = employeePatterns[employee.id];
    if (!pattern) continue;

    // Skip weekends unless employee has weekend chance
    if (isWeekendDay && seededRandom() > pattern.weekendChance) continue;

    // Absence check
    if (seededRandom() < pattern.absenceChance) continue;

    // Determine start time
    const isLate = seededRandom() < pattern.lateChance;
    const startVariance = randomInt(-pattern.typicalStartVariance, pattern.typicalStartVariance);
    const lateMinutes = isLate ? randomInt(15, 60) : 0;

    const dayStart = startOfDay(date);
    const clockInDate = addMinutes(
      addHours(dayStart, pattern.typicalStartHour),
      startVariance + lateMinutes,
    );

    // Determine work hours
    const isOT = seededRandom() < pattern.overtimeChance;
    const workHours = isOT
      ? pattern.typicalHours + randomInt(1, 3)
      : pattern.typicalHours + (seededRandom() - 0.5) * 1.0;

    const totalMinutes = Math.round(workHours * 60);

    // Today's entries might still be open
    const isOpenShift = dayOffset === 0 && seededRandom() < 0.3;
    const clockOutDate = isOpenShift ? null : addMinutes(clockInDate, totalMinutes);

    // Build breaks
    const breaks: BreakEntry[] = [];
    // Lunch break roughly in the middle of shift
    const lunchStart = addHours(clockInDate, randomInt(3, 5));
    const lunchDuration = randomInt(25, 35);
    breaks.push({
      id: nextBreakId(),
      type: 'lunch',
      startTime: lunchStart.toISOString(),
      endTime: addMinutes(lunchStart, lunchDuration).toISOString(),
    });

    // Some employees take an afternoon rest break
    if (workHours > 8.5 && seededRandom() < 0.4) {
      const restStart = addHours(clockInDate, randomInt(6, 7));
      breaks.push({
        id: nextBreakId(),
        type: 'rest',
        startTime: restStart.toISOString(),
        endTime: addMinutes(restStart, 15).toISOString(),
      });
    }

    // Flags
    const flags: TimeEntryFlag[] = [];
    if (isOT && workHours > 8) flags.push('overtime');
    if (isLate) flags.push('late_arrival');
    if (isOpenShift) flags.push('missing_clockout');
    if (seededRandom() < 0.03) {
      flags.push('manual_edit');
    }
    if (seededRandom() < 0.02) {
      flags.push('location_mismatch');
    }

    const isManualEdit = flags.includes('manual_edit');

    // Status
    let status: 'pending' | 'approved' | 'rejected';
    if (isRecent && pendingCount < MAX_PENDING && seededRandom() < 0.5) {
      status = 'pending';
      pendingCount += 1;
    } else if (seededRandom() < 0.02) {
      status = 'rejected';
    } else {
      status = 'approved';
    }

    // Location and project
    const empLocations = locations[employee.department];
    const location = pick(empLocations);
    const projectId = pick(projectIds);

    // Mileage for drivers
    const mileage =
      pattern.mileageMin !== null && pattern.mileageMax !== null
        ? randomInt(pattern.mileageMin, pattern.mileageMax)
        : null;

    // Notes
    const notes = pick(noteOptions);

    const entryId = nextEntryId();
    const entry: TimeEntry = {
      id: entryId,
      employeeId: employee.id,
      projectId,
      clockIn: clockInDate.toISOString(),
      clockOut: clockOutDate ? clockOutDate.toISOString() : null,
      breaks,
      notes,
      location,
      mileage,
      status,
      flags,
      isManualEdit,
    };

    allTimeEntries.push(entry);

    // Generate activity events from this entry
    allActivityEvents.push({
      id: nextEventId(),
      employeeId: employee.id,
      type: 'clock_in',
      timestamp: clockInDate.toISOString(),
      location,
      details: notes || undefined,
    });

    for (const brk of breaks) {
      allActivityEvents.push({
        id: nextEventId(),
        employeeId: employee.id,
        type: 'break_start',
        timestamp: brk.startTime,
        location,
        details: `${brk.type} break`,
      });
      if (brk.endTime) {
        allActivityEvents.push({
          id: nextEventId(),
          employeeId: employee.id,
          type: 'break_end',
          timestamp: brk.endTime,
          location,
          details: `${brk.type} break ended`,
        });
      }
    }

    if (clockOutDate) {
      allActivityEvents.push({
        id: nextEventId(),
        employeeId: employee.id,
        type: 'clock_out',
        timestamp: clockOutDate.toISOString(),
        location,
      });
    }

    // Occasional note events
    if (notes && seededRandom() < 0.3) {
      const noteTime = addHours(clockInDate, randomInt(2, 6));
      allActivityEvents.push({
        id: nextEventId(),
        employeeId: employee.id,
        type: 'note',
        timestamp: noteTime.toISOString(),
        location,
        details: notes,
      });
    }
  }
}

// Sort activity events by timestamp descending (most recent first)
allActivityEvents.sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
);

export const mockTimeEntries: TimeEntry[] = allTimeEntries;
export const mockActivityEvents: ActivityEvent[] = allActivityEvents;
