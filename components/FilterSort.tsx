/**
 * components/FilterSort.tsx — Filter & Sort Controls
 *
 * Client Component. Updates URL query params on change.
 * Receives initial values as props (from the Server Component).
 */

'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
// Pastikan import ini sesuai dengan file types Anda, hapus yang tidak perlu jika error
import type { BookStatus, SortField, SortOrder } from '@/lib/types';

interface FilterSortProps {
  categories:      string[];
  currentCategory: string;
  currentStatus:   string;
  currentSort:     string;
  currentOrder:    string;
}

export function FilterSort({
  categories,
  currentCategory,
  currentStatus,
  currentSort,
  currentOrder,
}: FilterSortProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // 1. Memecah kategori yang tergabung koma menjadi satuan dan menghapus duplikat
  const uniqueCategories = Array.from(
    new Set(
      categories.flatMap((cat) => 
        cat.split(',').map((c) => c.trim()).filter(Boolean)
      )
    )
  ).sort();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const [field, order] = e.target.value.split(':');
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', field);
    params.set('order', order);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // 2. Class styling untuk dropdown (INI YANG SEBELUMNYA HILANG/ERROR)
  const selectClass = `
    h-9 pl-3 pr-8 text-sm bg-[#1a1a1f] border border-[#2e2e3a]
    rounded-lg text-[#e8e8f0] appearance-none cursor-pointer
    hover:border-[#3d3d4d] focus:outline-none focus:border-[#c9a84c]
    transition-colors
  `;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Category filter */}
      <div className="relative">
        <select
          value={currentCategory}
          onChange={(e) => updateParam('category', e.target.value)}
          aria-label="Filter by category"
          className={selectClass}
        >
          <option value="">All genres</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <ChevronIcon />
      </div>

      {/* Status filter */}
      <div className="relative">
        <select
          value={currentStatus}
          onChange={(e) => updateParam('status', e.target.value)}
          aria-label="Filter by reading status"
          className={selectClass}
        >
          <option value="">All statuses</option>
          <option value="read">Read</option>
          <option value="reading">Reading</option>
          <option value="unread">Unread</option>
          <option value="wishlist">Wishlist</option>
        </select>
        <ChevronIcon />
      </div>

      {/* Sort */}
      <div className="relative">
        <select
          value={`${currentSort}:${currentOrder}`}
          onChange={handleSortChange}
          aria-label="Sort books"
          className={selectClass}
        >
          <option value="created_at:desc">Date added ↓</option>
          <option value="created_at:asc">Date added ↑</option>
          <option value="author:asc">Author A → Z</option>
          <option value="author:desc">Author Z → A</option>
          <option value="category:asc">Genre A → Z</option>
          <option value="title:asc">Title A → Z</option>
          <option value="rating:desc">Rating ↓</option>
          <option value="rating:asc">Rating ↑</option>
        </select>
        <ChevronIcon />
      </div>

    </div>
  );
}

function ChevronIcon() {
  return (
    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M1 1L5 5L9 1" stroke="#7c7c96" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}