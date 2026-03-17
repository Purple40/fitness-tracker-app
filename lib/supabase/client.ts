import { createBrowserClient } from '@supabase/ssr';

// Support both key name formats
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-key';

// ─── Singleton ────────────────────────────────────────────────────────────────
// Using createBrowserClient from @supabase/ssr ensures the session is read from
// cookies (set by the middleware) rather than localStorage.  A singleton avoids
// stale-closure bugs in useCallback hooks that capture the client at first render.
let _browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Server-side: always create a fresh instance (no singleton needed)
  if (typeof window === 'undefined') {
    return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  }
  // Client-side: reuse the same instance so the cookie-based session is shared
  if (!_browserClient) {
    _browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return _browserClient;
}

// Convenience export used in a few places
export const supabase = createClient();

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
