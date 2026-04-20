/**
 * app/error.tsx — Global error boundary
 */
'use client';

import { useEffect } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error('[Error boundary]', error); }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-900/50 bg-red-950/40 text-red-400 mb-5">
        <AlertTriangle size={20} />
      </div>
      <h1 className="font-display text-3xl text-[#e8e8f0] mb-2">Something went wrong</h1>
      <p className="text-[#5a5a72] text-sm max-w-xs mb-8">An unexpected error occurred. Try again or return to the library.</p>
      {process.env.NODE_ENV === 'development' && (
        <pre className="text-left text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-4 py-3 max-w-md mb-6 overflow-x-auto">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#c9a84c] text-[#0f0f12] hover:bg-[#d4b96a] transition-colors"
      >
        <RotateCcw size={13} />
        Try again
      </button>
    </div>
  );
}
