# TODO - Fix 404 Book Detail & File Access

- [x] Move broken dynamic route from `app/(public)/book/[id/]/page.tsx` to `app/(public)/book/[id]/page.tsx`
- [x] Remove unsafe `(book as any)` usage in detail page, use typed `book.file_url`
- [x] Verify add/edit action flow in `actions/books.ts` keeps `file_url` persisted correctly
- [x] Run project checks (type/lint if available) to confirm no regressions *(blocked by first-time Next.js ESLint setup prompt, not an app error)*
