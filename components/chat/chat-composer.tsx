"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUp, Loader2, Mic, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

  // Auto-resize: reset to auto first so scrollHeight reflects true content height
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  // Focus input on new empty chats (autoFocus) or when a seed prompt is set
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const seed = sessionStorage.getItem("nexa.seed-prompt");
    if (seed) {
      sessionStorage.removeItem("nexa.seed-prompt");
      setValue(seed);
    }
    if (autoFocus || seed) {
      // Small delay so the DOM is fully painted before focusing (important on mobile)
      const t = setTimeout(() => textareaRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    const text = value.trim();
    if (!text || busy) return;
    setValue("");
    await sendMessage(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Do not intercept Enter during IME composition (Gboard, Samsung, iOS)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !isComposing.current) {
      e.preventDefault();
      submit();
    }
  };

  return (
    // Outer wrapper: transparent — no fill, no gradient.
    // Safe-area + keyboard inset are handled by paddingBottom inline style
    // (env(safe-area-inset-bottom) for iOS home indicator;
    //  --vvh on the parent container already absorbs the Android keyboard inset).
    <div
      className="px-4 md:px-6 pt-2"
      style={{
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Glass pill — the only elevated surface */}
        <motion.div
          layout
          className={cn(
            // Single-row flex; items-end keeps buttons pinned to the bottom
            // edge when the textarea grows beyond one line (ChatGPT / Arc pattern)
            "flex items-end gap-1 px-1.5 py-1.5",
            "rounded-3xl overflow-hidden transition-colors",
            // Translucent dark glass surface + blur
            "bg-card/90 backdrop-blur-xl",
            // Hairline border that shifts to primary tint while the agent is busy
            "border",
            // Soft ambient drop shadow + 1 px top-edge highlight inside the glass
            "shadow-[0_2px_16px_-4px_hsl(0_0%_0%/0.5),inset_0_1px_0_hsl(0_0%_100%/0.04)]",
            busy ? "border-primary/25" : "border-white/[0.08]",
          )}
        >
          {/* ── Left: attach / expand ─────────────────────── */}
          <Button
            variant="ghost"
            size="icon"
            disabled
            aria-label="Attach"
            className="shrink-0 rounded-full text-muted-foreground/60 hover:text-muted-foreground"
          >
            <Plus className="size-4" />
          </Button>

          {/* ── Center: autogrow textarea ─────────────────── */}
          {/* Override the component's default min-h-[60px] with min-h-0 so   */}
          {/* rows={1} actually produces a single-line height on mount.        */}
          <Textarea
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
              "flex-1 min-h-0 border-0 bg-transparent",
              "px-0 py-[7px] text-[15px] leading-[1.4]",
              "focus-visible:ring-0 max-h-[160px]",
              "placeholder:text-muted-foreground/50",
            )}
          />

          {/* ── Right: mic + send / stop ──────────────────── */}
          <div className="flex items-center shrink-0 gap-0.5">
            {/* Mic visible only when idle so the stop button has room */}
            {!busy && (
              <Button
                variant="ghost"
                size="icon"
                disabled
                aria-label="Voice input"
                className="shrink-0 rounded-full text-muted-foreground/60 hover:text-muted-foreground"
              >
                <Mic className="size-4" />
              </Button>
            )}

            {busy ? (
              <Button
                size="icon"
                variant="outline"
                onClick={stop}
                aria-label="Stop agent"
                className="shrink-0 rounded-full border-muted-foreground/25 text-muted-foreground hover:bg-muted/20"
              >
                <Square className="size-3.5 fill-current" />
              </Button>
            ) : (
              // Default variant = bg-primary (orange) + primary-foreground
              <Button
                size="icon"
                onClick={submit}
                disabled={!value.trim()}
                aria-label="Send message"
                className="shrink-0 rounded-full disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Inline agent-state label — below the pill, not inside it */}
        {busy && (
          <div className="flex items-center justify-center gap-2 mt-2.5 font-mono text-[11px] text-muted-foreground">
            <Loader2 className="size-3 animate-spin text-primary" />
            <span className="uppercase tracking-wider">
              {status === "thinking" && "Planning"}
              {status === "executing" && "Executing tools"}
              {status === "streaming" && "Streaming reply"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
