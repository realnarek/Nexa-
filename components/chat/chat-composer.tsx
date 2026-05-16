"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUp, Loader2, Paperclip, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  "Summarize this thread",
  "Draft a follow-up email",
  "Plan my day",
  "Research competitors",
];

export function ChatComposer() {
  const [value, setValue] = React.useState("");
  const sendMessage = useChatStore((s) => s.sendMessage);
  const status = useChatStore((s) => s.status);
  const stop = useChatStore((s) => s.stopAgent);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const busy = status !== "idle" && status !== "error";

  // Auto-resize textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  // Hydrate from onboarding seed prompt if any
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const seed = sessionStorage.getItem("nexa.seed-prompt");
    if (seed) {
      sessionStorage.removeItem("nexa.seed-prompt");
      setValue(seed);
      textareaRef.current?.focus();
    }
  }, []);

  const submit = async () => {
    const text = value.trim();
    if (!text || busy) return;
    setValue("");
    await sendMessage(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="px-4 md:px-8 pb-6 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
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
            placeholder={
              busy
                ? "Agent is working… press Stop to interrupt."
                : "Ask Nexa anything..."
            }
            disabled={busy}
            rows={1}
            className="border-0 bg-transparent px-5 py-4 text-[15px] focus-visible:ring-0 max-h-[200px]"
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
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

        {!busy && (
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setValue(p)}
                className="rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

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
