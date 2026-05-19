"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ArrowUp,
  Plus,
  Sparkles,
  ListChecks,
  Workflow,
  Plug,
  Settings,
  MessageSquare,
  MoreVertical,
  ChevronRight,
  Trash2,
  Pencil,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { ConversationRenameRow } from "./ConversationRenameRow";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import type { Conversation } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DemoMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type NavItem =
  | { icon: React.ElementType; label: string; shortcut: string; isCommand: true }
  | { icon: React.ElementType; label: string; href: string; isCommand?: false };

// ─── Static data ─────────────────────────────────────────────────────────────

const DEMO_MESSAGES: DemoMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Generate 5 startup ideas in climate tech and save them as a note",
    timestamp: new Date(Date.now() - 120_000),
  },
  {
    id: "2",
    role: "assistant",
    content: `Here are 5 climate tech startup ideas:

**1. Grid-Interactive Smart EV Chargers**
Develops EV chargers that communicate with the grid to charge during renewable energy peaks and discharge during high-demand periods, turning EVs into distributed energy resources.

**2. AI-Powered Precision Agriculture Platform**
Uses satellite imagery, soil sensors, and machine learning to optimize fertilizer/pesticide use, reduce water consumption, and increase crop yields while minimizing environmental impact.

**3. Modular Direct Air Capture (DAC) Units for Small Businesses**
Creates compact, affordable DAC devices that small and medium businesses can install to capture CO₂ from their own facilities, with options for carbon credit monetization.

**4. Circular Economy Marketplace for Construction Materials**
A digital platform connecting demolition companies, contractors, and manufacturers to reuse, recycle, and repurpose building materials, reducing construction waste and embodied carbon.

**5. Ocean-Based Carbon Sequestration Monitoring**
Provides verification and monitoring services for ocean alkalinity enhancement and seaweed farming projects, using sensors and AI to measure carbon sequestration accurately for carbon credit markets.`,
    timestamp: new Date(Date.now() - 90_000),
  },
];

const NAV_ITEMS: NavItem[] = [
  { icon: Sparkles, label: "Quick command…", shortcut: "⌘K", isCommand: true },
  { icon: MessageSquare, label: "Agent", href: "/chat" },
  { icon: ListChecks, label: "Tasks", href: "/tasks" },
  { icon: Workflow, label: "Workflows", href: "/workflows" },
  { icon: Plug, label: "Integrations", href: "/integrations" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function nanoid() {
  return Math.random().toString(36).slice(2, 11);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AssistantContent({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-[#e8e8e8]">
      {text.split("\n\n").map((para, i) => {
        if (!para.trim()) return null;
        const rendered = para.replace(
          /\*\*(.+?)\*\*/g,
          '<strong class="font-semibold text-white">$1</strong>',
        );
        return (
          <p
            key={i}
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        );
      })}
    </div>
  );
}

function DemoMessageBubble({ msg }: { msg: DemoMessage }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 size-8 rounded-full grid place-items-center text-xs font-semibold",
          isUser
            ? "bg-[#d4a574] text-[#0a0e27]"
            : "bg-[#1a2040] border border-[rgba(255,255,255,0.1)] text-[#d4a574]",
        )}
      >
        {isUser ? "U" : "N"}
      </div>

      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-[#1e2a4a] border border-[rgba(255,255,255,0.1)] text-white text-sm leading-relaxed rounded-tr-md"
            : "bg-transparent",
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        ) : (
          <AssistantContent text={msg.content} />
        )}
        <p
          className={cn(
            "text-[10px] mt-2 font-mono",
            isUser
              ? "text-right text-[rgba(255,255,255,0.4)]"
              : "text-[rgba(255,255,255,0.3)]",
          )}
        >
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── ConversationRow ─────────────────────────────────────────────────────────

interface ConversationRowProps {
  conversation: Conversation;
  isActive: boolean;
  menuOpen: boolean;
  isRenaming: boolean;
  onActivate: (id: string) => void;
  onMenuToggle: (id: string) => void;
  onRenameStart: (id: string) => void;
  onSave: (id: string, title: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

const ConversationRow = React.memo(function ConversationRow({
  conversation: c,
  isActive,
  menuOpen,
  isRenaming,
  onActivate,
  onMenuToggle,
  onRenameStart,
  onSave,
  onCancel,
  onDelete,
}: ConversationRowProps) {
  // Lifecycle: rerender log
  const renderCountRef = React.useRef(0);
  renderCountRef.current += 1;
  if (renderCountRef.current > 1) {
    console.debug("[ConversationRow] rerender", {
      id: c.id,
      isActive,
      menuOpen,
      isRenaming,
      renderCount: renderCountRef.current,
    });
  }

  return (
    <div
      className="rounded-md"
      style={{
        background:
          isActive || menuOpen || isRenaming
            ? "rgba(255,255,255,0.08)"
            : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive && !menuOpen && !isRenaming)
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        if (!isActive && !menuOpen && !isRenaming)
          e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Row: link + three-dot */}
      <div className="flex items-center group">
        <Link
          href="/chat"
          onClick={() => onActivate(c.id)}
          className="flex-1 min-w-0 px-3 py-2 min-h-[40px] flex flex-col justify-center"
        >
          <div
            className="text-sm font-medium truncate"
            style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)" }}
          >
            {c.title}
          </div>
          <div
            className="font-mono text-[10px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {timeAgo(c.updatedAt)}
          </div>
        </Link>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle(c.id);
          }}
          className={cn(
            "shrink-0 grid place-items-center size-7 rounded-md mr-1.5 transition-all duration-150",
            menuOpen
              ? "opacity-100"
              : "opacity-50 md:opacity-0 md:group-hover:opacity-100",
          )}
          style={{ color: menuOpen ? "#d4a574" : "rgba(255,255,255,0.6)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            if (!menuOpen) e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = menuOpen
              ? "#d4a574"
              : "rgba(255,255,255,0.6)";
          }}
          aria-label="Conversation options"
        >
          <MoreVertical size={12} />
        </button>
      </div>

      {/* Rename input — rendered outside AnimatePresence so it stays
          mounted regardless of menu open/close or sidebar rerenders. */}
      {isRenaming && (
        <ConversationRenameRow
          conversationId={c.id}
          initialTitle={c.title ?? ""}
          onSave={onSave}
          onCancel={onCancel}
        />
      )}

      {/* Animated menu actions — never wraps the rename input */}
      <AnimatePresence>
        {menuOpen && !isRenaming && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2">
              <div
                className="flex gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onRenameStart(c.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs transition-colors"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }}
                >
                  <Pencil size={11} />
                  Rename
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs transition-colors"
                  style={{
                    color: "rgba(239,68,68,0.75)",
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.12)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ef4444";
                    e.currentTarget.style.background = "rgba(239,68,68,0.14)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(239,68,68,0.75)";
                    e.currentTarget.style.background = "rgba(239,68,68,0.06)";
                  }}
                >
                  <Trash2 size={11} />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

export function NexaChatUI({ children }: { children?: React.ReactNode }) {
  const isLayoutMode = !!children;

  // UI store
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);

  // Chat store
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const newConversation = useChatStore((s) => s.newConversation);
  const setActive = useChatStore((s) => s.setActive);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const renameConversation = useChatStore((s) => s.renameConversation);

  // Auth store
  const user = useAuthStore((s) => s.user);

  // Routing
  const pathname = usePathname();
  const router = useRouter();

  // Standalone demo state
  const [demoMessages, setDemoMessages] = React.useState<DemoMessage[]>(DEMO_MESSAGES);
  const [inputValue, setInputValue] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isLayoutMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [demoMessages, isLayoutMode]);

  // Close sidebar when resizing to desktop
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileSidebarOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setMobileSidebarOpen]);

  const sendDemoMessage = () => {
    const text = inputValue.trim();
    if (!text) return;

    const userMsg: DemoMessage = {
      id: nanoid(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setDemoMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    setTimeout(() => {
      const assistantMsg: DemoMessage = {
        id: nanoid(),
        role: "assistant",
        content: `I've received your message: "${text}"\n\nI'm processing your request now. As Nexa AI Agent, I'll help you accomplish this task step by step.`,
        timestamp: new Date(),
      };
      setDemoMessages((prev) => [...prev, assistantMsg]);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Do not intercept Enter during IME composition (Gboard, Samsung, iOS)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendDemoMessage();
    }
  };

  const closeSidebar = React.useCallback(
    () => setMobileSidebarOpen(false),
    [setMobileSidebarOpen],
  );

  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);

  // Outside-click: close the menu only. Rename stays active until the user
  // explicitly saves (Enter / ✓) or cancels (Escape / ✗).
  React.useEffect(() => {
    if (!menuOpenId) return;
    const handler = () => {
      console.debug("[Nexa:sidebar] outside-click close menu", { menuOpenId });
      setMenuOpenId(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpenId]);

  // Stable callbacks — all state setters and store actions are already stable.
  const handleActivate = React.useCallback(
    (id: string) => {
      setActive(id);
      setMobileSidebarOpen(false);
      setMenuOpenId(null);
    },
    [setActive, setMobileSidebarOpen],
  );

  const handleMenuToggle = React.useCallback((id: string) => {
    setMenuOpenId((prev) => (prev === id ? null : id));
    setRenamingId(null);
  }, []);

  const handleRenameStart = React.useCallback((id: string) => {
    setRenamingId(id);
  }, []);

  const handleSave = React.useCallback(
    (id: string, title: string) => {
      renameConversation(id, title);
      setRenamingId(null);
      setMenuOpenId(null);
    },
    [renameConversation],
  );

  const handleCancel = React.useCallback(() => {
    setRenamingId(null);
    setMenuOpenId(null);
  }, []);

  const handleDelete = React.useCallback(
    (id: string) => {
      deleteConversation(id);
      setMenuOpenId(null);
    },
    [deleteConversation],
  );

  // Sync --vvh / --keyboard-inset CSS variables via visualViewport API.
  // Fixes the Android keyboard-overlay bug where h-dvh uses the stale layout
  // viewport instead of the actual visible area above the keyboard.
  useVisualViewport();

  // Diagnostic: log persisted conversation health on first render
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    console.debug("[Nexa:sidebar] mounted conversations", conversations.slice(0, 5).map((c) => ({
      id: c.id,
      title: c.title,
      titleType: typeof c.title,
      hasUpdatedAt: typeof c.updatedAt === "number",
      updatedAt: c.updatedAt,
      msgCount: c.messages?.length ?? 0,
      stuckStreaming: c.messages?.some?.((m) => m.streaming) ?? false,
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally mount-only

  return (
    <div
      className="flex w-full overflow-hidden"
      style={{
        // Use the visual-viewport height instead of 100dvh / h-dvh.
        // On Android, dvh reflects the layout viewport which stays stale when
        // the software keyboard opens or after returning from another app.
        // --vvh is kept in sync by useVisualViewport() via the visualViewport
        // API, so this container always matches the area above the keyboard.
        height: "var(--vvh, 100dvh)",
        background: "#0a0e27",
        color: "#ffffff",
      }}
    >
      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] md:hidden"
            onClick={closeSidebar}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col",
          "w-[280px] max-w-[85vw]",
          "transition-transform duration-250",
          "md:relative md:z-auto md:w-[280px] md:max-w-none md:shrink-0 md:translate-x-0 md:flex",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        style={{
          background: "#0f1419",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          transitionProperty: "transform",
          transitionDuration: "250ms",
          transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: "transform",
          boxShadow: "4px 0 32px rgba(0,0,0,0.55)",
        }}
      >
        {/* Header */}
        <div
          className="flex h-14 shrink-0 items-center justify-between px-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Link href="/chat" onClick={closeSidebar} className="flex items-center gap-2">
            <div
              className="flex items-center justify-center size-7 rounded-lg font-bold text-sm"
              style={{ background: "#d4a574", color: "#0a0e27" }}
            >
              N
            </div>
            <span className="font-semibold text-white tracking-wide">Nexa</span>
            <span
              className="font-mono text-[9px] px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(212,165,116,0.15)",
                color: "#d4a574",
                border: "1px solid rgba(212,165,116,0.3)",
              }}
            >
              BETA
            </span>
          </Link>

          {/* Close button — mobile only */}
          <button
            onClick={closeSidebar}
            className="md:hidden grid place-items-center size-8 rounded-md transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="px-2 pt-3 pb-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              !item.isCommand && "href" in item && pathname.startsWith(item.href);

            if (item.isCommand) {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setCommandOpen(true);
                    closeSidebar();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-left transition-colors min-h-[44px]"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                  }}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <kbd
                    className="font-mono text-[9px] px-1 rounded"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    {item.shortcut}
                  </kbd>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeSidebar}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors min-h-[44px]"
                style={{
                  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isActive
                    ? "rgba(255,255,255,0.08)"
                    : "transparent";
                  e.currentTarget.style.color = isActive
                    ? "#ffffff"
                    : "rgba(255,255,255,0.55)";
                }}
              >
                <Icon size={15} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div
          className="mx-4 my-1"
          style={{ height: 1, background: "rgba(255,255,255,0.08)" }}
        />

        {/* Recent conversations */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <span
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Recent
          </span>
          <button
            onClick={() => {
              newConversation();
              closeSidebar();
              if (pathname !== "/chat") router.push("/chat");
            }}
            className="grid place-items-center size-6 rounded-md transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.5)";
            }}
            aria-label="New conversation"
          >
            <Plus size={13} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin">
          <ul className="space-y-0.5">
            {conversations.length === 0 ? (
              <li
                className="px-3 py-4 text-center text-xs"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                No conversations yet
              </li>
            ) : (
              <AnimatePresence initial={false}>
                {conversations.slice(0, 12).map((c) => (
                  <motion.li
                    key={c.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <ConversationRow
                      conversation={c}
                      isActive={c.id === activeId}
                      menuOpen={menuOpenId === c.id}
                      isRenaming={renamingId === c.id}
                      onActivate={handleActivate}
                      onMenuToggle={handleMenuToggle}
                      onRenameStart={handleRenameStart}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      onDelete={handleDelete}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            )}
          </ul>
        </div>

        {/* New chat CTA */}
        <div
          className="px-3 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => {
              newConversation();
              closeSidebar();
              if (pathname !== "/chat") router.push("/chat");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors min-h-[44px]"
            style={{
              background: "rgba(212,165,116,0.12)",
              color: "#d4a574",
              border: "1px solid rgba(212,165,116,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(212,165,116,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(212,165,116,0.12)";
            }}
          >
            <Plus size={15} />
            Create new chat
          </button>
        </div>

        {/* User profile */}
        <Link
          href="/settings"
          onClick={closeSidebar}
          className="flex items-center gap-3 px-4 py-3 transition-colors"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div
            className="flex-shrink-0 size-8 rounded-full grid place-items-center text-xs font-semibold"
            style={{ background: "#d4a574", color: "#0a0e27" }}
          >
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium text-white">
              {user?.name ?? "Operator"}
            </div>
            <div
              className="truncate text-[11px]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {user?.isGuest ? "Guest session" : user?.email}
            </div>
          </div>
        </Link>
      </aside>

      {/* ── Main area ── */}
      <div
        className={cn(
          "flex flex-1 flex-col min-w-0 overflow-hidden",
          isLayoutMode && "bg-background text-foreground",
        )}
      >
        {isLayoutMode ? (
          // Layout mode: children supply their own header (TopBar) and content
          <>{children}</>
        ) : (
          // Standalone demo mode: own header + demo messages + input
          <>
            {/* ── Header ── */}
            <header
              className="flex h-14 shrink-0 items-center justify-between px-4 gap-3"
              style={{
                background: "#0a0e27",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                position: "sticky",
                top: 0,
                zIndex: 20,
              }}
            >
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden grid place-items-center size-10 rounded-md transition-colors"
                style={{ color: "rgba(255,255,255,0.7)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              {/* Title */}
              <div className="flex-1 flex items-center justify-center md:justify-start">
                <h1 className="font-semibold text-base text-white tracking-wide">
                  Nexa
                </h1>
                <ChevronRight
                  size={14}
                  className="mx-1 hidden md:block"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
                <span
                  className="text-sm hidden md:block"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Climate Tech Ideas
                </span>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-semibold transition-colors min-h-[32px]"
                  style={{
                    background: "rgba(212,165,116,0.15)",
                    color: "#d4a574",
                    border: "1px solid rgba(212,165,116,0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(212,165,116,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(212,165,116,0.15)";
                  }}
                >
                  85
                </button>
                <button
                  className="grid place-items-center size-9 rounded-md transition-colors"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                  }}
                  aria-label="More options"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </header>

            {/* ── Messages ── */}
            <div
              className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin overscroll-contain"
              style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              <div className="max-w-2xl mx-auto w-full space-y-4">
                {demoMessages.map((msg) => (
                  <DemoMessageBubble key={msg.id} msg={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* ── Input ── */}
            <div
              className="shrink-0 px-3 pt-3"
              style={{
                background: "linear-gradient(to top, #0a0e27 80%, transparent)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingBottom: "max(12px, env(safe-area-inset-bottom))",
              }}
            >
              <div className="max-w-2xl mx-auto w-full">
                <div
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-1"
                  style={{
                    background: "#111827",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Nexa anything..."
                    autoCorrect="on"
                    autoCapitalize="sentences"
                    autoComplete="on"
                    spellCheck={true}
                    className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder-[rgba(255,255,255,0.35)] outline-none min-h-[44px]"
                  />
                  <button
                    onClick={sendDemoMessage}
                    disabled={!inputValue.trim()}
                    className="grid place-items-center size-8 rounded-xl shrink-0 transition-all duration-150"
                    style={{
                      background: inputValue.trim()
                        ? "#d4a574"
                        : "rgba(255,255,255,0.08)",
                      color: inputValue.trim()
                        ? "#0a0e27"
                        : "rgba(255,255,255,0.25)",
                      cursor: inputValue.trim() ? "pointer" : "not-allowed",
                    }}
                    aria-label="Send message"
                  >
                    <ArrowUp size={15} />
                  </button>
                </div>
                <p
                  className="text-center text-[10px] font-mono mt-1.5"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  Nexa Agent · v0.1 — press Enter to send
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
