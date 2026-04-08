import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.100.28'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wwxgzgahznbzfqtntzke.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;