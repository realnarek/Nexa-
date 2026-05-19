import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    return [
      {
        // Service worker: must never be cached anywhere in the chain.
        // The browser byte-diffs sw.js on every update() call — serving a stale
        // version from any cache layer silently prevents the update from being
        // detected, leaving users on the old deployment indefinitely.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
          // Browser: always revalidate.
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          // Legacy HTTP/1.0 proxies.
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          // Vercel edge CDN: bypass its own cache so the origin function is reached.
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
          // Generic CDN bypass (Cloudflare, Fastly, etc. if ever used).
          { key: "CDN-Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
