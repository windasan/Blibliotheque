/**
 * lib/supabase/server.ts
 *
 * Server-side Supabase client for use in:
 *  - Server Components (RSC)
 *  - Route Handlers
 *  - Server Actions
 *  - Middleware (see middleware.ts — uses a separate createMiddlewareClient)
 *
 * Uses @supabase/ssr to correctly read/write auth cookies.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Components cannot set cookies — mutations go through
            // Route Handlers / Server Actions which CAN set cookies.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // See above
          }
        },
      },
    }
  );
}

/**
 * Service-role client — BYPASSES RLS.
 * Use ONLY in trusted server-side contexts (e.g. seeding, migrations).
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client bundle.
 */
export function createServiceClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {},
        remove() {},
      },
      auth: {
        persistSession: false,      // service role never has a user session
        autoRefreshToken: false,
      },
    }
  );
}
