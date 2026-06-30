"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, List, LayoutGrid } from "lucide-react";
import type { Category, Priority, TaskStatus } from "@/types";
import { CATEGORY_META, PRIORITY_META, TASK_STATUS_META } from "@/lib/constants";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export type ViewMode = "status" | "category";

export interface TaskFilterState {
  category: Category | "all";
  priority: Priority | "all";
  assignee: "all" | "lucas" | "thaiane";
  status: TaskStatus | "all";
  search: string;
}

export const DEFAULT_FILTERS: TaskFilterState = {
  category: "all",
  priority: "all",
  assignee: "all",
  status: "all",
  search: "",
};

interface TaskFiltersProps {
  filters: TaskFilterState;
  onChange: (next: TaskFilterState) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
}

function Chip({ active, color, onClick, children }: { active: boolean; color?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-badge border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-transparent text-white" : "border-line text-muted hover:bg-panel hover:text-content",
      )}
      style={active ? { backgroundColor: color ?? "var(--brand-purple)" } : undefined}
    >
      {color && <span className="size-2 rounded-full" style={{ backgroundColor: active ? "#fff" : color }} />}
      {children}
    </button>
  );
}

function FilterGroups({ filters, onChange }: { filters: TaskFilterState; onChange: (n: TaskFilterState) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Categoria</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={filters.category === "all"} onClick={() => onChange({ ...filters, category: "all" })}>Todas</Chip>
          {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
            <Chip key={c} active={filters.category === c} color={CATEGORY_META[c].color} onClick={() => onChange({ ...filters, category: c })}>
              {CATEGORY_META[c].label}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Prioridade</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={filters.priority === "all"} onClick={() => onChange({ ...filters, priority: "all" })}>Todas</Chip>
          {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
            <Chip key={p} active={filters.priority === p} color={PRIORITY_META[p].color} onClick={() => onChange({ ...filters, priority: p })}>
              {PRIORITY_META[p].label}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Responsável</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={filters.assignee === "all"} onClick={() => onChange({ ...filters, assignee: "all" })}>Todos</Chip>
          <Chip active={filters.assignee === "lucas"} onClick={() => onChange({ ...filters, assignee: "lucas" })}>Lucas</Chip>
          <Chip active={filters.assignee === "thaiane"} onClick={() => onChange({ ...filters, assignee: "thaiane" })}>Thaiane</Chip>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Status</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={filters.status === "all"} onClick={() => onChange({ ...filters, status: "all" })}>Todas</Chip>
          {(Object.keys(TASK_STATUS_META) as TaskStatus[]).map((s) => (
            <Chip key={s} active={filters.status === s} onClick={() => onChange({ ...filters, status: s })}>
              {TASK_STATUS_META[s].label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TaskFilters({ filters, onChange, view, onViewChange }: TaskFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Debounce search → parent (300ms)
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== filters.search) onChange({ ...filters, search: searchInput });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar tarefa…"
            className="h-11 w-full rounded-input border border-line bg-surface pl-9 pr-3 text-sm text-content placeholder:text-muted focus:border-brand focus-visible:outline-none"
          />
        </div>

        <div className="flex items-center rounded-input border border-line p-0.5">
          <button
            type="button"
            aria-label="Agrupar por status"
            aria-pressed={view === "status"}
            onClick={() => onViewChange("status")}
            className={cn("grid size-9 place-items-center rounded-[6px] transition-colors", view === "status" ? "bg-brand text-white" : "text-muted hover:text-content")}
          >
            <List className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Agrupar por categoria"
            aria-pressed={view === "category"}
            onClick={() => onViewChange("category")}
            className={cn("grid size-9 place-items-center rounded-[6px] transition-colors", view === "category" ? "bg-brand text-white" : "text-muted hover:text-content")}
          >
            <LayoutGrid className="size-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-input border border-line px-3 text-sm font-medium text-content hover:bg-panel md:hidden"
        >
          <SlidersHorizontal className="size-4" /> Filtros
        </button>
      </div>

      {/* Desktop/tablet inline filters */}
      <div className="hidden md:block">
        <FilterGroups filters={filters} onChange={onChange} />
      </div>

      {/* Mobile sheet */}
      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filtros">
        <FilterGroups filters={filters} onChange={onChange} />
      </Modal>
    </div>
  );
}
