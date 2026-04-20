/**
 * components/admin/DeleteBookButton.tsx
 *
 * Client Component. Shows a "Delete" button that, when clicked, reveals
 * an inline "Confirm / Cancel" prompt to prevent accidental deletions.
 * Calls the deleteBook Server Action and refreshes the router on success.
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter }               from 'next/navigation';
import { Loader2 }                 from 'lucide-react';
import { deleteBook }              from '@/actions/books';

interface DeleteBookButtonProps {
  bookId:    string;
  bookTitle: string;
}

export function DeleteBookButton({ bookId, bookTitle }: DeleteBookButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteBook(bookId);
      if (!result.success) {
        setError(result.error ?? 'Delete failed.');
        setConfirming(false);
        return;
      }
      router.refresh();
    });
  };

  if (error) {
    return (
      <span className="text-xs text-red-400 font-mono">{error}</span>
    );
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-xs text-[#7c7c96] font-mono">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="
            px-2.5 py-1 rounded text-xs font-medium
            bg-red-950/60 text-red-400 border border-red-900/60
            hover:bg-red-900/60 disabled:opacity-50
            transition-colors inline-flex items-center gap-1
          "
        >
          {isPending && <Loader2 size={10} className="animate-spin" />}
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="px-2.5 py-1 rounded text-xs text-[#5a5a72] border border-[#2e2e3a] hover:text-[#a3a3bc] transition-colors"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${bookTitle}`}
      className="
        px-3 py-1.5 rounded-lg text-xs font-medium
        border border-[#2e2e3a] text-[#5a5a72]
        hover:border-red-900/60 hover:text-red-400
        transition-colors
      "
    >
      Delete
    </button>
  );
}
