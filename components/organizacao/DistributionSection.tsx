"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Paperclip, Plus, Trash2, Undo2 } from "lucide-react";
import type { Debt, Goal, Investment, MonthlyPlanItem, PlanItemCategory } from "@/types";
import type { PlanItemFormData } from "@/hooks/useOrganizacao";
import { PLAN_CATEGORY_META, PLAN_CATEGORY_ORDER } from "@/lib/organizacao";
import { formatBRL, cn } from "@/lib/utils";
import { PlanItemModal } from "./PlanItemModal";

type ItemStatus = { done: boolean; external: boolean; goalReached: boolean };

interface DistributionSectionProps {
  items: MonthlyPlanItem[];
  readOnly: boolean;
  itemStatus: (item: MonthlyPlanItem) => ItemStatus;
  debts: Debt[];
  goals: Goal[];
  investments: Investment[];
  canUndo: (item: MonthlyPlanItem) => boolean;
  onAdd: (form: PlanItemFormData) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (item: MonthlyPlanItem) => void;
  onUndo: (item: MonthlyPlanItem) => void;
}

function ItemRow({
  item,
  status,
  readOnly,
  undoable,
  onMarkPaid,
  onUndo,
  onDelete,
}: {
  item: MonthlyPlanItem;
  status: ItemStatus;
  readOnly: boolean;
  undoable: boolean;
  onMarkPaid: () => void;
  onUndo: () => void;
  onDelete: () => void;
}) {
  const meta = PLAN_CATEGORY_META[item.category];
  const done = status.done;
  const canToggle = !readOnly && (done ? undoable : true);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.25 }}
      className="group flex items-center gap-3 py-2.5"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Desmarcar ${item.name}` : `Marcar ${item.name} como pago`}
        disabled={!canToggle}
        onClick={() => (done ? onUndo() : onMarkPaid())}
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors",
          done ? "border-success bg-success text-white" : "border-line hover:border-brand",
          !canToggle && "cursor-default",
        )}
      >
        <AnimatePresence>
          {done && (
            <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
              <Check className="size-3.5" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className={cn("truncate text-sm font-medium", done ? "text-muted line-through decoration-1" : "text-content")}>
          {item.name}
        </span>
        <span className="hidden h-px flex-1 border-t border-dashed border-line sm:block" aria-hidden />
      </div>

      <span className={cn("shrink-0 text-sm font-bold tabular-nums", done ? "text-muted" : "text-content")}>
        {formatBRL(item.plannedAmount)}
      </span>

      <span className="w-[92px] shrink-0 text-right">
        {done ? (
          <span className="inline-flex items-center gap-1 rounded-badge bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
            {status.goalReached ? "🎯 Atingida" : status.external ? "✅ Feito fora" : "Pago"}
          </span>
        ) : !readOnly ? (
          <button
            type="button"
            onClick={onMarkPaid}
            className="rounded-badge border border-line px-2 py-0.5 text-[11px] font-semibold text-muted transition-colors hover:border-brand hover:text-brand"
          >
            {meta.payVerb}
          </button>
        ) : (
          <span className="text-[11px] text-muted">Não pago</span>
        )}
      </span>

      <span className="flex w-12 shrink-0 items-center justify-end gap-1">
        {item.linkedType && (
          <span title="Vinculado a outro módulo" className="text-brand">
            <Paperclip className="size-3.5" aria-label="vinculado" />
          </span>
        )}
        {!readOnly && done && undoable && (
          <button type="button" onClick={onUndo} aria-label="Desfazer pagamento" className="text-muted opacity-0 transition-opacity hover:text-content group-hover:opacity-100">
            <Undo2 className="size-3.5" />
          </button>
        )}
        {!readOnly && !done && (
          <button type="button" onClick={onDelete} aria-label={`Remover ${item.name}`} className="text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 focus:opacity-100">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </span>
    </motion.li>
  );
}

export function DistributionSection({
  items,
  readOnly,
  itemStatus,
  debts,
  goals,
  investments,
  canUndo,
  onAdd,
  onDelete,
  onMarkPaid,
  onUndo,
}: DistributionSectionProps) {
  const [modalCategory, setModalCategory] = useState<PlanItemCategory | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const openModal = (cat: PlanItemCategory) => {
    setModalKey((k) => k + 1);
    setModalCategory(cat);
  };

  return (
    <section aria-labelledby="org-dist" className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="org-dist" className="text-xs font-bold uppercase tracking-widest text-muted">
          Distribuição
        </h2>
        <p className="text-xs text-muted">Marque conforme acontece — o resto da plataforma é atualizado junto.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {PLAN_CATEGORY_ORDER.map((cat) => {
          const meta = PLAN_CATEGORY_META[cat];
          const list = items.filter((i) => i.category === cat);
          const open = list.filter((i) => !itemStatus(i).done);
          const paid = list.filter((i) => itemStatus(i).done);
          const total = list.reduce((s, i) => s + i.plannedAmount, 0);
          if (readOnly && list.length === 0) return null;

          return (
            <div key={cat} className="rounded-card border border-line bg-surface p-4 shadow-soft">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-bold text-content">
                  <span aria-hidden>{meta.emoji}</span> {meta.label}
                  {list.length > 0 && (
                    <span className="text-xs font-medium text-muted">
                      {paid.length}/{list.length}
                    </span>
                  )}
                </h3>
                <span className="text-sm font-semibold tabular-nums" style={{ color: meta.color }}>
                  {formatBRL(total)}
                </span>
              </div>

              <ul className="mt-1 divide-y divide-line/60">
                <AnimatePresence initial={false}>
                  {open.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      status={itemStatus(item)}
                      readOnly={readOnly}
                      undoable={canUndo(item)}
                      onMarkPaid={() => onMarkPaid(item)}
                      onUndo={() => onUndo(item)}
                      onDelete={() => onDelete(item.id)}
                    />
                  ))}
                </AnimatePresence>
              </ul>

              {paid.length > 0 && (
                <div className="mt-2 rounded-input bg-panel/40 px-3">
                  <p className="pt-2 text-[10px] font-bold uppercase tracking-wide text-muted">Pagos</p>
                  <ul className="divide-y divide-line/60">
                    <AnimatePresence initial={false}>
                      {paid.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          status={itemStatus(item)}
                          readOnly={readOnly}
                          undoable={canUndo(item)}
                          onMarkPaid={() => onMarkPaid(item)}
                          onUndo={() => onUndo(item)}
                          onDelete={() => onDelete(item.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              )}

              {list.length === 0 && <p className="py-3 text-xs text-muted">Nada planejado aqui ainda.</p>}

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => openModal(cat)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                >
                  <Plus className="size-3.5" /> Adicionar item
                </button>
              )}
            </div>
          );
        })}
      </div>

      <PlanItemModal
        key={modalKey}
        open={modalCategory !== null}
        defaultCategory={modalCategory ?? "fixa"}
        debts={debts}
        goals={goals}
        investments={investments}
        onClose={() => setModalCategory(null)}
        onSubmit={onAdd}
      />
    </section>
  );
}
