import { getSupabaseClient } from '../client';
import type { Project } from '@servicecore/shared';

export async function fetchProjects(): Promise<Project[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return (data || []).map(mapProject);
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? mapProject(data) : null;
}

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    client: row.client as string,
    location: row.location as string,
    isActive: row.is_active as boolean,
    budget: Number(row.budget),
    startDate: row.start_date as string,
    endDate: (row.end_date as string) || null,
  };
}
