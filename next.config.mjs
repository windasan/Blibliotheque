/**
 * next.config.ts
 */
/** @type {import('next').NextConfig} */
const nextConfig = {

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Add OpenLibrary covers if you fetch them:
      // { protocol: 'https', hostname: 'covers.openlibrary.org' },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
