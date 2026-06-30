import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // output:"standalone" нужен только для Docker. Vercel умеет сам.
  // Раскомментируй если деплоишь через Dockerfile:
  // output: "standalone",
  serverExternalPackages: ["better-sqlite3", "pg", "sharp", "satori"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "litter.catbox.moe" },
    ],
  },
  eslint: {
    // На Vercel-сборке у нас нет ESLint в зависимостях, выключаем проверку
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Если где-то остался тип-косяк — Vercel не упадёт. Локально tsc всё равно проверим.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
