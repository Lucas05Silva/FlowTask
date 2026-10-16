"use client";

import { useState } from "react";
import { Link2, Trash2 } from "lucide-react";
import type { DreamColor, Goal } from "@/types";
import type { DreamFormData, ResolvedDream } from "@/hooks/useOrganizacao";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DREAM_COLORS, DREAM_EMOJIS } from "@/lib/organizacao";
import { formatBRL, cn } from "@/lib/utils";

interface DreamModalProps {
  open: boolean;
  /** null = creating a new dream. */
  editing: ResolvedDream | null;
  goals: Goal[];
  onClose: () => void;
  onSave: (form: DreamFormData, id?: string) => void;
  onDelete: (id: string) => void;
}

export function DreamModal({ open, editing, goals, onClose, onSave, onDelete }: DreamModalProps) {
  // Fresh state per open: the parent remounts this modal (key) each time it opens.
  const d = editing?.dream;
  const [name, setName] = useState(d?.name ?? "");
  const [emoji, setEmoji] = useState(d?.emoji ?? "⭐");
  const [target, setTarget] = useState(d?.targetAmount ?? 0);
  const [current, setCurrent] = useState(d?.currentAmount ?? 0);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(d?.linkedGoalId ?? null);
  const [color, setColor] = useState<DreamColor>(d?.color ?? "roxo");
  const [notes, setNotes] = useState(d?.notes ?? "");
  const [showEmojis, setShowEmojis] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedGoal = linkedGoalId ? goals.find((g) => g.id === linkedGoalId) ?? null : null;

  function handleLink(id: string) {
    const goal = goals.find((g) => g.id === id) ?? null;
    setLinkedGoalId(goal ? goal.id : null);
    if (goal) {
      // Snapshot the goal's values (also the fallback if the goal is deleted later).
      setTarget(goal.targetAmount);
      setCurrent(goal.currentAmount);
      if (!name.trim()) setName(goal.title);
    }
  }

  function handleSave() {
    if (!name.trim()) return setError("Dê um nome ao sonho.");
    const effectiveTarget = linkedGoal ? linkedGoal.targetAmount : target;
    if (effectiveTarget <= 0) return setError("Defina o valor alvo.");
    onSave(
      {
        name,
        emoji,
        targetAmount: effectiveTarget,
        currentAmount: linkedGoal ? linkedGoal.currentAmount : current,
        linkedGoalId,
        color,
        notes,
      },
      d?.id,
    );
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar sonho" : "Novo sonho"}
      footer={
        <div className="flex items-center justify-between gap-2">
          {editing ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-danger">Excluir este sonho?</span>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Não
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    onDelete(editing.dream.id);
                    onClose();
                  }}
                >
                  Excluir
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" icon={Trash2} className="text-danger hover:bg-danger/5" onClick={() => setConfirmDelete(true)}>
                Excluir
              </Button>
            )
          ) : (
            <span />
          )}
          {!confirmDelete && (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Emoji + name */}
        <div className="flex items-end gap-3">
          <div className="relative">
            <Label>Ícone</Label>
            <button
              type="button"
              onClick={() => setShowEmojis((s) => !s)}
              aria-label="Escolher emoji"
              aria-expanded={showEmojis}
              className="grid size-11 place-items-center rounded-input border border-line text-2xl transition-colors hover:border-brand"
            >
              {emoji}
            </button>
          </div>
          <div className="flex-1">
            <Label htmlFor="dream-name">Nome do sonho *</Label>
            <Input id="dream-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Canadá" autoFocus />
          </div>
        </div>
        {showEmojis && (
          <div className="grid grid-cols-8 gap-1.5 rounded-input border border-line bg-panel/40 p-2">
            {DREAM_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  setEmoji(e);
                  setShowEmojis(false);
                }}
                className={cn(
                  "grid aspect-square place-items-center rounded-md text-xl transition-colors hover:bg-surface",
                  emoji === e && "bg-surface ring-2 ring-brand",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Link */}
        <div>
          <Label htmlFor="dream-goal">Vincular a meta existente</Label>
          <Select id="dream-goal" value={linkedGoalId ?? ""} onChange={(e) => handleLink(e.target.value)}>
            <option value="">Nenhuma — valores manuais</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title} ({formatBRL(g.currentAmount)} / {formatBRL(g.targetAmount)})
              </option>
            ))}
          </Select>
          {linkedGoal && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-brand">
              <Link2 className="size-3" /> Valores sincronizados com “{linkedGoal.title}” em tempo real.
            </p>
          )}
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="dream-target">Valor alvo *</Label>
            {linkedGoal ? (
              <p className="flex h-11 items-center rounded-input border border-line bg-panel/50 px-3 text-sm font-semibold text-muted">
                {formatBRL(linkedGoal.targetAmount)}
              </p>
            ) : (
              <CurrencyInput id="dream-target" value={target} onChange={setTarget} />
            )}
          </div>
          <div>
            <Label htmlFor="dream-current">Valor atual</Label>
            {linkedGoal ? (
              <p className="flex h-11 items-center rounded-input border border-line bg-panel/50 px-3 text-sm font-semibold text-muted">
                {formatBRL(linkedGoal.currentAmount)}
              </p>
            ) : (
              <CurrencyInput id="dream-current" value={current} onChange={setCurrent} />
            )}
          </div>
        </div>

        {/* Color */}
        <div>
          <Label>Cor do card</Label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(DREAM_COLORS) as DreamColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={color === c}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-input border px-2 py-2 text-xs font-medium transition-colors",
                  color === c ? "border-brand bg-brand/10 text-content" : "border-line text-muted hover:bg-panel/60",
                )}
              >
                <span className="size-3 rounded-full" style={{ backgroundColor: DREAM_COLORS[c].value }} />
                {DREAM_COLORS[c].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="dream-notes">Notas</Label>
          <Textarea
            id="dream-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='Opcional — ex: "Chegar até Agosto/2028"'
            className="min-h-[64px]"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
