/**
 * app/admin/dashboard/page.tsx — Admin Books Table
 *
 * Server Component. Fetches ALL books (no pagination for personal library scale)
 * and renders a table with Edit and Delete quick actions.
 */

import type { Metadata }   from 'next';
import Link                from 'next/link';
import Image               from 'next/image';
import { createClient }    from '@/lib/supabase/server';
import { DeleteBookButton } from '@/components/admin/DeleteBookButton';
import { formatDate, formatRating, STATUS_LABELS, STATUS_COLORS, cn } from '@/lib/utils';
import { PlusCircle, BookOpen } from 'lucide-react';
import type { Book }       from '@/lib/types';

export const metadata: Metadata = { title: 'Dashboard' };

async function getAllBooks(): Promise<Book[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AdminDashboard] fetch error:', error.message);
    return [];
  }
  return (data ?? []) as Book[];
}

export default async function AdminDashboardPage() {
  const books = await getAllBooks();

  const stats = {
    total:    books.length,
    read:     books.filter(b => b.status === 'read').length,
    reading:  books.filter(b => b.status === 'reading').length,
    unread:   books.filter(b => b.status === 'unread').length,
    wishlist: books.filter(b => b.status === 'wishlist').length,
  };

  return (
    <div className="max-w-6xl">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-[#e8e8f0]">Collection</h1>
          <p className="text-sm text-[#5a5a72] mt-1 font-mono">{books.length} books total</p>
        </div>
        <Link
          href="/admin/dashboard/add"
          className="
            inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
            bg-[#c9a84c] text-[#0f0f12] hover:bg-[#d4b96a]
            transition-colors
          "
        >
          <PlusCircle size={15} />
          Add Book
        </Link>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Read',     value: stats.read     },
          { label: 'Reading',  value: stats.reading  },
          { label: 'Unread',   value: stats.unread   },
          { label: 'Wishlist', value: stats.wishlist },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-[#2e2e3a] bg-[#1a1a1f] px-4 py-3"
          >
            <p className="text-xs font-mono text-[#5a5a72] uppercase tracking-wider mb-1">{label}</p>
            <p className="font-display text-2xl text-[#c9a84c]">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {books.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2e2e3a] p-16 text-center">
          <BookOpen size={32} className="mx-auto text-[#3d3d4d] mb-3" />
          <p className="text-[#5a5a72] text-sm mb-4">No books yet.</p>
          <Link
            href="/admin/dashboard/add"
            className="text-sm text-[#c9a84c] hover:text-[#d4b96a] transition-colors"
          >
            Add your first book →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-[#2e2e3a] bg-[#141418] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2e2e3a]">
                  {['Cover', 'Title & Author', 'Category', 'Status', 'Rating', 'Added', 'Actions'].map(col => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-[10px] font-mono text-[#5a5a72] uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e3a]">
                {books.map((book) => (
                  <tr
                    key={book.id}
                    className="group hover:bg-[#1a1a1f] transition-colors"
                  >
                    {/* Cover thumbnail */}
                    <td className="px-4 py-3 w-14">
                      <div className="relative w-9 h-12 rounded-[2px] overflow-hidden border border-[#2e2e3a] bg-[#25252e] flex-shrink-0">
                        {book.cover_url ? (
                          <Image
                            src={book.cover_url}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen size={10} className="text-[#3d3d4d]" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Title + Author */}
                    <td className="px-4 py-3 min-w-[200px]">
                      <Link
                        href={`/book/${book.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#e8e8f0] hover:text-[#c9a84c] transition-colors line-clamp-1"
                      >
                        {book.title}
                      </Link>
                      <p className="text-[#5a5a72] text-xs mt-0.5 line-clamp-1">{book.author}</p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[#7c7c96] text-xs">{book.category}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn(
                        'px-2 py-0.5 text-[10px] rounded border font-mono',
                        STATUS_COLORS[book.status]
                      )}>
                        {STATUS_LABELS[book.status]}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[#c9a84c] font-mono text-[11px] tracking-wider">
                        {book.rating ? '★'.repeat(book.rating) : '—'}
                      </span>
                    </td>

                    {/* Date added */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[#5a5a72] font-mono text-xs">
                        {formatDate(book.created_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/dashboard/edit/${book.id}`}
                          className="
                            px-3 py-1.5 rounded-lg text-xs font-medium
                            border border-[#2e2e3a] text-[#a3a3bc]
                            hover:border-[#c9a84c] hover:text-[#c9a84c]
                            transition-colors
                          "
                        >
                          Edit
                        </Link>
                        <DeleteBookButton bookId={book.id} bookTitle={book.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
