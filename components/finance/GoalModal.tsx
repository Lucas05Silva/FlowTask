"use client";

import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import type { Goal, FinancialGoalCategory } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { FINANCIAL_GOAL_CATEGORY_META } from "@/lib/constants";
import { formatBRL, daysUntil } from "@/lib/utils";

interface GoalModalProps {
  open: boolean;
  goal: Goal | null;
  onClose: () => void;
  onCreate: (form: any) => void;
  onUpdate: (id: string, form: any) => void;
  onDelete: (id: string) => void;
}

function emptyForm(): any {
  return {
    title: "",
    description: "",
    targetAmount: 0,
    currentAmount: 0,
    deadline: new Date().toISOString().slice(0, 10),
    category: "apartamento" as FinancialGoalCategory,
    linkedModule: "apartamento" as "apartamento" | "casamento" | null,
  };
}

function fromGoal(g: Goal): any {
  return {
    title: g.title,
    description: g.description,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    deadline: g.deadline,
    category: g.category as FinancialGoalCategory,
    linkedModule: g.linkedModule as "apartamento" | "casamento" | null,
  };
}

export function GoalModal({ open, goal, onClose, onCreate, onUpdate, onDelete }: GoalModalProps) {
  const [form, setForm] = useState<any>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = goal !== null;

  useEffect(() => {
    if (open) {
      setForm(goal ? fromGoal(goal) : emptyForm());
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, goal]);

  function patch(p: Partial<any>) {
    setForm((f: any) => {
      const next = { ...f, ...p };
      // Align linkedModule when category changes automatically
      if (p.category) {
        if (p.category === "apartamento" || p.category === "casamento") {
          next.linkedModule = p.category;
        } else {
          next.linkedModule = null;
        }
      }
      return next;
    });
  }

  function handleSave() {
    if (!form.title.trim()) {
      setError("Dê um título à meta.");
      return;
    }
    if (form.targetAmount <= 0) {
      setError("O valor alvo deve ser maior que zero.");
      return;
    }

    if (isEdit && goal) {
      onUpdate(goal.id, form);
    } else {
      onCreate(form);
    }
    onClose();
  }

  // Preview calculation
  const remainingValue = Math.max(0, form.targetAmount - form.currentAmount);
  let previewText = "";
  if (form.deadline && remainingValue > 0) {
    const days = daysUntil(form.deadline);
    if (days > 0) {
      const months = Math.max(1, Math.ceil(days / 30));
      const perMonth = remainingValue / months;
      previewText = `Se guardar ${formatBRL(perMonth)} por mês, você atinge a meta em ${months} meses.`;
    } else {
      previewText = "O prazo desta meta já passou ou vence hoje.";
    }
  } else if (remainingValue === 0) {
    previewText = "Parabéns! Meta já atingida! 🥳";
  }

  const categoryOptions = Object.keys(FINANCIAL_GOAL_CATEGORY_META) as FinancialGoalCategory[];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar meta" : "Nova meta financeira"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <Star className="size-4" /> +150 XP ao atingir
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <Label htmlFor="goal-title">Título da meta *</Label>
          <Input
            id="goal-title"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Ex: Sofá novo, Reserva do buffet"
            autoFocus
          />
          {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="goal-desc">Descrição</Label>
          <Textarea
            id="goal-desc"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Detalhes adicionais, links…"
          />
        </div>

        {/* Target & Current values */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="goal-target">Valor alvo *</Label>
            <CurrencyInput
              id="goal-target"
              value={form.targetAmount}
              onChange={(val) => patch({ targetAmount: val })}
              className="text-brand font-semibold"
            />
          </div>
          <div>
            <Label htmlFor="goal-current">Valor atual</Label>
            <CurrencyInput
              id="goal-current"
              value={form.currentAmount}
              onChange={(val) => patch({ currentAmount: val })}
              className="text-success border-success/20 focus:border-success"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Category */}
          <div>
            <Label htmlFor="goal-cat">Categoria</Label>
            <Select
              id="goal-cat"
              value={form.category}
              onChange={(e) => patch({ category: e.target.value as FinancialGoalCategory })}
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {FINANCIAL_GOAL_CATEGORY_META[cat]?.label ?? cat}
                </option>
              ))}
            </Select>
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="goal-deadline">Prazo final</Label>
            <Input
              id="goal-deadline"
              type="date"
              value={form.deadline ?? ""}
              onChange={(e) => patch({ deadline: e.target.value || null })}
            />
          </div>
        </div>

        {/* Linked module */}
        <div>
          <Label htmlFor="goal-link">Vincular ao módulo</Label>
          <Select
            id="goal-link"
            value={form.linkedModule ?? ""}
            onChange={(e) => patch({ linkedModule: (e.target.value as any) || null })}
          >
            <option value="">Nenhum</option>
            <option value="apartamento">Apartamento</option>
            <option value="casamento">Casamento</option>
          </Select>
        </div>

        {/* Preview dynamic info card */}
        {previewText && (
          <p className="rounded-input bg-brand/5 border border-brand/10 p-3 text-xs text-brand-dark leading-relaxed">
            {previewText}
          </p>
        )}

        {/* Delete option in Edit Mode */}
        {isEdit && goal && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger">Excluir esta meta?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Não
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onDelete(goal.id);
                    onClose();
                  }}
                >
                  Sim, excluir
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                icon={Trash2}
                className="w-full justify-center text-danger hover:bg-danger/5"
                onClick={() => setConfirmDelete(true)}
              >
                Excluir meta
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
