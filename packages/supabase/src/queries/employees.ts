import { getSupabaseClient } from '../client';
import type { Employee } from '@servicecore/shared';

export async function fetchEmployees(): Promise<Employee[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('employees')
    .select('*')
    .eq('is_active', true)
    .order('last_name');

  if (error) throw error;
  return (data || []).map(mapEmployee);
}

export async function fetchEmployeeById(id: string): Promise<Employee | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? mapEmployee(data) : null;
}

function mapEmployee(row: Record<string, unknown>): Employee {
  return {
    id: row.id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    department: row.department as Employee['department'],
    role: row.role as string,
    hourlyRate: Number(row.hourly_rate),
    overtimeRate: Number(row.overtime_rate),
    doubleTimeRate: Number(row.double_time_rate),
    hireDate: row.hire_date as string,
    isActive: row.is_active as boolean,
    avatarColor: row.avatar_color as string,
  };
}
