"use client";

import * as React from "react";
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
    : sanitizeAssistantContent(message.content, { trim: !message.streaming });
  const shouldRenderContent = Boolean(
    renderedContent || (message.streaming && !isUser),
  );
  const previousAssistantLength = React.useRef(renderedContent.length);
  const revealFrom =
    message.streaming && !isUser
      ? previousAssistantLength.current
      : renderedContent.length;

  React.useEffect(() => {
    previousAssistantLength.current = renderedContent.length;
  }, [renderedContent]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group flex gap-3 py-3 md:gap-4 md:py-5",
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
              "max-w-2xl text-overflow-safe",
              isUser
                ? "rounded-2xl rounded-tr-md bg-secondary/60 border border-border/60 px-3.5 py-2 md:px-4 md:py-2.5 text-[15px] leading-relaxed"
                : "text-[15px] leading-relaxed text-foreground/90",
            )}
          >
            {renderedContent ? (
              <MarkdownLite content={renderedContent} revealFrom={revealFrom} />
            ) : (
              <TypingIndicator />
            )}
            {message.streaming && !isUser && renderedContent && (
              <span className="caret" aria-hidden />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function sanitizeAssistantContent(
  content: string,
  { trim = true }: { trim?: boolean } = {},
) {
  const sanitized = content
    .replace(/(^|\s):[a-z0-9_+-]+(?:::[a-z0-9_+-]+)*:(?=\s|$|[.,!?;])/gi, "$1")
    .replace(/ {2,}/g, " ")
    .replace(/ *\n */g, "\n");

  return trim ? sanitized.trim() : sanitized;
}

/**
 * Tiny markdown subset renderer — bold + bullets + linebreaks.
 * Avoids adding a full markdown lib to the bundle for a demo.
 */
function MarkdownLite({
  content,
  revealFrom = content.length,
}: {
  content: string;
  revealFrom?: number;
}) {
  const lines = content.split("\n");
  let lineStart = 0;
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const currentLineStart = lineStart;
        lineStart += line.length + 1;

        if (!line.trim()) return <div key={i} className="h-2" />;
        const bullet = line.match(/^•\s+(.*)$/);
        if (bullet) {
          const bulletTextOffset = currentLineStart + line.indexOf(bullet[1]);
          return (
            <div key={i} className="flex gap-2.5 pl-1">
              <span className="text-primary mt-1 size-1 rounded-full bg-primary shrink-0" />
              <span className="flex-1">
                {renderInline(bullet[1], bulletTextOffset, revealFrom)}
              </span>
            </div>
          );
        }
        return (
          <p key={i}>{renderInline(line, currentLineStart, revealFrom)}</p>
        );
      })}
    </div>
  );
}

function renderInline(text: string, baseOffset: number, revealFrom: number) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^\s)]+\))/g);
  let offset = baseOffset;

  return parts.map((part, index) => {
    const partOffset = offset;
    offset += part.length;

    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong
          key={`${partOffset}-${index}`}
          className="font-semibold text-foreground"
        >
          {renderRevealedText(boldText, partOffset + 2, revealFrom)}
        </strong>
      );
    }

    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link) {
      return (
        <a
          key={`${partOffset}-${index}`}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          {renderRevealedText(link[1], partOffset + 1, revealFrom)}
        </a>
      );
    }

    return (
      <span key={`${partOffset}-${index}`}>
        {renderRevealedText(part, partOffset, revealFrom)}
      </span>
    );
  });
}

function renderRevealedText(
  text: string,
  baseOffset: number,
  revealFrom: number,
) {
  if (!text) return null;

  const nodeEnd = baseOffset + text.length;
  if (nodeEnd <= revealFrom) return text;

  const splitAt = Math.max(0, revealFrom - baseOffset);
  const stableText = text.slice(0, splitAt);
  const revealingText = text.slice(splitAt);

  return (
    <>
      {stableText}
      {revealingText && (
        <span className="assistant-text-reveal">{revealingText}</span>
      )}
    </>
  );
}

function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 py-1 text-muted-foreground"
      aria-label="Nexa is typing"
    >
      <span className="sr-only">Nexa is typing…</span>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1.5 rounded-full bg-primary/70 animate-pulse"
          style={{ animationDelay: `${index * 150}ms` }}
          aria-hidden
        />
      ))}
    </div>
  );
}
