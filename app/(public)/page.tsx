/**
 * app/(public)/page.tsx — Public Gallery Homepage
 *
 * Server Component. All data fetching, filtering, and sorting happen
 * server-side via Supabase query — zero client-side data fetching.
 *
 * URL search params drive state (shareable/bookmarkable URLs):
 *   ?search=dune
 *   ?category=Fiction
 *   ?status=read
 *   ?sort=author&order=asc
 *   ?sort=category&order=asc
 *   ?sort=created_at&order=desc
 */

import type { Metadata }          from 'next';
import Link                       from 'next/link';
import { createClient }           from '@/lib/supabase/server';
import { BookCard }               from '@/components/BookCard';
import { SearchBar }              from '@/components/SearchBar';
import { FilterSort }             from '@/components/FilterSort';
import type { Book, SortField, SortOrder, BookStatus } from '@/lib/types';

export const metadata: Metadata = {
  title: 'The Library',
  description: 'A personal curated book collection.',
};

// Revalidate every 60 s so new books appear quickly without a full rebuild
export const revalidate = 60;

// ── Types ──────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: {
    search?:   string;
    category?: string;
    status?:   string;
    sort?:     string;
    order?:    string;
  };
}

// ── Valid values (whitelist to prevent injection) ─────────────────────────────

const VALID_SORT_FIELDS  = new Set<SortField>(['author', 'category', 'created_at', 'title', 'rating']);
const VALID_SORT_ORDERS  = new Set<SortOrder>(['asc', 'desc']);
const VALID_STATUSES     = new Set<BookStatus>(['unread', 'reading', 'read', 'wishlist']);

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getBooks(params: PageProps['searchParams']): Promise<{
  books: Book[];
  categories: string[];
  total: number;
}> {
  const supabase = createClient();

  // ── Sanitise / whitelist all incoming params ──────────────────────────────
  const search   = params.search?.slice(0, 200).trim()   ?? '';
  const category = params.category?.slice(0, 100).trim() ?? '';
  const status   = VALID_STATUSES.has(params.status as BookStatus)
    ? (params.status as BookStatus)
    : null;
  const sortField: SortField = VALID_SORT_FIELDS.has(params.sort as SortField)
    ? (params.sort as SortField)
    : 'created_at';
  const sortOrder: SortOrder = VALID_SORT_ORDERS.has(params.order as SortOrder)
    ? (params.order as SortOrder)
    : 'desc';

  // ── Build the query ───────────────────────────────────────────────────────
  let query = supabase
    .from('books')
    .select('*', { count: 'exact' });

  // Search: title OR isbn using ilike (backed by trigram index)
  if (search) {
    query = query.or(`title.ilike.%${search}%,isbn.ilike.%${search}%`);
  }

  // Category filter (case-insensitive exact match)
  // Category filter (mencari kata di dalam teks)
  if (category) {
    query = query.ilike('category', `%${category}%`);
  }

  // Status filter
  if (status) {
    query = query.eq('status', status);
  }

  // ── Sorting ───────────────────────────────────────────────────────────────
  //
  // Sort options:
  //   author    → alphabetical A-Z (or Z-A)
  //   category  → alphabetical (same as genre)
  //   created_at→ date added (newest or oldest first)
  //   title     → alphabetical by title
  //   rating    → highest or lowest first (NULLs always last)
  //
  query = query.order(sortField, {
    ascending: sortOrder === 'asc',
    nullsFirst: false,
  });

  // Secondary sort to stabilise ordering when primary field has ties
  if (sortField !== 'created_at') {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[getBooks]', error.message);
    return { books: [], categories: [], total: 0 };
  }

  // ── Derive distinct category list for the filter UI ───────────────────────
  // We do this from the full result set (not a separate query) to keep it
  // in-sync with the current data without an extra round-trip.
  // For large libraries (1000+ books), consider a separate `.select('category')` query.
  const categoriesTable = supabase.from('books') as unknown as {
    select: (columns: string) => Promise<{ data: Array<Pick<Book, 'category'>> | null }>;
  };

  const { data: allCategories } = await categoriesTable.select('category');

  const categories = Array.from(
    new Set((allCategories ?? []).map((b) => b.category).filter(Boolean))
  ).sort();

  return {
    books:      (data ?? []) as Book[],
    categories,
    total:      count ?? 0,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage({ searchParams }: PageProps) {
  const { books, categories, total } = await getBooks(searchParams);

  const hasFilters = !!(searchParams.search || searchParams.category || searchParams.status);

  return (
    <div className="min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#2e2e3a] bg-[#0f0f12]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="page-column flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            {/* Decorative book spine icon */}
            <div className="w-1 h-7 bg-gradient-to-b from-[#c9a84c] to-[#7a5200] rounded-full" />
            <span className="font-display text-xl text-[#e8e8f0] tracking-tight">
              The Library
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-[#5a5a72]">
            <span className="font-mono text-[#c9a84c]">{total}</span>
            <span>{total === 1 ? 'book' : 'books'}</span>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="page-column pt-16 pb-10">
        <div className="max-w-xl">
          <p className="text-xs font-mono tracking-[0.2em] text-[#c9a84c] uppercase mb-3">
            Personal Collection
          </p>
          <h1 className="font-display text-5xl sm:text-6xl text-[#e8e8f0] leading-none mb-4">
            My<br />Reading<br />Shelf.
          </h1>
          <p className="text-[#7c7c96] text-base leading-relaxed max-w-sm">
            A curated record of every book I own, am reading, or want to read —
            with personal notes and annotations.
          </p>
        </div>
      </section>

      {/* ── Search + Filter bar ───────────────────────────────────────────── */}
      <div className="page-column pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <SearchBar defaultValue={searchParams.search ?? ''} />
          <FilterSort
            categories={categories}
            currentCategory={searchParams.category ?? ''}
            currentStatus={searchParams.status ?? ''}
            currentSort={searchParams.sort ?? 'created_at'}
            currentOrder={searchParams.order ?? 'desc'}
          />
        </div>
      </div>

      {/* ── Book Grid ─────────────────────────────────────────────────────── */}
      <main className="page-column pb-24">
        {books.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            {/* Result count when filtering */}
            {hasFilters && (
              <p className="text-sm text-[#5a5a72] mb-6 font-mono">
                {total} result{total !== 1 ? 's' : ''}
                {searchParams.search && (
                  <> for &ldquo;<span className="text-[#c9a84c]">{searchParams.search}</span>&rdquo;</>
                )}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {books.map((book, i) => (
                <BookCard
                  key={book.id}
                  book={book}
                  priority={i < 6}   // LCP optimisation: preload first row
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#2e2e3a] py-8">
        <div className="page-column flex items-center justify-between text-xs text-[#3d3d4d] font-mono">
          <span>© {new Date().getFullYear()} Personal Library</span>
          <Link href="/admin/login" className="hover:text-[#5a5a72] transition-colors">
            admin ↗
          </Link>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-component: EmptyState ─────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="text-6xl mb-4 opacity-20 font-display">📚</div>
      {hasFilters ? (
        <>
          <p className="text-[#7c7c96] text-base mb-2">No books match your filters.</p>
          <Link
            href="/"
            className="text-sm text-[#c9a84c] hover:text-[#d4b96a] transition-colors"
          >
            Clear all filters →
          </Link>
        </>
      ) : (
        <p className="text-[#5a5a72] text-base">
          The library is empty.{' '}
          <Link href="/admin/dashboard/add" className="text-[#c9a84c]">
            Add your first book
          </Link>
        </p>
      )}
    </div>
  );
}
