"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MessageSquare,
  Wrench,
  History,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";

const STEPS = [
  {
    icon: MessageSquare,
    title: "Type any task",
    body: "Plain English. Nexa decomposes your intent into a structured plan.",
  },
  {
    icon: Wrench,
    title: "Tools execute",
    body: "Search, notes, calendar, email, tasks — modular, typed, and replaceable.",
  },
  {
    icon: History,
    title: "Replay anything",
    body: "Every workflow run is saved. Audit, branch, or re-run from history.",
  },
];

const PROMPTS = [
  "Plan my day around three priorities",
  "Find the top 3 AI agent platforms launched in 2026",
  "Draft a warm reply to the recruiter follow-up",
  "Generate 5 startup ideas in the climate space",
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);

  React.useEffect(() => {
    // If somehow not authenticated, start guest session so the demo always works
    if (!user) continueAsGuest();
  }, [user, continueAsGuest]);

  return (
    <main className="relative min-h-screen px-6 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,hsl(28_100%_50%/0.08),transparent_60%)]" />
      </div>

      <div className="max-w-2xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-6"
        >
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <Badge variant="outline" className="font-mono">
            <Sparkles className="size-3 text-primary" />
            Welcome{user?.name ? `, ${user.name}` : ""}
          </Badge>
          <h1 className="text-balance text-3xl md:text-4xl tracking-tight">
            Three things to know before you{" "}
            <span className="display-serif italic text-primary">begin</span>.
          </h1>
        </motion.div>

        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
                className="surface flex items-start gap-4 p-5 rounded-xl"
              >
                <div className="grid place-items-center size-10 rounded-md border border-border bg-background/40 text-primary shrink-0">
                  <Icon className="size-4" />
                </div>
                <div>
                  <div className="font-medium mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground mr-2">
                      0{i + 1}
                    </span>
                    {step.title}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="space-y-3"
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-center">
            Try one of these
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  sessionStorage.setItem("nexa.seed-prompt", p);
                  router.push("/chat");
                }}
                className="surface text-left p-3 rounded-lg hover:border-primary/30 transition-colors text-sm"
              >
                {p}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-center pt-4">
          <Button size="lg" onClick={() => router.push("/chat")}>
            Open workspace <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
