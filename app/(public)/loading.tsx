/**
 * app/(public)/loading.tsx — Homepage loading skeleton
 */
import { GalleryGridSkeleton } from '@/components/ui/Skeleton';
import { Skeleton }            from '@/components/ui/Skeleton';

export default function HomeLoading() {
  return (
    <div className="min-h-screen">
      {/* Header placeholder */}
      <div className="h-16 border-b border-[#2e2e3a]" />
      <div className="page-column pt-16 pb-10">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-14 w-64 mb-2" />
        <Skeleton className="h-14 w-48 mb-2" />
        <Skeleton className="h-14 w-56 mb-6" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="page-column pb-8">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
      <div className="page-column pb-24">
        <GalleryGridSkeleton count={18} />
      </div>
    </div>
  );
}
