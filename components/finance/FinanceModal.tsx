"use client";

import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import type { FinanceEntry, FinanceType, FinanceCategory, FinanceRecurrenceRule } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { INCOME_CATEGORY_META, EXPENSE_CATEGORY_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FinanceModalProps {
  open: boolean;
  entry: FinanceEntry | null;
  defaultType?: FinanceType;
  onClose: () => void;
  onCreate: (form: any) => any;
  onUpdate: (id: string, form: any) => void;
  onDelete: (id: string) => void;
}

function emptyForm(type: FinanceType = "expense"): any {
  return {
    type,
    amount: 0,
    description: "",
    date: new Date().toISOString().slice(0, 10),
    category: type === "income" ? "flowsys" : "moradia",
    tags: [] as string[],
    isRecurring: false,
    recurrenceRule: "mensal" as FinanceRecurrenceRule,
  };
}

function fromEntry(e: FinanceEntry): any {
  return {
    type: e.type,
    amount: e.amount,
    description: e.description,
    date: e.date,
    category: e.category,
    tags: e.tags || [],
    isRecurring: e.isRecurring,
    recurrenceRule: e.recurrenceRule ?? "mensal",
  };
}

export function FinanceModal({
  open,
  entry,
  defaultType = "expense",
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: FinanceModalProps) {
  const [form, setForm] = useState<any>(emptyForm(defaultType));
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = entry !== null;

  useEffect(() => {
    if (open) {
      setForm(entry ? fromEntry(entry) : emptyForm(defaultType));
      setTagInput("");
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, entry, defaultType]);

  function patch(p: Partial<any>) {
    setForm((f: any) => {
      const next = { ...f, ...p };
      // Keep category aligned if type changes
      if (p.type && p.type !== f.type) {
        next.category = p.type === "income" ? "flowsys" : "moradia";
      }
      return next;
    });
  }

  function handleAddTag() {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed) return;
    if (form.tags.includes(trimmed)) {
      setTagInput("");
      return;
    }
    patch({ tags: [...form.tags, trimmed] });
    setTagInput("");
  }

  function handleRemoveTag(tag: string) {
    patch({ tags: form.tags.filter((t: string) => t !== tag) });
  }

  function handleSave() {
    if (!form.description.trim()) {
      setError("Insira uma descrição.");
      return;
    }
    if (form.amount <= 0) {
      setError("Insira um valor maior que zero.");
      return;
    }

    if (isEdit && entry) {
      onUpdate(entry.id, form);
    } else {
      onCreate(form);
    }
    onClose();
  }

  const categoryOptions =
    form.type === "income"
      ? (Object.keys(INCOME_CATEGORY_META) as FinanceCategory[])
      : (Object.keys(EXPENSE_CATEGORY_META) as FinanceCategory[]);

  const metaData = form.type === "income" ? INCOME_CATEGORY_META : EXPENSE_CATEGORY_META;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar lançamento" : "Novo lançamento financeiro"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <Star className="size-4" /> +5 XP
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
        {/* Toggle Income/Expense */}
        {!isEdit && (
          <div className="flex rounded-input bg-panel p-1">
            <button
              type="button"
              onClick={() => patch({ type: "expense" })}
              className={cn(
                "flex-1 rounded-[6px] py-1.5 text-sm font-medium transition-all",
                form.type === "expense" ? "bg-surface text-danger shadow-soft font-semibold" : "text-muted hover:text-content"
              )}
            >
              Saída (Despesa)
            </button>
            <button
              type="button"
              onClick={() => patch({ type: "income" })}
              className={cn(
                "flex-1 rounded-[6px] py-1.5 text-sm font-medium transition-all",
                form.type === "income" ? "bg-surface text-success shadow-soft font-semibold" : "text-muted hover:text-content"
              )}
            >
              Entrada (Receita)
            </button>
          </div>
        )}

        {/* Currency Amount */}
        <div>
          <Label htmlFor="finance-amount">Valor *</Label>
          <CurrencyInput
            id="finance-amount"
            value={form.amount}
            onChange={(val) => patch({ amount: val })}
            className={cn(
              "text-lg font-bold",
              form.type === "income" ? "text-success border-success/30 focus:border-success" : "text-danger border-danger/30 focus:border-danger"
            )}
            autoFocus
          />
          {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="finance-desc">Descrição *</Label>
          <Input
            id="finance-desc"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder={form.type === "income" ? "Ex: Projeto LP Incont Care" : "Ex: Compra supermercado"}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Date */}
          <div>
            <Label htmlFor="finance-date">Data</Label>
            <Input
              id="finance-date"
              type="date"
              value={form.date}
              onChange={(e) => patch({ date: e.target.value })}
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="finance-cat">Categoria</Label>
            <Select
              id="finance-cat"
              value={form.category}
              onChange={(e) => patch({ category: e.target.value as FinanceCategory })}
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {metaData[cat as keyof typeof metaData]?.label ?? cat}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Tags input (only for expense) */}
        {form.type === "expense" && (
          <div>
            <Label htmlFor="finance-tags">Tags (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="finance-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Digite e aperte Enter"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-badge bg-panel px-2.5 py-1 text-xs font-medium text-content border border-line"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-[10px] text-muted hover:text-danger"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recurrence Toggle */}
        <div className="rounded-input border border-line p-3">
          <div className="flex items-center justify-between">
            <Label className="mb-0 font-medium text-content">Lançamento recorrente</Label>
            <button
              type="button"
              role="switch"
              aria-checked={form.isRecurring}
              onClick={() => patch({ isRecurring: !form.isRecurring })}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                form.isRecurring ? "bg-brand" : "bg-panel"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow-soft transition-transform",
                  form.isRecurring ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
          {form.isRecurring && (
            <Select
              className="mt-2.5"
              value={form.recurrenceRule ?? "mensal"}
              onChange={(e) => patch({ recurrenceRule: e.target.value as FinanceRecurrenceRule })}
            >
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
              <option value="anual">Anual</option>
            </Select>
          )}
        </div>

        {/* Delete button for edit mode */}
        {isEdit && entry && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger">Excluir este lançamento?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Não
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onDelete(entry.id);
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
                Excluir lançamento
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
