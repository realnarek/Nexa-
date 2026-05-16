"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  ListChecks,
  History,
  Plug,
  Settings,
  Plus,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/chat", label: "Agent", icon: MessageSquare },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/workflows", label: "Workflows", icon: History },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const newConversation = useChatStore((s) => s.newConversation);
  const setActive = useChatStore((s) => s.setActive);
  const user = useAuthStore((s) => s.user);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);

  return (
    <aside className="hidden md:flex h-screen w-[260px] shrink-0 flex-col border-r border-border bg-card/30 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <Link href="/chat" className="flex items-center">
          <Logo size="md" />
        </Link>
        <Badge variant="muted" size="sm" className="font-mono">
          BETA
        </Badge>
      </div>

      {/* Command palette trigger */}
      <div className="px-3 pt-3">
        <button
          onClick={() => setCommandOpen(true)}
          className="group flex w-full items-center gap-2 rounded-md border border-border bg-background/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Sparkles className="size-3.5 text-primary" />
          <span className="flex-1 text-left">Quick command…</span>
          <kbd className="font-mono text-[10px] text-muted-foreground">⌘K</kbd>
        </button>
      </div>

      {/* Primary nav */}
      <nav className="px-2 pt-3 pb-2 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
              {item.href === "/chat" && conversations.length > 0 && (
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  {conversations.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Conversation list */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Recent
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => newConversation()}
          aria-label="New conversation"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2">
        <ul className="space-y-0.5 pb-3">
          {conversations.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-muted-foreground">
              No conversations yet
            </li>
          ) : (
            conversations.slice(0, 12).map((c) => (
              <li key={c.id}>
                <Link
                  href="/chat"
                  onClick={() => setActive(c.id)}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition-colors",
                    c.id === activeId
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <div className="truncate">{c.title}</div>
                  <div className="font-mono text-[10px] text-muted-foreground/70 mt-0.5">
                    {timeAgo(c.updatedAt)}
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </ScrollArea>

      {/* User */}
      <div className="border-t border-border p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/60 transition-colors"
        >
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="text-xs font-medium bg-secondary">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium">
              {user?.name ?? "Operator"}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {user?.isGuest ? "Guest session" : user?.email}
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
