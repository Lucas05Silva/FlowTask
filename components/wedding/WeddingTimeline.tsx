"use client";

import { useMemo } from "react";
import { Check, Heart, Calendar, User, Tag } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatDate, daysUntil } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  title: string;
  date: string;
  type: "task" | "wedding_day";
  isCompleted: boolean;
  assignee?: string;
  category?: string;
}

interface WeddingTimelineProps {
  items: TimelineItem[];
  onItemClick: (id: string, type: "task" | "wedding_day") => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  cerimonia: "Cerimônia",
  recepcao: "Recepção",
  visual: "Visual",
  documentacao: "Documentação",
  geral: "Geral",
};

export function WeddingTimeline({ items, onItemClick }: WeddingTimelineProps) {
  // Find the next active milestone (first uncompleted item)
  const activeIndex = useMemo(() => {
    return items.findIndex((it) => !it.isCompleted);
  }, [items]);

  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center text-center p-8 border-pink-100/25 bg-surface text-muted">
        <Calendar className="size-8 text-muted/65 mb-2" />
        <span className="text-sm font-semibold">Nenhum prazo ou data cadastrada para compor o cronograma.</span>
        <p className="text-xs text-muted/65 mt-1">Adicione prazos nas suas tarefas ou defina a data do casamento.</p>
      </Card>
    );
  }

  return (
    <div className="relative pl-6 sm:pl-8 space-y-6">
      {/* Central timeline vertical line */}
      <div className="absolute left-3.5 sm:left-4.5 top-2 bottom-2 w-[2px] bg-line/65" />

      {items.map((item, idx) => {
        const isWedding = item.type === "wedding_day";
        const isDone = item.isCompleted;
        const isActive = idx === activeIndex;
        const isFuture = !isDone && !isActive;

        return (
          <div
            key={item.id}
            onClick={() => {
              if (item.type === "task") {
                onItemClick(item.id, "task");
              } else {
                onItemClick(item.id, "wedding_day");
              }
            }}
            className={cn(
              "relative flex flex-col gap-2 rounded-card border bg-surface p-4 cursor-pointer select-none transition-all duration-200 hover:scale-[1.005] hover:shadow-soft",
              isActive ? "border-pink-400 shadow-pink-500/[0.03] ring-1 ring-pink-400/25" : "border-line",
              isDone && "bg-surface/65"
            )}
          >
            {/* Timeline bullet node */}
            <div
              className={cn(
                "absolute -left-[30px] sm:-left-[38px] top-4.5 z-10 grid size-6 sm:size-7 place-items-center rounded-full border shadow-sm transition-colors duration-200",
                isDone
                  ? "border-success bg-success text-white"
                  : isWedding
                  ? "border-pink-500 bg-pink-500 text-white animate-pulse"
                  : isActive
                  ? "border-pink-400 bg-surface text-pink-500 ring-4 ring-pink-500/10"
                  : "border-line bg-panel text-muted"
              )}
            >
              {isDone ? (
                <Check className="size-3.5 sm:size-4" />
              ) : isWedding ? (
                <Heart className="size-3.5 sm:size-4 fill-white" />
              ) : (
                <span className="size-2 rounded-full bg-current" />
              )}
            </div>

            {/* Date and details row */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span
                className={cn(
                  "text-[10px] font-extrabold uppercase tracking-wider text-muted",
                  isActive && "text-pink-500",
                  isDone && "text-muted/65"
                )}
              >
                {formatDate(item.date, { day: "2-digit", month: "long", year: "numeric" })}
              </span>
              {isActive && (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide border border-pink-200 bg-pink-50 text-pink-500 self-start sm:self-auto">
                  Próximo Marco 🎯
                </span>
              )}
            </div>

            {/* Title */}
            <h4
              className={cn(
                "font-bold text-sm text-content capitalize",
                isDone && "line-through text-muted/65",
                isWedding && "text-pink-500 font-extrabold text-base"
              )}
            >
              {item.title}
            </h4>

            {/* Sub-info tags */}
            {item.type === "task" && (
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted border-t border-line/45 pt-2 mt-1">
                {item.assignee && (
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3" />
                    <span className="capitalize">{item.assignee === "ambos" ? "Lucas & Thaiane" : item.assignee}</span>
                  </span>
                )}
                {item.category && (
                  <span className="inline-flex items-center gap-1">
                    <Tag className="size-3" />
                    <span>{CATEGORY_LABELS[item.category] || item.category}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
