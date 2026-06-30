"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Subtask } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { uid, pct } from "@/lib/utils";

interface SubtaskListProps {
  subtasks: Subtask[];
  onChange: (next: Subtask[]) => void;
}

export function SubtaskList({ subtasks, onChange }: SubtaskListProps) {
  const [draft, setDraft] = useState("");
  const done = subtasks.filter((s) => s.done).length;

  function add() {
    const title = draft.trim();
    if (!title) return;
    onChange([...subtasks, { id: uid("s"), title, done: false }]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2">
          <ProgressBar value={pct(done, subtasks.length)} height={6} className="flex-1" />
          <span className="text-xs text-muted">
            {done}/{subtasks.length}
          </span>
        </div>
      )}

      <ul className="space-y-1.5">
        {subtasks.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={s.done}
              aria-label={s.title}
              onClick={() => onChange(subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))}
              className={`grid size-5 shrink-0 place-items-center rounded-[6px] border transition-colors ${
                s.done ? "border-brand bg-brand text-white" : "border-line text-transparent hover:border-brand"
              }`}
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className={`flex-1 text-sm ${s.done ? "text-muted line-through" : "text-content"}`}>{s.title}</span>
            <button
              type="button"
              aria-label={`Remover ${s.title}`}
              onClick={() => onChange(subtasks.filter((x) => x.id !== s.id))}
              className="grid size-7 place-items-center rounded-input text-muted hover:bg-panel hover:text-danger"
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Adicionar subtarefa…"
          className="h-9 flex-1 rounded-input border border-line bg-surface px-3 text-sm text-content placeholder:text-muted focus:border-brand focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={add}
          aria-label="Adicionar subtarefa"
          className="grid size-9 shrink-0 place-items-center rounded-input bg-panel text-content hover:bg-brand hover:text-white"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
