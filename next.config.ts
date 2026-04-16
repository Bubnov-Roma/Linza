import type { NextConfig } from "next";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com;
    connect-src 'self' https://va.vercel-scripts.com https://suggestions.dadata.ru;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://i.ibb.co https://ibb.co https://*.beget.cloud https://avatars.yandex.net https://lh3.googleusercontent.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-src 'self' https://www.youtube.com https://youtube.com https://vk.com https://vkvideo.ru https://rutube.ru https://player.vimeo.com;
    upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-mariadb', 'bcryptjs'],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.yandex.net",
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      { protocol: "https", 
        hostname: "aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud",
        pathname: '/**'
      },
      {
        protocol: "https",
        hostname: "ibb.co",
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "*.ibb.co",
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
  },
  reactCompiler: true,
};

export default nextConfig;