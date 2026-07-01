"use client";

import { Braces, Pencil, Play } from "lucide-react";
import type { TaskPrompt } from "@/types";
import { useData } from "@/hooks/useData";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { relativeTime, cn } from "@/lib/utils";
import { promptCategoryColor } from "./promptCategories";

interface PromptCardProps {
  prompt: TaskPrompt;
  onUse: (p: TaskPrompt) => void;
  onEdit: (p: TaskPrompt) => void;
}

export function PromptCard({ prompt, onUse, onEdit }: PromptCardProps) {
  const data = useData();
  const color = promptCategoryColor(prompt.category);
  const author = data.users.find((u) => u.id === (prompt.updatedBy ?? prompt.createdBy));
  const lastUse = prompt.usageHistory[0];

  return (
    <div
      onClick={() => onUse(prompt)}
      className="group cursor-pointer rounded-card border border-line bg-surface p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-content">{prompt.title}</h4>
            <Badge color={color}>{prompt.category}</Badge>
          </div>
          {prompt.description && <p className="mt-0.5 truncate text-xs text-muted">{prompt.description}</p>}
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            aria-label="Editar prompt"
            onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}
            className="grid size-8 place-items-center rounded-input text-muted hover:bg-panel hover:text-content"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Usar prompt"
            onClick={(e) => { e.stopPropagation(); onUse(prompt); }}
            className="grid size-8 place-items-center rounded-input bg-brand/10 text-brand hover:bg-brand hover:text-white"
          >
            <Play className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Braces className="size-3.5" />
          {prompt.variables.length} {prompt.variables.length === 1 ? "variável" : "variáveis"}
        </span>
        <span className={cn(!lastUse && "italic")}>
          {lastUse ? `Usado ${relativeTime(lastUse.usedAt)}` : "Nunca usado"}
        </span>
        {author && (
          <span className="ml-auto inline-flex items-center gap-1">
            <Avatar user={author} size={18} />
          </span>
        )}
      </div>
    </div>
  );
}
