-- ============================================================================
-- PERSONAL LIBRARY — SUPABASE COMPLETE SETUP
-- ============================================================================
-- Run this entire file in:
--   Supabase Dashboard → SQL Editor → New Query → Run
--
-- Execution order:
--   1. Extensions
--   2. Custom ENUM type
--   3. Books table + indexes
--   4. updated_at trigger
--   5. Row Level Security (RLS) + policies
--   6. Storage bucket for cover images
--   7. Optional seed data
-- ============================================================================


-- ── 1. EXTENSIONS ────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";   -- gen_random_uuid() fallback
create extension if not exists "pg_trgm";    -- trigram index for fast ILIKE search on title/isbn


-- ── 2. CUSTOM ENUM TYPE ───────────────────────────────────────────────────────

-- Drop and recreate safely (idempotent with DO block)
do $$ begin
  create type public.book_status as enum (
    'unread',
    'reading',
    'read',
    'wishlist'
  );
exception
  when duplicate_object then null;  -- already exists, skip
end $$;


-- ── 3. BOOKS TABLE ────────────────────────────────────────────────────────────

create table if not exists public.books (
  -- ── Identity ──────────────────────────────────────────────────────────────
  id            uuid          primary key default gen_random_uuid(),
  created_at    timestamptz   not null    default now(),
  updated_at    timestamptz   not null    default now(),

  -- ── Core fields ───────────────────────────────────────────────────────────
  title         text          not null,
  author        text          not null,
  cover_url     text,                       -- Supabase Storage public URL
  isbn          text,                       -- nullable: not all books have ISBNs

  -- ── Classification ────────────────────────────────────────────────────────
  category      text          not null,     -- e.g. "Computer Science", "Fiction"
  status        public.book_status not null default 'unread',

  -- ── Review ────────────────────────────────────────────────────────────────
  rating        smallint      check (rating between 1 and 5),
  synopsis      text,
  personal_notes text,                      -- stored as Markdown, rendered via MDX

  -- ── Flexible metadata (JSONB) ─────────────────────────────────────────────
  -- Examples of what to store here:
  --   { "language": "English", "format": "Hardcover", "pages": 423,
  --     "publisher": "O'Reilly", "published_year": 2019,
  --     "purchase_price": 34.99, "currency": "USD",
  --     "shelf_location": "A-3", "edition": "2nd" }
  metadata      jsonb         not null      default '{}',

  -- ── Constraints ───────────────────────────────────────────────────────────
  constraint books_title_not_empty   check (char_length(title)  > 0),
  constraint books_author_not_empty  check (char_length(author) > 0),
  constraint books_category_not_empty check (char_length(category) > 0),
  -- ISBN: allow NULL, but if provided must be 10 or 13 digits (stripped of dashes)
  constraint books_isbn_format check (
    isbn is null
    or isbn ~ '^\d{10}$'
    or isbn ~ '^\d{13}$'
    or isbn ~ '^\d{3}-\d{10}$'
    or isbn ~ '^\d{1}-\d{3}-\d{5}-\d{1}$'
  )
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- Public gallery: sort by created_at desc (most recently added first)
create index if not exists idx_books_created_at
  on public.books (created_at desc);

-- Sort by author A-Z
create index if not exists idx_books_author
  on public.books (lower(author) asc);

-- Filter by category
create index if not exists idx_books_category
  on public.books (lower(category));

-- Filter by status
create index if not exists idx_books_status
  on public.books (status);

-- Fast full-text ILIKE search on title
create index if not exists idx_books_title_trgm
  on public.books using gin (title gin_trgm_ops);

-- Fast full-text ILIKE search on isbn
create index if not exists idx_books_isbn_trgm
  on public.books using gin (isbn gin_trgm_ops)
  where isbn is not null;

-- GIN index on metadata JSONB for fast key lookups
create index if not exists idx_books_metadata
  on public.books using gin (metadata);


-- ── 4. UPDATED_AT TRIGGER ─────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_books_updated_at on public.books;
create trigger trg_books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();


-- ── 5. ROW LEVEL SECURITY ─────────────────────────────────────────────────────

alter table public.books enable row level security;

-- ── Public (anon) access: READ ONLY ──────────────────────────────────────────

create policy "Public can read all books"
  on public.books
  for select
  to anon, authenticated
  using (true);

-- ── Admin (authenticated) access: FULL CRUD ──────────────────────────────────

-- INSERT: only logged-in users can add books
create policy "Authenticated can insert books"
  on public.books
  for insert
  to authenticated
  with check (true);

-- UPDATE: only logged-in users can edit books
create policy "Authenticated can update books"
  on public.books
  for update
  to authenticated
  using (true)
  with check (true);

-- DELETE: only logged-in users can delete books
create policy "Authenticated can delete books"
  on public.books
  for delete
  to authenticated
  using (true);


-- ── 6. STORAGE BUCKET ────────────────────────────────────────────────────────
--
-- Creates a public "book-covers" bucket for cover images.
-- Public URL pattern:
--   https://<project>.supabase.co/storage/v1/object/public/book-covers/<filename>
--
-- If this INSERT fails (storage schema not accessible), create the bucket
-- manually: Dashboard → Storage → New bucket → "book-covers" → Public: ON

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-covers',
  'book-covers',
  true,          -- public: cover images are accessible without auth
  3145728,       -- 3 MB max per image
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Anyone can VIEW cover images (they're public)
create policy "Public can view book covers"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'book-covers');

-- Only authenticated users can UPLOAD covers
create policy "Authenticated can upload book covers"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'book-covers');

-- Only authenticated users can REPLACE covers
create policy "Authenticated can update book covers"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'book-covers');

-- Only authenticated users can DELETE covers
create policy "Authenticated can delete book covers"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'book-covers');


-- ── 7. SEED DATA (optional) ───────────────────────────────────────────────────
-- Comment out this block if you don't want sample data.

insert into public.books
  (title, author, category, status, rating, isbn, synopsis, personal_notes, metadata)
values
  (
    'The Pragmatic Programmer',
    'David Thomas & Andrew Hunt',
    'Software Engineering',
    'read',
    5,
    '9780135957059',
    'A classic guide to programming best practices, covering topics from personal responsibility to career development for the professional software developer.',
    E'## My Notes\n\n**Key takeaway**: "You Are Responsible." The chapter on tracer bullets completely changed how I approach new projects — ship a thin slice end-to-end before expanding.\n\n### Favourite quotes\n\n> "Don''t live with broken windows."\n\nApplied the *rubber duck debugging* technique and it works surprisingly well.',
    '{"language": "English", "format": "Paperback", "pages": 352, "publisher": "Addison-Wesley", "published_year": 2019, "purchase_price": 49.99, "currency": "USD", "shelf_location": "A-1", "edition": "20th Anniversary"}'
  ),
  (
    'Clean Code',
    'Robert C. Martin',
    'Software Engineering',
    'read',
    4,
    '9780132350884',
    'A handbook of agile software craftsmanship that teaches programmers how to write code that is readable, maintainable, and expressive.',
    E'## My Notes\n\nStrong opinions, some of which I disagree with (function length dogma), but the chapter on naming is worth the price alone.\n\n**Chapters I revisit often**: 2 (Names), 3 (Functions), 10 (Classes).',
    '{"language": "English", "format": "Hardcover", "pages": 431, "publisher": "Prentice Hall", "published_year": 2008, "purchase_price": 39.00, "currency": "USD", "shelf_location": "A-2"}'
  ),
  (
    'Designing Data-Intensive Applications',
    'Martin Kleppmann',
    'Distributed Systems',
    'reading',
    null,
    '9781449373320',
    'The big ideas behind reliable, scalable, and maintainable systems, from databases to distributed architectures.',
    E'## Reading Progress\n\nCurrently on **Chapter 7: Transactions**. The section on isolation levels is the clearest explanation I have read anywhere.',
    '{"language": "English", "format": "Paperback", "pages": 611, "publisher": "O''Reilly", "published_year": 2017, "purchase_price": 59.99, "currency": "USD", "shelf_location": "B-1"}'
  ),
  (
    'The Art of Invisibility',
    'Kevin Mitnick',
    'Cybersecurity',
    'read',
    5,
    '9780316380522',
    'World''s most famous hacker teaches you how to protect your privacy in the digital age.',
    E'## My Notes\n\nMandatory reading for anyone in security. The OPSEC principles here apply directly to how I design auth systems.\n\n**Key principle**: Treat every data point as a potential attack surface.',
    '{"language": "English", "format": "Paperback", "pages": 320, "publisher": "Little, Brown", "published_year": 2017, "purchase_price": 18.00, "currency": "USD", "shelf_location": "C-1"}'
  ),
  (
    'Project Hail Mary',
    'Andy Weir',
    'Science Fiction',
    'read',
    5,
    '9780593135204',
    'A lone astronaut must save the Earth from disaster in this propulsive science-based thriller.',
    E'## My Notes\n\nBest sci-fi I have read in years. The science is rigorous and the story is genuinely moving. Read it blind — no spoilers.',
    '{"language": "English", "format": "Hardcover", "pages": 476, "publisher": "Ballantine Books", "published_year": 2021, "purchase_price": 28.00, "currency": "USD", "shelf_location": "D-1"}'
  ),
  (
    'The Web Application Hacker''s Handbook',
    'Dafydd Stuttard & Marcus Pinto',
    'Cybersecurity',
    'unread',
    null,
    '9781118026472',
    'Comprehensive coverage of web application vulnerabilities, exploitation techniques, and defenses.',
    null,
    '{"language": "English", "format": "Paperback", "pages": 912, "publisher": "Wiley", "published_year": 2011, "shelf_location": "C-2"}'
  )
on conflict do nothing;


-- ── VERIFICATION QUERIES ──────────────────────────────────────────────────────
-- Run these after setup:
--
--   select count(*) from public.books;     -- expect 6 (if seed data was kept)
--
--   -- Confirm RLS is active
--   select tablename, rowsecurity from pg_tables
--   where schemaname = 'public' and tablename = 'books';
--
--   -- List all policies on books
--   select policyname, cmd, roles from pg_policies
--   where schemaname = 'public' and tablename = 'books';
--
--   -- Test JSONB query (find all hardcover books)
--   select title, metadata->>'format' as format
--   from public.books
--   where metadata->>'format' = 'Hardcover';
--
--   -- Test trigram search (fast ILIKE)
--   select title, author from public.books
--   where title ilike '%pragmatic%';
-- ============================================================================
