"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Command,
  Cpu,
  Globe,
  ListChecks,
  Mail,
  NotebookPen,
  Sparkles,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TOOLS = [
  { icon: Globe, name: "Web Search" },
  { icon: NotebookPen, name: "Notes" },
  { icon: Mail, name: "Email Draft" },
  { icon: ListChecks, name: "Tasks" },
  { icon: Command, name: "Calendar" },
];

const CAPABILITIES = [
  {
    title: "Reasoning",
    description:
      "Decomposes vague intent into a plan you can read, audit, and steer.",
    icon: Cpu,
  },
  {
    title: "Tool execution",
    description:
      "Invokes typed, modular tools — not chained prompts pretending to be agents.",
    icon: Zap,
  },
  {
    title: "Persistent memory",
    description:
      "Every workflow run is replayable. Nothing happens in a black box.",
    icon: Sparkles,
  },
];

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Atmospheric backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,hsl(28_100%_50%/0.10),transparent_60%)]" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(28_100%_64%/0.08),transparent_70%)] blur-3xl" />
      </div>

      {/* Top nav */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-10 py-5">
        <Logo size="md" />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/onboarding">
              Open workspace <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 lg:px-10 pt-16 pb-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6 max-w-3xl"
        >
          <Badge variant="outline" className="font-mono">
            <span className="status-dot text-primary" /> v0.1 — early access
          </Badge>

          <h1 className="text-balance text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[0.95] font-medium">
            An AI{" "}
            <span className="display-serif italic font-normal text-primary">
              operating system
            </span>{" "}
            for the rest of us.
          </h1>

          <p className="text-balance text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Tell Nexa what you want done in plain English. It plans, picks the
            right tools, executes, and shows you exactly what it did — every
            step, replayable.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="lg" asChild>
              <Link href="/onboarding">
                Try the demo <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <span className="font-mono text-xs text-muted-foreground ml-2">
              No credit card. No setup. Guest mode available.
            </span>
          </div>
        </motion.div>

        {/* Floating product preview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-20"
        >
          <div className="surface-elevated rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 bg-card/60">
              <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-red-500/40" />
                <div className="size-2.5 rounded-full bg-amber-500/40" />
                <div className="size-2.5 rounded-full bg-emerald-500/40" />
              </div>
              <div className="flex-1" />
              <span className="font-mono text-[10px] text-muted-foreground">
                nexa.app/chat
              </span>
              <div className="flex-1" />
              <Cpu className="size-3.5 text-primary" />
              <span className="font-mono text-[10px] text-emerald-300">
                STREAMING
              </span>
            </div>
            <div className="p-6 md:p-10 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Your request
                </div>
                <div className="rounded-2xl rounded-tr-md bg-secondary/60 border border-border/60 p-4 text-sm">
                  Plan my Tuesday. Top 3 priorities, calendar blocks for each,
                  follow-up tasks.
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground pt-4">
                  Agent plan
                </div>
                <ol className="space-y-2 text-sm">
                  {[
                    "Identify priorities from context",
                    "Create three calendar blocks",
                    "Add follow-up tasks",
                    "Summarize the plan",
                  ].map((s, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 rounded-md border border-border/60 bg-card/40 px-3 py-2"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground w-4">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1">{s}</span>
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Tool executions
                </div>
                {TOOLS.slice(0, 4).map((t, i) => {
                  const Icon = t.icon;
                  return (
                    <motion.div
                      key={t.name}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.12 }}
                      className="surface flex items-center gap-3 rounded-lg px-3.5 py-2.5"
                    >
                      <div className="grid place-items-center size-7 rounded-md border border-border bg-card">
                        <Icon className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          completed · {180 + i * 90}ms
                        </div>
                      </div>
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Capabilities */}
      <section className="relative z-10 px-6 lg:px-10 py-24 max-w-6xl mx-auto border-t border-border">
        <div className="mb-12">
          <Badge variant="outline" className="font-mono mb-4">
            What it does
          </Badge>
          <h2 className="text-3xl md:text-4xl tracking-tight max-w-2xl">
            Not a chatbot.{" "}
            <span className="display-serif italic text-muted-foreground">
              An agent with hands.
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="surface p-6 hover:border-primary/30 transition-colors group"
              >
                <Icon className="size-5 text-primary mb-4" />
                <h3 className="font-medium mb-2">{cap.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cap.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 lg:px-10 py-24 max-w-6xl mx-auto">
        <div className="surface-elevated p-12 md:p-16 text-center rounded-2xl">
          <h2 className="display-serif italic text-4xl md:text-5xl tracking-tight mb-4">
            Run your first workflow.
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Open the workspace, type any task. The agent does the rest.
          </p>
          <Button size="lg" asChild>
            <Link href="/onboarding">
              Open workspace <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border px-6 lg:px-10 py-6 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Logo size="sm" showWordmark={false} />
          <span className="font-mono">© 2026 Nexa Labs</span>
        </div>
        <span className="font-mono">v0.1.0 · built for operators</span>
      </footer>
    </main>
  );
}
