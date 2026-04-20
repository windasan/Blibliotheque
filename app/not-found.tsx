/**
 * app/not-found.tsx — 404 page
 */
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-[#c9a84c] uppercase mb-4">404</p>
      <h1 className="font-display text-5xl text-[#e8e8f0] mb-3">Page not found</h1>
      <p className="text-[#5a5a72] text-sm max-w-xs mb-8">
        That shelf is empty. The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#c9a84c] text-[#0f0f12] hover:bg-[#d4b96a] transition-colors"
      >
        Back to the library
      </Link>
    </div>
  );
}
