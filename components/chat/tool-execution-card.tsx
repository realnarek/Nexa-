"use client";

import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import type { ToolCall } from "@/types";
import { toolRegistry } from "@/services/tool-registry";
import { cn, formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function iconFor(name?: string): LucideIcon {
  if (!name) return Icons.Wrench;
  const I = (Icons as unknown as Record<string, LucideIcon>)[name];
  return I ?? Icons.Wrench;
}

interface ToolExecutionCardProps {
  call: ToolCall;
}

export function ToolExecutionCard({ call }: ToolExecutionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const def = toolRegistry.get(call.toolId);
  const Icon = iconFor(def?.icon);

  const running = call.status === "running" || call.status === "queued";
  const ok = call.status === "succeeded";
  const failed = call.status === "failed";
  const duration =
    call.finishedAt ? call.finishedAt - call.startedAt : Date.now() - call.startedAt;
  const summary = getToolSummary(call);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "surface rounded-lg overflow-hidden border",
        running && "border-primary/30 animate-border-glow",
        ok && "border-emerald-500/15",
        failed && "border-red-500/30",
      )}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-accent/30 transition-colors"
      >
        <div
          className={cn(
            "grid place-items-center size-7 rounded-md border",
            running && "border-primary/30 bg-primary/5 text-primary",
            ok && "border-border bg-card text-foreground/80",
            failed && "border-red-500/30 bg-red-500/5 text-red-300",
          )}
        >
          {running ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Icon className="size-3.5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{call.toolName}</span>
            <Badge
              variant={running ? "primary" : ok ? "success" : failed ? "destructive" : "muted"}
              size="sm"
              className="font-mono"
            >
              {call.status}
            </Badge>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground truncate mt-0.5">
            {summary}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(ok || failed) && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatDuration(duration)}
            </span>
          )}
          {ok && <CheckCircle2 className="size-3.5 text-emerald-400" />}
          {failed && <XCircle className="size-3.5 text-red-400" />}
          <ChevronRight
            className={cn(
              "size-3.5 text-muted-foreground transition-transform",
              expanded && "rotate-90",
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-background/40 px-3.5 py-2.5 space-y-2">
          {/* Input */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Input
            </div>
            <pre className="font-mono text-[11px] text-foreground/80 overflow-x-auto scrollbar-thin whitespace-pre-wrap break-all">
              {JSON.stringify(call.input, null, 2)}
            </pre>
          </div>

          {/* Logs */}
          {call.logs.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Logs
              </div>
              <div className="space-y-0.5">
                {call.logs.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 font-mono text-[11px]"
                  >
                    <span className="text-muted-foreground/60 shrink-0">
                      {new Date(log.ts).toLocaleTimeString("en-US", {
                        hour12: false,
                      })}
                    </span>
                    <span
                      className={cn(
                        "shrink-0",
                        log.level === "info" && "text-foreground/60",
                        log.level === "debug" && "text-muted-foreground/60",
                        log.level === "warn" && "text-amber-300",
                        log.level === "error" && "text-red-400",
                      )}
                    >
                      [{log.level}]
                    </span>
                    <span className="text-foreground/80">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output */}
          {call.output !== undefined && (
            call.toolId === "web_search" ? (
              <WebSearchOutput output={call.output} />
            ) : (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Output
                </div>
                <pre className="font-mono text-[11px] text-foreground/80 overflow-x-auto scrollbar-thin whitespace-pre-wrap break-all">
                  {JSON.stringify(call.output, null, 2)}
                </pre>
              </div>
            )
          )}

          {/* Error */}
          {call.error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/5 p-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-red-300 mb-1">
                Error
              </div>
              <div className="font-mono text-[11px] text-red-200">{call.error}</div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}


function getToolSummary(call: ToolCall) {
  if (call.toolId === "web_search") {
    if (call.status === "running" || call.status === "queued") {
      return call.logs.at(-1)?.message ?? "Searching the web…";
    }

    const output = call.output as
      | { resultCount?: number; query?: string }
      | undefined;
    if (call.status === "succeeded") {
      return `Found ${output?.resultCount ?? 0} results`;
    }
  }

  const entries = Object.entries(call.input).slice(0, 2);
  if (entries.length === 0) return call.logs.at(-1)?.message ?? "Running tool";

  return entries
    .map(([key, value]) => `${key}=${truncate(String(value), 40)}`)
    .join(" · ");
}

function WebSearchOutput({ output }: { output: unknown }) {
  const data = output as {
    resultCount?: number;
    results?: Array<{ title?: string; url?: string; snippet?: string }>;
  };

  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        Sources
      </div>
      <div className="space-y-1.5">
        {(data.results ?? []).slice(0, 5).map((result, index) => (
          <a
            key={result.url ?? index}
            href={result.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-md border border-border/70 bg-card/40 p-2 text-[11px] hover:bg-accent/30 transition-colors"
          >
            <div className="font-medium text-foreground/90 truncate">
              {result.title ?? "Untitled result"}
            </div>
            <div className="text-primary/80 truncate">{result.url}</div>
            {result.snippet && (
              <div className="text-muted-foreground line-clamp-2 mt-1">
                {result.snippet}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
