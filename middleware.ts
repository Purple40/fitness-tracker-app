import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Start with an unmodified response — the supabase client will mutate this
  // via setAll() to write refreshed session cookies back to the browser.
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ── Demo / preview mode ──────────────────────────────────────────────────
  // If env vars are missing the app runs without Supabase (localStorage demo).
  if (!supabaseUrl || !supabaseKey) {
    if (request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return supabaseResponse;
  }

  // ── Supabase SSR client ──────────────────────────────────────────────────
  // IMPORTANT: use getAll / setAll (not get/set/remove) so the session token
  // is correctly read from chunked cookies and written back after refresh.
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
      ) {
        // Write cookies onto the request so downstream server components see them
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // Rebuild the response so the refreshed cookies are sent to the browser
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options ?? {})
        );
      },
    },
  });

  // IMPORTANT: always call getUser() — this refreshes the session if needed.
  // Do NOT use getSession() here; it does not validate the JWT server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Route protection ─────────────────────────────────────────────────────
  const protectedPaths = [
    '/dashboard',
    '/body',
    '/nutrition',
    '/workouts',
    '/progress',
    '/settings',
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // IMPORTANT: return supabaseResponse (not NextResponse.next()) so the
  // refreshed session cookies are included in the response.
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
