"use client";

import { motion } from "framer-motion";
import { Plug, Check, Plus } from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toolRegistry } from "@/services/tool-registry";
import { cn } from "@/lib/utils";

function iconFor(name: string): LucideIcon {
  const I = (Icons as unknown as Record<string, LucideIcon>)[name];
  return I ?? Icons.Wrench;
}

const CATEGORY_COPY: Record<string, string> = {
  search: "Information retrieval",
  writing: "Composition",
  productivity: "Productivity",
  planning: "Scheduling",
  communication: "Communication",
};

export default function IntegrationsPage() {
  const tools = toolRegistry.list();
  const connectedCount = tools.filter((t) => t.connected).length;

  // Group by category
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

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
          <div className="surface-elevated rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="grid place-items-center size-10 rounded-lg border border-border bg-card/40 text-primary shrink-0">
                <Plug className="size-4" />
              </div>
              <div className="flex-1">
                <h2 className="font-medium mb-1">Tool registry</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every capability the agent can invoke lives here. Each tool is
                  a typed, modular contract — easy to swap from mock to
                  production. Bring your own keys in{" "}
                  <code className="font-mono text-xs bg-secondary px-1 py-0.5 rounded">
                    .env.local
                  </code>{" "}
                  to flip a tool from demo to live.
                </p>
              </div>
            </div>
          </div>

          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-medium">
                  {CATEGORY_COPY[category] ?? category}
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {items.length} tool{items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {items.map((t, i) => {
                  const Icon = iconFor(t.icon);
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className={cn(
                        "surface p-4 rounded-xl flex flex-col gap-3 hover:border-primary/30 transition-colors group",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid place-items-center size-10 rounded-md border border-border bg-card/40">
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{t.name}</span>
                            {t.connected ? (
                              <Badge variant="success" size="sm">
                                <Check className="size-2.5" /> Connected
                              </Badge>
                            ) : (
                              <Badge variant="muted" size="sm">
                                Demo only
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {t.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {t.parameters.slice(0, 3).map((p) => (
                          <span
                            key={p.name}
                            className="font-mono text-[10px] text-muted-foreground bg-secondary/40 border border-border/60 rounded px-1.5 py-0.5"
                          >
                            {p.name}
                            {p.required && (
                              <span className="text-primary">*</span>
                            )}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {t.id}
                        </span>
                        <Button
                          size="sm"
                          variant={t.connected ? "ghost" : "outline"}
                          disabled
                        >
                          {t.connected ? "Configured" : (
                            <>
                              <Plus className="size-3" /> Connect
                            </>
                          )}
                        </Button>
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
