import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable Turbopack for faster development builds
  experimental: {
    // Turbopack is now default in Next.js 15
  },
  // Transpile shared package
  transpilePackages: ['@antone/shared'],
};

export default nextConfig;
