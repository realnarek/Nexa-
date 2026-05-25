"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Search,
  Globe,
  Terminal,
  ExternalLink,
  Clock,
} from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import type { ToolCall } from "@/types";
import { toolRegistry } from "@/services/tool-registry";
import { cn, formatDuration } from "@/lib/utils";

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function iconFor(name?: string): LucideIcon {
  if (!name) return Icons.Wrench;
  const I = (Icons as unknown as Record<string, LucideIcon>)[name];
  return I ?? Icons.Wrench;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

/** Live elapsed-ms counter, only active while `running` is true. */
function useLiveTimer(startedAt: number, running: boolean): number {
  const [elapsed, setElapsed] = useState(() => Date.now() - startedAt);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 100);
    return () => clearInterval(id);
  }, [startedAt, running]);
  return elapsed;
}

function getToolSummary(call: ToolCall): string {
  if (call.toolId === "web_search") {
    const q = truncate(String(call.input.query ?? ""), 52);
    if (call.status === "running" || call.status === "queued") return `"${q}"`;
    const results = (call.output as { results?: unknown[] } | undefined)?.results;
    const n = results?.length ?? 0;
    return `"${truncate(q, 40)}" · ${n} result${n !== 1 ? "s" : ""}`;
  }
  const entries = Object.entries(call.input).slice(0, 2);
  if (!entries.length) return call.logs.at(-1)?.message ?? "";
  return entries
    .map(([k, v]) => `${k}=${truncate(String(v), 36)}`)
    .join(" · ");
}

/* ─── StatusPill ─────────────────────────────────────────────────────────── */

function StatusPill({ status }: { status: ToolCall["status"] }) {
  const running = status === "running" || status === "queued";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-px",
        "font-mono text-[10px] font-medium leading-none",
        running && "border-primary/25 bg-primary/10 text-primary",
        status === "succeeded" &&
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
        status === "failed" &&
          "border-red-500/25 bg-red-500/10 text-red-400",
        status === "queued" &&
          "border-border bg-muted/50 text-muted-foreground",
      )}
    >
      {running && (
        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
      )}
      {status === "succeeded" && <CheckCircle2 className="size-2.5" />}
      {status === "failed" && <XCircle className="size-2.5" />}
      {status}
    </span>
  );
}

/* ─── ToolIcon ───────────────────────────────────────────────────────────── */

function ToolIcon({
  Icon,
  running,
  ok,
  failed,
}: {
  Icon: LucideIcon;
  running: boolean;
  ok: boolean;
  failed: boolean;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center shrink-0 size-7 rounded-md border",
        running && "border-primary/25 bg-primary/10 text-primary",
        ok && "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        failed && "border-red-500/25 bg-red-500/10 text-red-400",
        !running &&
          !ok &&
          !failed &&
          "border-border bg-card text-foreground/60",
      )}
    >
      {running ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Icon className="size-3.5" />
      )}
    </div>
  );
}

/* ─── Main card ──────────────────────────────────────────────────────────── */

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

  const elapsed = useLiveTimer(call.startedAt, running);
  const duration = call.finishedAt
    ? call.finishedAt - call.startedAt
    : elapsed;

  const summary = getToolSummary(call);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-xl overflow-hidden",
        "border bg-card backdrop-blur-sm",
        running &&
          "border-primary/25 animate-border-glow",
        ok && "border-border/70",
        failed && "border-red-500/25",
      )}
    >
      {/* Animated progress stripe while running */}
      {running && (
        <div
          className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-shimmer"
          style={{ backgroundSize: "200% 100%" }}
        />
      )}

      {/* ── Compact header (always visible) ── */}
      <button
        onClick={() => setExpanded((v: boolean) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 text-left",
          "px-3 py-2.5 md:px-3.5 md:py-3",
          "hover:bg-accent/20 active:bg-accent/30 transition-colors duration-150",
        )}
        aria-expanded={expanded}
        type="button"
      >
        <ToolIcon Icon={Icon} running={running} ok={ok} failed={failed} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13px] font-medium text-foreground/90 leading-none">
              {call.toolName}
            </span>
            <StatusPill status={call.status} />
          </div>
          {summary && (
            <div className="font-mono text-[11px] text-muted-foreground/70 truncate mt-1 leading-none">
              {summary}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/50 tabular-nums">
            <Clock className="size-2.5 opacity-60" />
            {formatDuration(duration)}
          </div>
          <ChevronRight
            className={cn(
              "size-3.5 text-muted-foreground/40 transition-transform duration-200",
              expanded && "rotate-90",
            )}
          />
        </div>
      </button>

      {/* ── Expandable detail panel ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              className={cn(
                "border-t border-border/30 bg-muted/20",
                "px-3 py-3 md:px-3.5 md:py-3.5 space-y-3",
              )}
            >
              {call.toolId === "web_search" ? (
                <WebSearchDetails call={call} />
              ) : (
                <GenericDetails call={call} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Web search detail panel ────────────────────────────────────────────── */

type WebSearchOutputType = {
  query?: string;
  provider?: string;
  results?: Array<{
    title: string;
    url: string;
    content: string;
    score?: number;
    publishedDate?: string;
  }>;
  answer?: string;
};

function WebSearchDetails({ call }: { call: ToolCall }) {
  const input = call.input as { query?: string; max_results?: number };
  const output = call.output as WebSearchOutputType | undefined;
  const running = call.status === "running" || call.status === "queued";
  const results = output?.results ?? [];

  return (
    <div className="space-y-3">
      {/* Query */}
      <div>
        <SectionLabel icon={Search} label="Query" />
        <div className="mt-1 text-[12px] font-medium text-foreground/80 bg-accent/20 rounded-lg px-2.5 py-1.5 border border-border/30 leading-relaxed select-text">
          {input.query ?? output?.query ?? "—"}
        </div>
      </div>

      {/* Live log stream while running */}
      {running && call.logs.length > 0 && (
        <div className="space-y-1">
          {call.logs.map((log, i) => (
            <div
              key={i}
              className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-primary/60 animate-pulse shrink-0" />
              {log.message}
            </div>
          ))}
        </div>
      )}

      {/* Sources list */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <SectionLabel icon={Globe} label="Sources" />
            <span className="font-mono text-[10px] text-muted-foreground/50">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-1.5">
            {results.slice(0, 5).map((r, i) => (
              <SourceCard key={r.url ?? i} result={r} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {call.error && <ErrorBlock error={call.error} />}

      {/* Logs (post-execution) */}
      {!running && call.logs.length > 0 && (
        <LogsSection logs={call.logs} />
      )}
    </div>
  );
}

/* ─── Generic detail panel ───────────────────────────────────────────────── */

function GenericDetails({ call }: { call: ToolCall }) {
  return (
    <div className="space-y-3">
      <div>
        <SectionLabel icon={Icons.SlidersHorizontal} label="Input" />
        <CodeBlock content={JSON.stringify(call.input, null, 2)} />
      </div>

      {call.logs.length > 0 && <LogsSection logs={call.logs} />}

      {call.output !== undefined && (
        <div>
          <SectionLabel icon={Icons.SquareCode} label="Output" />
          <CodeBlock content={JSON.stringify(call.output, null, 2)} />
        </div>
      )}

      {call.error && <ErrorBlock error={call.error} />}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3 text-muted-foreground/50" />
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
        {label}
      </span>
    </div>
  );
}

function CodeBlock({ content }: { content: string }) {
  return (
    <pre className="mt-1 font-mono text-[11px] text-foreground/65 overflow-x-auto scrollbar-none whitespace-pre-wrap break-all bg-accent/10 rounded-lg p-2.5 border border-border/25 leading-relaxed select-text">
      {content}
    </pre>
  );
}

function SourceCard({
  result,
  index,
}: {
  result: {
    title: string;
    url: string;
    content: string;
    score?: number;
    publishedDate?: string;
  };
  index: number;
}) {
  const domain = extractDomain(result.url);
  const initial = (domain[0] ?? "?").toUpperCase();

  return (
    <motion.a
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.045, duration: 0.2, ease: "easeOut" }}
      href={result.url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "flex gap-2.5 rounded-lg border border-border/40 bg-card/40 p-2",
        "hover:bg-accent/20 hover:border-border/70 transition-all duration-150",
        "group no-underline",
      )}
    >
      {/* Domain initials */}
      <div className="grid place-items-center size-5 rounded-sm bg-accent/60 border border-border/25 text-[9px] font-bold text-muted-foreground shrink-0 mt-0.5 select-none">
        {initial}
      </div>

      <div className="flex-1 min-w-0 select-text">
        <div className="text-[12px] font-medium text-foreground/80 truncate group-hover:text-foreground transition-colors leading-snug">
          {result.title}
        </div>
        <div className="text-[10px] text-primary/60 truncate font-mono mt-0.5">
          {domain}
        </div>
        {result.content && (
          <div className="text-[11px] text-muted-foreground/70 line-clamp-2 mt-1 leading-relaxed">
            {result.content.slice(0, 180)}
          </div>
        )}
      </div>

      <ExternalLink className="size-3 text-muted-foreground/25 group-hover:text-muted-foreground/60 transition-colors shrink-0 mt-0.5" />
    </motion.a>
  );
}

function LogsSection({ logs }: { logs: ToolCall["logs"] }) {
  return (
    <div>
      <SectionLabel icon={Terminal} label="Logs" />
      <div className="mt-1 space-y-px rounded-lg border border-border/25 bg-background/30 p-2 font-mono text-[10px]">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-2 select-text">
            <span className="text-muted-foreground/35 shrink-0 tabular-nums pt-px">
              {new Date(log.ts).toLocaleTimeString("en-US", { hour12: false })}
            </span>
            <span
              className={cn(
                "shrink-0 font-semibold uppercase pt-px",
                log.level === "info" && "text-sky-400/60",
                log.level === "debug" && "text-muted-foreground/40",
                log.level === "warn" && "text-amber-400/80",
                log.level === "error" && "text-red-400",
              )}
            >
              {log.level}
            </span>
            <span className="text-foreground/55 leading-relaxed">
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorBlock({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-red-500/25 bg-red-500/5 p-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <XCircle className="size-3 text-red-400" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-red-400/80">
          Error
        </span>
      </div>
      <div className="font-mono text-[11px] text-red-200/75 leading-relaxed select-text">
        {error}
      </div>
    </div>
  );
}
