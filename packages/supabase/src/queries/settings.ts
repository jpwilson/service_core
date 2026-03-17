import { getSupabaseClient } from '../client';
import type { AppSettings, OvertimeRules, BreakRules, PayPeriodType, Department } from '@servicecore/shared';

export async function fetchSettings(): Promise<AppSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('app_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    // No settings row yet -- return null so the app falls back to defaults
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapSettings(data) : null;
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const row: Record<string, unknown> = {};
  if (settings.payPeriodType !== undefined) row.pay_period_type = settings.payPeriodType;
  if (settings.overtimeRules !== undefined) row.overtime_rules = settings.overtimeRules;
  if (settings.breakRules !== undefined) row.break_rules = settings.breakRules;
  if (settings.geofenceEnabled !== undefined) row.geofence_enabled = settings.geofenceEnabled;

  // Upsert: insert if no row exists, update if it does
  const { data, error } = await client
    .from('app_settings')
    .upsert(row)
    .select()
    .single();

  if (error) throw error;
  return data ? mapSettings(data) : null;
}

function mapSettings(row: Record<string, unknown>): AppSettings {
  const overtimeRules = row.overtime_rules as OvertimeRules;
  const breakRules = row.break_rules as BreakRules;

  return {
    payPeriodType: (row.pay_period_type as PayPeriodType) || 'bi-weekly',
    overtimeRules: overtimeRules || {
      dailyThreshold: 8,
      weeklyThreshold: 40,
      overtimeMultiplier: 1.5,
      doubleTimeMultiplier: 2,
    },
    breakRules: breakRules || {
      autoDeductMinutes: 30,
      afterHoursThreshold: 6,
    },
    departments: ['Drivers', 'Service Crew', 'Office'] as Department[],
    geofenceEnabled: (row.geofence_enabled as boolean) ?? true,
  };
}
