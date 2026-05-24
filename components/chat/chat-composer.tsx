"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ChevronDown, Mic, Plus, Square } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

// Compact Telegram-style proportions
const MAX_HEIGHT = 240;
const MIN_HEIGHT = 48;
const CARET_BOTTOM_PAD = 13;
// FAB centering: (48 - 36) / 2 = 6
const BUTTON_BOTTOM = 6;
const BUTTON_RIGHT = 8;
const BUTTON_SIZE = 36;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const spring = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.75 };
const springSnap = { type: "spring" as const, stiffness: 600, damping: 26, mass: 0.7 };

const glassBase: React.CSSProperties = {
  background: "rgba(10, 10, 10, 0.72)",
  backdropFilter: "blur(44px)",
  WebkitBackdropFilter: "blur(44px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.07)",
    "0 4px 20px -5px rgba(0,0,0,0.52)",
    "0 1px 0 rgba(0,0,0,0.28)",
  ].join(", "),
};

// ─── Plus button — separate from the textbox ──────────────────────────────────
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

// ─── Floating action button ───────────────────────────────────────────────────
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
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          <Mic className="size-[15px]" strokeWidth={1.75} />
        </motion.button>
      )}
    </AnimatePresence>
  );
});

// ─── Main composer ────────────────────────────────────────────────────────────
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
  const isMultiline = textareaHeight > MIN_HEIGHT + 2;

  // ── Auto-resize ─────────────────────────────────────────────────────────────
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

  // ── Seed prompt + autofocus ──────────────────────────────────────────────────
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

  // ── Block layout-viewport panning inside the composer ────────────────────────
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

  // ── Submit ─────────────────────────────────────────────────────────────────
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

  const pillStyle: React.CSSProperties = {
    minHeight: `${MIN_HEIGHT}px`,
    borderRadius: "24px",
    background: "rgba(10, 10, 10, 0.72)",
    backdropFilter: "blur(44px)",
    WebkitBackdropFilter: "blur(44px)",
    border: focused
      ? "1px solid rgba(255,255,255,0.13)"
      : "1px solid rgba(255,255,255,0.08)",
    boxShadow: focused
      ? [
          "inset 0 1px 0 rgba(255,255,255,0.08)",
          "0 0 0 2px rgba(255,255,255,0.026)",
          "0 6px 24px -6px rgba(0,0,0,0.42)",
        ].join(", ")
      : [
          "inset 0 1px 0 rgba(255,255,255,0.06)",
          "0 4px 20px -5px rgba(0,0,0,0.36)",
        ].join(", "),
    transition: "border-color 200ms ease, box-shadow 200ms ease",
    padding: "0 0 0 16px",
  };

  const textPaddingRight = isMultiline
    ? BUTTON_RIGHT + BUTTON_SIZE + 40
    : BUTTON_RIGHT + BUTTON_SIZE + 8;

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
          Spring-animated gap: 5px idle → 12px focused.
          framer-motion animates the CSS `gap` property directly.
        */}
        <motion.div
          className="flex items-end relative"
          animate={{ gap: focused ? "12px" : "5px" }}
          transition={spring}
        >
          {/* Fixed-height wrapper keeps the 48px circle bottom-aligned with the pill */}
          <div
            className="flex items-center shrink-0"
            style={{ height: `${MIN_HEIGHT}px` }}
          >
            <PlusButton disabled={busy} />
          </div>

          {/* Pill */}
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
                "placeholder:text-white/[0.32]",
              )}
              style={{
                fontSize: "15px",
                lineHeight: "1.5",
                letterSpacing: "0.01em",
                color: busy ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.90)",
                caretColor: "hsl(var(--primary))",
                paddingTop: "13px",
                paddingBottom: `${CARET_BOTTOM_PAD}px`,
                paddingLeft: 0,
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
            - bottom: BUTTON_BOTTOM = 6px → centers 36px FAB inside 48px pill
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

          {/* Scroll-to-bottom button */}
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
                  background: "rgba(20, 20, 20, 0.80)",
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
        </motion.div>
      </div>
    </div>
  );
}
