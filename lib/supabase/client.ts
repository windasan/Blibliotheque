/**
 * lib/supabase/client.ts
 *
 * Browser-side Supabase singleton.
 * Import in Client Components ("use client") only.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
}
