import type { Config } from 'tailwindcss';

/**
 * Tailwind Configuration — Personal Library
 *
 * Aesthetic: Dark charcoal with warm amber-gold accents.
 * Feels like a rare-book vault: sophisticated, moody, curated.
 */
const config: Config = {
  darkMode: 'class',   // controlled by ThemeProvider if needed; default is dark

  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {
      // ── Color System ──────────────────────────────────────────────────────
      colors: {
        // Charcoal scale — the primary surface palette
        ink: {
          950: '#0a0a0b',   // deepest background
          900: '#0f0f12',   // page background
          850: '#141418',   // slightly lighter
          800: '#1a1a1f',   // card surface
          750: '#1f1f26',   // elevated card
          700: '#25252e',   // input backgrounds
          600: '#2e2e3a',   // borders, dividers
          500: '#3d3d4d',   // stronger borders
          400: '#5a5a72',   // muted icons
          300: '#7c7c96',   // placeholder text
          200: '#a3a3bc',   // secondary text
          100: '#cccce0',   // primary text (dimmed)
          50:  '#e8e8f0',   // primary text (bright)
        },
        // Gold/amber accent — the library's warmth
        gold: {
          900: '#3d2800',
          800: '#5c3d00',
          700: '#7a5200',
          600: '#9a6800',
          500: '#c9a84c',   // primary accent
          400: '#d4b96a',
          300: '#deca88',
          200: '#e8dba8',
          100: '#f2edcc',
        },
        // Semantic colours (for status badges, alerts)
        status: {
          unread:   { bg: '#1a1a2e', text: '#7c7ca0', border: '#2e2e4a' },
          reading:  { bg: '#2d1b00', text: '#c9a84c', border: '#5c3d00' },
          read:     { bg: '#001a10', text: '#4ade80', border: '#003320' },
          wishlist: { bg: '#12001a', text: '#a78bfa', border: '#2e0040' },
        },
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"DM Mono"', 'ui-monospace', 'monospace'],
      },

      // ── Spacing ───────────────────────────────────────────────────────────
      maxWidth: {
        content: '720px',
        wide:    '1200px',
        'book-card': '240px',
      },

      // ── Animations ────────────────────────────────────────────────────────
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease forwards',
        'shimmer': 'shimmer 1.5s infinite linear',
      },

      // ── Box shadows ───────────────────────────────────────────────────────
      boxShadow: {
        'book': '0 4px 20px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)',
        'book-hover': '0 8px 40px rgba(0,0,0,0.8), 0 2px 8px rgba(201,168,76,0.15)',
        'gold-glow': '0 0 20px rgba(201,168,76,0.2)',
      },

      // ── Border radius ─────────────────────────────────────────────────────
      borderRadius: {
        'book': '4px',   // book-cover feel: slightly rectangular
      },
    },
  },

  plugins: [
    require('@tailwindcss/typography'),   // for MDX prose rendering
  ],
};

export default config;
