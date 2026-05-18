"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, NotebookPen, Mail, ListChecks } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { ChatComposer } from "@/components/chat/chat-composer";
import { MessageBubble } from "@/components/chat/message-bubble";
import { useChatStore, useActiveConversation } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";

const SUGGESTIONS = [
  {
    icon: Globe,
    label: "Research a topic",
    prompt: "Find the top 3 AI agent platforms launched in 2026",
  },
  {
    icon: ListChecks,
    label: "Plan your day",
    prompt: "Plan my day around 3 priorities and book focus blocks",
  },
  {
    icon: Mail,
    label: "Draft an email",
    prompt: "Draft a warm follow-up to Bella about the offer call",
  },
  {
    icon: NotebookPen,
    label: "Capture an idea",
    prompt: "Generate 5 startup ideas in climate tech and save them as a note",
  },
];

export default function ChatPage() {
  const conversation = useActiveConversation();
  const sendMessage = useChatStore((s) => s.sendMessage);
  const user = useAuthStore((s) => s.user);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const messages = conversation?.messages ?? [];
  const hasMessages = messages.length > 0;
  const lastContent = messages[messages.length - 1]?.content ?? "";

  // Ensure an empty conversation exists in the store as soon as the chat page mounts
  React.useEffect(() => {
    const { activeId, newConversation } = useChatStore.getState();
    if (!activeId) newConversation();
  }, []);

  // Auto-scroll to bottom as messages stream in
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, lastContent]);

  return (
    <>
      <TopBar
        title={conversation?.title ?? "New conversation"}
        subtitle={
          hasMessages
            ? `${messages.length} message${messages.length === 1 ? "" : "s"}`
            : "Start by typing a task below"
        }
      />

      <div className="flex-1 flex flex-col min-h-0">
        {/* Message area — always rendered so layout is stable */}
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin flex flex-col"
        >
          {hasMessages ? (
            <div className="max-w-3xl mx-auto w-full px-3 md:px-6 py-3 md:py-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} userName={user?.name} />
              ))}
              <div className="h-4" />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center px-4">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-sm text-muted-foreground/40 select-none"
              >
                How can I help you today?
              </motion.p>
            </div>
          )}
        </div>

        {/* Suggestion chips — visible above composer when conversation is empty */}
        <AnimatePresence>
          {!hasMessages && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="px-3 md:px-6 pb-2"
            >
              <div className="max-w-3xl mx-auto grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.prompt}
                      onClick={() => sendMessage(s.prompt)}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                      className="surface text-left p-3 rounded-xl hover:border-primary/30 transition-colors group"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        <span className="text-xs font-medium truncate">
                          {s.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 pl-[22px]">
                        {s.prompt}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ChatComposer autoFocus={!hasMessages} />
      </div>
    </>
  );
}
