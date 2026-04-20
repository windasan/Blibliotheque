/**
 * components/SearchBar.tsx — Instant Search
 *
 * Client Component. Uses useRouter + usePathname to update the ?search=
 * query param without a full page reload. Debounced 300 ms to avoid
 * hammering the server on every keystroke.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  defaultValue: string;
}

export function SearchBar({ defaultValue }: SearchBarProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(defaultValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync with URL if user navigates back/forward
  useEffect(() => {
    setValue(searchParams.get('search') ?? '');
  }, [searchParams]);

  const updateSearch = useCallback((term: string) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set('search', term);
      } else {
        params.delete('search');
      }
      // Preserve other params (category, sort, etc.)
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
  }, [router, pathname, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    updateSearch(e.target.value);
  };

  const handleClear = () => {
    setValue('');
    updateSearch('');
  };

  return (
    <div className="relative flex-1 max-w-md">
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a72] pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Search by title or ISBN…"
        aria-label="Search books"
        className="
          w-full h-10 pl-9 pr-9 rounded-lg text-sm
          bg-[#1a1a1f] border border-[#2e2e3a]
          text-[#e8e8f0] placeholder:text-[#3d3d4d]
          focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/30
          transition-colors
        "
      />
      {value && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a72] hover:text-[#e8e8f0] transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
