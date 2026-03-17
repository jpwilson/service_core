import { createClient } from '@supabase/supabase-js';

// Read env vars from Vite (browser) or globalThis (Node/Edge)
function getEnv(viteKey: string, nodeKey: string): string | undefined {
  // Vite injects env vars via import.meta.env
  const meta = (import.meta as unknown as Record<string, unknown>);
  const env = meta.env as Record<string, string> | undefined;
  if (env?.[viteKey]) return env[viteKey];

  // Fallback for Node-like environments
  const g = globalThis as Record<string, unknown>;
  const proc = g.process as { env?: Record<string, string> } | undefined;
  return proc?.env?.[nodeKey];
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    console.warn('Supabase not configured. Using mock data.');
  }
  return supabase;
}
