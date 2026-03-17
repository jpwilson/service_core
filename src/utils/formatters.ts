import { format, parseISO } from 'date-fns';

function ensureDate(date: Date | string): Date {
  if (typeof date === 'string') {
    return parseISO(date);
  }
  return date;
}

export function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatHoursMinutes(totalHours: number): string {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return `${hours}h ${minutes}m`;
}

export function formatTime(date: Date | string): string {
  return format(ensureDate(date), 'hh:mm a');
}

export function formatDate(date: Date | string): string {
  return format(ensureDate(date), 'EEEE, MMM d, yyyy');
}

export function formatShortDate(date: Date | string): string {
  return format(ensureDate(date), 'MMM d');
}

export function formatDateRange(start: Date, end: Date): string {
  const startStr = format(start, 'MMM d');
  const endStr = format(end, 'MMM d, yyyy');
  return `${startStr} - ${endStr}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
}

export function formatPercent(value: number): string {
  return `${parseFloat(value.toFixed(1))}%`;
}
