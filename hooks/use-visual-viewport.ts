"use client";

import { useEffect } from "react";

// CSS variables written on <html> so any component can consume them.
const VAR_VVH = "--vvh";
const VAR_KEYBOARD_INSET = "--keyboard-inset";

/**
 * Reads the current visual-viewport geometry and writes two CSS variables to
 * document.documentElement:
 *
 *   --vvh             The visible viewport height in px (shrinks when keyboard opens).
 *   --keyboard-inset  Estimated keyboard height in px (0 when keyboard is closed).
 *
 * Falls back to window.innerHeight / 0 when visualViewport is unavailable
 * (desktop browsers, very old mobile WebViews).
 */
function syncViewport(): void {
  const root = document.documentElement;
  const vv = window.visualViewport;

  if (!vv) {
    root.style.setProperty(VAR_VVH, `${window.innerHeight}px`);
    root.style.setProperty(VAR_KEYBOARD_INSET, "0px");
    return;
  }

  root.style.setProperty(VAR_VVH, `${vv.height}px`);

  // Keyboard height = difference between the layout viewport bottom and the
  // bottom of the visual viewport. visualViewport.offsetTop accounts for cases
  // where the page scrolls to accommodate the keyboard (rare on Android Chrome
  // but present on some WebViews).
  const keyboardInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  root.style.setProperty(VAR_KEYBOARD_INSET, `${keyboardInset}px`);
}

/**
 * Call once near the root of the chat UI.  Registers visualViewport resize /
 * scroll listeners and re-syncs on visibilitychange (app resume / PWA switch).
 * All listeners are cleaned up on unmount.
 *
 * Desktop browsers: has no observable effect beyond setting --vvh = innerHeight.
 * iOS: DVH already works correctly; this hook is a no-op improvement.
 * Android Chrome / WebView / PWA: fixes the keyboard-overlay bug.
 */
export function useVisualViewport(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    syncViewport();

    const vv = window.visualViewport;
    let rafId = 0;

    const schedule = (): void => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncViewport);
    };

    if (vv) {
      // visualViewport fires at every animation frame during keyboard slide.
      vv.addEventListener("resize", schedule);
      // scroll fires when the browser shifts the viewport to reveal the focused
      // input (offsetTop changes).
      vv.addEventListener("scroll", schedule);
    } else {
      // Older browsers / desktop: use window resize as a fallback.
      window.addEventListener("resize", schedule);
    }

    // visibilitychange fires when the user alt-tabs back to the PWA / WebView.
    // At that point the visualViewport may have stale dimensions because Android
    // deferred the resize event.  Two extra timeouts catch the deferred layout
    // recalculation that happens after the browser fully restores the surface.
    const onVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        schedule();
        setTimeout(syncViewport, 150);
        setTimeout(syncViewport, 400);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // window focus fires on PWA foreground restore when visibilitychange is
    // suppressed (observed on some Samsung Internet / Android WebView builds).
    window.addEventListener("focus", schedule);

    return () => {
      if (vv) {
        vv.removeEventListener("resize", schedule);
        vv.removeEventListener("scroll", schedule);
      } else {
        window.removeEventListener("resize", schedule);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", schedule);
      cancelAnimationFrame(rafId);
    };
  }, []);
}
