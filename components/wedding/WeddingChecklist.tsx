"use client";

import { useState, useMemo } from "react";
import { Plus, CheckSquare, Square, Calendar, User, Search, Tag, Filter } from "lucide-react";
import type { WeddingTask, Assignee, TaskStatus } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoalProgress } from "../goals/GoalProgress";
import { countdownLabel, daysUntil, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface WeddingChecklistProps {
  tasks: WeddingTask[];
  onTaskClick: (task: WeddingTask) => void;
  onCreateClick: () => void;
  onUpdateStatus: (id: string, status: TaskStatus) => any;
}

const CATEGORY_LABELS: Record<string, string> = {
  cerimonia: "Cerimônia 💒",
  recepcao: "Recepção 🎉",
  visual: "Visual 👗",
  documentacao: "Documentação 📄",
  geral: "Geral ✨",
};

export function WeddingChecklist({
  tasks,
  onTaskClick,
  onCreateClick,
  onUpdateStatus,
}: WeddingChecklistProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<"todas" | Assignee>("todas");
  const [filterStatus, setFilterStatus] = useState<"todas" | TaskStatus>("todas");
  const [filterCategory, setFilterCategory] = useState<"todas" | string>("todas");

  // Apply filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchAssignee = filterAssignee === "todas" || t.assignee === filterAssignee;
      const matchStatus = filterStatus === "todas" || t.status === filterStatus;
      const matchCategory = filterCategory === "todas" || t.category === filterCategory;
      return matchSearch && matchAssignee && matchStatus && matchCategory;
    });
  }, [tasks, searchQuery, filterAssignee, filterStatus, filterCategory]);

  // Group by category
  const groupedData = useMemo(() => {
    const map: Record<string, WeddingTask[]> = {
      cerimonia: [],
      recepcao: [],
      visual: [],
      documentacao: [],
      geral: [],
    };

    filteredTasks.forEach((t) => {
      const cat = t.category || "geral";
      if (!map[cat]) {
        map[cat] = [];
      }
      map[cat].push(t);
    });

    return map;
  }, [filteredTasks]);

  const hasAnyTasks = filteredTasks.length > 0;

  return (
    <div className="space-y-6">
      {/* Toolbar filters */}
      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center border-pink-100/35">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar tarefa do casamento..."
            className="pl-9"
          />
        </div>

        <div className="grid gap-2 grid-cols-3 shrink-0">
          {/* Category */}
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="todas">Todas categorias</option>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </Select>

          {/* Assignee */}
          <Select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value as any)}>
            <option value="todas">Todos responsáveis</option>
            <option value="lucas">Lucas</option>
            <option value="thaiane">Thaiane</option>
            <option value="ambos">Ambos</option>
          </Select>

          {/* Status */}
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="todas">Todos status</option>
            <option value="a_fazer">A fazer</option>
            <option value="fazendo">Fazendo</option>
            <option value="concluida">Concluída</option>
          </Select>
        </div>

        <Button
          onClick={onCreateClick}
          size="sm"
          icon={Plus}
          className="bg-pink-500 hover:bg-pink-600 text-white font-bold shrink-0 self-start md:self-auto"
        >
          Nova tarefa
        </Button>
      </Card>

      {/* Task categories grid */}
      <div className="space-y-6">
        {!hasAnyTasks ? (
          <EmptyState
            icon={CheckSquare}
            title="Nenhuma tarefa encontrada!"
            description={
              searchQuery || filterCategory !== "todas" || filterAssignee !== "todas" || filterStatus !== "todas"
                ? "Refine seus filtros para encontrar tarefas do casamento."
                : "A jornada até o altar começa aqui! Crie sua primeira tarefa 💍"
            }
            action={
              !searchQuery &&
              filterCategory === "todas" &&
              filterAssignee === "todas" &&
              filterStatus === "todas" && (
                <Button size="sm" onClick={onCreateClick} className="bg-pink-500 hover:bg-pink-600 text-white font-bold">
                  Criar primeira tarefa
                </Button>
              )
            }
          />
        ) : (
          Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => {
            const list = groupedData[catKey] || [];
            if (list.length === 0) return null;

            const completed = list.filter((t) => t.status === "concluida").length;
            const total = list.length;
            const pctVal = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={catKey} className="border border-pink-100/25 rounded-card bg-surface overflow-hidden shadow-soft">
                {/* Category Header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-pink-500/[0.02] border-b border-line/45">
                  <h3 className="font-bold text-sm text-content capitalize">{catLabel}</h3>
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-muted">
                    <span>
                      {completed} de {total} ({pctVal}%)
                    </span>
                    <div className="w-20">
                      <GoalProgress current={completed} target={total} size="sm" color="var(--cat-casamento)" />
                    </div>
                  </div>
                </div>

                {/* List items */}
                <div className="divide-y divide-line/45 bg-surface">
                  {list.map((task) => {
                    const isDone = task.status === "concluida";
                    const isDoing = task.status === "fazendo";
                    const isAtrasado = task.deadline && !isDone && daysUntil(task.deadline) < 0;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="group flex cursor-pointer items-start justify-between gap-3 p-4 hover:bg-panel/20 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Checkbox button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(task.id, isDone ? "a_fazer" : "concluida");
                            }}
                            className={cn(
                              "grid size-8 place-items-center rounded-input border transition-colors shrink-0 mt-0.5",
                              isDone ? "border-pink-500 bg-pink-50 text-pink-500" : "border-line bg-surface hover:border-pink-300"
                            )}
                          >
                            {isDone ? <CheckSquare className="size-4.5" /> : <Square className="size-4.5" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "font-bold text-sm text-content group-hover:text-pink-500 transition-colors",
                                isDone && "line-through text-muted/65"
                              )}
                            >
                              {task.title}
                            </span>
                            {task.description && (
                              <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-1">{task.description}</p>
                            )}

                            {/* Info badges */}
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold">
                              {/* Assignee */}
                              <span className="inline-flex items-center gap-1 text-muted">
                                <User className="size-3" />
                                <span className="capitalize">{task.assignee === "ambos" ? "Lucas & Thaiane" : task.assignee}</span>
                              </span>

                              {/* Deadline */}
                              {task.deadline && (
                                <span className={cn("inline-flex items-center gap-1", isAtrasado ? "text-danger" : "text-muted")}>
                                  <Calendar className="size-3" />
                                  <span>{isDone ? `Concluído em ${formatDate(task.completedAt || "")}` : countdownLabel(task.deadline)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status badges */}
                        {!isDone && (
                          <span
                            className={cn(
                              "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider border self-center",
                              isDoing ? "border-warning/30 bg-warning/5 text-warning" : "border-line bg-panel text-muted"
                            )}
                          >
                            {isDoing ? "Fazendo" : "Pendente"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
