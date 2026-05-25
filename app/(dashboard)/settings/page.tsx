"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, Trash2, Key, Cpu } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { useTaskStore } from "@/store/task-store";
import { useWorkflowStore } from "@/store/workflow-store";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { theme, setTheme } = useTheme();
  const [apiKey, setApiKey] = React.useState("");
  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");

  const wipeAll = () => {
    if (!confirm("This will erase all conversations, tasks, and workflows. Continue?")) return;
    useChatStore.setState({ conversations: [], activeId: null });
    useTaskStore.setState({ tasks: [] });
    useWorkflowStore.setState({ workflows: [] });
    toast.success("Workspace reset");
  };

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  return (
    <>
      <TopBar title="Settings" subtitle="Profile, theme, connected services" />

      <div className="flex-1 overflow-y-auto scrollbar-none">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
          {/* Profile */}
          <section className="surface-elevated rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-medium">Profile</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                How Nexa addresses you across the workspace.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Avatar className="size-14 border border-border">
                <AvatarFallback className="text-lg bg-secondary">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{user?.name}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
                {user?.isGuest && (
                  <Badge variant="warning" size="sm" className="mt-1.5">
                    Guest session
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={user?.isGuest}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" disabled>
                Save changes
              </Button>
            </div>
          </section>

          {/* Appearance */}
          <section className="surface-elevated rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-medium">Appearance</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Theme and density preferences.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="size-4 text-muted-foreground" />
                ) : (
                  <Sun className="size-4 text-muted-foreground" />
                )}
                <div>
                  <div className="text-sm font-medium">Dark mode</div>
                  <div className="text-xs text-muted-foreground">
                    Nexa is designed dark-first.
                  </div>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
              />
            </div>
          </section>

          {/* API Keys */}
          <section className="surface-elevated rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-medium">API keys</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect a real LLM to upgrade from demo to live mode.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openai-key" className="flex items-center gap-2">
                <Cpu className="size-3.5" /> OpenAI API key
              </Label>
              <div className="flex gap-2">
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-…"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button size="default" variant="outline" disabled>
                  <Key className="size-3.5" /> Save
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                In production, this would be encrypted and stored server-side.
                For the demo, set{" "}
                <code className="font-mono bg-secondary px-1 py-0.5 rounded">OPENROUTER_API_KEY</code>{" "}
                in <code className="font-mono bg-secondary px-1 py-0.5 rounded">.env.local</code>.
              </p>
            </div>
          </section>

          {/* Connected services */}
          <section className="surface-elevated rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-medium">Connected services</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Granular permissions per integration.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Manage individual tools in the{" "}
              <a
                href="/integrations"
                className="text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Integrations
              </a>{" "}
              page.
            </div>
          </section>

          {/* Danger zone */}
          <section className="surface rounded-xl p-6 space-y-5 border-red-500/20">
            <div>
              <h2 className="font-medium text-red-300">Danger zone</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Irreversible actions affecting this workspace.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Reset workspace</div>
                <div className="text-xs text-muted-foreground">
                  Clears conversations, tasks, and workflow history.
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={wipeAll}>
                <Trash2 className="size-3.5" /> Reset
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Sign out</div>
                <div className="text-xs text-muted-foreground">
                  End this session and return to the landing page.
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="size-3.5" /> Sign out
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
