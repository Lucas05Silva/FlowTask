"use client";

/* Form state is intentionally re-synced from the selected prompt when the modal opens. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Trash2, Braces, ChevronDown } from "lucide-react";
import type { TaskPrompt } from "@/types";
import type { PromptFormData } from "@/hooks/useTaskPrompts";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { parseVariables } from "@/lib/prompts";
import { cn } from "@/lib/utils";
import { PROMPT_CATEGORIES, promptCategoryColor } from "./promptCategories";

interface PromptModalProps {
  open: boolean;
  prompt: TaskPrompt | null;
  onClose: () => void;
  onCreate: (form: PromptFormData) => void;
  onUpdate: (id: string, form: PromptFormData) => void;
  onDelete: (id: string) => void;
}

function emptyForm(): PromptFormData {
  return { title: "", description: "", category: "Instagram", content: "", variables: [] };
}

function fromPrompt(p: TaskPrompt): PromptFormData {
  return {
    title: p.title,
    description: p.description ?? "",
    category: p.category,
    content: p.content,
    variables: p.variables.map((v) => ({ key: v.key, label: v.label, defaultValue: v.defaultValue })),
  };
}

export function PromptModal({ open, prompt, onClose, onCreate, onUpdate, onDelete }: PromptModalProps) {
  const [form, setForm] = useState<PromptFormData>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showVars, setShowVars] = useState(false);
  const isEdit = prompt !== null;

  useEffect(() => {
    if (open) {
      setForm(prompt ? fromPrompt(prompt) : emptyForm());
      setError(null);
      setConfirmDelete(false);
      setShowVars(false);
    }
  }, [open, prompt]);

  function setContent(content: string) {
    setForm((f) => ({ ...f, content, variables: parseVariables(content, f.variables) }));
  }

  function setVariable(key: string, patch: { label?: string; defaultValue?: string }) {
    setForm((f) => ({
      ...f,
      variables: f.variables.map((v) => (v.key === key ? { ...v, ...patch } : v)),
    }));
  }

  function handleSave() {
    if (!form.title.trim()) return setError("Dê um título ao prompt.");
    if (!form.content.trim()) return setError("Escreva o conteúdo do prompt.");
    if (isEdit && prompt) onUpdate(prompt.id, form);
    else onCreate(form);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar prompt" : "Novo prompt"}
      className="sm:max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="prompt-title">Título *</Label>
          <Input
            id="prompt-title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Post Feed Instagram"
            autoFocus
          />
        </div>

        <div>
          <Label>Categoria</Label>
          <div className="flex flex-wrap gap-2">
            {PROMPT_CATEGORIES.map((c) => {
              const active = form.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: c }))}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-badge border px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "border-transparent text-white" : "border-line text-muted hover:bg-panel hover:text-content",
                  )}
                  style={active ? { backgroundColor: promptCategoryColor(c) } : undefined}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <Input
            className="mt-2"
            value={PROMPT_CATEGORIES.includes(form.category as (typeof PROMPT_CATEGORIES)[number]) ? "" : form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="Ou digite uma categoria personalizada…"
          />
        </div>

        <div>
          <Label htmlFor="prompt-desc">Descrição</Label>
          <Textarea
            id="prompt-desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Para que serve este prompt?"
            className="min-h-[60px]"
          />
        </div>

        <div>
          <Label htmlFor="prompt-content">Conteúdo do prompt *</Label>
          <textarea
            id="prompt-content"
            value={form.content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva o prompt. Use {variavel} para campos dinâmicos, ex: {nome_cliente}."
            className="min-h-[200px] w-full resize-y rounded-input border border-line bg-panel p-3 font-mono text-[13px] leading-relaxed text-content placeholder:text-muted focus:border-brand focus-visible:outline-none"
          />
          <p className="mt-1.5 text-xs text-muted">
            {form.variables.length > 0 ? (
              <>
                <span className="font-medium text-content">Variáveis detectadas:</span>{" "}
                {form.variables.map((v) => `{${v.key}}`).join(", ")}
              </>
            ) : (
              "Nenhuma variável ainda. Use chaves, ex: {mes}."
            )}
          </p>
        </div>

        {form.variables.length > 0 && (
          <div className="rounded-input border border-line">
            <button
              type="button"
              onClick={() => setShowVars((s) => !s)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-content"
            >
              <Braces className="size-4 text-brand" /> Configurar variáveis ({form.variables.length})
              <ChevronDown className={cn("ml-auto size-4 text-muted transition-transform", showVars && "rotate-180")} />
            </button>
            {showVars && (
              <div className="space-y-3 border-t border-line p-3">
                {form.variables.map((v) => (
                  <div key={v.key} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <span className="mb-1 block font-mono text-[11px] text-muted">{`{${v.key}}`} — Label</span>
                      <Input value={v.label} onChange={(e) => setVariable(v.key, { label: e.target.value })} className="h-9" />
                    </div>
                    <div>
                      <span className="mb-1 block text-[11px] text-muted">Valor padrão</span>
                      <Input
                        value={v.defaultValue ?? ""}
                        onChange={(e) => setVariable(v.key, { defaultValue: e.target.value })}
                        className="h-9"
                        placeholder="opcional"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {isEdit && prompt && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger">Excluir este prompt?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Não</Button>
                <Button variant="danger" size="sm" onClick={() => { onDelete(prompt.id); onClose(); }}>Sim, excluir</Button>
              </div>
            ) : (
              <Button variant="ghost" icon={Trash2} className="w-full justify-center text-danger" onClick={() => setConfirmDelete(true)}>
                Excluir prompt
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
