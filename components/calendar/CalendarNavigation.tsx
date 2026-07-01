"use client";

import { ChevronLeft, ChevronRight, Grid3x3, List } from "lucide-react";
import type { CalendarViewMode } from "@/hooks/useCalendar";
import { cn } from "@/lib/utils";

interface CalendarNavigationProps {
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  view: CalendarViewMode;
  onViewChange: (v: CalendarViewMode) => void;
  prevLabel: string;
  nextLabel: string;
}

export function CalendarNavigation({
  title,
  onPrev,
  onNext,
  onToday,
  view,
  onViewChange,
  prevLabel,
  nextLabel,
}: CalendarNavigationProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          aria-label={prevLabel}
          className="grid size-9 place-items-center rounded-input text-muted transition-colors hover:bg-panel hover:text-content"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={onNext}
          aria-label={nextLabel}
          className="grid size-9 place-items-center rounded-input text-muted transition-colors hover:bg-panel hover:text-content"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <h2 aria-live="polite" className="min-w-0 flex-1 text-lg font-semibold capitalize text-content sm:text-xl">
        {title}
      </h2>

      <button
        onClick={onToday}
        className="rounded-input border border-line px-3 py-1.5 text-sm font-medium text-content transition-colors hover:bg-panel"
      >
        Hoje
      </button>

      <div className="flex items-center rounded-input border border-line p-0.5">
        <button
          aria-label="Visão mensal"
          aria-pressed={view === "month"}
          onClick={() => onViewChange("month")}
          className={cn(
            "grid size-9 place-items-center rounded-[6px] transition-colors",
            view === "month" ? "bg-brand text-white" : "text-muted hover:text-content",
          )}
        >
          <Grid3x3 className="size-5" />
        </button>
        <button
          aria-label="Visão diária"
          aria-pressed={view === "day"}
          onClick={() => onViewChange("day")}
          className={cn(
            "grid size-9 place-items-center rounded-[6px] transition-colors",
            view === "day" ? "bg-brand text-white" : "text-muted hover:text-content",
          )}
        >
          <List className="size-5" />
        </button>
      </div>
    </div>
  );
}
