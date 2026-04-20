/**
 * app/admin/dashboard/layout.tsx — Admin Shell
 *
 * Server Component. Double-checks auth (middleware is the primary guard;
 * this is the belt-and-suspenders check in the RSC layer).
 */

import { redirect }      from 'next/navigation';
import Link              from 'next/link';
import { createClient }  from '@/lib/supabase/server';
import { AdminSignOut }  from '@/components/admin/AdminSignOut';
import { BookOpen, LayoutDashboard, PlusCircle } from 'lucide-react';

const NAV = [
  { href: '/admin/dashboard',     label: 'All Books', icon: LayoutDashboard },
  { href: '/admin/dashboard/add', label: 'Add Book',  icon: PlusCircle      },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session guard (belt-and-suspenders)
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/admin/login');

  return (
    <div className="flex min-h-screen">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-[#2e2e3a] bg-[#141418]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#2e2e3a]">
          <div className="w-0.5 h-6 bg-gradient-to-b from-[#c9a84c] to-[#7a5200] rounded-full" />
          <span className="font-display text-base text-[#e8e8f0]">Library</span>
          <span className="ml-auto text-[9px] font-mono text-[#3d3d4d] uppercase tracking-wider">Admin</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="
                flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm
                text-[#7c7c96] hover:text-[#e8e8f0] hover:bg-[#1f1f26]
                transition-colors group
              "
            >
              <Icon size={14} className="group-hover:text-[#c9a84c] transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + sign out */}
        <div className="border-t border-[#2e2e3a] p-3">
          <div className="px-3 py-1 mb-1">
            <p className="text-[10px] font-mono text-[#3d3d4d] truncate">
              {session.user.email}
            </p>
          </div>
          <AdminSignOut />
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-[#2e2e3a] bg-[#141418]">
          <span className="font-display text-base text-[#e8e8f0]">Library Admin</span>
          <div className="flex items-center gap-2">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                title={label}
                className="p-2 rounded-lg text-[#7c7c96] hover:text-[#e8e8f0] hover:bg-[#1f1f26] transition-colors"
              >
                <Icon size={16} />
              </Link>
            ))}
          </div>
        </div>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
