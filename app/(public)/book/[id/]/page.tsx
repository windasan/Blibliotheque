/**
 * app/(public)/book/[id]/page.tsx — Book Detail Page
 */

import type { Metadata }          from 'next';
import Image                      from 'next/image';
import Link                       from 'next/link';
import { notFound }               from 'next/navigation';
import { MDXRemote }              from 'next-mdx-remote/rsc';
import { createClient }           from '@/lib/supabase/server';
import { formatDate, formatRating, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';
import { cn }                     from '@/lib/utils';
import type { Book }              from '@/lib/types';
import { BookOpen }               from 'lucide-react'; // Tambahkan icon

// ── Dynamic metadata ───────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const book = await getBook(params.id);
  if (!book) return { title: 'Book not found' };
  return {
    title: `${book.title} — ${book.author}`,
    description: book.synopsis ?? `A book by ${book.author}`,
  };
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getBook(id: string): Promise<Book | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.log("DEBUG: ID bukan format UUID yang valid:", id);
    return null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // Pesan ini akan muncul di Terminal VS Code kamu, bukan di browser
    console.error("DEBUG SUPABASE ERROR:", error.message, "Code:", error.code);
    return null;
  }

  if (!data) {
    console.log("DEBUG: Data tidak ditemukan untuk ID:", id);
    return null;
  }

  return data as Book;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BookDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const book = await getBook(params.id);
  if (!book) notFound();

  const meta = book.metadata ?? {};

  return (
    <div className="min-h-screen">

      {/* Back nav */}
      <div className="page-column pt-8 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#5a5a72] hover:text-[#c9a84c] transition-colors font-mono"
        >
          ← Back to library
        </Link>
      </div>

      <main className="page-column pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 lg:gap-16">

          {/* ── Left column: Cover + quick metadata ───────────────────────── */}
          <div className="space-y-6">

            {/* Cover */}
            <div className="relative w-full max-w-[280px] aspect-[2/3] rounded-[4px] overflow-hidden shadow-book border border-[#2e2e3a] bg-[#1a1a1f]">
              {book.cover_url ? (
                <Image
                  src={book.cover_url}
                  alt={`Cover of ${book.title}`}
                  fill
                  className="object-cover"
                  sizes="280px"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-end p-4">
                  <span className="font-display text-sm text-[#5a5a72] leading-snug">
                    {book.title}
                  </span>
                </div>
              )}
            </div>

            {/* ── TOMBOL BACA BUKU ── */}
            {/* Menggunakan casting 'as any' untuk file_url jika kamu belum update lib/types.ts */}
            {(book as any).file_url && (
              <a 
                href={(book as any).file_url}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#c9a84c] hover:bg-[#d4b96a] text-[#0f0f12] font-bold rounded-lg transition-colors shadow-lg"
              >
                <BookOpen size={18} />
                Baca Buku
              </a>
            )}

            {/* Status + Rating */}
            <div className="flex flex-wrap gap-2">
              <span className={cn(
                'px-2.5 py-1 text-xs rounded border font-mono',
                STATUS_COLORS[book.status]
              )}>
                {STATUS_LABELS[book.status]}
              </span>
              {book.rating && (
                <span className="px-2.5 py-1 text-xs rounded border bg-[#3d2800] text-[#c9a84c] border-[#5c3d00] font-mono tracking-wider">
                  {formatRating(book.rating)}
                </span>
              )}
            </div>

            {/* Metadata table */}
            <div className="space-y-2.5">
              <MetaRow label="ISBN"      value={book.isbn} />
              <MetaRow label="Category"  value={book.category} />
              <MetaRow label="Added"     value={formatDate(book.created_at)} />
              <MetaRow label="Language"  value={meta.language} />
              <MetaRow label="Format"    value={meta.format} />
              <MetaRow label="Pages"     value={meta.pages?.toString()} />
              <MetaRow label="Publisher" value={meta.publisher} />
              <MetaRow label="Published" value={meta.published_year?.toString()} />
              <MetaRow label="Edition"   value={meta.edition} />
              <MetaRow label="Shelf"     value={meta.shelf_location} />
              {meta.purchase_price != null && (
                <MetaRow
                  label="Paid"
                  value={`${meta.currency ?? ''}${meta.purchase_price.toFixed(2)}`}
                />
              )}
            </div>
          </div>

          {/* ── Right column: Content ──────────────────────────────────────── */}
          <div className="space-y-10 min-w-0">

            {/* Title block */}
            <div>
              <h1 className="font-display text-4xl sm:text-5xl text-[#e8e8f0] leading-tight mb-2">
                {book.title}
              </h1>
              <p className="text-[#7c7c96] text-lg">{book.author}</p>
            </div>

            {/* Synopsis */}
            {book.synopsis && (
              <section>
                <SectionLabel>Synopsis</SectionLabel>
                <p className="text-[#a3a3bc] leading-relaxed text-base">
                  {book.synopsis}
                </p>
              </section>
            )}

            {/* Personal notes (Markdown → MDX) */}
            {book.personal_notes && (
              <section>
                <SectionLabel>Personal Notes</SectionLabel>
                <div className="prose prose-sm max-w-none mt-4
                  prose-headings:font-display
                  prose-headings:text-[#e8e8f0]
                  prose-p:text-[#a3a3bc]
                  prose-strong:text-[#e8e8f0]
                  prose-a:text-[#c9a84c]
                  prose-blockquote:border-[#c9a84c]
                  prose-blockquote:text-[#7c7c96]
                  prose-code:text-[#c9a84c]
                  prose-pre:bg-[#1f1f26]
                  prose-pre:border
                  prose-pre:border-[#2e2e3a]
                  prose-hr:border-[#2e2e3a]
                  prose-li:text-[#a3a3bc]
                ">
                  <MDXRemote source={book.personal_notes} />
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm border-b border-[#2e2e3a] pb-2">
      <span className="text-[#5a5a72] font-mono text-xs uppercase tracking-wider">{label}</span>
      <span className="text-[#a3a3bc] text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-mono tracking-[0.15em] text-[#c9a84c] uppercase">
        {children}
      </span>
      <div className="flex-1 h-px bg-[#2e2e3a]" />
    </div>
  );
}