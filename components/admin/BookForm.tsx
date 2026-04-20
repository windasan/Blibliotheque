'use client';

import { useRef, useState, useTransition, type FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Upload, X, ChevronDown } from 'lucide-react';
import type { ActionResult, Book } from '@/lib/types';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

interface BookFormProps {
  action: (fd: FormData) => Promise<ActionResult<{ id: string }>>;
  mode: 'add' | 'edit';
  book?: Book;
}

// ── Shared input / label classes ───────────────────────────────────────────────

const inputCls = `
  w-full h-10 px-3 rounded-lg text-sm
  bg-[#1a1a1f] border border-[#2e2e3a]
  text-[#e8e8f0] placeholder:text-[#3d3d4d]
  focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/30
  transition-colors disabled:opacity-50
`;

const textareaCls = `
  w-full px-3 py-2.5 rounded-lg text-sm leading-relaxed
  bg-[#1a1a1f] border border-[#2e2e3a]
  text-[#e8e8f0] placeholder:text-[#3d3d4d]
  focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/30
  transition-colors resize-y disabled:opacity-50
  font-mono
`;

const labelCls = 'block text-[10px] font-mono text-[#7c7c96] uppercase tracking-wider mb-1.5';

// ── Component ──────────────────────────────────────────────────────────────────

export function BookForm({ action, mode, book }: BookFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(book?.cover_url ?? null);
  const [showMeta, setShowMeta] = useState(false);
  const [bookFileName, setBookFileName] = useState<string | null>(book?.file_url?.split('/').pop() ?? null);

  const fileRef = useRef<HTMLInputElement>(null);
  const bookFileRef = useRef<HTMLInputElement>(null);

  // ── Category Tags State ────────────────────────────────────────────────────
  const initialCategories = book?.category 
    ? (Array.isArray(book.category) ? book.category : book.category.split(',').map(c => c.trim()).filter(Boolean))
    : [];
    
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [categoryInput, setCategoryInput] = useState('');

  const addCategory = () => {
    const newCategory = categoryInput.trim().replace(/,/g, '');
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }
    setCategoryInput('');
  };

  const handleCategoryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); 
      addCategory();
    }
  };

  const removeCategory = (catToRemove: string) => {
    setCategories(categories.filter(cat => cat !== catToRemove));
  };

  // ── Handle cover preview ───────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setError('Image must be JPEG, PNG, WebP, or GIF.');
      e.target.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Image must be under 3 MB.');
      e.target.value = '';
      return;
    }

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    if (categories.length === 0) {
      setError('Kategori tidak boleh kosong.');
      return;
    }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await action(formData);

        if (!result || typeof result.success !== 'boolean') {
          setError('Unexpected response from server action.');
          return;
        }

        if (!result.success) {
          setError(result.error ?? 'Something went wrong.');
          return;
        }

        router.push('/admin/dashboard');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Hidden id for edit mode */}
      {mode === 'edit' && book && <input type="hidden" name="id" value={book.id} />}

      {/* ── Cover image ──────────────────────────────────────────────────── */}
      <div>
        <label className={labelCls}>Cover Image</label>
        <div className="flex gap-4 items-start">
          <div
            className="relative w-24 h-36 rounded-[4px] overflow-hidden border border-[#2e2e3a] bg-[#1a1a1f] flex-shrink-0 cursor-pointer group"
            onClick={() => fileRef.current?.click()}
          >
            {previewUrl ? (
              <>
                <Image src={previewUrl} alt="Cover preview" fill className="object-cover" sizes="96px" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload size={16} className="text-white" />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[#3d3d4d] group-hover:text-[#5a5a72] transition-colors">
                <Upload size={18} />
                <span className="text-[9px] font-mono">Upload</span>
              </div>
            )}
          </div>

          <div className="flex-1 pt-1">
            <input
              ref={fileRef}
              type="file"
              name="cover_image"
              title="Upload cover image"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isPending}
              className="
                px-3 py-1.5 rounded-lg text-xs border border-[#2e2e3a]
                text-[#7c7c96] hover:text-[#e8e8f0] hover:border-[#3d3d4d]
                transition-colors disabled:opacity-50
              "
            >
              Choose file
            </button>
            <p className="text-[10px] text-[#3d3d4d] mt-2 font-mono">JPEG, PNG, WebP or GIF · max 3 MB</p>
            {previewUrl && (
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                className="flex items-center gap-1 text-[10px] text-[#5a5a72] hover:text-red-400 transition-colors mt-1.5 font-mono"
              >
                <X size={10} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Book file ─────────────────────────────────────────────────────── */}
      <div className="pt-2 pb-4 border-b border-[#2e2e3a]/50">
        <label className={labelCls}>File Buku (PDF/EPUB)</label>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1f] border border-[#2e2e3a] hover:border-[#3d3d4d] transition-colors">
          <div className="flex-1 truncate">
            {bookFileName ? (
              <span className="text-xs text-[#c9a84c] font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
                {bookFileName}
              </span>
            ) : (
              <span className="text-xs text-[#5a5a72] font-mono">Belum ada file yang dipilih...</span>
            )}
          </div>

          <input
            ref={bookFileRef}
            type="file"
            name="book_file"
            title="Upload book file"
            accept=".pdf,.epub"
            onChange={(e) => setBookFileName(e.target.files?.[0]?.name ?? null)}
            className="hidden"
            disabled={isPending}
          />

          <button
            type="button"
            onClick={() => bookFileRef.current?.click()}
            disabled={isPending}
            className="px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider border border-[#2e2e3a] text-[#7c7c96] hover:text-[#e8e8f0] transition-colors"
          >
            {bookFileName ? 'Ganti File' : 'Pilih File'}
          </button>
        </div>
      </div>

      {/* ── Required fields ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Title *">
          <input
            name="title"
            required
            defaultValue={book?.title}
            placeholder="The Pragmatic Programmer"
            disabled={isPending}
            className={inputCls}
          />
        </Field>
        <Field label="Author *">
          <input
            name="author"
            required
            defaultValue={book?.author}
            placeholder="David Thomas"
            disabled={isPending}
            className={inputCls}
          />
        </Field>

        {/* ── Category Tags Field (Sesuai Gambar Referensi) ────────────────── */}
        <Field label="Category / Genre *">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={handleCategoryKeyDown}
                placeholder="genre (press Enter)"
                disabled={isPending}
                className={cn(inputCls, "flex-1")}
              />
              <button
                type="button"
                onClick={addCategory}
                disabled={isPending}
                className="
                  px-4 rounded-lg text-sm font-medium
                  bg-[#1a1a1f] border border-[#2e2e3a] text-[#e8e8f0]
                  hover:bg-[#2e2e3a] hover:border-[#3d3d4d] transition-colors
                "
              >
                Add
              </button>
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span 
                    key={cat} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2e2e3a] text-[#e8e8f0] text-sm rounded-md border border-[#3d3d4d]"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => removeCategory(cat)}
                      disabled={isPending}
                      className="text-[#7c7c96] hover:text-[#e8e8f0] focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input type="hidden" name="category" value={categories.join(', ')} />
          </div>
        </Field>

        <Field label="Status *">
          <div className="relative">
            <select
              name="status"
              required
              title="Book status"
              defaultValue={book?.status ?? 'unread'}
              disabled={isPending}
              className={cn(inputCls, 'appearance-none pr-8 cursor-pointer')}
            >
              <option value="unread">Unread</option>
              <option value="reading">Reading</option>
              <option value="read">Read</option>
              <option value="wishlist">Wishlist</option>
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a72] pointer-events-none" />
          </div>
        </Field>
      </div>

      {/* ── Optional fields ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="ISBN">
          <input
            name="isbn"
            defaultValue={book?.isbn ?? ''}
            placeholder="9780135957059"
            disabled={isPending}
            className={inputCls}
          />
        </Field>
        <Field label="Rating (1–5)">
          <div className="relative">
            <select
              name="rating"
              title="Book rating"
              defaultValue={book?.rating?.toString() ?? ''}
              disabled={isPending}
              className={cn(inputCls, 'appearance-none pr-8 cursor-pointer')}
            >
              <option value="">No rating</option>
              <option value="5">★★★★★  Masterpiece</option>
              <option value="4">★★★★☆  Great</option>
              <option value="3">★★★☆☆  Good</option>
              <option value="2">★★☆☆☆  Fair</option>
              <option value="1">★☆☆☆☆  Poor</option>
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a72] pointer-events-none" />
          </div>
        </Field>
      </div>

      <Field label="Synopsis">
        <textarea
          name="synopsis"
          rows={3}
          defaultValue={book?.synopsis ?? ''}
          placeholder="A brief description of the book…"
          disabled={isPending}
          className={textareaCls}
        />
      </Field>

      <Field label="Personal Notes (Markdown)">
        <textarea
          name="personal_notes"
          rows={8}
          defaultValue={book?.personal_notes ?? ''}
          placeholder={`## My Notes\n\nWrite in **Markdown**. Supports:\n- headers\n- bullet lists\n- > blockquotes\n- \`inline code\``}
          disabled={isPending}
          className={textareaCls}
        />
        <p className="text-[10px] text-[#3d3d4d] mt-1 font-mono">Rendered with MDX on the public book page.</p>
      </Field>

      {/* ── JSONB Metadata (collapsible) ─────────────────────────────────── */}
      <div className="border border-[#2e2e3a] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMeta((v) => !v)}
          className="
            w-full flex items-center justify-between px-4 py-3
            text-sm text-[#7c7c96] hover:text-[#e8e8f0]
            hover:bg-[#1f1f26] transition-colors
          "
        >
          <span className="font-mono text-xs uppercase tracking-wider">
            Metadata <span className="text-[#3d3d4d]">(JSONB · optional)</span>
          </span>
          <ChevronDown size={14} className={cn('transition-transform', showMeta && 'rotate-180')} />
        </button>

        {showMeta && (
          <div className="border-t border-[#2e2e3a] p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetaField label="Language" name="meta_language" placeholder="English" defaultValue={book?.metadata?.language} isPending={isPending} />
              <MetaField label="Format" name="meta_format" placeholder="Paperback / Hardcover / eBook" defaultValue={book?.metadata?.format} isPending={isPending} />
              <MetaField label="Publisher" name="meta_publisher" placeholder="O Reilly Media" defaultValue={book?.metadata?.publisher} isPending={isPending} />
              <MetaField label="Edition" name="meta_edition" placeholder="2nd, Anniversary..." defaultValue={book?.metadata?.edition} isPending={isPending} />
              <MetaField label="Pages" name="meta_pages" placeholder="423" type="number" defaultValue={book?.metadata?.pages?.toString()} isPending={isPending} />
              <MetaField label="Published Year" name="meta_published_year" placeholder="2019" type="number" defaultValue={book?.metadata?.published_year?.toString()} isPending={isPending} />
              <MetaField label="Purchase Price" name="meta_purchase_price" placeholder="34.99" type="number" defaultValue={book?.metadata?.purchase_price?.toString()} isPending={isPending} />
              <MetaField label="Currency (ISO)" name="meta_currency" placeholder="USD" defaultValue={book?.metadata?.currency} isPending={isPending} />
              <MetaField label="Shelf Location" name="meta_shelf_location" placeholder="A-3" defaultValue={book?.metadata?.shelf_location} isPending={isPending} />
            </div>
            <p className="text-[10px] text-[#3d3d4d] font-mono">
              Stored as JSONB. Query with: <code className="text-[#c9a84c]">{`metadata->>'language'`}</code>
            </p>
          </div>
        )}
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <p role="alert" className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="
            inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
            bg-[#c9a84c] text-[#0f0f12]
            hover:bg-[#d4b96a] disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending ? (mode === 'add' ? 'Adding…' : 'Saving…') : mode === 'add' ? 'Add to Library' : 'Save Changes'}
        </button>
        <a href="/admin/dashboard" className="text-sm text-[#5a5a72] hover:text-[#a3a3bc] transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function MetaField({
  label,
  name,
  placeholder,
  type = 'text',
  defaultValue,
  isPending,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  defaultValue?: string;
  isPending: boolean;
}) {
  return (
    <div>
      <label className={cn(labelCls, 'text-[#5a5a72]')}>{label}</label>
      <input
        name={name}
        type={type}
        step={type === 'number' ? 'any' : undefined}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        disabled={isPending}
        className={inputCls}
      />
    </div>
  );
}