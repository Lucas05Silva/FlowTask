/* ===========================================================================
   FlowTask — Domain types (mirror of Supabase schema, prompt §9)
   Used by the mock data layer now; same shapes will back Supabase later.
   =========================================================================== */

export type ID = string;

/** Shared category used across tasks, calendar and finance. */
export type Category =
  | "flowsys"
  | "pessoal"
  | "apartamento"
  | "casamento"
  | "financeiro";

export type Priority = "baixa" | "media" | "alta" | "urgente";

export type TaskStatus = "a_fazer" | "fazendo" | "concluida";
export type ProjectStatus = "a_fazer" | "fazendo" | "feito";

export type Assignee = "lucas" | "thaiane" | "ambos";

export type ThemePreference = "light" | "dark" | "system";

export type RecurrenceRule = "diaria" | "semanal" | "mensal" | "personalizada";

export type ServiceType =
  | "landing_page"
  | "mklink"
  | "site"
  | "automacao"
  | "agente_ia"
  | "trafego_pago";

/* --------------------------------------------------------------------------- */

export interface User {
  id: ID;
  email: string;
  name: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
  xp: number;
  level: number;
  streakCount: number;
  streakRecord: number;
  streakLastDate: string | null;
  themePreference: ThemePreference;
  createdAt: string;
}

export interface Subtask {
  id: ID;
  title: string;
  done: boolean;
}

export interface Task {
  id: ID;
  title: string;
  description: string;
  dueDate: string | null;
  priority: Priority;
  category: Category;
  status: TaskStatus;
  assignee: Assignee;
  subtasks: Subtask[];
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  parentTaskId: ID | null;
  goalId: ID | null;
  goalContributionType?: GoalContributionType;
  goalContributionValue?: number;
  xpReward: number;
  order: number;
  createdBy: ID;
  createdAt: string;
  completedAt: string | null;
}

export interface CalendarEvent {
  id: ID;
  title: string;
  startDatetime: string;
  endDatetime: string;
  category: Category;
  location: string | null;
  notes: string | null;
  isAllDay: boolean;
  createdBy: ID;
  createdAt: string;
}

export type StepStatus = "pendente" | "concluido";

export interface ProjectStep {
  id: ID;
  title: string;
  status: StepStatus;
  order: number;
  completedAt: string | null;
}

export interface Project {
  id: ID;
  clientName: string;
  projectName: string;
  serviceType: ServiceType;
  status: ProjectStatus;
  startDate: string;
  deadline: string;
  value: number;
  assignee: Assignee;
  steps: ProjectStep[];
  notes: string;
  createdAt: string;
  completedAt: string | null;
}

export type FinanceType = "income" | "expense";
export type FinanceRecurrenceRule = "mensal" | "semanal" | "anual";
export type IncomeCategory = "flowsys" | "freelance" | "salario" | "investimentos" | "outros";
export type ExpenseCategory =
  | "moradia"
  | "alimentacao"
  | "transporte"
  | "lazer"
  | "saude"
  | "apartamento"
  | "casamento"
  | "flowsys_custo"
  | "educacao"
  | "outros";
export type FinanceCategory = IncomeCategory | ExpenseCategory;
export type FinancialGoalCategory =
  | "apartamento"
  | "casamento"
  | "reserva_emergencia"
  | "viagem"
  | "investimento"
  | "outros";

export interface FinanceEntry {
  id: ID;
  type: FinanceType;
  amount: number;
  description: string;
  date: string;
  category: FinanceCategory;
  tags: string[];
  isRecurring: boolean;
  recurrenceRule: FinanceRecurrenceRule | null;
  createdBy: ID;
  createdAt: string;
}

export type DebtStatus = "ativa" | "quitada";

export interface Debt {
  id: ID;
  name: string;
  totalAmount: number;
  paidAmount: number;
  installmentsTotal: number;
  installmentsPaid: number;
  dueDay: number;
  interestRate: number | null;
  status: DebtStatus;
  notes: string;
  createdBy: ID;
  createdAt: string;
  paidAt: string | null;
}

export type GoalType =
  | "financeira"
  | "projeto"
  | "pessoal"
  | "apartamento"
  | "casamento";

export type GoalContributionType = "count" | "value" | "checklist";
export type GoalStatus = "em_andamento" | "concluida" | "atrasada";
export interface GoalCheckItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: ID;
  title: string;
  description: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  unit?: string;
  checklist?: GoalCheckItem[];
  deadline: string | null;
  category: string | null;
  linkedModule: string | null;
  linkedId?: string | null;
  xpReward: number;
  status: GoalStatus;
  createdBy: ID;
  createdAt: string;
  completedAt: string | null;
  contributionType?: GoalContributionType;
  contributionValuePerTask?: number;
}

export type Room =
  | "sala"
  | "quarto"
  | "cozinha"
  | "banheiro"
  | "lavanderia"
  | "escritorio";

export type ItemPriority = "essencial" | "importante" | "desejavel";
export type ItemStatus = "pesquisando" | "orcado" | "comprado" | "entregue";

export interface ApartmentItem {
  id: ID;
  room: string;
  name: string;
  estimatedCost: number;
  actualCost: number | null;
  priority: ItemPriority;
  status: ItemStatus;
  purchaseDeadline: string | null;
  storeLink: string | null;
  notes: string;
  createdBy: ID;
  createdAt: string;
}

export interface WeddingTask {
  id: ID;
  title: string;
  description: string;
  deadline: string | null;
  assignee: Assignee;
  status: TaskStatus;
  category: string;
  createdAt: string;
  completedAt: string | null;
}

export type VendorStatus = "pesquisando" | "orcado" | "contratado" | "pago";

export interface WeddingBudgetItem {
  id: ID;
  category: string;
  estimatedCost: number;
  actualCost: number;
  notes: string;
}

export interface WeddingVendor {
  id: ID;
  name: string;
  service: string;
  contactPhone: string | null;
  contactEmail: string | null;
  quotedValue: number;
  status: VendorStatus;
  notes: string;
}

export interface Achievement {
  id: ID;
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface UserAchievement {
  id: ID;
  userId: ID;
  achievementId: ID;
  unlockedAt: string;
}

export type NotificationType =
  | "prazo"
  | "atrasado"
  | "divida"
  | "meta"
  | "conquista"
  | "levelup"
  | "streak"
  | "info";

export interface AppNotification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  icon?: string;
  createdAt: string;
}

/* --- Task Prompts (Cofre de Prompts, Fase 11) --- */

export interface PromptVariable {
  key: string; // e.g. "nome_cliente" (without braces)
  label: string; // display label, e.g. "Nome do Cliente"
  defaultValue?: string; // optional default
  currentValue?: string; // filled by the user before copying (not persisted)
}

export interface PromptUsage {
  id: ID;
  usedBy: ID;
  usedAt: string;
  variablesUsed: Record<string, string>;
}

export interface TaskPrompt {
  id: ID;
  taskId: ID;
  title: string;
  description?: string;
  category: string;
  content: string; // prompt text with {variavel} tokens
  variables: PromptVariable[];
  usageHistory: PromptUsage[];
  createdBy: ID;
  createdAt: string;
  updatedAt: string;
  updatedBy?: ID;
}

export interface Note {
  id: string;
  title?: string;
  content: string;
  color: "default" | "purple" | "cyan" | "amber" | "pink" | "green";
  isPinned: boolean;
  isShared: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/* --- Investimentos (Fase 15) ---------------------------------------------- */

/** Supported investment vehicles. */
export type InvestmentType =
  | "tesouro_selic"
  | "tesouro_ipca"
  | "tesouro_prefixado"
  | "cdb"
  | "lci_lca"
  | "fii"
  | "acao"
  | "crypto"
  | "poupanca"
  | "outro";

/** Yield indexer. */
export type IndexType = "selic" | "ipca" | "cdi" | "prefixado" | "nenhum";

export type InvestmentLiquidity = "diaria" | "no_vencimento" | "carencia";

/** A single investment position owned by a user (Lucas/Thaiane independent). */
export interface Investment {
  id: ID;
  userId: ID; // owner
  name: string; // ex: "Tesouro Selic 2027", "CDB Nubank"
  type: InvestmentType;
  index: IndexType;
  rate: number; // extra rate (ex: IPCA + 6.5 → rate = 6.5)
  investedAmount: number; // total contributed (sum of contributions)
  currentValue: number; // estimated current value (auto-calculated)
  purchaseDate: string; // date of the first contribution (yyyy-mm-dd)
  maturityDate?: string | null; // vencimento (null for daily liquidity)
  liquidity: InvestmentLiquidity;
  liquidityDays?: number | null; // carência in days (if applicable)
  isEmergencyFund: boolean; // part of the emergency reserve
  goalId?: ID | null; // linked Metas goal (optional)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Individual contribution (deposit history) for an investment. */
export interface InvestmentContribution {
  id: ID;
  investmentId: ID;
  userId: ID;
  amount: number;
  date: string; // yyyy-mm-dd
  notes?: string;
  createdAt: string;
}

/** Monthly patrimony snapshot (for the evolution chart). */
export interface PatrimonySnapshot {
  id: ID;
  userId: ID;
  month: string; // "YYYY-MM"
  totalInvested: number;
  totalCurrent: number;
  snapshotAt: string;
}

/** Top-level shape of the mock store persisted to localStorage. */
export interface FlowTaskData {
  users: User[];
  tasks: Task[];
  events: CalendarEvent[];
  projects: Project[];
  finances: FinanceEntry[];
  debts: Debt[];
  goals: Goal[];
  apartmentItems: ApartmentItem[];
  weddingTasks: WeddingTask[];
  weddingBudget: WeddingBudgetItem[];
  weddingVendors: WeddingVendor[];
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  notifications: AppNotification[];
  taskPrompts: TaskPrompt[];
  notes: Note[];
  investments: Investment[];
  investmentContributions: InvestmentContribution[];
  patrimonySnapshots: PatrimonySnapshot[];
  weddingDate: string | null;
  weddingVenueName?: string | null;
  weddingVenueAddress?: string | null;
}
