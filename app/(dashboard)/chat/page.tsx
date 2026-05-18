"use client";

import * as React from "react";
import { TopBar } from "@/components/layout/top-bar";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { MessageBubble } from "@/components/chat/message-bubble";
import { useChatStore, useActiveConversation } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";

export default function ChatPage() {
  const conversation = useActiveConversation();
  const sendMessage = useChatStore((s) => s.sendMessage);
  const user = useAuthStore((s) => s.user);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const messages = conversation?.messages ?? [];
  const hasMessages = messages.length > 0;
  const lastContent = messages[messages.length - 1]?.content ?? "";

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
        {hasMessages ? (
          <div ref={scrollerRef} className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
            <div className="max-w-3xl mx-auto px-3 md:px-6 py-3 md:py-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} userName={user?.name} />
              ))}
              <div className="h-4" />
            </div>
          </div>
        ) : (
          <ChatEmptyState onPick={(p) => sendMessage(p)} />
        )}
        <ChatComposer />
      </div>
    </>
  );
}
