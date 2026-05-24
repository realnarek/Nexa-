"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Mic, Plus, Square } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

// ~11 natural lines before internal scroll activates
const MAX_HEIGHT = 240;
// Baseline single-line height for the pill
const MIN_HEIGHT = 56;
// Bottom padding inside the textarea scroll box
const CARET_BOTTOM_PAD = 17;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

// Shared spring — responsive without being bouncy
const spring = { type: "spring" as const, stiffness: 520, damping: 30, mass: 0.85 };
// Snappier spring for icon swaps
const springSnap = { type: "spring" as const, stiffness: 600, damping: 26, mass: 0.7 };

// ─────────────────────────────────────────────────────────────────────────────
// Glass style tokens — defined once so both buttons share the same language
// ─────────────────────────────────────────────────────────────────────────────
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
      // whileTap fires on both pointer and touch; spring snaps back naturally
      whileTap={{ scale: 0.82 }}
      transition={spring}
      className={cn(
        "shrink-0 flex items-center justify-center",
        "size-12 rounded-full",
        // Hover: lighten border + icon
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
// Right action zone — three exclusive states: mic | send | stop
// Renders inside the textbox pill on the trailing edge
// ─────────────────────────────────────────────────────────────────────────────
const RightActionZone = React.memo(function RightActionZone({
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
  // Which key is active drives which motion element is mounted
  const activeKey = busy ? "stop" : hasText ? "send" : "mic";

  return (
    <div
      className="shrink-0 flex items-center"
      // Align to bottom of the pill with a small offset so the button sits
      // centered inside the 56 px minimum height
      style={{ paddingBottom: "9px", paddingLeft: "2px" }}
    >
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
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main composer
// ─────────────────────────────────────────────────────────────────────────────
interface ChatComposerProps {
  autoFocus?: boolean;
}

export function ChatComposer({ autoFocus }: ChatComposerProps) {
  const [value, setValue] = React.useState("");
  const [focused, setFocused] = React.useState(false);

  const sendMessage = useChatStore((s) => s.sendMessage);
  const status = useChatStore((s) => s.status);
  const stop = useChatStore((s) => s.stopAgent);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const isComposing = React.useRef(false);

  const busy = status !== "idle" && status !== "error";
  const hasText = value.trim().length > 0;

  // ── Auto-resize ───────────────────────────────────────────────────────────
  // Collapse to 0 → read scrollHeight → set exact height. Captures scrollTop
  // before the collapse so Android caret/handles don't drift.
  const resize = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const savedScrollTop = el.scrollTop;
    const wasOverflowing = el.style.overflowY === "auto";
    el.style.height = "0px";
    const scrollH = el.scrollHeight;
    const overflowing = scrollH > MAX_HEIGHT;
    el.style.height = `${Math.min(scrollH, MAX_HEIGHT)}px`;
    el.style.overflowY = overflowing ? "auto" : "hidden";
    if (overflowing) {
      el.scrollTop = wasOverflowing ? savedScrollTop : scrollH;
    }
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
  // Native touchmove listener (passive:false) lets us call preventDefault()
  // while still allowing the textarea to scroll its own overflow content.
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

  // Pill container border + shadow — transitions smoothly on focus
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
    // Horizontal rhythm: generous leading padding, tight trailing before button
    padding: "0 8px 0 20px",
  };

  return (
    // Absolutely positioned so the wrapper itself is fully transparent —
    // only the glass pill elements are visible. The parent must be
    // position:relative (it is, via the chat page's flex container).
    // Not motion.div: framer-promoted compositor layers can detach from the
    // layout on Android Chrome during visual-viewport transitions.
    <div
      ref={wrapperRef}
      className="absolute bottom-0 left-0 right-0 px-3 md:px-4 pt-2"
      style={{
        paddingBottom: "max(14px, env(safe-area-inset-bottom))",
        zIndex: 10,
        // Explicitly transparent — no dark layer behind the pills
        background: "transparent",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/*
          Row layout:
            [ Plus 48px ] [ 12px gap ] [ TextPill flex-1 ]

          items-end: multiline textarea grows upward so both elements
          stay anchored to the same bottom baseline.
        */}
        <div className="flex items-end gap-3">
          {/* ── Plus button ─────────────────────────────────────────────── */}
          <PlusButton disabled={busy} />

          {/* ── Text input pill ─────────────────────────────────────────── */}
          <div className="flex-1 flex items-end" style={pillStyle}>
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
                // IME may not fire onChange; re-measure after commit
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
                "flex-1 bg-transparent border-0 resize-none outline-none ring-0",
                "scrollbar-none scroll-touch",
                "disabled:cursor-default",
                // Placeholder color — white at 26% opacity
                "placeholder:text-white/[0.26]",
              )}
              style={{
                fontSize: "15px",
                lineHeight: "1.5",
                letterSpacing: "0.01em",
                color: busy ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.90)",
                caretColor: "hsl(var(--primary))",
                // Vertical rhythm: top padding + single text line + bottom padding = ~56px
                paddingTop: "17px",
                paddingBottom: `${CARET_BOTTOM_PAD}px`,
                paddingLeft: 0,
                // Reserve right space to clear the floating scroll-to-bottom
                // button that sits at the pill's right edge at z:20. Without
                // this, wrapped lines run underneath the button on narrow viewports.
                paddingRight: "72px",
                minHeight: `${MIN_HEIGHT}px`,
                maxHeight: `${MAX_HEIGHT}px`,
                height: `${MIN_HEIGHT}px`,
                overflowY: "hidden",
                // pan-y: browser handles vertical scroll; won't bubble to parent
                touchAction: "pan-y",
                // Disables scroll-anchor algorithm so manual scrollTop
                // restoration during resize keeps Android handles from drifting
                overflowAnchor: "none",
                transition: "color 200ms ease",
              }}
            />

            {/* Right action zone — absolutely owned by the pill */}
            <RightActionZone
              hasText={hasText}
              busy={busy}
              onSend={submit}
              onStop={stop}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
