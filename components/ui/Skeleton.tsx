/**
 * components/ui/Skeleton.tsx — Loading skeleton primitives
 */

import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('skeleton rounded', className)}
    />
  );
}

/** Gallery grid skeleton — mirrors the BookCard layout */
export function BookCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="w-full aspect-[2/3] skeleton rounded-[4px]" />
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/** Skeleton for the homepage grid */
export function GalleryGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}
