"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, NotebookPen, Mail, ListChecks } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { ChatComposer } from "@/components/chat/chat-composer";
import { MessageBubble } from "@/components/chat/message-bubble";
import { useChatStore, useActiveConversation } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { useScrollController } from "@/hooks/use-scroll-controller";

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

  const { scrollerRef, showJumpButton, scrollToBottom, scrollOnSend, onContentGrow } =
    useScrollController();

  const messages = conversation?.messages ?? [];
  const hasMessages = messages.length > 0;
  const lastContent = messages[messages.length - 1]?.content ?? "";

  // Count only user messages so we know when the user has sent a new one.
  // Using a filter here is fine — the list is bounded by a single conversation.
  const userMessageCount = messages.filter((m) => m.role === "user").length;

  // Ensure an empty conversation exists as soon as the chat page mounts.
  React.useEffect(() => {
    const { activeId, newConversation } = useChatStore.getState();
    if (!activeId) newConversation();
  }, []);

  // Jump to bottom (instant) each time the user sends a message, and enter
  // auto-follow mode so streaming content keeps the viewport pinned to the
  // bottom until the user manually scrolls away.
  React.useEffect(() => {
    if (userMessageCount > 0) scrollOnSend();
  }, [userMessageCount, scrollOnSend]);

  // While streaming, keep the viewport at the bottom only if auto-follow mode
  // is still active (i.e. the user has not scrolled away since sending).
  // This replaces the old "auto-scroll on every delta" behaviour.
  React.useEffect(() => {
    onContentGrow();
  }, [lastContent, onContentGrow]);

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

      {/* relative container — ChatComposer floats absolutely inside here */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Message area — fills all available space; content is padded at the
            bottom so the last message is never hidden behind the floating
            composer. The scroller extends to the full container height so chat
            content is visible through the transparent composer wrapper. */}
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-none flex flex-col select-none"
        >
          {hasMessages ? (
            <div className="max-w-3xl mx-auto w-full px-3 md:px-6 py-3 md:py-4 select-none">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {/* Reserve space for the floating composer so the last message
                  is not hidden behind it */}
              <div className="h-[88px]" />
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

        {/* Suggestion chips — visible above composer when conversation is empty.
            pb-[88px] reserves space for the absolutely-positioned floating
            composer so chips are never overlapped by it. */}
        <AnimatePresence>
          {!hasMessages && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="px-3 md:px-6 pb-[88px]"
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

        {/* Cinematic bottom fade — fades scroll content into darkness behind the
            floating composer. Pointer-events disabled so it never blocks taps.
            z-9 keeps it above the message list but below the composer (z-10). */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "160px",
            zIndex: 9,
            background:
              "linear-gradient(to bottom, hsl(var(--background) / 0) 0%, hsl(var(--background) / 0.28) 30%, hsl(var(--background) / 0.68) 58%, hsl(var(--background) / 0.88) 78%, hsl(var(--background) / 0.97) 100%)",
          }}
        />

        <ChatComposer
          autoFocus={!hasMessages}
          showScrollButton={showJumpButton}
          onScrollToBottom={scrollToBottom}
        />
      </div>
    </>
  );
}
