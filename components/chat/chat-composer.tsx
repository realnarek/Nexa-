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

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

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
    // Outer wrapper transparent — safe-area padding via inline style only.
    // env(safe-area-inset-bottom) covers iOS home indicator.
    // --vvh on the parent already absorbs the Android keyboard inset.
    <div
      className="px-4 md:px-6 pt-2"
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-3xl mx-auto">
        {/*
          Pill geometry: py-[7px] shell + 30px content row = 44px total.
          items-center keeps every child on the same visual baseline so the
          input doesn't float above the icons (the "stacked card" problem).
          When the textarea grows beyond one line the pill expands symmetrically,
          which is standard for AI/messaging inputs.
        */}
        <motion.div
          layout
          className={cn(
            "flex items-center gap-1 px-2 py-[7px]",
            "rounded-3xl overflow-hidden transition-colors",
            "bg-card/90 backdrop-blur-xl",
            "border shadow-[0_2px_12px_-4px_hsl(0_0%_0%/0.4),inset_0_1px_0_hsl(0_0%_100%/0.04)]",
            busy ? "border-primary/25" : "border-white/[0.08]",
          )}
        >
          {/* Attach — 30 × 30, same height as textarea and send button */}
          <Button
            variant="ghost"
            size="icon"
            disabled
            aria-label="Attach"
            className="shrink-0 h-[30px] w-[30px] rounded-full text-muted-foreground/50 hover:text-muted-foreground"
          >
            <Plus className="size-[15px]" />
          </Button>

          {/*
            Textarea: py-[5px] + leading-5 (20px) = 30px single-line height,
            matching the 30px buttons so items-center produces true alignment.
            style minHeight:0 is belt-and-suspenders over the CSS min-h-0 class —
            the component default min-h-[60px] must not win here.
          */}
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
            className="flex-1 min-h-0 border-0 bg-transparent px-1 py-[5px] text-[15px] leading-5 focus-visible:ring-0 max-h-[120px] placeholder:text-muted-foreground/50"
            style={{ minHeight: 0 }}
          />

          {/* Right cluster: mic (idle only) + send / stop */}
          <div className="flex items-center shrink-0 gap-0.5">
            {!busy && (
              <Button
                variant="ghost"
                size="icon"
                disabled
                aria-label="Voice input"
                className="shrink-0 h-[30px] w-[30px] rounded-full text-muted-foreground/50 hover:text-muted-foreground"
              >
                <Mic className="size-[15px]" />
              </Button>
            )}

            {busy ? (
              <Button
                size="icon"
                variant="outline"
                onClick={stop}
                aria-label="Stop agent"
                className="shrink-0 h-[30px] w-[30px] rounded-full border-muted-foreground/25 text-muted-foreground hover:bg-muted/20"
              >
                <Square className="size-3 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={submit}
                disabled={!value.trim()}
                aria-label="Send message"
                className="shrink-0 h-[30px] w-[30px] rounded-full disabled:opacity-30"
              >
                <ArrowUp className="size-[14px]" />
              </Button>
            )}
          </div>
        </motion.div>

        {busy && (
          <div className="flex items-center justify-center gap-2 mt-2 font-mono text-[11px] text-muted-foreground">
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
