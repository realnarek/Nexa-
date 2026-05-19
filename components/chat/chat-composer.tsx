"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Mic, Plus, Square } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

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

  // Auto-resize: single line by default, grows upward
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [value]);

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
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
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
      className="px-3 md:px-4 pt-2 shrink-0"
      style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Floating glass dock */}
        <motion.div
          layout
          className={cn(
            "relative flex items-end gap-0.5 px-1.5 py-1.5",
            "rounded-[26px]",
            // Glass surface
            "bg-card/55 backdrop-blur-2xl",
            // Border
            busy ? "border border-primary/25" : "border border-white/[0.07]",
          )}
          style={{
            boxShadow: busy
              ? [
                  "inset 0 1px 0 hsl(0 0% 100% / 0.09)",
                  "0 0 0 0.5px hsl(28 100% 64% / 0.12)",
                  "0 8px 32px -8px hsl(0 0% 0% / 0.55)",
                ].join(", ")
              : [
                  "inset 0 1px 0 hsl(0 0% 100% / 0.09)",
                  "0 0 0 0.5px hsl(0 0% 100% / 0.04)",
                  "0 8px 32px -8px hsl(0 0% 0% / 0.55)",
                ].join(", "),
          }}
        >
          {/* Attach / plus */}
          <button
            type="button"
            disabled={busy}
            aria-label="Attach"
            className="shrink-0 size-9 rounded-full flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
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
            onCompositionEnd={() => { isComposing.current = false; }}
            placeholder={busy ? "Agent is working…" : "Ask Nexa anything..."}
            disabled={busy}
            rows={1}
            autoCorrect="on"
            autoCapitalize="sentences"
            autoComplete="on"
            spellCheck={true}
            className={cn(
              "flex-1 bg-transparent border-0 resize-none outline-none ring-0",
              "text-[15px] leading-[1.45] py-[9px] px-1",
              "min-h-[36px] max-h-[180px]",
              "placeholder:text-muted-foreground/40 text-foreground",
              "disabled:opacity-40 disabled:cursor-default",
              "scrollbar-none",
            )}
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
                className="shrink-0 size-9 rounded-full flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.06] transition-colors"
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
                  hasText ? "text-primary-foreground" : "text-muted-foreground/50",
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
