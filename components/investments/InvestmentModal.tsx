"use client";

import { useEffect, useState } from "react";
import { Star, Trash2, Info } from "lucide-react";
import type { Investment, InvestmentType, IndexType, InvestmentLiquidity, Goal } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { INVESTMENT_TYPE_META, INDEX_META, LIQUIDITY_META } from "@/lib/investment-calculator";
import type { InvestmentFormData } from "@/hooks/useInvestments";
import { todayISO, cn } from "@/lib/utils";

interface InvestmentModalProps {
  open: boolean;
  investment: Investment | null;
  goals: Goal[];
  onClose: () => void;
  onCreate: (form: InvestmentFormData) => void;
  onUpdate: (id: string, patch: Partial<Investment>) => void;
  onDelete: (id: string) => void;
}

const TYPE_OPTIONS = Object.keys(INVESTMENT_TYPE_META) as InvestmentType[];
const INDEX_OPTIONS = Object.keys(INDEX_META) as IndexType[];
const LIQUIDITY_OPTIONS = Object.keys(LIQUIDITY_META) as InvestmentLiquidity[];

function emptyForm(): InvestmentFormData {
  return {
    name: "",
    type: "tesouro_selic",
    index: "selic",
    rate: 0,
    initialAmount: 0,
    purchaseDate: todayISO(),
    maturityDate: null,
    liquidity: "diaria",
    liquidityDays: null,
    isEmergencyFund: false,
    goalId: null,
    notes: "",
  };
}

function fromInvestment(inv: Investment): InvestmentFormData {
  return {
    name: inv.name,
    type: inv.type,
    index: inv.index,
    rate: inv.rate,
    initialAmount: inv.investedAmount,
    purchaseDate: inv.purchaseDate,
    maturityDate: inv.maturityDate ?? null,
    liquidity: inv.liquidity,
    liquidityDays: inv.liquidityDays ?? null,
    isEmergencyFund: inv.isEmergencyFund,
    goalId: inv.goalId ?? null,
    notes: inv.notes ?? "",
  };
}

export function InvestmentModal({
  open,
  investment,
  goals,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: InvestmentModalProps) {
  const [form, setForm] = useState<InvestmentFormData>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = investment !== null;

  useEffect(() => {
    if (open) {
      setForm(investment ? fromInvestment(investment) : emptyForm());
      setError(null);
      setNameError(false);
      setAmountError(false);
      setConfirmDelete(false);
    }
  }, [open, investment]);

  function patch(p: Partial<InvestmentFormData>) {
    if (p.name !== undefined && p.name.trim()) setNameError(false);
    if (p.initialAmount !== undefined && p.initialAmount > 0) setAmountError(false);
    setForm((f) => {
      const next = { ...f, ...p };
      // Auto-align indexer with the chosen type.
      if (p.type && p.type !== f.type) {
        next.index = INVESTMENT_TYPE_META[p.type].defaultIndex;
      }
      return next;
    });
  }

  function handleSave() {
    const invalidName = !form.name.trim();
    const invalidAmount = form.initialAmount <= 0 && !isEdit;
    if (invalidName || invalidAmount) {
      setNameError(invalidName);
      setAmountError(invalidAmount);
      setError(
        invalidName
          ? "Dê um nome ao investimento."
          : "Informe um valor inicial maior que zero.",
      );
      return;
    }
    if (isEdit && investment) {
      onUpdate(investment.id, {
        name: form.name.trim(),
        type: form.type,
        index: form.index,
        rate: form.rate,
        maturityDate: form.maturityDate,
        liquidity: form.liquidity,
        liquidityDays: form.liquidity === "carencia" ? form.liquidityDays : null,
        isEmergencyFund: form.isEmergencyFund,
        goalId: form.goalId,
        notes: form.notes.trim() || undefined,
      });
    } else {
      onCreate(form);
    }
    onClose();
  }

  const tip = INVESTMENT_TYPE_META[form.type].tip;
  const rateLabel = form.index === "cdi" ? "% do CDI" : form.index === "prefixado" ? "Taxa (% a.a.)" : "Taxa adicional (% a.a.)";
  const openGoals = goals.filter((g) => g.status !== "concluida");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar investimento" : "Novo investimento"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <Star className="size-4" /> +15 XP
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
        {/* Name */}
        <div>
          <Label htmlFor="inv-name">Nome do investimento *</Label>
          <Input
            id="inv-name"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Ex: Tesouro Selic 2027"
            aria-invalid={nameError}
            className={cn(nameError && "border-danger focus:border-danger")}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Type */}
          <div>
            <Label htmlFor="inv-type">Tipo *</Label>
            <Select id="inv-type" value={form.type} onChange={(e) => patch({ type: e.target.value as InvestmentType })}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {INVESTMENT_TYPE_META[t].label}
                </option>
              ))}
            </Select>
          </div>
          {/* Index */}
          <div>
            <Label htmlFor="inv-index">Indexador *</Label>
            <Select id="inv-index" value={form.index} onChange={(e) => patch({ index: e.target.value as IndexType })}>
              {INDEX_OPTIONS.map((i) => (
                <option key={i} value={i}>
                  {INDEX_META[i].label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Contextual tip */}
        {tip && (
          <div className="flex items-start gap-2 rounded-input border border-line bg-panel/60 p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" />
            <p className="text-xs leading-relaxed text-muted">{tip}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Rate */}
          <div>
            <Label htmlFor="inv-rate">{rateLabel}</Label>
            <Input
              id="inv-rate"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={Number.isFinite(form.rate) ? form.rate : 0}
              onChange={(e) => patch({ rate: parseFloat(e.target.value) || 0 })}
              placeholder={form.index === "cdi" ? "100" : "6.5"}
            />
          </div>
          {/* Initial amount (only editable when creating) */}
          <div>
            <Label htmlFor="inv-amount">{isEdit ? "Valor aportado" : "Valor inicial aportado *"}</Label>
            <CurrencyInput
              id="inv-amount"
              value={form.initialAmount}
              onChange={(v) => patch({ initialAmount: v })}
              disabled={isEdit}
              aria-invalid={amountError}
              className={cn(
                "font-semibold",
                isEdit && "opacity-60",
                amountError && "border-danger focus:border-danger",
              )}
            />
          </div>
        </div>
        {isEdit && (
          <p className="-mt-2 text-[11px] text-muted">
            Para adicionar dinheiro, use o botão <strong>+ Aporte</strong> no card do investimento.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Purchase date */}
          <div>
            <Label htmlFor="inv-date">Data do 1º aporte *</Label>
            <Input
              id="inv-date"
              type="date"
              value={form.purchaseDate}
              onChange={(e) => patch({ purchaseDate: e.target.value })}
              disabled={isEdit}
              className={cn(isEdit && "opacity-60")}
            />
          </div>
          {/* Maturity date */}
          <div>
            <Label htmlFor="inv-maturity">Vencimento</Label>
            <Input
              id="inv-maturity"
              type="date"
              value={form.maturityDate ?? ""}
              onChange={(e) => patch({ maturityDate: e.target.value || null })}
            />
          </div>
        </div>

        {/* Liquidity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="inv-liquidity">Liquidez *</Label>
            <Select
              id="inv-liquidity"
              value={form.liquidity}
              onChange={(e) => patch({ liquidity: e.target.value as InvestmentLiquidity })}
            >
              {LIQUIDITY_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {LIQUIDITY_META[l].label}
                </option>
              ))}
            </Select>
          </div>
          {form.liquidity === "carencia" && (
            <div>
              <Label htmlFor="inv-carencia">Carência (dias)</Label>
              <Input
                id="inv-carencia"
                type="number"
                inputMode="numeric"
                value={form.liquidityDays ?? ""}
                onChange={(e) => patch({ liquidityDays: parseInt(e.target.value, 10) || null })}
                placeholder="90"
              />
            </div>
          )}
        </div>

        {/* Emergency fund toggle */}
        <div className="rounded-input border border-line p-3">
          <div className="flex items-center justify-between">
            <Label className="mb-0 font-medium text-content">Faz parte da reserva de emergência?</Label>
            <button
              type="button"
              role="switch"
              aria-checked={form.isEmergencyFund}
              onClick={() => patch({ isEmergencyFund: !form.isEmergencyFund })}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                form.isEmergencyFund ? "bg-success" : "bg-panel",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow-soft transition-transform",
                  form.isEmergencyFund ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </div>

        {/* Link to goal */}
        <div>
          <Label htmlFor="inv-goal">Vincular a uma meta (opcional)</Label>
          <Select
            id="inv-goal"
            value={form.goalId ?? ""}
            onChange={(e) => patch({ goalId: e.target.value || null })}
          >
            <option value="">Nenhuma</option>
            {openGoals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </Select>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="inv-notes">Observações</Label>
          <Textarea
            id="inv-notes"
            value={form.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="Anotações sobre esse investimento…"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Delete */}
        {isEdit && investment && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger">Excluir este investimento e seus aportes?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Não
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onDelete(investment.id);
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
                Excluir investimento
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
