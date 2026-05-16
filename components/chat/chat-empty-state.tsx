"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/common/logo";
import { Globe, NotebookPen, CalendarPlus, Mail, ListChecks } from "lucide-react";

const SUGGESTIONS = [
  {
    icon: Globe,
    title: "Research a topic",
    prompt: "Find the top 3 AI agent platforms launched in 2026",
  },
  {
    icon: ListChecks,
    title: "Plan your day",
    prompt: "Plan my day around 3 priorities and book focus blocks",
  },
  {
    icon: Mail,
    title: "Draft an email",
    prompt: "Draft a warm follow-up to Bella about the offer call",
  },
  {
    icon: NotebookPen,
    title: "Capture an idea",
    prompt: "Generate 5 startup ideas in climate tech and save them as a note",
  },
];

interface EmptyStateProps {
  onPick: (prompt: string) => void;
}

export function ChatEmptyState({ onPick }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl space-y-8"
      >
        <div className="flex justify-center mb-2">
          <Logo size="lg" showWordmark={false} />
        </div>
        <h2 className="display-serif italic text-4xl tracking-tight">
          What should I do for you?
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          Describe an outcome in plain English. The agent will plan, pick tools,
          execute, and show you every step.
        </p>

        <div className="grid sm:grid-cols-2 gap-2 pt-4">
          {SUGGESTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.button
                key={s.prompt}
                onClick={() => onPick(s.prompt)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="surface text-left p-4 rounded-lg hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="grid place-items-center size-8 rounded-md border border-border bg-card/40 shrink-0 text-foreground/70 group-hover:text-primary transition-colors">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium mb-0.5">{s.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {s.prompt}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
