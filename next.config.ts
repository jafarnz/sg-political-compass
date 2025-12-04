import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/wikipedia/commons/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/wikipedia/en/**',
      },
      {
        protocol: 'https',
        hostname: 'www.pikpng.com',
        pathname: '/pngl/**',
      },
    ],
    // Use unoptimized images for Cloudflare Workers (no image optimization runtime)
    unoptimized: process.env.CLOUDFLARE === 'true',
  },
  
  // Cloudflare Pages/Workers compatibility
  ...(process.env.CLOUDFLARE === 'true' && {
    experimental: {
      // Required for Cloudflare Workers
    },
  }),
};

export default nextConfig;
