"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { Category, Task, TaskStatus } from "@/types";
import { CATEGORY_META, TASK_STATUS_META } from "@/lib/constants";
import { TaskCard } from "./TaskCard";
import type { TaskModalTab } from "./TaskModal";
import type { ViewMode } from "./TaskFilters";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  label: string;
  color?: string;
  tasks: Task[];
}

interface TaskListProps {
  tasks: Task[];
  view: ViewMode;
  onComplete: (task: Task) => void;
  onOpen: (task: Task, tab?: TaskModalTab) => void;
}

const STATUS_ORDER: TaskStatus[] = ["a_fazer", "fazendo", "concluida"];

function buildGroups(tasks: Task[], view: ViewMode): Group[] {
  if (view === "status") {
    return STATUS_ORDER.map((s) => ({
      id: s,
      label: TASK_STATUS_META[s].label,
      tasks: tasks.filter((t) => t.status === s).sort((a, b) => a.order - b.order),
    }));
  }
  return (Object.keys(CATEGORY_META) as Category[])
    .map((c) => ({
      id: c,
      label: CATEGORY_META[c].label,
      color: CATEGORY_META[c].color,
      tasks: tasks.filter((t) => t.category === c).sort((a, b) => a.order - b.order),
    }))
    .filter((g) => g.tasks.length > 0);
}

export function TaskList({ tasks, view, onComplete, onOpen }: TaskListProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const groups = buildGroups(tasks, view);

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const isCollapsed = collapsed[group.id];
        return (
          <section key={group.id}>
            <button
              type="button"
              onClick={() => setCollapsed((c) => ({ ...c, [group.id]: !c[group.id] }))}
              className="mb-3 flex w-full items-center gap-2"
            >
              {group.color && <span className="size-2.5 rounded-full" style={{ backgroundColor: group.color }} />}
              <h2 className="text-sm font-semibold uppercase tracking-wide text-content">{group.label}</h2>
              <span className="rounded-badge bg-panel px-2 py-0.5 text-xs font-medium text-muted">
                {group.tasks.length}
              </span>
              <ChevronDown
                className={cn("ml-auto size-4 text-muted transition-transform", isCollapsed && "-rotate-90")}
              />
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {group.tasks.length === 0 ? (
                    <p className="rounded-card border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                      Nenhuma tarefa aqui.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      <AnimatePresence mode="popLayout">
                        {group.tasks.map((task) => (
                          <TaskCard key={task.id} task={task} onComplete={onComplete} onOpen={onOpen} />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}
    </div>
  );
}
