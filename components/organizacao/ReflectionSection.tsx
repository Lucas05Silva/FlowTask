"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckSquare, NotebookPen, Target, Trash2 } from "lucide-react";
import type { FinancialIdea, IdeaDestination } from "@/types";
import type { PromoteFormData } from "@/hooks/useOrganizacao";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { PromoteIdeaModal } from "./PromoteIdeaModal";

interface ReflectionSectionProps {
  monthLabel: string;
  notes: string;
  ideas: FinancialIdea[];
  readOnly: boolean;
  onSaveNotes: (notes: string) => void;
  onAddIdea: (content: string) => void;
  onDeleteIdea: (id: string) => void;
  onPromote: (idea: FinancialIdea, destination: IdeaDestination, form: PromoteFormData) => void;
}

const DESTINATION_LABEL: Record<IdeaDestination, string> = { task: "Tarefa", goal: "Meta", note: "Nota" };

export function ReflectionSection({
  monthLabel,
  notes,
  ideas,
  readOnly,
  onSaveNotes,
  onAddIdea,
  onDeleteIdea,
  onPromote,
}: ReflectionSectionProps) {
  // Local draft + 800ms debounced autosave. The parent keys this component by
  // plan id, so switching months starts from that month's saved text.
  const [draft, setDraft] = useState(notes);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Pending save captures the onSaveNotes of the month it was typed in, so an
  // unmount flush (switching months mid-typing) never writes into another month.
  const pending = useRef<{ value: string; save: (v: string) => void } | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (pending.current) pending.current.save(pending.current.value);
    },
    [],
  );

  function handleNotesChange(value: string) {
    setDraft(value);
    setSaveState("saving");
    pending.current = { value, save: onSaveNotes };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pending.current?.save(pending.current.value);
      pending.current = null;
      setSaveState("saved");
    }, 800);
  }

  const [ideaDraft, setIdeaDraft] = useState("");
  const [promoting, setPromoting] = useState<{ idea: FinancialIdea; destination: IdeaDestination } | null>(null);
  const [promoteKey, setPromoteKey] = useState(0);

  return (
    <section aria-labelledby="org-reflect" className="space-y-4">
      <h2 id="org-reflect" className="text-xs font-bold uppercase tracking-widest text-muted">
        Reflexão
      </h2>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* 4.1 Texto livre */}
        <Card className="flex flex-col gap-3 lg:col-span-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base font-semibold text-content">✍️ {monthLabel} — o que está na minha cabeça</h3>
            <span className="text-[11px] text-muted" aria-live="polite">
              {saveState === "saving" ? "Salvando…" : saveState === "saved" ? "Salvo ✓" : ""}
            </span>
          </div>
          <textarea
            value={draft}
            onChange={(e) => handleNotesChange(e.target.value)}
            readOnly={readOnly}
            placeholder={
              readOnly
                ? "Nada escrito neste mês."
                : "Como está sua cabeça esse mês? Escreva sobre seus objetivos, preocupações ou planos..."
            }
            className="min-h-[220px] w-full resize-y rounded-input border border-line bg-panel/30 px-4 py-3 text-sm leading-relaxed text-content placeholder:text-muted focus:border-brand focus-visible:outline-none"
          />
        </Card>

        {/* 4.2 Ideias */}
        <Card className="flex flex-col gap-3 lg:col-span-2">
          <h3 className="text-base font-semibold text-content">💡 Ideias deste mês</h3>
          {!readOnly && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddIdea(ideaDraft);
                setIdeaDraft("");
              }}
            >
              <Input
                value={ideaDraft}
                onChange={(e) => setIdeaDraft(e.target.value)}
                placeholder="+ Escrever uma ideia… (Enter)"
                className="h-10"
              />
            </form>
          )}

          {ideas.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted">
              {readOnly ? "Nenhuma ideia registrada neste mês." : "Anote ideias soltas — depois transforme em tarefa, meta ou nota."}
            </p>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {ideas.map((idea) => (
                  <motion.li
                    key={idea.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={cn("rounded-input border p-3", idea.promotedTo ? "border-success/30 bg-success/5" : "border-line")}>
                      <p className="text-sm text-content">“{idea.content}”</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {idea.promotedTo ? (
                          <span className="text-[11px] font-semibold text-success">
                            ✅ promovida → {DESTINATION_LABEL[idea.promotedTo]}
                          </span>
                        ) : (
                          !readOnly && (
                            <>
                              {(
                                [
                                  { dest: "task", label: "Tarefa", icon: CheckSquare },
                                  { dest: "goal", label: "Meta", icon: Target },
                                  { dest: "note", label: "Nota", icon: NotebookPen },
                                ] as const
                              ).map(({ dest, label, icon: Icon }) => (
                                <button
                                  key={dest}
                                  type="button"
                                  onClick={() => {
                                    setPromoteKey((k) => k + 1);
                                    setPromoting({ idea, destination: dest });
                                  }}
                                  className="inline-flex items-center gap-1 rounded-badge border border-line px-2 py-0.5 text-[11px] font-medium text-muted transition-colors hover:border-brand hover:text-brand"
                                >
                                  <Icon className="size-3" /> {dest === "note" ? "Salvar como nota" : `Virar ${label.toLowerCase()}`}
                                </button>
                              ))}
                            </>
                          )
                        )}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => onDeleteIdea(idea.id)}
                            aria-label="Apagar ideia"
                            className="ml-auto text-muted transition-colors hover:text-danger"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Card>
      </div>

      <PromoteIdeaModal
        key={promoteKey}
        open={promoting !== null}
        idea={promoting?.idea ?? null}
        destination={promoting?.destination ?? "task"}
        onClose={() => setPromoting(null)}
        onSubmit={(form) => promoting && onPromote(promoting.idea, promoting.destination, form)}
      />
    </section>
  );
}
