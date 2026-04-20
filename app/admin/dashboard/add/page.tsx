/**
 * app/admin/dashboard/add/page.tsx — Add New Book
 */

import type { Metadata } from 'next';
import Link              from 'next/link';
import { BookForm }      from '@/components/admin/BookForm';
import { addBook }       from '@/actions/books';
import { ArrowLeft }     from 'lucide-react';

export const metadata: Metadata = { title: 'Add Book' };

export default function AddBookPage() {
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
        <h1 className="font-display text-3xl text-[#e8e8f0]">Add New Book</h1>
        <p className="text-sm text-[#5a5a72] mt-1">Fill in the details below. Only Title, Author, Category, and Status are required.</p>
      </div>

      <BookForm action={addBook} mode="add" />
    </div>
  );
}
