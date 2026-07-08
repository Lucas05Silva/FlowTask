"use client";

/* Form state is intentionally re-synced from the selected task when the modal opens. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Star, Trash2, Repeat } from "lucide-react";
import type { Assignee, Category, Goal, Priority, RecurrenceRule, Task, GoalType } from "@/types";
import { useData } from "@/hooks/useData";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { SubtaskList } from "./SubtaskList";
import { TaskPromptsSection } from "./prompts/TaskPromptsSection";
import { CATEGORY_META, PRIORITY_META, ASSIGNEE_META } from "@/lib/constants";
import { taskXp, type CelebrationResult } from "@/lib/gamification";
import type { TaskFormData } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

export type TaskModalTab = "subtarefas" | "prompts";

interface TaskModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onCreate: (form: TaskFormData) => void;
  onUpdate: (id: string, form: TaskFormData) => void;
  onComplete: (id: string) => CelebrationResult | null;
  onDelete: (id: string) => void;
  initialTab?: TaskModalTab;
  defaultGoalId?: string | null;
}

function emptyForm(defaultGoalId?: string | null): TaskFormData {
  return {
    title: "",
    description: "",
    dueDate: null,
    priority: "media",
    category: "flowsys",
    assignee: "lucas",
    isRecurring: false,
    recurrenceRule: "semanal",
    subtasks: [],
    goalId: defaultGoalId || null,
    status: "a_fazer",
  };
}

function fromTask(t: Task): TaskFormData {
  return {
    title: t.title,
    description: t.description,
    dueDate: t.dueDate,
    priority: t.priority,
    category: t.category,
    assignee: t.assignee,
    isRecurring: t.isRecurring,
    recurrenceRule: t.recurrenceRule ?? "semanal",
    subtasks: t.subtasks,
    goalId: t.goalId,
    status: t.status,
  };
}

const ASSIGNEES: Assignee[] = ["lucas", "thaiane", "ambos"];

export function TaskModal({ open, task, onClose, onCreate, onUpdate, onComplete, onDelete, initialTab, defaultGoalId }: TaskModalProps) {
  const data = useData();
  const [form, setForm] = useState<TaskFormData>(emptyForm(defaultGoalId));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tab, setTab] = useState<TaskModalTab>("subtarefas");
  const isEdit = task !== null;

  useEffect(() => {
    if (open) {
      setForm(task ? fromTask(task) : emptyForm(defaultGoalId));
      setError(null);
      setConfirmDelete(false);
      setTab(initialTab ?? "subtarefas");
    }
  }, [open, task, initialTab, defaultGoalId]);

  function patch(p: Partial<TaskFormData>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function handleSave() {
    if (!form.title.trim()) {
      setError("Dê um título à tarefa.");
      return;
    }
    if (isEdit && task) onUpdate(task.id, form);
    else onCreate(form);
    onClose();
  }

  const GOAL_TYPE_LABELS: Record<GoalType, string> = {
    projeto: "Projetos",
    pessoal: "Pessoal",
    apartamento: "Apartamento",
    casamento: "Casamento",
    financeira: "Financeira"
  };

  const activeGoals = data.goals.filter((g) => g.status !== "concluida");
  const goalsByType = activeGoals.reduce((acc, g) => {
    if (!acc[g.type]) acc[g.type] = [];
    acc[g.type].push(g);
    return acc;
  }, {} as Record<GoalType, Goal[]>);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar tarefa" : "Nova tarefa"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <Star className="size-4" /> +{taskXp(form.priority)} XP
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="task-title">Título *</Label>
          <Input
            id="task-title"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="O que precisa ser feito?"
            autoFocus
          />
          {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        </div>

        <div>
          <Label htmlFor="task-desc">Descrição</Label>
          <Textarea
            id="task-desc"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Detalhes, links, observações…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="task-due">Data de entrega</Label>
            <Input
              id="task-due"
              type="date"
              value={form.dueDate ?? ""}
              onChange={(e) => patch({ dueDate: e.target.value || null })}
            />
          </div>
          <div>
            <Label htmlFor="task-goal">Vincular a meta</Label>
            <Select
              id="task-goal"
              value={form.goalId ?? ""}
              onChange={(e) => {
                const gId = e.target.value || null;
                const targetGoal = data.goals.find((g) => g.id === gId);
                patch({
                  goalId: gId,
                  goalContributionType: targetGoal?.contributionType || "count",
                  goalContributionValue: targetGoal?.contributionType === "value" ? (targetGoal.contributionValuePerTask || 1) : 1
                });
              }}
            >
              <option value="">Nenhuma</option>
              {(Object.keys(goalsByType) as GoalType[]).map((type) => (
                <optgroup key={type} label={GOAL_TYPE_LABELS[type]}>
                  {goalsByType[type].map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.currentAmount}/{g.targetAmount} {g.unit || ""})
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </div>
        </div>

        {(() => {
          const selectedGoal = data.goals.find((g) => g.id === form.goalId);
          if (!selectedGoal) return null;

          const type = form.goalContributionType || selectedGoal.contributionType || "count";
          let addedValue = 1;
          if (type === "value") {
            addedValue = form.goalContributionValue ?? selectedGoal.contributionValuePerTask ?? 0;
          } else if (type === "count") {
            addedValue = form.goalContributionValue ?? 1;
          }

          const nextVal = Math.min(selectedGoal.targetAmount, selectedGoal.currentAmount + (type === "checklist" ? 1 : addedValue));
          const prevPct = Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100);
          const nextPct = Math.round((nextVal / selectedGoal.targetAmount) * 100);

          return (
            <div className="rounded-card border border-line bg-panel/30 p-3.5 space-y-3 animate-in fade-in duration-200">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Como contribui?</Label>
                {selectedGoal.contributionType === "count" && (
                  <p className="text-sm font-semibold text-content">🎯 Ao concluir, soma +1 na meta</p>
                )}
                {selectedGoal.contributionType === "checklist" && (
                  <p className="text-sm font-semibold text-content">📋 Ao concluir, marca este item da meta</p>
                )}
                {selectedGoal.contributionType === "value" && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Cada tarefa contribui com um valor numérico para a meta.</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-28"
                        value={form.goalContributionValue ?? selectedGoal.contributionValuePerTask ?? 1}
                        onChange={(e) => patch({ goalContributionValue: Number(e.target.value) || 0 })}
                      />
                      <span className="text-sm font-bold text-muted-foreground">{selectedGoal.unit || "unidades"}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-line">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand">Preview do impacto:</span>
                  <span className="font-semibold text-muted-foreground">
                    {selectedGoal.currentAmount}/{selectedGoal.targetAmount} → {nextVal}/{selectedGoal.targetAmount}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Ao concluir esta tarefa, a meta <strong>{selectedGoal.title}</strong> irá de <strong>{prevPct}%</strong> para <strong>{nextPct}%</strong>.
                </p>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-panel">
                  {/* Nova barra roxa (projetado) */}
                  <div
                    className="absolute left-0 top-0 h-full bg-brand transition-all duration-300"
                    style={{ width: `${nextPct}%` }}
                  />
                  {/* Barra verde (atual) */}
                  <div
                    className="absolute left-0 top-0 h-full bg-success transition-all duration-300"
                    style={{ width: `${prevPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        <div>
          <Label>Prioridade</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
              <ChipToggle key={p} active={form.priority === p} color={PRIORITY_META[p].color} onClick={() => patch({ priority: p })}>
                {PRIORITY_META[p].label}
              </ChipToggle>
            ))}
          </div>
        </div>

        <div>
          <Label>Categoria</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
              <ChipToggle key={c} active={form.category === c} color={CATEGORY_META[c].color} onClick={() => patch({ category: c })}>
                {CATEGORY_META[c].label}
              </ChipToggle>
            ))}
          </div>
        </div>

        <div>
          <Label>Responsável</Label>
          <div className="flex flex-wrap gap-2">
            {ASSIGNEES.map((a) => (
              <ChipToggle key={a} active={form.assignee === a} onClick={() => patch({ assignee: a })}>
                {ASSIGNEE_META[a].label}
              </ChipToggle>
            ))}
          </div>
          {!isEdit && form.assignee === "ambos" && (
            <p className="mt-1 text-xs text-muted">Será criada uma tarefa para cada um. 👫</p>
          )}
        </div>

        <div>
          <Label>Status</Label>
          <div className="flex flex-wrap gap-2">
            <ChipToggle active={form.status === "a_fazer"} color="var(--text-secondary)" onClick={() => patch({ status: "a_fazer" })}>
              A fazer
            </ChipToggle>
            <ChipToggle active={form.status === "fazendo"} color="var(--brand-purple)" onClick={() => patch({ status: "fazendo" })}>
              Fazendo
            </ChipToggle>
            <ChipToggle active={form.status === "concluida"} color="var(--success)" onClick={() => patch({ status: "concluida" })}>
              Concluída
            </ChipToggle>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label className="mb-0 flex items-center gap-1.5">
              <Repeat className="size-4" /> Recorrente
            </Label>
            <button
              type="button"
              role="switch"
              aria-checked={form.isRecurring}
              onClick={() => patch({ isRecurring: !form.isRecurring })}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                form.isRecurring ? "bg-brand" : "bg-panel",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow-soft transition-transform",
                  form.isRecurring ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
          {form.isRecurring && (
            <Select
              className="mt-2"
              value={form.recurrenceRule ?? "semanal"}
              onChange={(e) => patch({ recurrenceRule: e.target.value as RecurrenceRule })}
            >
              <option value="diaria">Diária</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
              <option value="personalizada">Personalizada</option>
            </Select>
          )}
        </div>

        <div>
          <div className="mb-3 flex gap-1 rounded-input bg-panel p-1">
            <button
              type="button"
              onClick={() => setTab("subtarefas")}
              className={cn(
                "flex-1 rounded-[6px] py-1.5 text-sm font-medium transition-colors",
                tab === "subtarefas" ? "bg-surface text-content shadow-soft" : "text-muted hover:text-content",
              )}
            >
              Subtarefas
            </button>
            <button
              type="button"
              onClick={() => setTab("prompts")}
              className={cn(
                "flex-1 rounded-[6px] py-1.5 text-sm font-medium transition-colors",
                tab === "prompts" ? "bg-surface text-content shadow-soft" : "text-muted hover:text-content",
              )}
            >
              Prompts
            </button>
          </div>

          {tab === "subtarefas" ? (
            <SubtaskList subtasks={form.subtasks} onChange={(subtasks) => patch({ subtasks })} />
          ) : isEdit && task ? (
            <TaskPromptsSection taskId={task.id} />
          ) : (
            <p className="rounded-input border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              Salve a tarefa primeiro para adicionar prompts. 💾
            </p>
          )}
        </div>

        {isEdit && task && (
          <div className="border-t border-line pt-4">
            {task.status !== "concluida" && (
              <Button
                variant="outline"
                className="mb-2 w-full justify-center"
                onClick={() => {
                  onComplete(task.id);
                  onClose();
                }}
              >
                Marcar como concluída
              </Button>
            )}
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger">Excluir esta tarefa?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Não</Button>
                <Button variant="danger" size="sm" onClick={() => { onDelete(task.id); onClose(); }}>Sim, excluir</Button>
              </div>
            ) : (
              <Button variant="ghost" icon={Trash2} className="w-full justify-center text-danger" onClick={() => setConfirmDelete(true)}>
                Excluir tarefa
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function ChipToggle({ active, color, onClick, children }: { active: boolean; color?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-badge border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-transparent text-white" : "border-line text-muted hover:bg-panel hover:text-content",
      )}
      style={active ? { backgroundColor: color ?? "var(--brand-purple)" } : undefined}
    >
      {color && <span className="size-2 rounded-full" style={{ backgroundColor: active ? "#fff" : color }} />}
      {children}
    </button>
  );
}
