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

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const [leaving, setLeaving] = React.useState(false);

  React.useEffect(() => {
    if (!user) continueAsGuest();
  }, [user, continueAsGuest]);

  const handleEnter = React.useCallback(() => {
    setLeaving(true);
    setTimeout(() => router.push("/chat"), 280);
  }, [router]);

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center px-5 py-8 overflow-hidden">
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-x-0 top-0 h-[400px] bg-[radial-gradient(ellipse_at_top,hsl(28_100%_50%/0.08),transparent_60%)]" />
      </div>

      <motion.div
        animate={
          leaving
            ? { opacity: 0, y: -12, scale: 0.97 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm space-y-5"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <Badge variant="outline" className="font-mono">
            <Sparkles className="size-3 text-primary" />
            Welcome{user?.name ? `, ${user.name}` : ""}
          </Badge>
          <h1 className="text-balance text-2xl tracking-tight">
            Three things to know before you{" "}
            <span className="display-serif italic text-primary">begin</span>.
          </h1>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.09, duration: 0.35 }}
                className="surface flex items-start gap-3 p-3.5 rounded-xl"
              >
                <div className="grid place-items-center size-8 rounded-md border border-border bg-background/40 text-primary shrink-0">
                  <Icon className="size-3.5" />
                </div>
                <div>
                  <div className="font-medium text-sm mb-0.5">
                    <span className="font-mono text-[10px] text-muted-foreground mr-2">
                      0{i + 1}
                    </span>
                    {step.title}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.35 }}
          className="flex flex-col items-center gap-2 pt-1"
        >
          <Button size="lg" className="w-full" onClick={handleEnter}>
            Enter workspace <ArrowRight className="size-4" />
          </Button>
          <p className="text-[11px] text-muted-foreground text-center font-mono">
            You can revisit this later in Settings.
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
