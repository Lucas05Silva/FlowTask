"use client";

import { motion } from "framer-motion";
import { Repeat, CalendarDays, ListTree, Braces } from "lucide-react";
import type { Task } from "@/types";
import { useData } from "@/hooks/useData";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { CATEGORY_META, PRIORITY_META } from "@/lib/constants";
import { countdownLabel, daysUntil, cn } from "@/lib/utils";
import type { TaskModalTab } from "./TaskModal";

interface TaskCardProps {
  task: Task;
  onComplete: (task: Task) => void;
  onOpen: (task: Task, tab?: TaskModalTab) => void;
}

export function TaskCard({ task, onComplete, onOpen }: TaskCardProps) {
  const data = useData();
  const done = task.status === "concluida";
  const cat = CATEGORY_META[task.category];
  const prio = PRIORITY_META[task.priority];

  const assignees =
    task.assignee === "ambos"
      ? data.users
      : data.users.filter((u) => u.id === task.assignee);

  const doneSubs = task.subtasks.filter((s) => s.done).length;
  const promptCount = (data.taskPrompts ?? []).filter((p) => p.taskId === task.id).length;
  const overdue = task.dueDate && !done && daysUntil(task.dueDate) < 0;
  const dueSoon = task.dueDate && !done && daysUntil(task.dueDate) <= 7;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      onClick={() => onOpen(task)}
      className={cn(
        "group cursor-pointer rounded-card border bg-surface p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop",
        task.status === "fazendo" ? "border-l-4 border-l-brand border-y-line border-r-line" : "border-line",
        done && "opacity-65",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={done ? "Tarefa concluída" : `Concluir ${task.title}`}
          disabled={done}
          onClick={(e) => {
            e.stopPropagation();
            if (!done) onComplete(task);
          }}
          className={cn(
            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
            done ? "border-success bg-success text-white" : "border-line text-transparent hover:border-brand",
          )}
        >
          <motion.svg
            viewBox="0 0 24 24"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            initial={false}
            animate={done ? { scale: 1 } : { scale: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 400 }}
          >
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn("text-sm font-semibold leading-snug text-content", done && "text-muted line-through")}>
              {task.title}
            </h3>
            {task.isRecurring && (
              <Repeat className="mt-0.5 size-4 shrink-0 text-muted" aria-label="Tarefa recorrente" />
            )}
          </div>

          {task.description && !done && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted">{task.description}</p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Badge color={prio.color}>{prio.label}</Badge>
            <Badge color={cat.color} variant="soft">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.label}
            </Badge>

            {task.dueDate && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  overdue ? "font-semibold text-danger" : dueSoon ? "text-prio-alta" : "text-muted",
                )}
              >
                <CalendarDays className="size-3.5" />
                {countdownLabel(task.dueDate)}
              </span>
            )}

            {task.subtasks.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <ListTree className="size-3.5" />
                {doneSubs}/{task.subtasks.length}
              </span>
            )}

            {promptCount > 0 && (
              <button
                type="button"
                aria-label={`${promptCount} prompts`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(task, "prompts");
                }}
                className="inline-flex items-center gap-1 rounded-badge px-1 text-xs text-muted transition-colors hover:text-brand"
              >
                <Braces className="size-3.5" />
                {promptCount}
              </button>
            )}

            <span className="ml-auto flex -space-x-1.5">
              {assignees.map((u) => (
                <Avatar key={u.id} user={u} size={22} className="ring-1 ring-surface" />
              ))}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
