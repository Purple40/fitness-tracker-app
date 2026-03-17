import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

// Support both the legacy anon key name and the new publishable key name
// (Supabase renamed ANON_KEY → PUBLISHABLE_DEFAULT_KEY in late 2024)
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-key';

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (!!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  SUPABASE_URL !== 'https://placeholder.supabase.co';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
