/**
 * components/admin/AdminSignOut.tsx
 *
 * Client Component — calls supabase.auth.signOut() then redirects to /.
 */

'use client';

import { useTransition }  from 'react';
import { useRouter }      from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { createClient }   from '@/lib/supabase/client';

export function AdminSignOut() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="
        flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm
        text-[#5a5a72] hover:text-[#e8e8f0] hover:bg-[#1f1f26]
        transition-colors disabled:opacity-50
      "
    >
      {isPending
        ? <Loader2 size={14} className="animate-spin" />
        : <LogOut  size={14} />
      }
      Sign out
    </button>
  );
}
