"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { useUIStore } from "@/store/ui-store";
import { useChatStore } from "@/store/chat-store";
import { toolRegistry } from "@/services/tool-registry";
import {
  MessageSquare,
  ListChecks,
  History,
  Plug,
  Settings,
  Plus,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/auth-store";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

function iconFor(name: string): LucideIcon {
  const I = (Icons as unknown as Record<string, LucideIcon>)[name];
  return I ?? Icons.Wrench;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const router = useRouter();
  const newConversation = useChatStore((s) => s.newConversation);
  const signOut = useAuthStore((s) => s.signOut);
  const { theme, setTheme } = useTheme();
  const tools = toolRegistry.list();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command, search workflows, invoke a tool…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem
            onSelect={() => {
              newConversation();
              go("/chat");
            }}
          >
            <Plus />
            <span>New conversation</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun /> : <Moon />}
            <span>Toggle theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              signOut();
              router.push("/");
            }}
          >
            <LogOut />
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => go("/chat")}>
            <MessageSquare />
            <span>Agent chat</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/tasks")}>
            <ListChecks />
            <span>Tasks</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/workflows")}>
            <History />
            <span>Workflow history</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/integrations")}>
            <Plug />
            <span>Integrations</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Tools">
          {tools.map((t) => {
            const Icon = iconFor(t.icon);
            return (
              <CommandItem key={t.id} onSelect={() => go("/integrations")}>
                <Icon />
                <span>{t.name}</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  {t.category}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
