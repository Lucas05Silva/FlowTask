"use client";

import { useMemo, useState } from "react";
import { Plus, ClipboardList } from "lucide-react";
import type { Task } from "@/types";
import { useTasks, type TaskFormData } from "@/hooks/useTasks";
import { useGamification } from "@/components/providers/GamificationProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskStats } from "./TaskStats";
import { TaskFilters, DEFAULT_FILTERS, type TaskFilterState, type ViewMode } from "./TaskFilters";
import { TaskList } from "./TaskList";
import { TaskModal, type TaskModalTab } from "./TaskModal";

export function TaskPage() {
  const { tasks, createTask, updateTask, deleteTask, completeTask } = useTasks();
  const { celebrate } = useGamification();

  const [filters, setFilters] = useState<TaskFilterState>(DEFAULT_FILTERS);
  const [view, setView] = useState<ViewMode>("status");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [modalTab, setModalTab] = useState<TaskModalTab>("subtarefas");

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filters.category !== "all" && t.category !== filters.category) return false;
      if (filters.priority !== "all" && t.priority !== filters.priority) return false;
      if (filters.assignee !== "all" && t.assignee !== filters.assignee && t.assignee !== "ambos") return false;
      if (filters.status !== "all" && t.status !== filters.status) return false;
      if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, filters]);

  const complete = (id: string) => {
    const result = completeTask(id);
    if (result) celebrate(result);
    return result;
  };

  function openNew() {
    setEditing(null);
    setModalTab("subtarefas");
    setModalOpen(true);
  }
  function openEdit(task: Task, tab: TaskModalTab = "subtarefas") {
    setEditing(task);
    setModalTab(tab);
    setModalOpen(true);
  }

  function handleUpdate(id: string, form: TaskFormData) {
    updateTask(id, {
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate,
      priority: form.priority,
      category: form.category,
      assignee: form.assignee,
      isRecurring: form.isRecurring,
      recurrenceRule: form.isRecurring ? form.recurrenceRule : null,
      subtasks: form.subtasks,
      goalId: form.goalId,
    });
  }

  const hasTasks = tasks.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Tarefas"
        subtitle="Organize, priorize e ganhe XP a cada conquista."
        action={
          <Button icon={Plus} onClick={openNew} className="hidden md:inline-flex">
            Nova tarefa
          </Button>
        }
      />

      <div className="space-y-5">
        <TaskStats />
        <TaskFilters filters={filters} onChange={setFilters} view={view} onViewChange={setView} />

        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={hasTasks ? "Nada por aqui com esses filtros" : "Tudo limpo por aqui!"}
            description={
              hasTasks
                ? "Tente ajustar os filtros ou a busca."
                : "Crie sua primeira tarefa e comece a acumular XP 🚀"
            }
            action={<Button icon={Plus} onClick={openNew}>Nova tarefa</Button>}
          />
        ) : (
          <TaskList tasks={filtered} view={view} onComplete={(t) => complete(t.id)} onOpen={openEdit} />
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={openNew}
        aria-label="Nova tarefa"
        className="fixed bottom-20 right-4 z-30 grid size-14 place-items-center rounded-full bg-brand text-white shadow-pop transition-transform hover:scale-105 active:scale-95 md:hidden"
      >
        <Plus className="size-6" />
      </button>

      <TaskModal
        open={modalOpen}
        task={editing}
        initialTab={modalTab}
        onClose={() => setModalOpen(false)}
        onCreate={createTask}
        onUpdate={handleUpdate}
        onComplete={complete}
        onDelete={deleteTask}
      />
    </div>
  );
}
