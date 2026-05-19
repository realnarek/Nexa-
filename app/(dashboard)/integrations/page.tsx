"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plug, Check, Zap, Settings2, Unplug } from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { toolRegistry } from "@/services/tool-registry";
import { cn } from "@/lib/utils";

function iconFor(name: string): LucideIcon {
  const I = (Icons as unknown as Record<string, LucideIcon>)[name];
  return I ?? Icons.Wrench;
}

const CATEGORY_LABELS: Record<string, string> = {
  search: "Search",
  writing: "Composition",
  productivity: "Productivity",
  planning: "Scheduling",
  communication: "Communication",
};

const TOOL_DESCRIPTIONS: Record<string, string> = {
  web_search:
    "Search the live web for news, facts, research, and current information.",
};

export default function IntegrationsPage() {
  const tools = toolRegistry.list();
  const connectedCount = tools.filter((t) => t.connected).length;

  const grouped = tools.reduce<Record<string, typeof tools>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  return (
    <>
      <TopBar
        title="Integrations"
        subtitle={`${connectedCount} of ${tools.length} connected`}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin scroll-touch">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
          <div className="surface-elevated rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="grid place-items-center size-9 rounded-lg border border-border bg-card/40 text-primary shrink-0 mt-0.5">
                <Plug className="size-4" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-sm mb-1.5">
                  Connected tools
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Connect services Nexa can use while working. Tools help the
                  agent search, plan, retrieve information, and complete tasks
                  for you.
                </p>
              </div>
            </div>
          </div>

          {Object.entries(grouped).map(([category, items]) => (
            <section key={category} className="space-y-2">
              <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                {CATEGORY_LABELS[category] ?? category}
              </h3>
              <div className="grid gap-2">
                {items.map((t, i) => {
                  const Icon = iconFor(t.icon);
                  const description = TOOL_DESCRIPTIONS[t.id] ?? t.description;
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className="surface rounded-xl p-4 hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="grid place-items-center size-9 rounded-lg border border-border bg-secondary/60 text-foreground shrink-0">
                          <Icon className="size-4" />
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-medium text-sm leading-none">
                            {t.name}
                          </span>
                          {t.connected ? (
                            <Badge variant="success" size="sm">
                              <Check className="size-2.5" /> Ready
                            </Badge>
                          ) : (
                            <Badge variant="muted" size="sm">
                              Not connected
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        {description}
                      </p>

                      <div className="flex items-center gap-2">
                        <ActionButton
                          icon={<Zap className="size-3" />}
                          label="Test"
                        />
                        <ActionButton
                          icon={<Settings2 className="size-3" />}
                          label="Settings"
                        />
                        <ActionButton
                          icon={<Unplug className="size-3" />}
                          label="Disconnect"
                          className="ml-auto text-destructive/60 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

function ActionButton({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2.5 text-xs rounded-lg",
        "border border-border/60 bg-secondary/30 text-foreground/60",
        "hover:bg-secondary/70 hover:text-foreground hover:border-border",
        "transition-all duration-150 active:scale-95",
        "touch-manipulation",
        className,
      )}
    >
      {icon}
      {label}
    </button>
  );
}
