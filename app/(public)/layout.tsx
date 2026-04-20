/**
 * app/(public)/layout.tsx — Public layout wrapper
 * Route group: no URL prefix, just groups public pages under a shared layout.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
