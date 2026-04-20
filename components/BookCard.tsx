/**
 * components/BookCard.tsx
 *
 * The gallery tile. Shows: cover image, title, author, rating, status badge.
 * Hover lifts the card and reveals metadata overlay.
 */

import Image          from 'next/image';
import Link           from 'next/link';
import { cn, formatRating, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';
import type { Book }  from '@/lib/types';

interface BookCardProps {
  book:     Book;
  priority: boolean;   // passed true for above-the-fold images
}

export function BookCard({ book, priority }: BookCardProps) {
  return (
    <Link
      href={`/book/${book.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] rounded-[4px]"
      aria-label={`${book.title} by ${book.author}`}
    >
      <article className="relative flex flex-col">

        {/* ── Cover ───────────────────────────────────────────────────────── */}
        <div className={cn(
          'relative w-full aspect-[2/3] rounded-[4px] overflow-hidden',
          'bg-[#1a1a1f] border border-[#2e2e3a]',
          'shadow-book group-hover:shadow-book-hover',
          'transition-all duration-300 ease-out',
          'group-hover:-translate-y-1 group-hover:border-[#3d3d4d]'
        )}>

          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={`Cover of ${book.title}`}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 18vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              priority={priority}
            />
          ) : (
            /* Fallback: typographic cover */
            <div className="absolute inset-0 flex flex-col justify-between p-3">
              <div className="w-full h-px bg-[#c9a84c]/40" />
              <div className="space-y-1">
                <p className="font-display text-xs text-[#a3a3bc] leading-snug line-clamp-4">
                  {book.title}
                </p>
                <p className="font-mono text-[9px] text-[#5a5a72]">{book.author}</p>
              </div>
              <div className="w-full h-px bg-[#c9a84c]/40" />
            </div>
          )}

          {/* Hover overlay */}
          <div className={cn(
            'absolute inset-0 bg-gradient-to-t from-[#0f0f12]/90 via-transparent to-transparent',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            'flex flex-col justify-end p-3'
          )}>
            <p className="text-[10px] font-mono text-[#c9a84c]">View details →</p>
          </div>

          {/* Status badge — top left corner */}
          <div className="absolute top-1.5 left-1.5">
            <span className={cn(
              'px-1.5 py-0.5 text-[9px] rounded border font-mono leading-none',
              STATUS_COLORS[book.status]
            )}>
              {STATUS_LABELS[book.status]}
            </span>
          </div>
        </div>

        {/* ── Caption ─────────────────────────────────────────────────────── */}
        <div className="mt-2.5 px-0.5">
          <p className="text-[13px] font-medium text-[#e8e8f0] leading-snug line-clamp-2 group-hover:text-[#c9a84c] transition-colors">
            {book.title}
          </p>
          <p className="text-[11px] text-[#5a5a72] mt-0.5 line-clamp-1">
            {book.author}
          </p>
          {book.rating && (
            <p className="text-[10px] text-[#c9a84c] mt-0.5 font-mono tracking-wider">
              {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
            </p>
          )}
        </div>

      </article>
    </Link>
  );
}
