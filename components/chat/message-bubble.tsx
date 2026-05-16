"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { ToolExecutionCard } from "./tool-execution-card";
import { Logo } from "@/components/common/logo";

interface MessageBubbleProps {
  message: ChatMessage;
  userName?: string;
}

export function MessageBubble({ message, userName }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const renderedContent = isUser
    ? message.content
    : sanitizeAssistantContent(message.content);
  const shouldRenderContent = Boolean(
    renderedContent || (message.streaming && !isUser && message.content),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group flex gap-4 py-5",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar slot */}
      <div className="shrink-0 pt-0.5">
        {isUser ? (
          <div className="grid place-items-center size-7 rounded-full bg-secondary border border-border text-xs font-medium">
            {userName?.[0]?.toUpperCase() ?? "U"}
          </div>
        ) : (
          <div className="size-7 grid place-items-center">
            <Logo size="sm" showWordmark={false} />
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex-1 min-w-0 space-y-3",
          isUser && "flex flex-col items-end",
        )}
      >
        {/* Tool calls (rendered BEFORE content so they read chronologically) */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="w-full space-y-2 max-w-2xl">
            {message.toolCalls.map((c) => (
              <ToolExecutionCard key={c.id} call={c} />
            ))}
          </div>
        )}

        {/* Text content */}
        {shouldRenderContent && (
          <div
            className={cn(
              "max-w-2xl",
              isUser
                ? "rounded-2xl rounded-tr-md bg-secondary/60 border border-border/60 px-4 py-2.5 text-[15px] leading-relaxed"
                : "text-[15px] leading-relaxed text-foreground/90",
            )}
          >
            <MarkdownLite content={renderedContent} />
            {message.streaming && !isUser && (
              <span className="caret" aria-hidden />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function sanitizeAssistantContent(content: string) {
  return content
    .replace(/(^|\s):[a-z0-9_+-]+(?:::[a-z0-9_+-]+)*:(?=\s|$|[.,!?;])/gi, "$1")
    .replace(/ {2,}/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

/**
 * Tiny markdown subset renderer — bold + bullets + linebreaks.
 * Avoids adding a full markdown lib to the bundle for a demo.
 */
function MarkdownLite({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        const bullet = line.match(/^•\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2.5 pl-1">
              <span className="text-primary mt-1 size-1 rounded-full bg-primary shrink-0" />
              <span className="flex-1">{renderInline(bullet[1])}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
