"use client";

import { Pin, Share2, Trash2 } from "lucide-react";
import type { Note } from "@/types";
import { relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { NOTE_COLOR_MAP } from "./NoteColorPicker";

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function NoteCard({ note, isSelected, onSelect, onDelete }: NoteCardProps) {
  // Determine displayed title (fallback: first 50 chars of content, or "Sem título")
  const displayTitle = useMemoTitle(note.title, note.content);

  // Determine preview text (content truncated)
  const displayPreview = useMemoPreview(note.content);

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative rounded-card p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between select-none min-h-[110px] border border-transparent hover:shadow-md",
        isSelected 
          ? "ring-2 ring-brand border-transparent" 
          : "hover:scale-[1.01] hover:border-line",
        NOTE_COLOR_MAP[note.color || "default"].classes
      )}
    >
      <div className="space-y-1.5 pr-6">
        <div className="flex items-start justify-between gap-1.5">
          <h4 className="font-extrabold text-sm leading-snug line-clamp-1 break-all">
            {displayTitle}
          </h4>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {note.isPinned && (
              <Pin className="size-3.5 fill-current rotate-45 text-brand" />
            )}
            {note.isShared && (
              <Share2 className="size-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
        <p className="text-xs opacity-80 font-medium line-clamp-2 leading-relaxed break-all">
          {displayPreview || <em className="opacity-50">Sem conteúdo adicional</em>}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] opacity-60 font-bold">
          {relativeTime(note.updatedAt)}
        </span>

        {/* Delete button shown on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          title="Excluir nota"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 -m-1.5 text-inherit hover:text-danger hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all shrink-0 cursor-pointer"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// Helpers for memoized text formatting to keep render fast
function useMemoTitle(title?: string, content?: string) {
  if (title && title.trim()) return title.trim();
  const cleanContent = content ? content.trim() : "";
  if (!cleanContent) return "Sem título";
  const firstLine = cleanContent.split("\n")[0];
  return firstLine.length > 50 ? `${firstLine.substring(0, 50)}...` : firstLine;
}

function useMemoPreview(content?: string) {
  const cleanContent = content ? content.trim() : "";
  if (!cleanContent) return "";
  // Strip the first line if it acts as the title
  const lines = cleanContent.split("\n");
  const subContent = lines.slice(1).join("\n").trim();
  const previewText = subContent || cleanContent;
  return previewText.length > 100 ? `${previewText.substring(0, 100)}...` : previewText;
}
