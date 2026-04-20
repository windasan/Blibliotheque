# Personal Library — Architecture

## Folder Structure

```
personal-library/
├── app/
│   ├── (public)/                         # Route group — no URL prefix
│   │   ├── layout.tsx                    # Public layout wrapper
│   │   ├── loading.tsx                   # Homepage skeleton (Suspense)
│   │   ├── page.tsx                      # / → Book gallery (SSR + sort/filter)
│   │   └── book/
│   │       └── [id]/
│   │           └── page.tsx              # /book/:id → Detail + MDX notes
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx                  # /admin/login → Auth form
│   │   └── dashboard/
│   │       ├── layout.tsx                # Admin shell (sidebar + auth guard)
│   │       ├── page.tsx                  # /admin/dashboard → Books table
│   │       ├── add/
│   │       │   └── page.tsx              # /admin/dashboard/add → Add form
│   │       └── edit/
│   │           └── [id]/
│   │               └── page.tsx          # /admin/dashboard/edit/:id → Edit form
│   ├── error.tsx                         # Global error boundary
│   ├── not-found.tsx                     # 404 page
│   ├── globals.css                       # Tailwind + CSS custom properties
│   └── layout.tsx                        # Root layout (metadata, fonts)
│
├── actions/
│   └── books.ts                          # Server Actions: addBook, updateBook, deleteBook
│
├── components/
│   ├── BookCard.tsx                      # Gallery tile (cover + metadata)
│   ├── SearchBar.tsx                     # Instant search → URL ?search=
│   ├── FilterSort.tsx                    # Category / status / sort → URL params
│   ├── admin/
│   │   ├── BookForm.tsx                  # Shared Add/Edit form (all fields + JSONB)
│   │   ├── DeleteBookButton.tsx          # Inline confirm → deleteBook action
│   │   └── AdminSignOut.tsx              # Sign out button
│   └── ui/
│       └── Skeleton.tsx                  # Loading skeleton primitives
│
├── lib/
│   ├── types.ts                          # TypeScript types (Book, BookMetadata, etc.)
│   ├── utils.ts                          # cn(), formatDate(), STATUS_COLORS, etc.
│   └── supabase/
│       ├── server.ts                     # SSR client (Server Components / Actions)
│       └── client.ts                     # Browser singleton (Client Components)
│
├── middleware.ts                         # Edge route guard for /admin/*
├── supabase_setup.sql                    # Full DB setup (enums, table, RLS, storage)
├── tailwind.config.ts                    # Charcoal-gold design system
├── next.config.ts
├── tsconfig.json
├── postcss.config.js
├── package.json
└── .env.local.template
```

## Security Model

| Layer              | Mechanism                                              |
|--------------------|--------------------------------------------------------|
| Edge (fast path)   | `middleware.ts` — checks Supabase session via cookie   |
| RSC (belt+suspenders) | `dashboard/layout.tsx` — server-side session check  |
| Server Actions     | `requireAuth()` — session validated before every mutation |
| Database           | RLS policies — anon=read-only, authenticated=full CRUD |
| Storage            | Bucket policies — anon=read, authenticated=write/delete |
| Input validation   | MIME type + size checked server-side in every action   |

## Data Flow: Adding a Book

```
User fills BookForm
  → onSubmit builds FormData
    → addBook("use server") called
      → requireAuth() validates session
        → cover File → MIME/size check → Storage.upload()
          → getPublicUrl() → cover_url
            → books.insert({ ...fields, metadata: JSONB })
              → revalidatePath('/')
                → redirect to /admin/dashboard
```

## JSONB Metadata

The `metadata` column accepts any JSON object. Current tracked fields:

| Key              | Type    | Example           |
|------------------|---------|-------------------|
| `language`       | string  | "English"         |
| `format`         | string  | "Paperback"       |
| `pages`          | number  | 423               |
| `publisher`      | string  | "O'Reilly"        |
| `published_year` | number  | 2019              |
| `purchase_price` | number  | 34.99             |
| `currency`       | string  | "USD"             |
| `shelf_location` | string  | "A-3"             |
| `edition`        | string  | "2nd"             |

Query example:
```sql
SELECT title, metadata->>'shelf_location' AS shelf
FROM books
WHERE metadata->>'format' = 'Hardcover';
```
