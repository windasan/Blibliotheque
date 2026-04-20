/**
 * lib/utils.ts — Shared utility functions
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { BookStatus } from '@/lib/types';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a Supabase ISO timestamp to a readable date */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  });
}

/** Return a star string for a rating (e.g. 4 → "★★★★☆") */
export function formatRating(rating: number | null): string {
  if (!rating) return '—';
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

/** Human-readable label for each status */
export const STATUS_LABELS: Record<BookStatus, string> = {
  unread:   'Unread',
  reading:  'Reading',
  read:     'Read',
  wishlist: 'Wishlist',
};

/** Tailwind classes for each status badge */
export const STATUS_COLORS: Record<BookStatus, string> = {
  unread:   'bg-zinc-800 text-zinc-400 border-zinc-700',
  reading:  'bg-amber-950 text-amber-400 border-amber-800',
  read:     'bg-emerald-950 text-emerald-400 border-emerald-800',
  wishlist: 'bg-indigo-950 text-indigo-400 border-indigo-800',
};

/** Sanitise a filename for storage upload */
export function sanitiseFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-');
}

/** Extract a human-readable error message from an unknown thrown value */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred.';
}

/** Build a public Supabase Storage URL */
export function storageUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
