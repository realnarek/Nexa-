"use client";

import { useEffect, useRef } from "react";

/**
 * Scopes "Select all" to the element where the selection originated or to the
 * currently focused textarea/input.
 *
 * Problem: CSS `contain` and `isolation` do not prevent the browser from
 * extending a text selection across DOM siblings.  On Android, tapping
 * "Select all" in the native floating toolbar calls the browser's selectAll
 * command, which selects every node with `user-select:text` on the page —
 * including text in unrelated message bubbles.
 *
 * Fix:
 *   1. Keyboard (desktop) — intercept Ctrl+A / Cmd+A:
 *      • focused textarea/input → call .select() on the element
 *      • selection in a .message-text → select only that element's contents
 *   2. Mobile — listen to `selectionchange`:
 *      • record the .message-text that the pointer pressed down on
 *      • whenever the selection escapes that element, constrain it back
 */
export function useSelectAllScope() {
  const selectionOriginRef = useRef<Element | null>(null);
  const isConstraining = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Remember which .message-text element the user started interacting with.
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Element;
      selectionOriginRef.current =
        target.closest?.(".message-text") ?? null;
    };

    // Desktop: Ctrl+A / Cmd+A — scope to the focused control or current message.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== "a") return;

      const active = document.activeElement;

      if (
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLInputElement
      ) {
        // Explicitly scope to the control — on some Android Chrome builds the
        // native selectAll bleeds out of the control even when it is focused.
        e.preventDefault();
        active.select();
        return;
      }

      // If the caret/selection is inside a .message-text, select that island only.
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
      const messageText = el?.closest?.(".message-text");
      if (messageText) {
        e.preventDefault();
        const newRange = document.createRange();
        newRange.selectNodeContents(messageText);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    };

    // Mobile: selectionchange — constrain selection that has escaped the origin element.
    const handleSelectionChange = () => {
      // Guard against re-entry while we are already setting a constrained range.
      if (isConstraining.current) return;

      // Textarea / input have their own internal selection model; don't interfere.
      const active = document.activeElement;
      if (
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLInputElement
      ) return;

      const origin = selectionOriginRef.current;
      if (!origin) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (range.collapsed) return;

      // If either endpoint of the selection is outside the origin element,
      // pull the entire selection back inside it.
      if (
        !origin.contains(range.startContainer) ||
        !origin.contains(range.endContainer)
      ) {
        isConstraining.current = true;
        const newRange = document.createRange();
        newRange.selectNodeContents(origin);
        selection.removeAllRanges();
        selection.addRange(newRange);
        // Release the guard after the browser has settled the selection update.
        requestAnimationFrame(() => {
          isConstraining.current = false;
        });
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);
}
