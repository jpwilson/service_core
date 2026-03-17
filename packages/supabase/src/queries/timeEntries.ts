import { getSupabaseClient } from '../client';
import type { TimeEntry, BreakEntry, TimeEntryFlag } from '@servicecore/shared';

export async function fetchTimeEntries(dateRange: { start: Date; end: Date }): Promise<TimeEntry[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('time_entries')
    .select('*')
    .gte('clock_in', dateRange.start.toISOString())
    .lte('clock_in', dateRange.end.toISOString())
    .order('clock_in', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapTimeEntry);
}

export async function fetchTimeEntriesByEmployee(employeeId: string): Promise<TimeEntry[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('time_entries')
    .select('*')
    .eq('employee_id', employeeId)
    .order('clock_in', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapTimeEntry);
}

export async function createTimeEntry(entry: Partial<TimeEntry>): Promise<TimeEntry | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('time_entries')
    .insert(mapToRow(entry))
    .select()
    .single();

  if (error) throw error;
  return data ? mapTimeEntry(data) : null;
}

export async function updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('time_entries')
    .update(mapToRow(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data ? mapTimeEntry(data) : null;
}

export async function clockIn(
  employeeId: string,
  projectId?: string,
  location?: string,
  notes?: string
): Promise<TimeEntry | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('time_entries')
    .insert({
      employee_id: employeeId,
      project_id: projectId || null,
      clock_in: new Date().toISOString(),
      location: location || '',
      notes: notes || '',
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data ? mapTimeEntry(data) : null;
}

export async function clockOut(entryId: string, notes?: string): Promise<TimeEntry | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const updates: Record<string, unknown> = {
    clock_out: new Date().toISOString(),
  };
  if (notes !== undefined) {
    updates.notes = notes;
  }

  const { data, error } = await client
    .from('time_entries')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw error;
  return data ? mapTimeEntry(data) : null;
}

export async function approveTimesheet(entryId: string): Promise<TimeEntry | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('time_entries')
    .update({ status: 'approved' })
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw error;
  return data ? mapTimeEntry(data) : null;
}

export async function rejectTimesheet(entryId: string): Promise<TimeEntry | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('time_entries')
    .update({ status: 'rejected' })
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw error;
  return data ? mapTimeEntry(data) : null;
}

function mapTimeEntry(row: Record<string, unknown>): TimeEntry {
  return {
    id: row.id as string,
    employeeId: row.employee_id as string,
    projectId: (row.project_id as string) || null,
    clockIn: row.clock_in as string,
    clockOut: (row.clock_out as string) || null,
    breaks: (row.breaks as BreakEntry[]) || [],
    notes: (row.notes as string) || '',
    location: (row.location as string) || '',
    mileage: row.mileage !== null ? Number(row.mileage) : null,
    status: row.status as TimeEntry['status'],
    flags: (row.flags as TimeEntryFlag[]) || [],
    isManualEdit: (row.is_manual_edit as boolean) || false,
  };
}

function mapToRow(entry: Partial<TimeEntry>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (entry.employeeId !== undefined) row.employee_id = entry.employeeId;
  if (entry.projectId !== undefined) row.project_id = entry.projectId;
  if (entry.clockIn !== undefined) row.clock_in = entry.clockIn;
  if (entry.clockOut !== undefined) row.clock_out = entry.clockOut;
  if (entry.breaks !== undefined) row.breaks = entry.breaks;
  if (entry.notes !== undefined) row.notes = entry.notes;
  if (entry.location !== undefined) row.location = entry.location;
  if (entry.mileage !== undefined) row.mileage = entry.mileage;
  if (entry.status !== undefined) row.status = entry.status;
  if (entry.flags !== undefined) row.flags = entry.flags;
  if (entry.isManualEdit !== undefined) row.is_manual_edit = entry.isManualEdit;
  return row;
}
