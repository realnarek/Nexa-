"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUp, Loader2, Paperclip, Sparkles, Square } from "lucide-react";
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

  // Auto-resize textarea
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
    <div
      className="px-3 md:px-6 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent"
      style={{
        // env(safe-area-inset-bottom) covers the iOS home indicator.
        // On Android the container height already tracks --vvh (visual viewport)
        // so the keyboard inset is already factored in; the 16px minimum gives
        // comfortable breathing room at the bottom.
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="max-w-3xl mx-auto">
        <motion.div
          layout
          className={cn(
            "surface-elevated rounded-2xl overflow-hidden transition-colors",
            busy && "border-primary/30",
          )}
        >
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onCompositionStart={() => { isComposing.current = true; }}
            onCompositionEnd={() => { isComposing.current = false; }}
            placeholder={
              busy
                ? "Agent is working… press Stop to interrupt."
                : "Ask Nexa anything..."
            }
            disabled={busy}
            rows={1}
            autoCorrect="on"
            autoCapitalize="sentences"
            autoComplete="on"
            spellCheck={true}
            className="border-0 bg-transparent px-4 py-3 text-[15px] focus-visible:ring-0 max-h-[160px]"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" disabled aria-label="Attach">
                <Paperclip className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" disabled aria-label="Tools">
                <Sparkles className="size-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground">
                Nexa Agent · v0.1
              </span>
              {busy ? (
                <Button size="sm" variant="outline" onClick={stop}>
                  <Square className="size-3 fill-current" /> Stop
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={submit}
                  disabled={!value.trim()}
                  aria-label="Send message"
                >
                  Send
                  <ArrowUp className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {busy && (
          <div className="flex items-center justify-center gap-2 mt-3 font-mono text-[11px] text-muted-foreground">
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
