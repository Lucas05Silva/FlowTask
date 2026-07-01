"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import type { ProjectStep } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn, pct, uid } from "@/lib/utils";

interface ProjectStepsProps {
  steps: ProjectStep[];
  onChange?: (steps: ProjectStep[]) => void;
  onToggle?: (stepId: string) => void;
  editable?: boolean;
}

export function ProjectSteps({ steps, onChange, onToggle, editable = false }: ProjectStepsProps) {
  const [title, setTitle] = useState("");
  const ordered = [...steps].sort((a, b) => a.order - b.order);
  const done = ordered.filter((s) => s.status === "concluido").length;

  function commitAdd() {
    const trimmed = title.trim();
    if (!trimmed || !onChange) return;
    onChange([
      ...ordered,
      {
        id: uid("ps"),
        title: trimmed,
        status: "pendente",
        order: ordered.length,
        completedAt: null,
      },
    ]);
    setTitle("");
  }

  function patchStep(id: string, patch: Partial<ProjectStep>) {
    if (!onChange) return;
    onChange(ordered.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeStep(id: string) {
    if (!onChange) return;
    onChange(ordered.filter((s) => s.id !== id).map((s, index) => ({ ...s, order: index })));
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted">
          <span>{done}/{ordered.length} etapas concluidas</span>
          <span>{pct(done, ordered.length)}%</span>
        </div>
        <ProgressBar value={pct(done, ordered.length)} color="var(--brand-purple)" />
      </div>

      <div className="space-y-2">
        {ordered.map((step, index) => {
          const checked = step.status === "concluido";
          return (
            <motion.div
              key={step.id}
              layout
              className="flex items-center gap-2 rounded-input border border-line bg-panel/40 px-2 py-2"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => {
                  if (onToggle) onToggle(step.id);
                  else patchStep(step.id, {
                    status: checked ? "pendente" : "concluido",
                    completedAt: checked ? null : new Date().toISOString(),
                  });
                }}
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  checked ? "border-success bg-success text-white" : "border-line text-transparent hover:border-brand",
                )}
              >
                <motion.svg
                  viewBox="0 0 24 24"
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  initial={false}
                  animate={checked ? { scale: 1 } : { scale: 0 }}
                >
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              </button>

              <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted">{index + 1}</span>
              {editable ? (
                <Input
                  value={step.title}
                  onChange={(e) => patchStep(step.id, { title: e.target.value })}
                  className="h-9 flex-1 bg-surface"
                  aria-label={`Etapa ${index + 1}`}
                />
              ) : (
                <span className={cn("min-w-0 flex-1 truncate text-sm text-content", checked && "text-muted line-through")}>
                  {step.title}
                </span>
              )}

              {editable && (
                <button
                  type="button"
                  onClick={() => removeStep(step.id)}
                  aria-label="Remover etapa"
                  className="grid size-8 shrink-0 place-items-center rounded-input text-muted hover:bg-surface hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {editable && (
        <div className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitAdd();
              }
            }}
            placeholder="Adicionar etapa"
            className="h-10"
          />
          <Button type="button" variant="outline" size="icon" icon={Plus} onClick={commitAdd} aria-label="Adicionar etapa" />
        </div>
      )}
    </div>
  );
}
