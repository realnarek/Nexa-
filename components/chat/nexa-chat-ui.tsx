"use client";

import * as React from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface RecentChat {
  id: string;
  title: string;
  preview: string;
  time: string;
}

// ─── Sample data ─────────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "user",
    content:
      "Generate 5 startup ideas in climate tech and save them as a note",
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

const NAV_ITEMS = [
  { icon: Sparkles, label: "Quick command…", shortcut: "⌘K" },
  { icon: MessageSquare, label: "Agent" },
  { icon: ListChecks, label: "Tasks" },
  { icon: Workflow, label: "Workflows" },
  { icon: Plug, label: "Integrations" },
  { icon: Settings, label: "Settings" },
];

const RECENT_CHATS: RecentChat[] = [
  {
    id: "r1",
    title: "Climate tech startup ideas",
    preview: "Generate 5 startup ideas…",
    time: "2m ago",
  },
  {
    id: "r2",
    title: "Q3 marketing strategy",
    preview: "Draft a comprehensive plan…",
    time: "1h ago",
  },
  {
    id: "r3",
    title: "Competitor analysis",
    preview: "Research top 5 competitors…",
    time: "3h ago",
  },
  {
    id: "r4",
    title: "Product roadmap review",
    preview: "Summarize the key priorities…",
    time: "Yesterday",
  },
  {
    id: "r5",
    title: "Email campaign draft",
    preview: "Write a follow-up email…",
    time: "2d ago",
  },
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

function MessageBubble({ msg }: { msg: Message }) {
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
      {/* Avatar */}
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

      {/* Content */}
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
            isUser ? "text-right text-[rgba(255,255,255,0.4)]" : "text-[rgba(255,255,255,0.3)]",
          )}
        >
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NexaChatUI() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = React.useState("");
  const [activeNav, setActiveNav] = React.useState("Agent");
  const [activeChat, setActiveChat] = React.useState("r1");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close sidebar on resize to desktop
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setSidebarOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const sendMessage = () => {
    const text = inputValue.trim();
    if (!text) return;

    const userMsg: Message = {
      id: nanoid(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // Simulate assistant response
    setTimeout(() => {
      const assistantMsg: Message = {
        id: nanoid(),
        role: "assistant",
        content: `I've received your message: "${text}"\n\nI'm processing your request now. As Nexa AI Agent, I'll help you accomplish this task step by step.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: "#0a0e27", color: "#ffffff" }}
    >
      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={closeSidebar}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          // Mobile: fixed overlay
          "fixed inset-y-0 left-0 z-40 flex w-full flex-col",
          "transition-transform duration-300",
          "md:relative md:z-auto md:w-[280px] md:shrink-0 md:translate-x-0 md:flex",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        style={{
          background: "#0f1419",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          // cubic-bezier override via inline style for the specific easing
          transitionTimingFunction: sidebarOpen
            ? "cubic-bezier(0.4, 0, 0.2, 1)"
            : "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Sidebar header */}
        <div
          className="flex h-14 shrink-0 items-center justify-between px-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2">
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
          </div>
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
            const isActive = activeNav === item.label;
            return (
              <button
                key={item.label}
                onClick={() => {
                  setActiveNav(item.label);
                  if (window.innerWidth < 768) closeSidebar();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-left transition-colors min-h-[44px]",
                )}
                style={{
                  background: isActive
                    ? "rgba(255,255,255,0.08)"
                    : "transparent",
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
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
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <kbd
                    className="font-mono text-[9px] px-1 rounded"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div
          className="mx-4 my-1"
          style={{ height: 1, background: "rgba(255,255,255,0.08)" }}
        />

        {/* Recent section */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <span
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Recent
          </span>
          <button
            onClick={() => {
              const newChat: RecentChat = {
                id: nanoid(),
                title: "New chat",
                preview: "Start a conversation…",
                time: "just now",
              };
              setActiveChat(newChat.id);
              setMessages([]);
              if (window.innerWidth < 768) closeSidebar();
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
            aria-label="New chat"
          >
            <Plus size={13} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin">
          <ul className="space-y-0.5">
            {RECENT_CHATS.map((chat) => {
              const isActive = activeChat === chat.id;
              return (
                <li key={chat.id}>
                  <button
                    onClick={() => {
                      setActiveChat(chat.id);
                      if (window.innerWidth < 768) closeSidebar();
                    }}
                    className="w-full rounded-md px-3 py-2 text-left transition-colors min-h-[44px]"
                    style={{
                      background: isActive
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isActive
                        ? "rgba(255,255,255,0.08)"
                        : "transparent";
                    }}
                  >
                    <div
                      className="text-sm font-medium truncate"
                      style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)" }}
                    >
                      {chat.title}
                    </div>
                    <div
                      className="flex items-center justify-between mt-0.5"
                    >
                      <span
                        className="text-[11px] truncate"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        {chat.preview}
                      </span>
                      <span
                        className="font-mono text-[10px] ml-2 shrink-0"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {chat.time}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* New chat CTA */}
        <div
          className="px-3 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => {
              setMessages([]);
              setActiveChat("");
              if (window.innerWidth < 768) closeSidebar();
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
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
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
          {/* Left: hamburger (mobile only) */}
          <button
            onClick={() => setSidebarOpen(true)}
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

          {/* Center: title */}
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

          {/* Right: badge + three-dot */}
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
          className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="max-w-2xl mx-auto w-full space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Input area ── */}
        <div
          className="shrink-0 px-4 py-4"
          style={{
            background: "linear-gradient(to top, #0a0e27 80%, transparent)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="max-w-2xl mx-auto w-full">
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-1"
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
                className="flex-1 bg-transparent py-3 text-sm text-white placeholder-[rgba(255,255,255,0.35)] outline-none min-h-[48px]"
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim()}
                className="grid place-items-center size-9 rounded-xl shrink-0 transition-all duration-150"
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
                <ArrowUp size={16} />
              </button>
            </div>
            <p
              className="text-center text-[10px] font-mono mt-2"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              Nexa Agent · v0.1 — press Enter to send
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
