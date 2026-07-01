"use client";

import { Search } from "lucide-react";
import type { Assignee, ProjectStatus, ServiceType } from "@/types";
import { ASSIGNEE_META, PROJECT_STATUS_META, SERVICE_TYPE_META } from "@/lib/constants";
import { Input, Select } from "@/components/ui/Input";
import { ASSIGNEES, PROJECT_STATUS_ORDER, SERVICE_TYPES } from "./project-utils";

export interface ProjectFilterState {
  search: string;
  status: ProjectStatus | "all";
  serviceType: ServiceType | "all";
  assignee: Assignee | "all";
}

export const DEFAULT_PROJECT_FILTERS: ProjectFilterState = {
  search: "",
  status: "all",
  serviceType: "all",
  assignee: "all",
};

interface ProjectFiltersProps {
  filters: ProjectFilterState;
  onChange: (filters: ProjectFilterState) => void;
}

export function ProjectFilters({ filters, onChange }: ProjectFiltersProps) {
  const patch = (p: Partial<ProjectFilterState>) => onChange({ ...filters, ...p });

  return (
    <div className="grid gap-3 rounded-card border border-line bg-surface p-3 shadow-soft lg:grid-cols-[1fr_170px_190px_170px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={filters.search}
          onChange={(e) => patch({ search: e.target.value })}
          placeholder="Buscar cliente ou projeto..."
          className="pl-9"
          aria-label="Buscar projeto"
        />
      </div>
      <Select value={filters.status} onChange={(e) => patch({ status: e.target.value as ProjectFilterState["status"] })}>
        <option value="all">Todos os status</option>
        {PROJECT_STATUS_ORDER.map((status) => (
          <option key={status} value={status}>
            {PROJECT_STATUS_META[status].label}
          </option>
        ))}
      </Select>
      <Select
        value={filters.serviceType}
        onChange={(e) => patch({ serviceType: e.target.value as ProjectFilterState["serviceType"] })}
      >
        <option value="all">Todos os servicos</option>
        {SERVICE_TYPES.map((type) => (
          <option key={type} value={type}>
            {SERVICE_TYPE_META[type].label}
          </option>
        ))}
      </Select>
      <Select value={filters.assignee} onChange={(e) => patch({ assignee: e.target.value as ProjectFilterState["assignee"] })}>
        <option value="all">Responsavel</option>
        {ASSIGNEES.map((assignee) => (
          <option key={assignee} value={assignee}>
            {ASSIGNEE_META[assignee].label}
          </option>
        ))}
      </Select>
    </div>
  );
}
