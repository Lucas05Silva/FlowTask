"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, GripVertical, Link2, Pencil, Plus } from "lucide-react";
import type { Goal } from "@/types";
import type { DreamFormData, ResolvedDream } from "@/hooks/useOrganizacao";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DREAM_COLORS } from "@/lib/organizacao";
import { formatBRL, cn } from "@/lib/utils";
import { DreamModal } from "./DreamModal";

interface DreamsSectionProps {
  dreams: ResolvedDream[];
  goals: Goal[];
  onSave: (form: DreamFormData, id?: string) => void;
  onDelete: (id: string) => void;
  onSetCurrent: (id: string, value: number) => void;
  onReorder: (orderedIds: string[]) => void;
}

const compact = (v: number) =>
  v >= 1000 ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: v >= 10000 ? 0 : 1 })}k` : `${Math.round(v)}`;

function DreamCard({
  rd,
  index,
  total,
  dragging,
  dropTarget,
  onEdit,
  onSetCurrent,
  onMove,
  dragProps,
}: {
  rd: ResolvedDream;
  index: number;
  total: number;
  dragging: boolean;
  dropTarget: boolean;
  onEdit: () => void;
  onSetCurrent: (value: number) => void;
  onMove: (delta: -1 | 1) => void;
  dragProps: React.HTMLAttributes<HTMLDivElement> & { draggable: boolean };
}) {
  const { dream, target, current, linkedGoal, projection: p } = rd;
  const color = DREAM_COLORS[dream.color]?.value ?? DREAM_COLORS.roxo.value;
  const [editingValue, setEditingValue] = useState(false);
  const [draft, setDraft] = useState(current);

  const line =
    p.remaining === 0 ? "Conquistado! 🏆"
    : dream.emoji === "🍁" ? "Canadá está chegando 🍁"
    : p.pct >= 75 ? "quase lá! 🎉"
    : p.pct >= 40 ? "na metade do caminho 💜"
    : "cada depósito conta 🌱";

  function commit() {
    if (draft !== current) onSetCurrent(Math.max(0, draft));
    setEditingValue(false);
  }

  return (
    // Native HTML5 drag events live on a plain div — motion.div reserves
    // onDragStart/onDragEnd for its own gesture system.
    <div {...dragProps} draggable={dragProps.draggable && !editingValue} className="h-full">
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: dragging ? 0.4 : 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-card border border-t-4 bg-surface p-4 shadow-soft transition-shadow hover:shadow-pop",
        dropTarget ? "border-brand ring-2 ring-brand/30" : "border-line",
      )}
      style={{ borderTopColor: color }}
    >
      {/* Top-right actions */}
      <div className="absolute right-2 top-2 flex items-center gap-0.5">
        <span
          className="hidden cursor-grab p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing pointer-fine:inline"
          aria-hidden
          title="Arraste para reordenar"
        >
          <GripVertical className="size-3.5" />
        </span>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar ${dream.name}`}
          className="rounded-md p-1 text-muted transition-colors hover:bg-panel hover:text-content"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      <span className="text-3xl" aria-hidden>{dream.emoji}</span>
      <h4 className="mt-2 truncate pr-10 text-sm font-extrabold uppercase tracking-wide text-content">{dream.name}</h4>
      <p className="text-[11px] text-muted">{line}</p>

      <div className="mt-3">
        {p.remaining === 0 ? (
          <p className="text-xl font-bold text-success">Atingido</p>
        ) : p.months !== null ? (
          <>
            <p className="text-xl font-bold text-content">
              {p.months} {p.months === 1 ? "mês" : "meses"}
            </p>
            <p className="text-xs text-muted">{p.dateLabel}</p>
          </>
        ) : (
          <p className="text-sm font-semibold text-muted">Prazo a definir</p>
        )}
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-panel">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p.pct}%` }}
          transition={{ duration: 0.8, delay: 0.15 + index * 0.05, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* Valor atual — inline editable when not linked to a goal */}
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-muted">
        {editingValue ? (
          <CurrencyInput
            value={draft}
            onChange={setDraft}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditingValue(false);
            }}
            autoFocus
            aria-label={`Valor atual de ${dream.name}`}
            className="h-7 px-2 text-xs font-semibold"
          />
        ) : linkedGoal ? (
          <span className="inline-flex items-center gap-1" title={`Sincronizado com a meta “${linkedGoal.title}”`}>
            <Link2 className="size-3 text-brand" />
            {formatBRL(current)} / {compact(target)}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(current);
              setEditingValue(true);
            }}
            title="Clique para atualizar o valor atual"
            className="rounded px-0.5 text-left underline decoration-dotted underline-offset-2 hover:text-content"
          >
            {formatBRL(current)} / {compact(target)}
          </button>
        )}
        {!editingValue && (
          <span className="font-bold" style={{ color }}>
            {p.pct}%
          </span>
        )}
      </div>

      {dream.notes && <p className="mt-2 line-clamp-2 text-[11px] italic text-muted">{dream.notes}</p>}

      {/* Touch devices: no drag — move buttons instead */}
      {total > 1 && (
        <div className="mt-2 hidden justify-end gap-1 pointer-coarse:flex">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Mover para a esquerda"
            className="rounded-md border border-line p-1 text-muted disabled:opacity-30"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label="Mover para a direita"
            className="rounded-md border border-line p-1 text-muted disabled:opacity-30"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}

      {p.monthsSavedWith300 && !editingValue && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-brand px-4 py-2.5 text-[11px] font-medium text-white transition-transform duration-200 group-hover:translate-y-0 pointer-coarse:hidden">
          Poupar +R$ 300/mês acelera em {p.monthsSavedWith300} {p.monthsSavedWith300 === 1 ? "mês" : "meses"}
        </div>
      )}
    </motion.div>
    </div>
  );
}

export function DreamsSection({ dreams, goals, onSave, onDelete, onSetCurrent, onReorder }: DreamsSectionProps) {
  const [modal, setModal] = useState<{ open: boolean; editing: ResolvedDream | null; key: number }>({
    open: false,
    editing: null,
    key: 0,
  });
  const openModal = (editing: ResolvedDream | null) => setModal((m) => ({ open: true, editing, key: m.key + 1 }));

  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const ids = dreams.map((d) => d.dream.id);

  function moveTo(fromId: string, toIndex: number) {
    const next = ids.filter((id) => id !== fromId);
    next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, fromId);
    onReorder(next);
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-content">✨ Sonhos com prazo</h3>
        {dreams.length > 1 && <p className="hidden text-[11px] text-muted pointer-fine:block">Arraste os cards para reordenar</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {dreams.map((rd, i) => (
          <DreamCard
            key={rd.dream.id}
            rd={rd}
            index={i}
            total={dreams.length}
            dragging={dragId === rd.dream.id}
            dropTarget={overId === rd.dream.id && dragId !== rd.dream.id}
            onEdit={() => openModal(rd)}
            onSetCurrent={(v) => onSetCurrent(rd.dream.id, v)}
            onMove={(delta) => moveTo(rd.dream.id, i + delta)}
            dragProps={{
              draggable: true,
              onDragStart: (e) => {
                setDragId(rd.dream.id);
                e.dataTransfer.effectAllowed = "move";
              },
              onDragOver: (e) => {
                e.preventDefault();
                if (overId !== rd.dream.id) setOverId(rd.dream.id);
              },
              onDragLeave: () => setOverId((o) => (o === rd.dream.id ? null : o)),
              onDrop: (e) => {
                e.preventDefault();
                if (dragId && dragId !== rd.dream.id) moveTo(dragId, i);
                setDragId(null);
                setOverId(null);
              },
              onDragEnd: () => {
                setDragId(null);
                setOverId(null);
              },
            }}
          />
        ))}

        <button
          type="button"
          onClick={() => openModal(null)}
          className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line text-sm font-semibold text-muted transition-colors hover:border-brand hover:bg-brand/5 hover:text-brand"
        >
          <Plus className="size-6" />
          Adicionar sonho
        </button>
      </div>

      <DreamModal
        key={modal.key}
        open={modal.open}
        editing={modal.editing}
        goals={goals}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSave={onSave}
        onDelete={onDelete}
      />
    </div>
  );
}
