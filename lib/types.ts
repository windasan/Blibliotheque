/**
 * lib/types.ts
 *
 * Shared TypeScript types derived from the Supabase schema.
 * Keep these in sync with supabase_setup.sql.
 *
 * Regenerate the full Database type with:
 *   npx supabase gen types typescript --project-id <id> > lib/types/database.ts
 */

// ── Enums ─────────────────────────────────────────────────────────────────────

export type BookStatus = 'unread' | 'reading' | 'read' | 'wishlist';

// ── JSONB Metadata ────────────────────────────────────────────────────────────

/**
 * Shape of the `metadata` JSONB column.
 * All fields are optional — the column stores whatever the admin enters.
 */
export interface BookMetadata {
  language?:        string;   // e.g. "English", "Portuguese"
  format?:          string;   // "Hardcover" | "Paperback" | "eBook" | "Audiobook"
  pages?:           number;
  publisher?:       string;
  published_year?:  number;
  purchase_price?:  number;
  currency?:        string;   // ISO 4217, e.g. "USD"
  shelf_location?:  string;   // e.g. "A-3" (row-column notation)
  edition?:         string;   // e.g. "2nd", "Anniversary"
  [key: string]:    unknown;  // allow arbitrary extra fields
}

// ── Core Entity ───────────────────────────────────────────────────────────────

export interface Book {
  id:             string;
  created_at:     string;   // ISO 8601 timestamp string from Supabase
  updated_at:     string;
  title:          string;
  author:         string;
  cover_url:      string | null;
  isbn:           string | null;
  category:       string[];
  status:         BookStatus;
  rating:         number | null;  // 1–5
  synopsis:       string | null;
  personal_notes: string | null;  // Markdown source
  metadata:       BookMetadata;
  file_url?: string | null;
}

// ── Derived / Partial Types ───────────────────────────────────────────────────

/** Fields required when creating a new book (id and timestamps are auto-generated) */
export type BookInsert = Omit<Book, 'id' | 'created_at' | 'updated_at'>;

/** Fields that can be updated */
export type BookUpdate = Partial<BookInsert>;

// ── Query Parameters ──────────────────────────────────────────────────────────

export type SortField = 'author' | 'category' | 'created_at' | 'title' | 'rating';
export type SortOrder = 'asc' | 'desc';

export interface BookFilters {
  search?:   string;      // matches title OR isbn
  category?: string;
  status?:   BookStatus;
  sort?:     SortField;
  order?:    SortOrder;
}

// ── Server Action Responses ───────────────────────────────────────────────────

export interface ActionResult<T = void> {
  data?:    T;
  error?:   string;
  success:  boolean;
}

// ── Supabase Database stub ────────────────────────────────────────────────────
// Replace with the generated output of `supabase gen types typescript`

export interface Database {
  public: {
    Tables: {
      books: {
        Row: Book;
        Insert: BookInsert;
        Update: BookUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      book_status: BookStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
