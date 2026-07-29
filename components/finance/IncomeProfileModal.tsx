"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import type { IncomeSource, IncomeSourceType } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { IncomeProfileFormData } from "@/hooks/useIncomeProfile";
import { uid, cn } from "@/lib/utils";

interface IncomeProfileModalProps {
  open: boolean;
  initial: IncomeProfileFormData;
  onClose: () => void;
  onSave: (form: IncomeProfileFormData) => void;
}

const TYPE_OPTIONS: { value: IncomeSourceType; label: string }[] = [
  { value: "fixo", label: "Fixo" },
  { value: "variavel", label: "Variável" },
  { value: "beneficio", label: "Benefício" },
];

export function IncomeProfileModal({ open, initial, onClose, onSave }: IncomeProfileModalProps) {
  const [form, setForm] = useState<IncomeProfileFormData>(initial);

  useEffect(() => {
    if (open) setForm({ ...initial, sources: initial.sources.map((s) => ({ ...s })) });
  }, [open, initial]);

  const patchSource = (id: string, patch: Partial<IncomeSource>) =>
    setForm((f) => ({ ...f, sources: f.sources.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  const addSource = () =>
    setForm((f) => ({
      ...f,
      sources: [...f.sources, { id: uid("src"), label: "", type: "fixo", amount: 0, active: true }],
    }));

  const removeSource = (id: string) =>
    setForm((f) => ({ ...f, sources: f.sources.filter((s) => s.id !== id) }));

  const handleSave = () => {
    onSave({ ...form, sources: form.sources.filter((s) => s.label.trim().length > 0) });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar perfil de renda"
      className="sm:max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <Star className="size-4" /> +25 XP na 1ª vez
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
      <div className="space-y-5">
        {/* Sources */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="mb-0 text-xs font-bold uppercase tracking-wider text-muted">Fontes de renda</Label>
            <Button size="sm" variant="outline" icon={Plus} onClick={addSource}>
              Adicionar fonte
            </Button>
          </div>
          <div className="space-y-2.5">
            {form.sources.length === 0 && (
              <p className="rounded-input border border-dashed border-line px-3 py-4 text-center text-xs text-muted">
                Nenhuma fonte. Clique em “Adicionar fonte”.
              </p>
            )}
            {form.sources.map((s) => (
              <div key={s.id} className="rounded-input border border-line p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor={`src-label-${s.id}`} className="text-[11px]">
                      Nome
                    </Label>
                    <Input
                      id={`src-label-${s.id}`}
                      value={s.label}
                      onChange={(e) => patchSource(s.id, { label: e.target.value })}
                      placeholder="Ex: Novo emprego"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <Label htmlFor={`src-type-${s.id}`} className="text-[11px]">
                      Tipo
                    </Label>
                    <Select
                      id={`src-type-${s.id}`}
                      value={s.type}
                      onChange={(e) => patchSource(s.id, { type: e.target.value as IncomeSourceType })}
                      className="h-9 text-sm"
                    >
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-full sm:w-32">
                    <Label htmlFor={`src-amount-${s.id}`} className="text-[11px]">
                      Valor/mês
                    </Label>
                    <CurrencyInput
                      id={`src-amount-${s.id}`}
                      value={s.amount}
                      onChange={(v) => patchSource(s.id, { amount: v })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={s.active}
                      aria-label="Ativo"
                      onClick={() => patchSource(s.id, { active: !s.active })}
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                        s.active ? "bg-success" : "bg-panel",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 size-5 rounded-full bg-white shadow-soft transition-transform",
                          s.active ? "translate-x-5" : "translate-x-0.5",
                        )}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSource(s.id)}
                      aria-label="Remover fonte"
                      className="rounded-input p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment settings */}
        <div className="border-t border-line pt-4">
          <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">
            Configurações de investimento
          </Label>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="inc-expenses" className="text-[11px]">
                Gastos mensais
              </Label>
              <CurrencyInput
                id="inc-expenses"
                value={form.monthlyExpenses}
                onChange={(v) => setForm((f) => ({ ...f, monthlyExpenses: v }))}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="inc-goal" className="text-[11px]">
                Meta de investimento (%)
              </Label>
              <Input
                id="inc-goal"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={form.investmentGoalPct}
                onChange={(e) => setForm((f) => ({ ...f, investmentGoalPct: parseFloat(e.target.value) || 0 }))}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="inc-flowsys" className="text-[11px]">
                % da Flowsys p/ investir
              </Label>
              <Input
                id="inc-flowsys"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={form.flowsysInvestmentPct}
                onChange={(e) => setForm((f) => ({ ...f, flowsysInvestmentPct: parseFloat(e.target.value) || 0 }))}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
