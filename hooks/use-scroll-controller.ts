"use client";

import { useRef, useState, useCallback, useEffect, type RefObject } from "react";

const NEAR_BOTTOM_THRESHOLD = 120; // px from bottom before showing button
const SCROLL_STOP_DELAY = 200; // ms after last scroll event before evaluating
const AUTO_HIDE_DELAY = 2750; // ms of inactivity before hiding the button

export interface ScrollController {
  scrollerRef: RefObject<HTMLDivElement>;
  showJumpButton: boolean;
  /** Smooth scroll to bottom (for button click). Enters auto-follow mode. */
  scrollToBottom: () => void;
  /** Instant scroll to bottom (for message send). Enters auto-follow mode. */
  scrollOnSend: () => void;
  /**
   * Call when streaming content grows. If the user hasn't manually scrolled
   * away, the viewport stays pinned to the bottom (auto-follow mode).
   */
  onContentGrow: () => void;
}

export function useScrollController(): ScrollController {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showJumpButton, setShowJumpButton] = useState(false);

  const scrollStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True while we should keep the viewport pinned to the bottom as content grows.
  const isAutoFollowing = useRef(false);

  const clearTimers = useCallback(() => {
    if (scrollStopTimer.current) {
      clearTimeout(scrollStopTimer.current);
      scrollStopTimer.current = null;
    }
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    clearTimers();
    setShowJumpButton(false);
    isAutoFollowing.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [clearTimers]);

  const scrollOnSend = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    clearTimers();
    setShowJumpButton(false);
    isAutoFollowing.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
  }, [clearTimers]);

  // No deps — only reads refs so it's always fresh without re-binding.
  const onContentGrow = useCallback(() => {
    if (!isAutoFollowing.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    // Pointer/touch/wheel signals that the *user* is taking control of scroll.
    // Programmatic scrolls (scrollTo) do not fire these events, so auto-follow
    // is not accidentally cancelled when we scroll on send or on button click.
    const exitAutoFollow = () => {
      isAutoFollowing.current = false;
    };

    const handleScroll = () => {
      // Always hide the button while the finger is moving / wheel is spinning.
      setShowJumpButton(false);
      clearTimers();

      scrollStopTimer.current = setTimeout(() => {
        // Re-read the position at the exact moment scrolling stopped.
        const { scrollTop, scrollHeight, clientHeight } = el;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const awayFromBottom = distanceFromBottom >= NEAR_BOTTOM_THRESHOLD;

        if (awayFromBottom) {
          setShowJumpButton(true);
          // Auto-hide after inactivity.
          autoHideTimer.current = setTimeout(() => {
            setShowJumpButton(false);
          }, AUTO_HIDE_DELAY);
        }
      }, SCROLL_STOP_DELAY);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    el.addEventListener("wheel", exitAutoFollow, { passive: true });
    el.addEventListener("touchstart", exitAutoFollow, { passive: true });
    el.addEventListener("pointerdown", exitAutoFollow, { passive: true });

    return () => {
      el.removeEventListener("scroll", handleScroll);
      el.removeEventListener("wheel", exitAutoFollow);
      el.removeEventListener("touchstart", exitAutoFollow);
      el.removeEventListener("pointerdown", exitAutoFollow);
      clearTimers();
    };
  }, [clearTimers]);

  return { scrollerRef, showJumpButton, scrollToBottom, scrollOnSend, onContentGrow };
}
