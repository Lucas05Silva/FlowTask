"use client";

import { useState } from "react";
import type { FinancialIdea, IdeaDestination } from "@/types";
import type { PromoteFormData } from "@/hooks/useOrganizacao";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

interface PromoteIdeaModalProps {
  open: boolean;
  idea: FinancialIdea | null;
  destination: IdeaDestination;
  onClose: () => void;
  onSubmit: (form: PromoteFormData) => void;
}

const TITLES: Record<IdeaDestination, string> = {
  task: "Transformar em tarefa",
  goal: "Transformar em meta financeira",
  note: "Salvar como nota",
};

export function PromoteIdeaModal({ open, idea, destination, onClose, onSubmit }: PromoteIdeaModalProps) {
  // Fresh state per open: the parent remounts this modal (key) each time it opens.
  const content = idea?.content ?? "";
  const [title, setTitle] = useState(content.length > 80 ? `${content.slice(0, 77)}…` : content);
  const [date, setDate] = useState("");
  const [target, setTarget] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!title.trim()) return setError("Dê um título.");
    if (destination === "goal" && target <= 0) return setError("Defina o valor da meta.");
    onSubmit({ title, date: date || null, targetAmount: target });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={TITLES[destination]}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Criar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="rounded-input bg-panel/60 px-3 py-2 text-xs italic text-muted">“{idea?.content}”</p>
        <div>
          <Label htmlFor="promote-title">Título</Label>
          <Input id="promote-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        {destination === "goal" && (
          <div>
            <Label htmlFor="promote-target">Valor da meta *</Label>
            <CurrencyInput id="promote-target" value={target} onChange={setTarget} />
          </div>
        )}
        {destination !== "note" && (
          <div>
            <Label htmlFor="promote-date">{destination === "task" ? "Prazo" : "Data alvo"} (opcional)</Label>
            <Input id="promote-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}
        <p className="text-[11px] text-muted">
          {destination === "task"
            ? "Vai para Tarefas, categoria Financeiro, atribuída a você."
            : destination === "goal"
              ? "Vai para as Metas do Financeiro — e aparece nos seus Sonhos com prazo."
              : "Vai para Notas, privada (só você vê)."}
        </p>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
