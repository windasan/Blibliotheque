/**
 * middleware.ts — Route Guard
 *
 * Security model:
 *  - /admin/login   → always public (the login form itself)
 *  - /admin/*       → requires an authenticated Supabase session
 *                     unauthenticated → redirect to /admin/login
 *  - /              → public; authenticated users see the same view
 *
 * The middleware ALSO refreshes the Supabase session cookie on every
 * request so tokens never expire mid-session.
 *
 * Runs on the Edge Runtime (no Node.js APIs allowed here).
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Mutate the response so we can write refreshed cookies back to the browser
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // ── Initialise Supabase on the Edge ──────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Write to the request (propagates to downstream RSCs) AND response (browser)
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // ── Refresh session (CRITICAL — do before any auth check) ─────────────────
  // This silently rotates the access token if expired.
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  // ── Route: /admin/login ───────────────────────────────────────────────────
  if (pathname === '/admin/login') {
    // Already logged in → send directly to dashboard
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return response; // not logged in → show login page
  }

  // ── Route: /admin/* (everything except login) ─────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      // Preserve the intended destination for post-login redirect
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response; // authenticated → allow
  }

  // ── All other routes → pass through ──────────────────────────────────────
  return response;
}

// ── Matcher: exclude static assets and image optimisation routes ──────────────
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
