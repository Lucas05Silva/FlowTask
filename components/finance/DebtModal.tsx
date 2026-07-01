"use client";

import { useEffect, useState } from "react";
import { Star, Trash2, CreditCard } from "lucide-react";
import type { Debt } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { formatBRL } from "@/lib/utils";

interface DebtModalProps {
  open: boolean;
  debt: Debt | null;
  onClose: () => void;
  onCreate: (form: any) => void;
  onUpdate: (id: string, form: any) => void;
  onPayInstallment: (id: string) => any;
  onDelete: (id: string) => void;
  onCelebrate: (result: any) => void;
}

function emptyForm(): any {
  return {
    name: "",
    totalAmount: 0,
    paidAmount: 0,
    installmentsTotal: 1,
    installmentsPaid: 0,
    dueDay: 10,
    interestRate: 0,
    notes: "",
  };
}

function fromDebt(d: Debt): any {
  return {
    name: d.name,
    totalAmount: d.totalAmount,
    paidAmount: d.paidAmount,
    installmentsTotal: d.installmentsTotal,
    installmentsPaid: d.installmentsPaid,
    dueDay: d.dueDay,
    interestRate: d.interestRate ?? 0,
    notes: d.notes || "",
  };
}

export function DebtModal({
  open,
  debt,
  onClose,
  onCreate,
  onUpdate,
  onPayInstallment,
  onDelete,
  onCelebrate,
}: DebtModalProps) {
  const [form, setForm] = useState<any>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = debt !== null;

  useEffect(() => {
    if (open) {
      setForm(debt ? fromDebt(debt) : emptyForm());
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, debt]);

  function patch(p: Partial<any>) {
    setForm((f: any) => ({ ...f, ...p }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      setError("Insira o nome da dívida.");
      return;
    }
    if (form.totalAmount <= 0) {
      setError("O valor total deve ser maior que zero.");
      return;
    }
    if (form.installmentsTotal <= 0) {
      setError("O total de parcelas deve ser pelo menos 1.");
      return;
    }
    if (form.dueDay < 1 || form.dueDay > 31) {
      setError("O dia de vencimento deve ser entre 1 e 31.");
      return;
    }

    if (isEdit && debt) {
      onUpdate(debt.id, form);
    } else {
      onCreate(form);
    }
    onClose();
  }

  function handlePayInstallment() {
    if (!debt) return;
    const res = onPayInstallment(debt.id);
    if (res) {
      onCelebrate(res);
    }
    onClose();
  }

  const installmentValue = form.totalAmount / (form.installmentsTotal || 1);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar dívida" : "Nova dívida / parcelamento"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-500">
            {isEdit && debt?.status !== "quitada" ? (
              <span className="text-xs text-muted">
                Parcela: <strong>{formatBRL(installmentValue)}</strong>
              </span>
            ) : (
              <>
                <Star className="size-4 text-brand" /> +100 XP ao quitar
              </>
            )}
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
          <Label htmlFor="debt-name">Nome da dívida *</Label>
          <Input
            id="debt-name"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Ex: Cartão Nubank, Financiamento Notebook"
            autoFocus
          />
          {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        </div>

        {/* Total & Paid Amounts */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="debt-total">Valor total *</Label>
            <CurrencyInput
              id="debt-total"
              value={form.totalAmount}
              onChange={(val) => patch({ totalAmount: val })}
              className="text-content"
            />
          </div>
          <div>
            <Label htmlFor="debt-paid">Valor já pago</Label>
            <CurrencyInput
              id="debt-paid"
              value={form.paidAmount}
              onChange={(val) => patch({ paidAmount: val })}
              className="text-success border-success/20 focus:border-success"
            />
          </div>
        </div>

        {/* Installments count */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="debt-inst-total">Total parcelas *</Label>
            <Input
              id="debt-inst-total"
              type="number"
              min="1"
              value={form.installmentsTotal}
              onChange={(e) => patch({ installmentsTotal: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            />
          </div>
          <div>
            <Label htmlFor="debt-inst-paid">Parcelas pagas</Label>
            <Input
              id="debt-inst-paid"
              type="number"
              min="0"
              max={form.installmentsTotal}
              value={form.installmentsPaid}
              onChange={(e) =>
                patch({
                  installmentsPaid: Math.min(form.installmentsTotal, Math.max(0, parseInt(e.target.value, 10) || 0)),
                })
              }
            />
          </div>
        </div>

        {/* Due Day & Interest rate */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="debt-due">Dia de vencimento (1-31) *</Label>
            <Input
              id="debt-due"
              type="number"
              min="1"
              max="31"
              value={form.dueDay}
              onChange={(e) => patch({ dueDay: Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 10)) })}
            />
          </div>
          <div>
            <Label htmlFor="debt-interest">Taxa de juros (% a.m.)</Label>
            <Input
              id="debt-interest"
              type="number"
              step="0.01"
              min="0"
              value={form.interestRate || ""}
              onChange={(e) => patch({ interestRate: parseFloat(e.target.value) || null })}
              placeholder="0%"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="debt-notes">Observações</Label>
          <Input
            id="debt-notes"
            value={form.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="Alguma nota extra…"
          />
        </div>

        {/* Edit mode helpers */}
        {isEdit && debt && (
          <div className="border-t border-line pt-4 space-y-2">
            {debt.status !== "quitada" && (
              <Button
                type="button"
                variant="outline"
                icon={CreditCard}
                className="w-full justify-center text-brand border-brand/20 hover:bg-brand/5"
                onClick={handlePayInstallment}
              >
                Pagar parcela ({debt.installmentsPaid + 1}/{debt.installmentsTotal})
              </Button>
            )}

            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger">Excluir esta dívida?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Não
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onDelete(debt.id);
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
                Excluir dívida
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
