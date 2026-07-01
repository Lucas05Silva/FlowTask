"use client";

import { useState } from "react";
import { Plus, Braces } from "lucide-react";
import type { TaskPrompt } from "@/types";
import { useTaskPrompts } from "@/hooks/useTaskPrompts";
import { Button } from "@/components/ui/Button";
import { PromptCard } from "./PromptCard";
import { PromptModal } from "./PromptModal";
import { PromptUseModal } from "./PromptUseModal";

export function TaskPromptsSection({ taskId }: { taskId: string }) {
  const { getPromptsByTask, createPrompt, updatePrompt, deletePrompt, recordUsage } = useTaskPrompts();
  const prompts = getPromptsByTask(taskId);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TaskPrompt | null>(null);
  const [useOpen, setUseOpen] = useState(false);
  const [using, setUsing] = useState<TaskPrompt | null>(null);

  function openNew() {
    setEditing(null);
    setEditOpen(true);
  }
  function openEdit(p: TaskPrompt) {
    setEditing(p);
    setEditOpen(true);
  }
  function openUse(p: TaskPrompt) {
    setUsing(p);
    setUseOpen(true);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-content">Prompts ({prompts.length})</h3>
        <Button size="sm" icon={Plus} onClick={openNew}>Novo prompt</Button>
      </div>

      {prompts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line px-4 py-10 text-center">
          <Braces className="size-8 text-brand opacity-50" aria-hidden />
          <p className="text-sm font-semibold text-content">Nenhum prompt salvo ainda</p>
          <p className="max-w-xs text-xs text-muted">
            Salve prompts recorrentes desta tarefa e use com 1 clique 🚀
          </p>
          <Button size="sm" icon={Plus} onClick={openNew} className="mt-2">Criar primeiro prompt</Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {prompts.map((p) => (
            <PromptCard key={p.id} prompt={p} onUse={openUse} onEdit={openEdit} />
          ))}
        </div>
      )}

      <PromptModal
        open={editOpen}
        prompt={editing}
        onClose={() => setEditOpen(false)}
        onCreate={(form) => createPrompt(taskId, form)}
        onUpdate={updatePrompt}
        onDelete={deletePrompt}
      />
      <PromptUseModal
        open={useOpen}
        prompt={using}
        onClose={() => setUseOpen(false)}
        onUse={(values) => using && recordUsage(using.id, values)}
      />
    </div>
  );
}
