"use client";

import { useChatStore } from "@/store/chat-store";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { Cpu, Square, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COPY: Record<string, { label: string; color: string }> = {
  idle: { label: "Idle", color: "text-muted-foreground" },
  thinking: { label: "Reasoning", color: "text-amber-300" },
  executing: { label: "Executing", color: "text-amber-300" },
  streaming: { label: "Streaming", color: "text-emerald-300" },
  error: { label: "Error", color: "text-red-400" },
};

interface TopBarProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function TopBar({ title, subtitle, right }: TopBarProps) {
  const status = useChatStore((s) => s.status);
  const stop = useChatStore((s) => s.stopAgent);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const s = STATUS_COPY[status] ?? STATUS_COPY.idle;
  const busy = status === "thinking" || status === "executing" || status === "streaming";

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-3 md:px-6 select-none"
      style={{
        minHeight: "3.5rem",
        paddingTop: "max(0px, env(safe-area-inset-top))",
      }}
    >
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="md:hidden grid place-items-center size-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
        aria-label="Open sidebar"
      >
        <Menu className="size-5" />
      </button>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <h1 className="text-sm font-medium leading-none truncate">{title}</h1>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "hidden sm:flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1",
          )}
        >
          <Cpu className={cn("size-3.5", s.color)} />
          <span className="font-mono text-[11px] tracking-wide">
            <span className={s.color}>{s.label.toUpperCase()}</span>
          </span>
          <span
            className={cn(
              "status-dot",
              status === "idle"
                ? "text-muted-foreground/40"
                : status === "error"
                  ? "text-red-400"
                  : "text-primary",
            )}
            aria-hidden
          />
        </div>

        {busy && (
          <Button
            variant="outline"
            size="sm"
            onClick={stop}
            className="font-mono text-[11px]"
          >
            <Square className="size-3 fill-current" /> Stop
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCommandOpen(true)}
          className="hidden sm:flex font-mono text-[11px]"
        >
          ⌘K
        </Button>

        {right}
      </div>
    </header>
  );
}
