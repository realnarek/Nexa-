"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ChevronDown, Mic, Plus, Square } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

// ~11 natural lines before internal scroll activates
const MAX_HEIGHT = 240;
// Baseline single-line height for the pill
const MIN_HEIGHT = 56;
// Bottom padding inside the textarea scroll box
const CARET_BOTTOM_PAD = 17;
// Button is size-9 = 36px. Center in MIN_HEIGHT: (56 - 36) / 2 = 10
const BUTTON_BOTTOM = 10;
// Button right inset from pill edge — keeps it inside the rounded corner
const BUTTON_RIGHT = 8;
// Button diameter for zone calculation
const BUTTON_SIZE = 36;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const spring = { type: "spring" as const, stiffness: 520, damping: 30, mass: 0.85 };
const springSnap = { type: "spring" as const, stiffness: 600, damping: 26, mass: 0.7 };

const glassBase: React.CSSProperties = {
  background: "rgba(20, 20, 20, 0.72)",
  backdropFilter: "blur(44px)",
  WebkitBackdropFilter: "blur(44px)",
  border: "1px solid rgba(255, 255, 255, 0.085)",
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.08)",
    "0 4px 20px -5px rgba(0,0,0,0.55)",
    "0 1px 0 rgba(0,0,0,0.28)",
  ].join(", "),
};

// ─────────────────────────────────────────────────────────────────────────────
// Plus button — completely separate from the textbox
// ─────────────────────────────────────────────────────────────────────────────
const PlusButton = React.memo(function PlusButton({
  disabled,
}: {
  disabled: boolean;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      aria-label="Attach"
      whileTap={{ scale: 0.82 }}
      transition={spring}
      className={cn(
        "shrink-0 flex items-center justify-center",
        "size-12 rounded-full",
        "hover:border-[rgba(255,255,255,0.14)] active:brightness-110",
        "transition-[border-color,opacity] duration-200",
        "disabled:pointer-events-none disabled:opacity-25",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
      style={{
        ...glassBase,
        color: "rgba(255,255,255,0.50)",
      }}
    >
      <Plus className="size-[18px]" strokeWidth={2} />
    </motion.button>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Floating action button — lives OUTSIDE the pill, overlapping its right edge.
// Absolutely positioned by the parent flex row so it sits above the pill at
// the bottom-right in both collapsed and multiline states.
// ─────────────────────────────────────────────────────────────────────────────
const FloatingActionButton = React.memo(function FloatingActionButton({
  hasText,
  busy,
  onSend,
  onStop,
}: {
  hasText: boolean;
  busy: boolean;
  onSend: () => void;
  onStop: () => void;
}) {
  const activeKey = busy ? "stop" : hasText ? "send" : "mic";

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {activeKey === "stop" && (
        <motion.button
          key="stop"
          type="button"
          onClick={onStop}
          aria-label="Stop agent"
          initial={{ scale: 0.62, opacity: 0, y: 4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.62, opacity: 0, y: 4 }}
          transition={springSnap}
          whileTap={{ scale: 0.82 }}
          className={cn(
            "flex items-center justify-center",
            "size-9 rounded-full",
            "focus-visible:outline-none",
          )}
          style={{
            background: "rgba(255, 112, 0, 0.13)",
            border: "1px solid rgba(255, 112, 0, 0.24)",
          }}
        >
          <Square className="size-[10px] fill-primary text-primary" />
        </motion.button>
      )}

      {activeKey === "send" && (
        <motion.button
          key="send"
          type="button"
          onClick={onSend}
          aria-label="Send message"
          initial={{ scale: 0.62, opacity: 0, y: 6 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.62, opacity: 0, y: -6 }}
          transition={springSnap}
          whileTap={{ scale: 0.82 }}
          className={cn(
            "flex items-center justify-center",
            "size-9 rounded-full",
            "hover:brightness-110 transition-[filter] duration-150",
            "focus-visible:outline-none",
          )}
          style={{
            background: "hsl(var(--primary))",
            boxShadow: "0 2px 20px -4px hsl(28 100% 64% / 0.65)",
          }}
        >
          <ArrowUp
            className="size-[15px] text-primary-foreground"
            strokeWidth={2.5}
          />
        </motion.button>
      )}

      {activeKey === "mic" && (
        <motion.button
          key="mic"
          type="button"
          aria-label="Voice input"
          initial={{ scale: 0.62, opacity: 0, y: -6 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.62, opacity: 0, y: 6 }}
          transition={springSnap}
          whileTap={{ scale: 0.82 }}
          className={cn(
            "flex items-center justify-center",
            "size-9 rounded-full",
            "transition-[color] duration-150",
            "focus-visible:outline-none",
          )}
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          <Mic className="size-[16px]" strokeWidth={2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main composer
// ─────────────────────────────────────────────────────────────────────────────
interface ChatComposerProps {
  autoFocus?: boolean;
  showScrollButton?: boolean;
  onScrollToBottom?: () => void;
}

export function ChatComposer({ autoFocus, showScrollButton, onScrollToBottom }: ChatComposerProps) {
  const [value, setValue] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [textareaHeight, setTextareaHeight] = React.useState(MIN_HEIGHT);

  const sendMessage = useChatStore((s) => s.sendMessage);
  const status = useChatStore((s) => s.status);
  const stop = useChatStore((s) => s.stopAgent);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const isComposing = React.useRef(false);

  const busy = status !== "idle" && status !== "error";
  const hasText = value.trim().length > 0;
  // Collapsed = exactly one line of text height. A +2px tolerance absorbs
  // sub-pixel rounding across devices before switching to multiline layout.
  const isMultiline = textareaHeight > MIN_HEIGHT + 2;

  // ── Auto-resize ───────────────────────────────────────────────────────────
  const resize = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const savedScrollTop = el.scrollTop;
    const wasOverflowing = el.style.overflowY === "auto";
    el.style.height = "0px";
    const scrollH = el.scrollHeight;
    const overflowing = scrollH > MAX_HEIGHT;
    const newHeight = Math.min(scrollH, MAX_HEIGHT);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = overflowing ? "auto" : "hidden";
    if (overflowing) {
      el.scrollTop = wasOverflowing ? savedScrollTop : scrollH;
    }
    setTextareaHeight(newHeight);
  }, []);

  useIsomorphicLayoutEffect(() => {
    resize();
  }, [value, resize]);

  // ── Seed prompt + autofocus ───────────────────────────────────────────────
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

  // ── Block layout-viewport panning inside the composer ────────────────────
  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const blockPan = (e: TouchEvent) => {
      const ta = textareaRef.current;
      if (ta && ta.scrollHeight > ta.clientHeight) {
        let node: Node | null = e.target as Node;
        while (node) {
          if (node === ta) return;
          node = node.parentNode;
        }
      }
      if (e.cancelable) e.preventDefault();
    };
    wrapper.addEventListener("touchmove", blockPan, { passive: false });
    return () => wrapper.removeEventListener("touchmove", blockPan);
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    const text = value.trim();
    if (!text || busy) return;
    setValue("");
    setTextareaHeight(MIN_HEIGHT);
    const el = textareaRef.current;
    if (el) {
      el.style.height = `${MIN_HEIGHT}px`;
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

  // Pill: full-width glass container. No right padding — the floating button
  // overlaps the right edge from the outside, z-index above.
  const pillStyle: React.CSSProperties = {
    minHeight: `${MIN_HEIGHT}px`,
    borderRadius: "28px",
    background: "rgba(22, 22, 22, 0.58)",
    backdropFilter: "blur(52px)",
    WebkitBackdropFilter: "blur(52px)",
    border: focused
      ? "1px solid rgba(255,255,255,0.15)"
      : "1px solid rgba(255,255,255,0.08)",
    boxShadow: focused
      ? [
          "inset 0 1px 0 rgba(255,255,255,0.09)",
          "0 0 0 3px rgba(255,255,255,0.032)",
          "0 8px 28px -6px rgba(0,0,0,0.42)",
        ].join(", ")
      : [
          "inset 0 1px 0 rgba(255,255,255,0.07)",
          "0 4px 20px -5px rgba(0,0,0,0.36)",
        ].join(", "),
    transition: "border-color 220ms ease, box-shadow 220ms ease",
    // Left padding only — right side is open for the floating button overlay
    padding: "0 0 0 20px",
  };

  // Dynamic text right padding:
  //   Collapsed — compact clearance so button overlaps the pill aesthetically
  //               (BUTTON_RIGHT + BUTTON_SIZE + ~8px breathing room)
  //   Multiline — wider reserved zone keeps every line readable past the button
  const textPaddingRight = isMultiline
    ? BUTTON_RIGHT + BUTTON_SIZE + 40   // 84px
    : BUTTON_RIGHT + BUTTON_SIZE + 8;   // 52px

  return (
    <div
      ref={wrapperRef}
      className="absolute bottom-0 left-0 right-0 px-3 md:px-4 pt-2"
      style={{
        paddingBottom: "max(14px, env(safe-area-inset-bottom))",
        zIndex: 10,
        background: "transparent",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/*
          `relative` on the row lets FloatingActionButton anchor itself to
          the pill's bottom-right without escaping the max-width container.
          `items-end` keeps Plus button and pill bottom-aligned as pill grows.
        */}
        <div className="flex items-end gap-3 relative">
          <PlusButton disabled={busy} />

          {/* Pill — full visual width; button floats above its right edge */}
          <div className="flex-1" style={pillStyle}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onCompositionStart={() => {
                isComposing.current = true;
              }}
              onCompositionEnd={() => {
                isComposing.current = false;
                resize();
              }}
              placeholder={busy ? "Agent is working…" : "Message Nexa..."}
              disabled={busy}
              rows={1}
              autoCorrect="on"
              autoCapitalize="sentences"
              autoComplete="on"
              spellCheck={true}
              enterKeyHint="send"
              className={cn(
                "w-full bg-transparent border-0 resize-none outline-none ring-0",
                "scrollbar-none scroll-touch",
                "disabled:cursor-default",
                "placeholder:text-white/[0.26]",
              )}
              style={{
                fontSize: "15px",
                lineHeight: "1.5",
                letterSpacing: "0.01em",
                color: busy ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.90)",
                caretColor: "hsl(var(--primary))",
                paddingTop: "17px",
                paddingBottom: `${CARET_BOTTOM_PAD}px`,
                paddingLeft: 0,
                // Switches from compact to reserved as composer grows to multiline
                paddingRight: `${textPaddingRight}px`,
                minHeight: `${MIN_HEIGHT}px`,
                maxHeight: `${MAX_HEIGHT}px`,
                height: `${MIN_HEIGHT}px`,
                overflowY: "hidden",
                touchAction: "pan-y",
                overflowAnchor: "none",
                transition: "color 200ms ease, padding-right 200ms ease",
              }}
            />
          </div>

          {/*
            Floating action button:
            - Absolutely positioned relative to the flex row
            - Sits above the pill via z-index (no clip from pill border-radius)
            - bottom: BUTTON_BOTTOM centers it in the 56px collapsed height
            - In multiline, stays anchored at the same bottom offset → bottom-right
            - right: BUTTON_RIGHT keeps it inside the pill's rounded corner
          */}
          <div
            className="absolute"
            style={{
              bottom: `${BUTTON_BOTTOM}px`,
              right: `${BUTTON_RIGHT}px`,
              zIndex: 2,
            }}
          >
            <FloatingActionButton
              hasText={hasText}
              busy={busy}
              onSend={submit}
              onStop={stop}
            />
          </div>

          {/*
            Scroll-to-bottom button:
            - Anchored to the top-right of the pill, 8px above it
            - top: -(BUTTON_SIZE + 8) places it 8px above the flex row's top edge
            - Moves up with the pill as the textarea grows (wrapper is bottom-0)
            - right: BUTTON_RIGHT aligns with the FAB for visual consistency
          */}
          <AnimatePresence>
            {showScrollButton && onScrollToBottom && (
              <motion.button
                onClick={onScrollToBottom}
                aria-label="Scroll to latest message"
                className="absolute grid place-items-center"
                style={{
                  top: `${-(BUTTON_SIZE + 8)}px`,
                  right: `${BUTTON_RIGHT}px`,
                  width: `${BUTTON_SIZE}px`,
                  height: `${BUTTON_SIZE}px`,
                  borderRadius: "50%",
                  background: "rgba(30, 30, 30, 0.72)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  boxShadow: [
                    "0 4px 24px -4px rgba(0,0,0,0.52)",
                    "0 1px 2px rgba(0,0,0,0.28)",
                    "inset 0 1px 0 rgba(255,255,255,0.07)",
                  ].join(", "),
                  zIndex: 2,
                }}
                initial={{ opacity: 0, scale: 0.92, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 6 }}
                transition={{ type: "spring", stiffness: 520, damping: 30, mass: 0.85 }}
                whileTap={{ scale: 0.88 }}
              >
                <ChevronDown
                  size={15}
                  style={{ color: "rgba(255,255,255,0.65)" }}
                />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
