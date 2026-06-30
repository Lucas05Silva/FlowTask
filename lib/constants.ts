import type {
  Category,
  Priority,
  TaskStatus,
  ProjectStatus,
  ServiceType,
  Assignee,
} from "@/types";

/** Category metadata — label + the CSS var color token. */
export const CATEGORY_META: Record<Category, { label: string; color: string; dot: string }> = {
  flowsys: { label: "FlowSys", color: "var(--cat-flowsys)", dot: "bg-cat-flowsys" },
  pessoal: { label: "Pessoal", color: "var(--cat-pessoal)", dot: "bg-cat-pessoal" },
  apartamento: { label: "Apartamento", color: "var(--cat-apartamento)", dot: "bg-cat-apartamento" },
  casamento: { label: "Casamento", color: "var(--cat-casamento)", dot: "bg-cat-casamento" },
  financeiro: { label: "Financeiro", color: "var(--cat-financeiro)", dot: "bg-cat-financeiro" },
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; weight: number }
> = {
  baixa: { label: "Baixa", color: "var(--prio-baixa)", weight: 0 },
  media: { label: "Média", color: "var(--prio-media)", weight: 1 },
  alta: { label: "Alta", color: "var(--prio-alta)", weight: 2 },
  urgente: { label: "Urgente", color: "var(--prio-urgente)", weight: 3 },
};

export const TASK_STATUS_META: Record<TaskStatus, { label: string }> = {
  a_fazer: { label: "A fazer" },
  fazendo: { label: "Fazendo" },
  concluida: { label: "Concluída" },
};

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string }> = {
  a_fazer: { label: "A fazer" },
  fazendo: { label: "Fazendo" },
  feito: { label: "Feito" },
};

export const SERVICE_TYPE_META: Record<ServiceType, { label: string }> = {
  landing_page: { label: "Landing Page" },
  mklink: { label: "MKlink" },
  site: { label: "Site" },
  automacao: { label: "Automação" },
  agente_ia: { label: "Agente de IA" },
  trafego_pago: { label: "Tráfego Pago" },
};

export const ASSIGNEE_META: Record<Assignee, { label: string }> = {
  lucas: { label: "Lucas" },
  thaiane: { label: "Thaiane" },
  ambos: { label: "Ambos" },
};
