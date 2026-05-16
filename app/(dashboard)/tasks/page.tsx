"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Flame,
} from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTaskStore } from "@/store/task-store";
import { cn, timeAgo } from "@/lib/utils";
import type { Task } from "@/types";

const PRIORITY_STYLES: Record<Task["priority"], { variant: any; icon: any; label: string }> = {
  urgent: { variant: "destructive", icon: Flame, label: "Urgent" },
  high: { variant: "warning", icon: AlertCircle, label: "High" },
  medium: { variant: "muted", icon: Clock, label: "Medium" },
  low: { variant: "muted", icon: Clock, label: "Low" },
};

export default function TasksPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const add = useTaskStore((s) => s.add);
  const remove = useTaskStore((s) => s.remove);
  const toggleStatus = useTaskStore((s) => s.toggleStatus);
  const [newTitle, setNewTitle] = React.useState("");

  const counts = React.useMemo(
    () => ({
      all: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      done: tasks.filter((t) => t.status === "done").length,
    }),
    [tasks],
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    add({ title: newTitle.trim() });
    setNewTitle("");
  };

  return (
    <>
      <TopBar
        title="Tasks"
        subtitle={`${counts.todo} open · ${counts.in_progress} in progress · ${counts.done} done`}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {/* Quick add */}
          <form onSubmit={handleAdd} className="surface-elevated rounded-xl p-3 flex items-center gap-2">
            <div className="grid place-items-center size-8 rounded-md border border-border bg-card/40 shrink-0">
              <Plus className="size-3.5 text-muted-foreground" />
            </div>
            <Input
              placeholder="Add a task… press ⏎ to save"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 px-0 h-9"
            />
            <Button type="submit" size="sm" disabled={!newTitle.trim()}>
              Add
            </Button>
          </form>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">
                All <span className="font-mono ml-1.5 text-[10px] text-muted-foreground">{counts.all}</span>
              </TabsTrigger>
              <TabsTrigger value="todo">
                Open <span className="font-mono ml-1.5 text-[10px] text-muted-foreground">{counts.todo}</span>
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                Active <span className="font-mono ml-1.5 text-[10px] text-muted-foreground">{counts.in_progress}</span>
              </TabsTrigger>
              <TabsTrigger value="done">
                Done <span className="font-mono ml-1.5 text-[10px] text-muted-foreground">{counts.done}</span>
              </TabsTrigger>
            </TabsList>

            {(["all", "todo", "in_progress", "done"] as const).map((tab) => {
              const filtered = tab === "all" ? tasks : tasks.filter((t) => t.status === tab);
              return (
                <TabsContent key={tab} value={tab} className="mt-4 space-y-2">
                  {filtered.length === 0 ? (
                    <div className="surface text-center py-16 px-6 rounded-xl">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                        Empty
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Nothing here. Ask the agent to create some.
                      </p>
                    </div>
                  ) : (
                    filtered.map((task, i) => {
                      const P = PRIORITY_STYLES[task.priority];
                      const PIcon = P.icon;
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02, duration: 0.25 }}
                          className="surface group rounded-lg flex items-center gap-3 px-3.5 py-2.5"
                        >
                          <button
                            onClick={() => toggleStatus(task.id)}
                            aria-label="Toggle status"
                            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {task.status === "done" ? (
                              <CheckCircle2 className="size-4 text-emerald-400" />
                            ) : task.status === "in_progress" ? (
                              <Clock className="size-4 text-primary" />
                            ) : (
                              <Circle className="size-4" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                "text-sm",
                                task.status === "done" &&
                                  "line-through text-muted-foreground",
                              )}
                            >
                              {task.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {timeAgo(task.createdAt)}
                              </span>
                              {task.dueAt && (
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  · due {new Date(task.dueAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant={P.variant} size="sm">
                            <PIcon className="size-2.5" /> {P.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => remove(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Delete task"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </motion.div>
                      );
                    })
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </>
  );
}
