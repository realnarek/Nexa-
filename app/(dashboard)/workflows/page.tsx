"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Trash2,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkflowStore } from "@/store/workflow-store";
import { cn, timeAgo, formatDuration } from "@/lib/utils";
import { toolRegistry } from "@/services/tool-registry";

const STATUS_META = {
  running: { variant: "primary", icon: Loader2, label: "Running", spin: true },
  succeeded: { variant: "success", icon: CheckCircle2, label: "Succeeded" },
  failed: { variant: "destructive", icon: XCircle, label: "Failed" },
  queued: { variant: "muted", icon: Clock, label: "Queued" },
  cancelled: { variant: "muted", icon: XCircle, label: "Cancelled" },
} as const;

export default function WorkflowsPage() {
  const workflows = useWorkflowStore((s) => s.workflows);
  const remove = useWorkflowStore((s) => s.remove);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  return (
    <>
      <TopBar
        title="Workflow history"
        subtitle={`${workflows.length} run${workflows.length === 1 ? "" : "s"} recorded`}
      />
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-3">
          {workflows.length === 0 ? (
            <div className="surface text-center py-16 px-6 rounded-xl">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Empty
              </div>
              <p className="text-muted-foreground text-sm">
                Nothing yet. Run a task in the agent chat to populate history.
              </p>
            </div>
          ) : (
            workflows.map((wf, i) => {
              const meta = STATUS_META[wf.status as keyof typeof STATUS_META] ?? STATUS_META.queued;
              const Icon = meta.icon;
              const expanded = expandedId === wf.id;
              const duration = wf.finishedAt
                ? wf.finishedAt - wf.startedAt
                : Date.now() - wf.startedAt;

              return (
                <motion.div
                  key={wf.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.25 }}
                  className="surface rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(expanded ? null : wf.id)}
                    className="w-full flex items-start gap-4 p-4 text-left hover:bg-accent/30 transition-colors"
                  >
                    <div
                      className={cn(
                        "grid place-items-center size-8 rounded-md border shrink-0",
                        wf.status === "running" &&
                          "border-primary/30 bg-primary/5 text-primary",
                        wf.status === "succeeded" &&
                          "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
                        wf.status === "failed" &&
                          "border-red-500/30 bg-red-500/5 text-red-300",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-3.5",
                          "spin" in meta && meta.spin && "animate-spin",
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{wf.title}</span>
                        <Badge variant={meta.variant} size="sm" className="font-mono shrink-0">
                          {meta.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                        <span>{timeAgo(wf.startedAt)}</span>
                        <span>· {formatDuration(duration)}</span>
                        {wf.toolCalls.length > 0 && (
                          <span className="flex items-center gap-1">
                            · <Wrench className="size-2.5" /> {wf.toolCalls.length} tool
                            {wf.toolCalls.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      {wf.summary && !expanded && (
                        <div className="text-xs text-muted-foreground mt-2 line-clamp-1">
                          {wf.summary}
                        </div>
                      )}
                    </div>

                    <ChevronRight
                      className={cn(
                        "size-4 text-muted-foreground transition-transform shrink-0 mt-1",
                        expanded && "rotate-90",
                      )}
                    />
                  </button>

                  {expanded && (
                    <div className="border-t border-border/30 bg-muted/20 px-4 py-4 space-y-4">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                          Original request
                        </div>
                        <div className="text-sm">{wf.request}</div>
                      </div>

                      {wf.plan && (
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                            Plan ({wf.plan.steps.length} steps)
                          </div>
                          <ol className="space-y-1">
                            {wf.plan.steps.map((s, idx) => (
                              <li
                                key={s.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span className="font-mono text-[10px] text-muted-foreground w-5">
                                  {String(idx + 1).padStart(2, "0")}
                                </span>
                                <span className="flex-1">{s.description}</span>
                                {s.toolId && (
                                  <Badge variant="muted" size="sm" className="font-mono">
                                    {toolRegistry.get(s.toolId)?.name ?? s.toolId}
                                  </Badge>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {wf.summary && (
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                            Outcome
                          </div>
                          <div className="text-sm text-foreground/80 leading-relaxed">
                            {wf.summary}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(wf.id)}
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
