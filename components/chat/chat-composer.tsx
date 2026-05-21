"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Mic, Plus, Square } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

// Allow ~11 natural lines before internal scrolling starts.
// At 15px / 1.45 line-height ≈ 21.75px per line; 240px ≈ 11 lines.
// Increasing from 160px prevents scroll mode from activating too early,
// giving a comfortable editing space for long messages on mobile.
const MAX_HEIGHT = 240;

// Bottom padding inside the textarea scroll box so the caret and last
// line never clip against the lower edge of the scroll container.
const CARET_SAFE_PADDING_BOTTOM = 10;

// Run synchronously before paint on client; fall back to useEffect during SSR
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

interface ChatComposerProps {
  autoFocus?: boolean;
}

export function ChatComposer({ autoFocus }: ChatComposerProps) {
  const [value, setValue] = React.useState("");
  const sendMessage = useChatStore((s) => s.sendMessage);
  const status = useChatStore((s) => s.status);
  const stop = useChatStore((s) => s.stopAgent);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isComposing = React.useRef(false);
  const busy = status !== "idle" && status !== "error";
  const hasText = value.trim().length > 0;

  // Stable auto-resize without the "height: auto" bounce.
  // Setting height to 0 before reading scrollHeight gives an accurate
  // content measurement without triggering an intermediate paint at "auto" size.
  // overflowY is kept hidden while growing so no scrollbar flicker occurs;
  // it switches to "auto" only after the content exceeds MAX_HEIGHT.
  //
  // Android stability: we capture scrollTop before collapsing the height,
  // then restore it after resize. Without this, Android resets scrollTop to 0
  // during the height=0 measurement phase, causing caret and selection handles
  // to visually jump or drift.
  const resize = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    // Snapshot scroll state before any DOM mutation.
    const savedScrollTop = el.scrollTop;
    const wasOverflowing = el.style.overflowY === "auto";

    el.style.height = "0px";
    const scrollH = el.scrollHeight;
    const overflowing = scrollH > MAX_HEIGHT;

    el.style.height = `${Math.min(scrollH, MAX_HEIGHT)}px`;
    el.style.overflowY = overflowing ? "auto" : "hidden";

    // Restore scroll to keep caret anchored and prevent Android selection
    // handles from drifting after a height change.
    if (overflowing) {
      // Already scrolling: stay at the same offset.
      // Just entered overflow: pin to bottom (caret is at the end).
      el.scrollTop = wasOverflowing ? savedScrollTop : scrollH;
    }
  }, []);

  // useLayoutEffect fires before the browser paints so height and value
  // update in the same frame — prevents the one-frame height-lag flash.
  useIsomorphicLayoutEffect(() => {
    resize();
  }, [value, resize]);

  // Focus on mount / seed prompt
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const seed = sessionStorage.getItem("nexa.seed-prompt");
    if (seed) {
      sessionStorage.removeItem("nexa.seed-prompt");
      setValue(seed);
    }
    if (autoFocus || seed) {
      const t = setTimeout(() => textareaRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    const text = value.trim();
    if (!text || busy) return;
    setValue("");
    const el = textareaRef.current;
    if (el) {
      el.style.height = "36px";
      el.style.overflowY = "hidden";
    }
    await sendMessage(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing &&
      !isComposing.current
    ) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="px-3 md:px-4 pt-1.5 shrink-0"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Floating glass dock */}
        <motion.div
          className={cn(
            "relative flex items-end gap-0.5 px-1.5 py-1",
            "rounded-[26px]",
            // Glass surface — lighter opacity + stronger blur for premium translucency
            "bg-card/42 backdrop-blur-[52px]",
            // Border — slightly brighter rim light
            busy ? "border border-primary/25" : "border border-white/[0.10]",
          )}
          style={{
            boxShadow: busy
              ? [
                  "inset 0 1px 0 hsl(0 0% 100% / 0.10)",
                  "0 0 0 0.5px hsl(28 100% 64% / 0.12)",
                  "0 4px 12px -4px hsl(0 0% 0% / 0.22)",
                ].join(", ")
              : [
                  "inset 0 1px 0 hsl(0 0% 100% / 0.10)",
                  "0 0 0 0.5px hsl(0 0% 100% / 0.06)",
                  "0 4px 12px -4px hsl(0 0% 0% / 0.22)",
                ].join(", "),
          }}
        >
          {/* Attach / plus */}
          <button
            type="button"
            disabled={busy}
            aria-label="Attach"
            className="shrink-0 size-9 rounded-full flex items-center justify-center text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
          >
            <Plus className="size-[17px]" strokeWidth={2} />
          </button>

          {/* Growing textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onCompositionStart={() => { isComposing.current = true; }}
            onCompositionEnd={() => {
              isComposing.current = false;
              // Re-measure after IME commits characters — composition may not
              // fire onChange, so the resize effect won't run automatically.
              resize();
            }}
            placeholder={busy ? "Agent is working…" : "Ask Nexa anything..."}
            disabled={busy}
            rows={1}
            autoCorrect="on"
            autoCapitalize="sentences"
            autoComplete="on"
            spellCheck={true}
            enterKeyHint="send"
            className={cn(
              "flex-1 bg-transparent border-0 resize-none outline-none ring-0",
              // pt-[7px] only — bottom padding is controlled via paddingBottom below
              // so we can guarantee CARET_SAFE_PADDING_BOTTOM is always applied.
              "text-[15px] leading-[1.45] pt-[7px] px-1",
              "placeholder:text-muted-foreground/40 text-foreground",
              "disabled:opacity-40 disabled:cursor-default",
              // scroll-touch: -webkit-overflow-scrolling + overscroll-behavior:contain
              // scrollbar-none: hides the scrollbar track when overflow activates
              "scrollbar-none scroll-touch",
            )}
            style={{
              minHeight: "36px",
              maxHeight: `${MAX_HEIGHT}px`,
              height: "36px",
              overflowY: "hidden",
              // pan-y: browser handles vertical touch-scroll, won't hand off to parent
              touchAction: "pan-y",
              // Ensures the caret and last line are never clipped at the lower
              // edge of the scroll container on any Android keyboard.
              paddingBottom: `${CARET_SAFE_PADDING_BOTTOM}px`,
              // Disables the browser's scroll-anchor algorithm on this element.
              // Without this, scroll anchoring fights our manual scrollTop
              // restoration during resize, causing Android handles to drift.
              overflowAnchor: "none",
            }}
          />

          {/* Mic button — hidden while busy */}
          <AnimatePresence initial={false}>
            {!busy && (
              <motion.button
                key="mic"
                type="button"
                aria-label="Voice input"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                className="shrink-0 size-9 rounded-full flex items-center justify-center text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.06] transition-colors"
              >
                <Mic className="size-[17px]" strokeWidth={2} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Send / Stop — perfect circle */}
          {busy ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop agent"
              className="shrink-0 size-9 rounded-full border border-primary/30 bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors"
            >
              <Square className="size-3 fill-primary text-primary" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!hasText}
              aria-label="Send message"
              className={cn(
                "shrink-0 size-9 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95",
                hasText
                  ? "bg-primary hover:brightness-110 shadow-[0_2px_14px_-3px_hsl(28_100%_64%/0.55)]"
                  : "bg-white/[0.07] cursor-default",
              )}
            >
              <ArrowUp
                className={cn(
                  "size-[17px]",
                  hasText ? "text-primary-foreground" : "text-muted-foreground/65",
                )}
                strokeWidth={2.5}
              />
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
