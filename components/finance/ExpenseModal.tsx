"use client";

import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import type { MonthlyExpense, MonthlyExpenseCategory, ExpenseRecurrence } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { EXPENSE_CATEGORY_META, EXPENSE_CATEGORY_OPTIONS, RECURRENCE_META } from "./expenseMeta";
import type { ExpenseFormData } from "@/hooks/useMonthlyExpenses";
import { cn } from "@/lib/utils";

interface ExpenseModalProps {
  open: boolean;
  expense: MonthlyExpense | null;
  onClose: () => void;
  onCreate: (form: ExpenseFormData) => void;
  onUpdate: (id: string, patch: Partial<MonthlyExpense>) => void;
  onDelete: (id: string) => void;
}

const RECURRENCES: ExpenseRecurrence[] = ["mensal", "parcelado", "eventual"];

function emptyForm(): ExpenseFormData {
  return {
    name: "",
    category: "moradia",
    amount: 0,
    recurrence: "mensal",
    installmentsTotal: null,
    installmentsPaid: 0,
    dueDay: null,
    notes: "",
  };
}

function fromExpense(e: MonthlyExpense): ExpenseFormData {
  return {
    name: e.name,
    category: e.category,
    amount: e.amount,
    recurrence: e.recurrence,
    installmentsTotal: e.installmentsTotal ?? null,
    installmentsPaid: e.installmentsPaid,
    dueDay: e.dueDay ?? null,
    notes: e.notes ?? "",
  };
}

export function ExpenseModal({ open, expense, onClose, onCreate, onUpdate, onDelete }: ExpenseModalProps) {
  const [form, setForm] = useState<ExpenseFormData>(emptyForm());
  const [nameError, setNameError] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = expense !== null;

  useEffect(() => {
    if (open) {
      setForm(expense ? fromExpense(expense) : emptyForm());
      setNameError(false);
      setAmountError(false);
      setConfirmDelete(false);
    }
  }, [open, expense]);

  function patch(p: Partial<ExpenseFormData>) {
    if (p.name !== undefined && p.name.trim()) setNameError(false);
    if (p.amount !== undefined && p.amount > 0) setAmountError(false);
    setForm((f) => ({ ...f, ...p }));
  }

  function handleSave() {
    const invalidName = !form.name.trim();
    const invalidAmount = form.amount <= 0;
    if (invalidName || invalidAmount) {
      setNameError(invalidName);
      setAmountError(invalidAmount);
      return;
    }
    const clean: ExpenseFormData = {
      ...form,
      installmentsTotal: form.recurrence === "parcelado" ? form.installmentsTotal : null,
      installmentsPaid: form.recurrence === "parcelado" ? form.installmentsPaid : 0,
    };
    if (isEdit && expense) {
      onUpdate(expense.id, clean);
    } else {
      onCreate(clean);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar gasto" : "Novo gasto"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <Star className="size-4" /> +10 XP
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
        <div>
          <Label htmlFor="exp-name">Nome do gasto *</Label>
          <Input
            id="exp-name"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Ex: Condomínio"
            aria-invalid={nameError}
            className={cn(nameError && "border-danger focus:border-danger")}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="exp-cat">Categoria *</Label>
            <Select
              id="exp-cat"
              value={form.category}
              onChange={(e) => patch({ category: e.target.value as MonthlyExpenseCategory })}
            >
              {EXPENSE_CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {EXPENSE_CATEGORY_META[c].label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="exp-amount">Valor *</Label>
            <CurrencyInput
              id="exp-amount"
              value={form.amount}
              onChange={(v) => patch({ amount: v })}
              aria-invalid={amountError}
              className={cn("font-semibold", amountError && "border-danger focus:border-danger")}
            />
          </div>
        </div>

        {/* Recurrence */}
        <div>
          <Label>Tipo de gasto *</Label>
          <div className="flex rounded-input bg-panel p-1">
            {RECURRENCES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => patch({ recurrence: r })}
                className={cn(
                  "flex-1 rounded-[6px] py-1.5 text-sm font-medium transition-all",
                  form.recurrence === r ? "bg-surface text-content shadow-soft font-semibold" : "text-muted hover:text-content",
                )}
              >
                {RECURRENCE_META[r].label}
              </button>
            ))}
          </div>
          {form.recurrence === "eventual" && (
            <p className="mt-1.5 text-[11px] text-muted">Gastos eventuais não somam no total mensal recorrente.</p>
          )}
        </div>

        {form.recurrence === "parcelado" && (
          <div className="grid grid-cols-2 gap-3 rounded-input border border-line p-3">
            <div>
              <Label htmlFor="exp-inst-total" className="text-[11px]">
                Total de parcelas
              </Label>
              <Input
                id="exp-inst-total"
                type="number"
                inputMode="numeric"
                min={1}
                value={form.installmentsTotal ?? ""}
                onChange={(e) => patch({ installmentsTotal: parseInt(e.target.value, 10) || null })}
                className="h-9 text-sm"
                placeholder="4"
              />
            </div>
            <div>
              <Label htmlFor="exp-inst-paid" className="text-[11px]">
                Parcelas já pagas
              </Label>
              <Input
                id="exp-inst-paid"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.installmentsPaid}
                onChange={(e) => patch({ installmentsPaid: parseInt(e.target.value, 10) || 0 })}
                className="h-9 text-sm"
                placeholder="1"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="exp-due">Dia de vencimento</Label>
          <Input
            id="exp-due"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={form.dueDay ?? ""}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              patch({ dueDay: Number.isNaN(v) ? null : Math.max(1, Math.min(31, v)) });
            }}
            placeholder="1 a 31 (opcional)"
          />
        </div>

        <div>
          <Label htmlFor="exp-notes">Observação</Label>
          <Textarea
            id="exp-notes"
            value={form.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="Opcional"
          />
        </div>

        {isEdit && expense && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger">Excluir este gasto?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Não
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onDelete(expense.id);
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
                Excluir gasto
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
