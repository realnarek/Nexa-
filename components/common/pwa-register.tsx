"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Guard: prevent multiple reloads within the same tab lifetime.
    let reloading = false;
    // Holds teardown logic once registration succeeds.
    let cleanup: (() => void) | null = null;

    // Set up controllerchange BEFORE registering so we never miss the event.
    // Fires when a new SW calls skipWaiting() + clients.claim() and takes over.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // 1. Immediate check on every page load — catches deployments that
        //    happened while the tab was closed or the app was backgrounded.
        registration.update().catch(() => {});

        // 2. Periodic check every 20 s while the tab is open.
        const intervalId = setInterval(() => {
          registration.update().catch(() => {});
        }, 20_000);

        // 3. Check immediately when the user returns to this tab.
        //    Android Chrome aggressively throttles background timers, so the
        //    interval alone is unreliable for backgrounded PWAs.
        const onVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);

        cleanup = () => {
          clearInterval(intervalId);
          document.removeEventListener("visibilitychange", onVisibilityChange);
        };
      })
      .catch(() => {
        // SW registration may fail in dev (non-HTTPS) or incognito — ignore.
      });

    return () => {
      cleanup?.();
    };
  }, []);

  return null;
}
