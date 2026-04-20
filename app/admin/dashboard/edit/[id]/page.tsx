/**
 * app/admin/dashboard/edit/[id]/page.tsx — Edit Book
 *
 * Server Component. Fetches the book and passes it to the shared BookForm
 * in "edit" mode so all fields are pre-filled.
 */

import type { Metadata }  from 'next';
import Link               from 'next/link';
import { notFound }       from 'next/navigation';
import { createClient }   from '@/lib/supabase/server';
import { BookForm }       from '@/components/admin/BookForm';
import { updateBook }     from '@/actions/books';
import { ArrowLeft }      from 'lucide-react';
import type { Book }      from '@/lib/types';

export const metadata: Metadata = { title: 'Edit Book' };

async function getBook(id: string): Promise<Book | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Book;
}

export default async function EditBookPage({
  params,
}: {
  params: { id: string };
}) {
  const book = await getBook(params.id);
  if (!book) notFound();

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[#5a5a72] hover:text-[#c9a84c] transition-colors font-mono mb-4"
        >
          <ArrowLeft size={13} />
          Back to dashboard
        </Link>
        <h1 className="font-display text-3xl text-[#e8e8f0]">Edit Book</h1>
        <p className="text-sm text-[#5a5a72] mt-1 font-mono truncate">{book.title}</p>
      </div>

      <BookForm action={updateBook} mode="edit" book={book} />
    </div>
  );
}
