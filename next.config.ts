import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "pg"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "litter.catbox.moe" },
    ],
  },
};

export default nextConfig;
