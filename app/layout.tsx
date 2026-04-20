/**
 * app/layout.tsx — Root Layout
 *
 * Server Component. Sets up:
 *  - Global metadata
 *  - DM Serif Display + DM Sans + DM Mono via next/font (no FOUT)
 *  - Global CSS import
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default:  'The Library',
    template: '%s · The Library',
  },
  description: 'A personal curated book collection.',
  robots: { index: false, follow: false }, // keep personal library private from search
};

export const viewport: Viewport = {
  themeColor: '#0f0f12',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="grain antialiased">
        {children}
      </body>
    </html>
  );
}
