/**
 * actions/books.ts — Book Server Actions
 *
 * All mutations go through here. Each action:
 * 1. Validates the incoming FormData defensively
 * 2. Authenticates the caller (double-checks session even though
 * middleware already guards /admin routes — belt-and-suspenders)
 * 3. Handles Supabase Storage upload where applicable
 * 4. Performs the database operation
 * 5. Revalidates relevant Next.js cache paths
 * 6. Returns a typed ActionResult (never throws to the client)
 *
 * NOTE: "use server" makes these callable from Client Components too,
 * but they always run on the server — env secrets and service calls
 * never reach the browser.
 */

'use server';

import { revalidatePath }         from 'next/cache';
import { createClient }           from '@/lib/supabase/server';
import { sanitiseFilename, getErrorMessage } from '@/lib/utils';
import type { ActionResult, BookMetadata, BookStatus, Database, Book } from '@/lib/types';

// ── Internal: session guard ───────────────────────────────────────────────────

async function requireAuth() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('Unauthorised: you must be signed in to perform this action.');
  }
  return { supabase, session };
}

// ── Internal: parse & validate rating ────────────────────────────────────────

function parseRating(raw: FormDataEntryValue | null): number | null {
  if (!raw || raw === '') return null;
  const n = parseInt(String(raw), 10);
  if (isNaN(n) || n < 1 || n > 5) return null;
  return n;
}

// ── addBook ───────────────────────────────────────────────────────────────────

export async function addBook(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAuth();

    // ── 1. Extract & validate required fields ──────────────────────────────
    const title    = formData.get('title')?.toString().trim();
    const author   = formData.get('author')?.toString().trim();
    // Menangkap "Fiksi, Edukasi" sebagai satu string
    const category = formData.get('category')?.toString().trim(); 
    const status   = formData.get('status')?.toString() as BookStatus | undefined;

    if (!title || !author || !category || !status) {
      return { success: false, error: 'Title, author, category, and status are required.' };
    }

    const validStatuses: BookStatus[] = ['unread', 'reading', 'read', 'wishlist'];
    if (!validStatuses.includes(status)) {
      return { success: false, error: `Invalid status: "${status}".` };
    }

    // ── 2. Optional simple fields ──────────────────────────────────────────
    const isbn          = formData.get('isbn')?.toString().trim()          || null;
    const synopsis      = formData.get('synopsis')?.toString().trim()      || null;
    const personal_notes = formData.get('personal_notes')?.toString().trim() || null;
    const rating        = parseRating(formData.get('rating'));

    // ── 3. Build the JSONB metadata object ────────────────────────────────
    const metadata: BookMetadata = {};

    const metaStr = (key: string) => {
      const v = formData.get(key)?.toString().trim();
      return v || undefined;
    };
    const metaNum = (key: string) => {
      const v = formData.get(key)?.toString().trim();
      if (!v) return undefined;
      const n = parseFloat(v);
      return isNaN(n) ? undefined : n;
    };

    const language       = metaStr('meta_language');
    const format         = metaStr('meta_format');
    const publisher      = metaStr('meta_publisher');
    const currency       = metaStr('meta_currency');
    const shelfLocation  = metaStr('meta_shelf_location');
    const edition        = metaStr('meta_edition');
    const pages          = metaNum('meta_pages');
    const publishedYear  = metaNum('meta_published_year');
    const purchasePrice  = metaNum('meta_purchase_price');

    if (language)      metadata.language       = language;
    if (format)        metadata.format         = format;
    if (publisher)     metadata.publisher      = publisher;
    if (currency)      metadata.currency       = currency;
    if (shelfLocation) metadata.shelf_location = shelfLocation;
    if (edition)       metadata.edition        = edition;
    if (pages)         metadata.pages          = pages;
    if (publishedYear) metadata.published_year = publishedYear;
    if (purchasePrice) metadata.purchase_price = purchasePrice;

    // ── 4a. Handle cover image upload to Supabase Storage ─────────────────
    let cover_url: string | null = null;
    const coverFile = formData.get('cover_image');

    if (coverFile instanceof File && coverFile.size > 0) {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimes.includes(coverFile.type)) {
        return { success: false, error: 'Cover image must be JPEG, PNG, WebP, or GIF.' };
      }
      if (coverFile.size > 3 * 1024 * 1024) {
        return { success: false, error: 'Cover image must be under 3 MB.' };
      }

      const ext      = coverFile.name.split('.').pop() ?? 'jpg';
      const baseName = sanitiseFilename(title).slice(0, 60);
      const filename = `covers/${baseName}-${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(filename, coverFile, {
          contentType: coverFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[addBook] Storage upload error:', uploadError.message);
        return { success: false, error: `Cover upload failed: ${uploadError.message}` };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('book-covers')
        .getPublicUrl(uploadData.path);

      cover_url = publicUrl;
    }

    // ── 4b. Handle book file (PDF/EPUB) upload to Supabase Storage ────────
    let file_url: string | null = null;
    const bookFile = formData.get('book_file');

    if (bookFile instanceof File && bookFile.size > 0) {
      const allowedFileMimes = ['application/pdf', 'application/epub+zip'];
      if (!allowedFileMimes.includes(bookFile.type)) {
        return { success: false, error: 'File buku harus berformat PDF atau EPUB.' };
      }
      if (bookFile.size > 20 * 1024 * 1024) { // Batas 20MB
        return { success: false, error: 'File buku tidak boleh lebih dari 20 MB.' };
      }

      const ext      = bookFile.name.split('.').pop() ?? 'pdf';
      const baseName = sanitiseFilename(title).slice(0, 60);
      const filename = `files/${baseName}-${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('book-files')
        .upload(filename, bookFile, {
          contentType: bookFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[addBook] Book file upload error:', uploadError.message);
        return { success: false, error: `Gagal upload buku: ${uploadError.message}` };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('book-files')
        .getPublicUrl(uploadData.path);

      file_url = publicUrl;
    }

    // ── 5. Insert into the books table ────────────────────────────────────
    const payload: Database['public']['Tables']['books']['Insert'] = {
      title,
      author,
      category,
      status,
      isbn,
      synopsis,
      personal_notes,
      rating,
      cover_url,
      file_url,
      metadata,
    };

    const booksTable = supabase.from('books') as unknown as {
      insert: (values: Database['public']['Tables']['books']['Insert']) => {
        select: (columns: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> };
      };
    };

    const { data, error: insertError } = await booksTable
      .insert(payload)
      .select('id')
      .single();

    if (insertError) {
      console.error('[addBook] Insert error:', insertError.message);
      // Clean up jika database insert gagal
      if (cover_url) {
        const path = cover_url.split('/book-covers/')[1];
        if (path) await supabase.storage.from('book-covers').remove([path]);
      }
      if (file_url) {
        const path = file_url.split('/book-files/')[1];
        if (path) await supabase.storage.from('book-files').remove([path]);
      }
      return { success: false, error: insertError.message };
    }

    if (!data?.id) {
      return { success: false, error: 'Insert succeeded but no book ID was returned.' };
    }

    // ── 6. Invalidate Next.js cache ───────────────────────────────────────
    revalidatePath('/');                     
    revalidatePath('/admin/dashboard');      

    return { success: true, data: { id: data.id } };

  } catch (err) {
    return { success: false, error: getErrorMessage(err) };
  }
}

// ── updateBook ────────────────────────────────────────────────────────────────

export async function updateBook(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAuth();

    const id = formData.get('id')?.toString();
    if (!id) return { success: false, error: 'Book ID is required for update.' };

    const existingTable = supabase.from('books') as unknown as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: Pick<Book, 'cover_url' | 'file_url'> | null; error: { message: string } | null }>;
        };
      };
    };

    const { data: existing, error: fetchError } = await existingTable
      .select('cover_url, file_url')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'Book not found.' };
    }

    const title    = formData.get('title')?.toString().trim();
    const author   = formData.get('author')?.toString().trim();
    // DIKEMBALIKAN KE STRING BIASA DI SINI:
    const category = formData.get('category')?.toString().trim(); 
    const status   = formData.get('status')?.toString() as BookStatus | undefined;

    if (!title || !author || !category || !status) {
      return { success: false, error: 'Title, author, category, and status are required.' };
    }

    const validStatuses: BookStatus[] = ['unread', 'reading', 'read', 'wishlist'];
    if (!validStatuses.includes(status)) {
      return { success: false, error: `Invalid status: "${status}".` };
    }

    const isbn           = formData.get('isbn')?.toString().trim()           || null;
    const synopsis       = formData.get('synopsis')?.toString().trim()       || null;
    const personal_notes = formData.get('personal_notes')?.toString().trim() || null;
    const rating         = parseRating(formData.get('rating'));

    // Rebuild metadata
    const metadata: BookMetadata = {};
    const metaStr = (key: string) => formData.get(key)?.toString().trim() || undefined;
    const metaNum = (key: string) => {
      const v = formData.get(key)?.toString().trim();
      if (!v) return undefined;
      const n = parseFloat(v);
      return isNaN(n) ? undefined : n;
    };

    const mLanguage = metaStr('meta_language');       if (mLanguage)  metadata.language       = mLanguage;
    const mFormat   = metaStr('meta_format');         if (mFormat)    metadata.format         = mFormat;
    const mPub      = metaStr('meta_publisher');      if (mPub)       metadata.publisher      = mPub;
    const mCurr     = metaStr('meta_currency');       if (mCurr)      metadata.currency       = mCurr;
    const mShelf    = metaStr('meta_shelf_location'); if (mShelf)     metadata.shelf_location = mShelf;
    const mEdition  = metaStr('meta_edition');        if (mEdition)   metadata.edition        = mEdition;
    const mPages    = metaNum('meta_pages');          if (mPages)     metadata.pages          = mPages;
    const mYear     = metaNum('meta_published_year'); if (mYear)      metadata.published_year = mYear;
    const mPrice    = metaNum('meta_purchase_price'); if (mPrice)     metadata.purchase_price = mPrice;

    // Handle new cover image
    let cover_url = existing.cover_url;
    const coverFile = formData.get('cover_image');

    if (coverFile instanceof File && coverFile.size > 0) {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimes.includes(coverFile.type)) return { success: false, error: 'Cover image must be JPEG, PNG, WebP, or GIF.' };
      if (coverFile.size > 3 * 1024 * 1024) return { success: false, error: 'Cover image must be under 3 MB.' };

      const ext      = coverFile.name.split('.').pop() ?? 'jpg';
      const baseName = sanitiseFilename(title!).slice(0, 60);
      const filename = `covers/${baseName}-${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(filename, coverFile, { contentType: coverFile.type, upsert: false });

      if (uploadError) return { success: false, error: `Cover upload failed: ${uploadError.message}` };

      // Delete old cover
      if (existing.cover_url) {
        const oldPath = existing.cover_url.split('/book-covers/')[1];
        if (oldPath) await supabase.storage.from('book-covers').remove([oldPath]).catch(console.warn);
      }

      const { data: { publicUrl } } = supabase.storage.from('book-covers').getPublicUrl(uploadData.path);
      cover_url = publicUrl;
    }

    // Handle new book file (PDF/EPUB)
    let file_url = existing.file_url;
    const bookFile = formData.get('book_file');

    if (bookFile instanceof File && bookFile.size > 0) {
      const allowedFileMimes = ['application/pdf', 'application/epub+zip'];
      if (!allowedFileMimes.includes(bookFile.type)) return { success: false, error: 'File buku harus berformat PDF atau EPUB.' };
      if (bookFile.size > 20 * 1024 * 1024) return { success: false, error: 'File buku tidak boleh lebih dari 20 MB.' };

      const ext      = bookFile.name.split('.').pop() ?? 'pdf';
      const baseName = sanitiseFilename(title!).slice(0, 60);
      const filename = `files/${baseName}-${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('book-files')
        .upload(filename, bookFile, { contentType: bookFile.type, upsert: false });

      if (uploadError) return { success: false, error: `Gagal upload buku: ${uploadError.message}` };

      // Delete old book file
      if (existing.file_url) {
        const oldPath = existing.file_url.split('/book-files/')[1];
        if (oldPath) await supabase.storage.from('book-files').remove([oldPath]).catch(console.warn);
      }

      const { data: { publicUrl } } = supabase.storage.from('book-files').getPublicUrl(uploadData.path);
      file_url = publicUrl;
    }

    const updatePayload: Database['public']['Tables']['books']['Update'] = {
      title,
      author,
      category,
      status,
      isbn,
      synopsis,
      personal_notes,
      rating,
      cover_url,
      file_url,
      metadata,
    };

    const booksUpdateTable = supabase.from('books') as unknown as {
      update: (values: Database['public']['Tables']['books']['Update']) => {
        eq: (column: string, value: string) => {
          select: (columns: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> };
        };
      };
    };

    const { data, error: updateError } = await booksUpdateTable
      .update(updatePayload)
      .eq('id', id)
      .select('id')
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    if (!data?.id) {
      return { success: false, error: 'Update succeeded but no book ID was returned.' };
    }

    revalidatePath('/');
    revalidatePath(`/book/${id}`);
    revalidatePath('/admin/dashboard');

    return { success: true, data: { id: data.id } };

  } catch (err) {
    return { success: false, error: getErrorMessage(err) };
  }
}

// ── deleteBook ────────────────────────────────────────────────────────────────

export async function deleteBook(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAuth();

    if (!id) return { success: false, error: 'Book ID is required.' };

    const deleteFetchTable = supabase.from('books') as unknown as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: Pick<Book, 'cover_url' | 'file_url'> | null; error: { message: string } | null }>;
        };
      };
    };

    const { data: book, error: fetchError } = await deleteFetchTable
      .select('cover_url, file_url')
      .eq('id', id)
      .single();

    if (fetchError || !book) return { success: false, error: 'Book not found.' };

    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (deleteError) return { success: false, error: deleteError.message };

    if (book?.cover_url) {
      const path = book.cover_url.split('/book-covers/')[1];
      if (path) {
        await supabase.storage.from('book-covers').remove([path]).catch(console.warn);
      }
    }

    if (book?.file_url) {
      const path = book.file_url.split('/book-files/')[1];
      if (path) {
        await supabase.storage.from('book-files').remove([path]).catch(console.warn);
      }
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');

    return { success: true };

  } catch (err) {
    return { success: false, error: getErrorMessage(err) };
  }
}