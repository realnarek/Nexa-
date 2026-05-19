"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Guard against the controllerchange reload firing more than once per tab.
    let reloading = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // A new SW just called skipWaiting() + clients.claim() and took over.
      // Reload so the page is served by the fresh deployment.
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Check for a new SW version every 60 s while the tab is open.
        intervalId = setInterval(() => registration.update(), 60_000);
      })
      .catch(() => {
        // SW registration may fail in dev or non-HTTPS environments — that's fine.
      });

    return () => {
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, []);

  return null;
}
