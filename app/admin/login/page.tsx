/**
 * app/admin/login/page.tsx — Admin Login
 *
 * Client Component: manages form state and calls supabase.auth.signInWithPassword.
 * On success, middleware automatically redirects to /admin/dashboard.
 */

'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, BookOpen } from 'lucide-react';

function AdminLoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password,
    });

    if (authError) {
      // Intentionally vague error message (don't reveal whether email exists)
      setError('Invalid credentials. Please try again.');
      setLoading(false);
      return;
    }

    // Redirect to the originally-requested page or dashboard
    const next = searchParams.get('next') ?? '/admin/dashboard';
    router.push(next);
    router.refresh();
  };

  const inputClass = `
    w-full h-11 px-4 rounded-lg text-sm
    bg-[#1a1a1f] border border-[#2e2e3a]
    text-[#e8e8f0] placeholder:text-[#3d3d4d]
    focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/30
    transition-colors disabled:opacity-50
  `;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-1 h-8 bg-gradient-to-b from-[#c9a84c] to-[#7a5200] rounded-full" />
          <span className="font-display text-2xl text-[#e8e8f0]">The Library</span>
        </div>

        <div className="rounded-xl border border-[#2e2e3a] bg-[#1a1a1f] p-8">
          <h1 className="font-display text-xl text-[#e8e8f0] mb-1">Admin Access</h1>
          <p className="text-xs text-[#5a5a72] mb-6">Sign in to manage your collection.</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-mono text-[#7c7c96] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-mono text-[#7c7c96] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className={inputClass}
              />
            </div>

            {error && (
              <p role="alert" className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="
                w-full h-11 rounded-lg text-sm font-medium
                bg-[#c9a84c] text-[#0f0f12]
                hover:bg-[#d4b96a] disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors flex items-center justify-center gap-2
              "
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginInner />
    </Suspense>
  );
}
