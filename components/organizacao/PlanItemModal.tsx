"use client";

import { useState } from "react";
import type { Debt, Goal, Investment, PlanItemCategory, PlanItemLinkType } from "@/types";
import type { PlanItemFormData } from "@/hooks/useOrganizacao";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { PLAN_CATEGORY_META, PLAN_CATEGORY_ORDER } from "@/lib/organizacao";
import { formatBRL } from "@/lib/utils";

interface PlanItemModalProps {
  open: boolean;
  defaultCategory: PlanItemCategory;
  debts: Debt[];
  goals: Goal[];
  investments: Investment[];
  onClose: () => void;
  onSubmit: (form: PlanItemFormData) => void;
}

/** Link-select value: "" = none, else "<type>:<id>". */
const LINK_CATEGORY: Record<PlanItemLinkType, PlanItemCategory> = {
  debt: "divida",
  financial_goal: "meta",
  investment: "investimento",
};

export function PlanItemModal({ open, defaultCategory, debts, goals, investments, onClose, onSubmit }: PlanItemModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<PlanItemCategory>(defaultCategory);
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Fresh state per open: the parent remounts this modal (key) each time it opens.

  function handleLinkChange(value: string) {
    setLink(value);
    if (!value) return;
    const [type, id] = value.split(":") as [PlanItemLinkType, string];
    // Pre-fill from the linked record (keeps a reserve goal under "Reserva").
    if (!(type === "financial_goal" && category === "reserva")) setCategory(LINK_CATEGORY[type]);
    if (type === "debt") {
      const d = debts.find((x) => x.id === id);
      if (d) {
        if (!name) setName(d.name);
        if (!amount) setAmount(Math.round((d.totalAmount / d.installmentsTotal) * 100) / 100);
      }
    } else if (type === "financial_goal") {
      const g = goals.find((x) => x.id === id);
      if (g && !name) setName(g.title);
    } else {
      const inv = investments.find((x) => x.id === id);
      if (inv && !name) setName(inv.name);
    }
  }

  function handleSubmit() {
    if (!name.trim()) return setError("Dê um nome ao item.");
    if (amount <= 0) return setError("Informe um valor maior que zero.");
    const [linkedType, linkedId] = link ? (link.split(":") as [PlanItemLinkType, string]) : [null, null];
    onSubmit({ name, category, plannedAmount: amount, linkedType, linkedId, notes });
    onClose();
  }

  const hasOptions = debts.length + goals.length + investments.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adicionar item ao plano"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Adicionar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="pi-link">Vincular a</Label>
          <Select id="pi-link" value={link} onChange={(e) => handleLinkChange(e.target.value)}>
            <option value="">Nenhum — ao pagar, cria um lançamento no Financeiro</option>
            {debts.length > 0 && (
              <optgroup label="Dívidas">
                {debts.map((d) => (
                  <option key={d.id} value={`debt:${d.id}`}>
                    {d.name} — parcela {formatBRL(d.totalAmount / d.installmentsTotal)}
                  </option>
                ))}
              </optgroup>
            )}
            {goals.length > 0 && (
              <optgroup label="Metas">
                {goals.map((g) => (
                  <option key={g.id} value={`financial_goal:${g.id}`}>
                    {g.title} — faltam {formatBRL(Math.max(0, g.targetAmount - g.currentAmount))}
                  </option>
                ))}
              </optgroup>
            )}
            {investments.length > 0 && (
              <optgroup label="Investimentos">
                {investments.map((i) => (
                  <option key={i.id} value={`investment:${i.id}`}>
                    {i.name}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
          <p className="mt-1 text-[11px] text-muted">
            {hasOptions
              ? "Vinculado: ao marcar como pago, a parcela/aporte/depósito é registrado no módulo de origem."
              : "Nenhuma dívida, meta ou investimento cadastrado ainda."}
          </p>
        </div>

        <div>
          <Label htmlFor="pi-name">Nome *</Label>
          <Input id="pi-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Aluguel" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pi-amount">Valor planejado *</Label>
            <CurrencyInput id="pi-amount" value={amount} onChange={setAmount} />
          </div>
          <div>
            <Label htmlFor="pi-cat">Categoria</Label>
            <Select id="pi-cat" value={category} onChange={(e) => setCategory(e.target.value as PlanItemCategory)}>
              {PLAN_CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {PLAN_CATEGORY_META[c].emoji} {PLAN_CATEGORY_META[c].label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="pi-notes">Notas</Label>
          <Textarea id="pi-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="min-h-[64px]" />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
