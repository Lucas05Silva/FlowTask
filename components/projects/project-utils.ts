"use client";

import type { Assignee, Project, ProjectStatus, ServiceType } from "@/types";
import { PROJECT_STATUS_META, SERVICE_TYPE_META } from "@/lib/constants";
import { countdownLabel, daysUntil, pct } from "@/lib/utils";

export const PROJECT_STATUS_ORDER: ProjectStatus[] = ["a_fazer", "fazendo", "feito"];
export const SERVICE_TYPES = Object.keys(SERVICE_TYPE_META) as ServiceType[];
export const ASSIGNEES: Assignee[] = ["lucas", "thaiane", "ambos"];

export function projectProgress(project: Project): { done: number; total: number; pct: number } {
  const total = project.steps.length;
  const done = project.steps.filter((s) => s.status === "concluido").length;
  return { done, total, pct: pct(done, total) };
}

export function projectStatusColor(status: ProjectStatus): string {
  if (status === "feito") return "var(--success)";
  if (status === "fazendo") return "var(--brand-purple)";
  return "var(--text-secondary)";
}

export function serviceColor(type: ServiceType): string {
  const colors: Record<ServiceType, string> = {
    landing_page: "var(--cat-flowsys)",
    mklink: "var(--cat-casamento)",
    site: "var(--brand-purple)",
    automacao: "var(--cat-financeiro)",
    agente_ia: "var(--cat-apartamento)",
    trafego_pago: "var(--prio-alta)",
  };
  return colors[type];
}

export function deadlineState(project: Project): {
  label: string;
  color: string;
  overdue: boolean;
} {
  if (project.status === "feito") {
    return { label: "Entregue", color: "var(--success)", overdue: false };
  }
  const days = daysUntil(project.deadline);
  if (days < 0) return { label: "ATRASADO", color: "var(--danger)", overdue: true };
  if (days < 3) return { label: countdownLabel(project.deadline), color: "var(--danger)", overdue: false };
  if (days <= 5) return { label: countdownLabel(project.deadline), color: "var(--prio-alta)", overdue: false };
  return { label: countdownLabel(project.deadline), color: "var(--success)", overdue: false };
}

export function statusLabel(status: ProjectStatus): string {
  return PROJECT_STATUS_META[status].label;
}
