import { readFileSync } from "fs";
import path from "path";

// Stable per deployment: Vercel deployment ID → git SHA → Next.js build ID → dev constant.
// Computed at request time (force-dynamic) so the origin always serves the correct version
// without relying on CDN propagation timing.
const CACHE_VERSION = (() => {
  if (process.env.VERCEL_DEPLOYMENT_ID)
    return process.env.VERCEL_DEPLOYMENT_ID.slice(0, 16);
  if (process.env.VERCEL_GIT_COMMIT_SHA)
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 8);
  try {
    return readFileSync(
      path.join(process.cwd(), ".next/BUILD_ID"),
      "utf-8"
    ).trim();
  } catch {
    // In `next dev` the BUILD_ID file may not exist yet; use a stable dev marker.
    return process.env.NODE_ENV === "development" ? "dev" : String(Date.now());
  }
})();

function buildServiceWorker(version: string): string {
  return `
const CACHE_VERSION = ${JSON.stringify(version)};
const SHELL_CACHE = \`nexa-shell-\${CACHE_VERSION}\`;
const STATIC_CACHE = \`nexa-static-\${CACHE_VERSION}\`;

const SHELL_URLS = ['/'];

self.addEventListener('install', (event) => {
  // Take over immediately — don't wait for existing tabs to close.
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      // Claim all open clients so the new SW controls them immediately.
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // API routes: always hit the network, never cache agent responses.
  if (url.pathname.startsWith('/api/')) return;

  // Fingerprinted static assets: cache-first (content-addressed, immutable).
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation (HTML pages): network-first so redeploys are always reflected.
  // Falls back to cached shell only when genuinely offline.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Public-dir assets and everything else: stale-while-revalidate.
  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const fallback = await caches.match('/');
    return fallback ?? new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);
  return cached ?? fetchPromise;
}
`.trim();
}

// force-dynamic: every browser request hits the origin function directly.
// This guarantees the browser always receives the current deployment's SW bytes
// without waiting for CDN edge propagation — which is critical because browsers
// use a byte-diff check to detect SW updates.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(buildServiceWorker(CACHE_VERSION), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Tell browsers never to cache sw.js — it must be re-fetched on every update check.
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Service-Worker-Allowed": "/",
      // Vercel-specific: bypass the edge CDN cache so the origin function is always reached.
      "Vercel-CDN-Cache-Control": "no-store",
      "CDN-Cache-Control": "no-store",
    },
  });
}
