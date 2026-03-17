export interface OcrParsedEntry {
  employeeName: string | null;
  date: string | null;
  clockIn: string | null;
  clockOut: string | null;
  hoursWorked: number | null;
  project: string | null;
  notes: string | null;
  confidence: number;
}

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04',
  may: '05', jun: '06', jul: '07', aug: '08',
  sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * Finds time patterns like "7:00 AM", "07:00", "7:00am" and normalizes to "HH:mm".
 */
export function extractTimeFromText(text: string): string | null {
  // Match "7:00 AM", "07:00 am", "7:00am", "7:00 pm"
  const amPmMatch = text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\b/);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2];
    const period = amPmMatch[3].toLowerCase();
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  // Match 24-hour format "14:30", "07:00" (but not dates like 2023-11-14)
  const h24Match = text.match(/(?<!\d[/-])(\d{1,2}):(\d{2})(?!\s*(am|pm|AM|PM))(?!\d)/);
  if (h24Match) {
    const hours = parseInt(h24Match[1], 10);
    const minutes = h24Match[2];
    if (hours >= 0 && hours <= 23 && parseInt(minutes, 10) <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  }

  return null;
}

/**
 * Finds date patterns and normalizes to "YYYY-MM-DD".
 */
export function extractDateFromText(text: string): string | null {
  // ISO format: YYYY-MM-DD
  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // US format: MM/DD/YYYY
  const usMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (usMatch) {
    const month = usMatch[1].padStart(2, '0');
    const day = usMatch[2].padStart(2, '0');
    return `${usMatch[3]}-${month}-${day}`;
  }

  // Named month format: "Nov 14, 2023" or "November 14, 2023"
  const namedMatch = text.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i
  );
  if (namedMatch) {
    const monthKey = namedMatch[1].toLowerCase().slice(0, 3);
    const month = MONTH_MAP[monthKey];
    if (month) {
      const day = namedMatch[2].padStart(2, '0');
      return `${namedMatch[3]}-${month}-${day}`;
    }
  }

  return null;
}

/**
 * Finds hours patterns like "8.5", "8h 30m", "8.5 hours".
 */
export function extractHoursFromText(text: string): number | null {
  // "8h 30m" or "8h30m"
  const hmMatch = text.match(/\b(\d+)\s*h\s*(\d+)\s*m\b/i);
  if (hmMatch) {
    const hours = parseInt(hmMatch[1], 10);
    const minutes = parseInt(hmMatch[2], 10);
    return hours + minutes / 60;
  }

  // "8.5 hours" or "8.5 hrs"
  const hoursMatch = text.match(/\b(\d+\.?\d*)\s*(?:hours?|hrs?)\b/i);
  if (hoursMatch) {
    return parseFloat(hoursMatch[1]);
  }

  // Standalone decimal number (only if it looks like hours, i.e. reasonable range)
  const numMatch = text.match(/\b(\d+\.\d+)\b/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (val > 0 && val <= 24) {
      return val;
    }
  }

  return null;
}

/**
 * Extracts an employee name from text using common label patterns.
 */
function extractEmployeeName(text: string): string | null {
  // "Employee: John Smith" or "Name: John Smith"
  const labelMatch = text.match(/(?:employee|name|worker|staff)\s*:\s*(.+)/i);
  if (labelMatch) {
    return labelMatch[1].trim();
  }
  return null;
}

/**
 * Extracts a project/job name from text.
 */
function extractProject(text: string): string | null {
  // "Project: ..." or "Job: ..." or "Site: ..."
  const labelMatch = text.match(/(?:project|job|site|location)\s*:\s*(.+)/i);
  if (labelMatch) {
    return labelMatch[1].trim();
  }
  return null;
}

/**
 * Extracts a time range like "7:00 AM - 3:30 PM" and returns [clockIn, clockOut].
 */
function extractTimeRange(text: string): [string | null, string | null] {
  // Look for "TIME - TIME" pattern
  const rangeMatch = text.match(
    /(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)\s*[-\u2013\u2014to]+\s*(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)/
  );
  if (rangeMatch) {
    const clockIn = extractTimeFromText(rangeMatch[1]);
    const clockOut = extractTimeFromText(rangeMatch[2]);
    return [clockIn, clockOut];
  }
  return [null, null];
}

/**
 * Parses OCR text output from a paper timesheet into structured entries.
 */
export function parseOcrText(text: string): OcrParsedEntry[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const entries: OcrParsedEntry[] = [];

  // First pass: find global employee name
  let globalEmployeeName: string | null = null;
  for (const line of lines) {
    const name = extractEmployeeName(line);
    if (name) {
      globalEmployeeName = name;
      break;
    }
  }

  // Second pass: look for row-based entries (one row per day)
  for (const line of lines) {
    const date = extractDateFromText(line);
    const [clockIn, clockOut] = extractTimeRange(line);
    const hoursWorked = extractHoursFromText(line);

    // A line is considered a timesheet row if it has a date AND time info, or a time range
    if ((date && (clockIn || clockOut || hoursWorked !== null)) || (clockIn && clockOut)) {
      // Try to find project info - text after hours or at the end
      let project: string | null = extractProject(line);
      if (!project) {
        // Try to find trailing text after hours as project name
        const hoursPattern = /\d+\.?\d*\s*(?:hours?|hrs?|h\s*\d+\s*m)/i;
        const hoursMatch = line.match(hoursPattern);
        if (hoursMatch) {
          const afterHours = line.slice(
            (hoursMatch.index ?? 0) + hoursMatch[0].length
          ).trim();
          if (afterHours.length > 1) {
            project = afterHours;
          }
        }
      }

      // Per-row employee name or fall back to global
      const rowName = extractEmployeeName(line) || globalEmployeeName;

      // Calculate confidence based on how many fields are present
      let fieldsFound = 0;
      const totalFields = 5; // date, clockIn, clockOut, hours, project
      if (date) fieldsFound++;
      if (clockIn) fieldsFound++;
      if (clockOut) fieldsFound++;
      if (hoursWorked !== null) fieldsFound++;
      if (project) fieldsFound++;

      const confidence = fieldsFound / totalFields;

      entries.push({
        employeeName: rowName,
        date,
        clockIn,
        clockOut,
        hoursWorked,
        project,
        notes: null,
        confidence,
      });
    }
  }

  return entries;
}
