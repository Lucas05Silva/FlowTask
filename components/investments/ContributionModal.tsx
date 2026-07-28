"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import type { Investment } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { ContributionFormData } from "@/hooks/useInvestments";
import { todayISO, cn } from "@/lib/utils";

interface ContributionModalProps {
  open: boolean;
  /** Fixed target investment (from a card's +Aporte). */
  investment: Investment | null;
  /** Full list, enabling a picker when no fixed investment (aporte avulso). */
  investments?: Investment[];
  onClose: () => void;
  onSubmit: (investmentId: string, form: ContributionFormData) => void;
}

function emptyForm(): ContributionFormData {
  return { amount: 0, date: todayISO(), notes: "", registerAsExpense: false };
}

export function ContributionModal({
  open,
  investment,
  investments = [],
  onClose,
  onSubmit,
}: ContributionModalProps) {
  const [form, setForm] = useState<ContributionFormData>(emptyForm());
  const [selectedId, setSelectedId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState(false);

  const usePicker = !investment;

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setError(null);
      setAmountError(false);
      setSelectedId(investment?.id ?? investments[0]?.id ?? "");
    }
  }, [open, investment, investments]);

  function patch(p: Partial<ContributionFormData>) {
    if (p.amount !== undefined && p.amount > 0) setAmountError(false);
    setForm((f) => ({ ...f, ...p }));
  }

  function handleSubmit() {
    const targetId = investment?.id ?? selectedId;
    if (!targetId) {
      setError("Selecione um investimento.");
      return;
    }
    if (form.amount <= 0) {
      setError("Informe um valor maior que zero.");
      setAmountError(true);
      return;
    }
    onSubmit(targetId, form);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar aporte"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <Star className="size-4" /> +15 XP
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Registrar aporte</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="contrib-inv">Investimento</Label>
          {usePicker ? (
            <Select id="contrib-inv" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {investments.length === 0 && <option value="">Nenhum investimento cadastrado</option>}
              {investments.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name}
                </option>
              ))}
            </Select>
          ) : (
            <div className="rounded-input border border-line bg-panel/60 px-3 py-2.5 text-sm font-semibold text-content">
              {investment?.name}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="contrib-amount">Valor *</Label>
          <CurrencyInput
            id="contrib-amount"
            value={form.amount}
            onChange={(v) => patch({ amount: v })}
            aria-invalid={amountError}
            className={cn(
              "text-lg font-bold",
              amountError
                ? "text-danger border-danger focus:border-danger"
                : "text-success border-success/30 focus:border-success",
            )}
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="contrib-date">Data *</Label>
          <Input
            id="contrib-date"
            type="date"
            value={form.date}
            onChange={(e) => patch({ date: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="contrib-notes">Observação</Label>
          <Textarea
            id="contrib-notes"
            value={form.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="Opcional"
          />
        </div>

        {/* Register as finance expense */}
        <div className="rounded-input border border-line p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="mb-0 font-medium text-content">Registrar também como saída no Financeiro?</Label>
              <p className="mt-0.5 text-[11px] text-muted">Cria uma despesa na categoria &quot;Outros&quot;.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.registerAsExpense}
              onClick={() => patch({ registerAsExpense: !form.registerAsExpense })}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                form.registerAsExpense ? "bg-brand" : "bg-panel",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow-soft transition-transform",
                  form.registerAsExpense ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
