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
  | "exterior"
  | "outro";

/** Yield indexer. */
export type IndexType = "selic" | "ipca" | "cdi" | "prefixado" | "nenhum";

export type InvestmentLiquidity = "diaria" | "no_vencimento" | "carencia";

/** Risk level of an investment position. */
export type RiskLevel = "baixo" | "medio" | "alto";

/** Who a contribution is attributed to (shared portfolio). */
export type Contributor = "lucas" | "thaiane" | "ambos";

/** A single investment position in the shared couple portfolio. */
export interface Investment {
  id: ID;
  userId: ID; // who created the record (audit; portfolio is shared)
  name: string; // ex: "Tesouro Selic 2031", "Caixinha Nubank"
  type: InvestmentType;
  index: IndexType;
  rate: number; // extra rate (ex: IPCA + 6.5 → rate = 6.5; CDB → 100 = 100% do CDI)
  investedAmount: number; // total contributed (sum of contributions)
  currentValue: number; // estimated current value (auto-calculated)
  purchaseDate: string; // date of the first contribution (yyyy-mm-dd)
  maturityDate?: string | null; // vencimento (null for daily liquidity)
  liquidity: InvestmentLiquidity;
  liquidityDays?: number | null; // carência in days (if applicable)
  isEmergencyFund: boolean; // part of the emergency reserve
  goalId?: ID | null; // linked Metas goal (optional)
  institution?: string; // ex: "Tesouro Nacional", "Nubank"
  allocationPercent?: number | null; // target monthly allocation (60 / 15 / 25)
  unitPrice?: number | null; // price per cota/unit (ex: 199.43)
  riskLevel?: RiskLevel | null;
  isPlaceholder?: boolean; // reserved vehicle not defined yet (ex: Exterior)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Individual contribution (deposit history) for an investment. */
export interface InvestmentContribution {
  id: ID;
  investmentId: ID;
  userId: ID; // who recorded it
  contributor?: Contributor; // who the money is attributed to
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

/* --- Canadá (Fase 16) ------------------------------------------------------ */

export type CanadaDecisionCategory = "cidade" | "visto" | "prazo" | "moradia" | "trabalho" | "outro";
export type CanadaDecisionStatus = "pendente" | "pesquisando" | "decidido";

/** A pending/answered planning decision (e.g. "Qual cidade vamos morar?"). */
export interface CanadaDecision {
  id: ID;
  category: CanadaDecisionCategory;
  question: string;
  answer: string | null; // null = ainda não decidido
  status: CanadaDecisionStatus;
  notes?: string;
  decidedAt: string | null;
  createdAt: string;
}

export type CanadaDocumentCategory = "passaporte" | "visto" | "civil" | "financeiro" | "outro";
export type CanadaDocumentStatus = "pendente" | "em_andamento" | "concluido" | "nao_aplicavel";

/** A document needed for the immigration process, owned by Lucas/Thaiane/ambos. */
export interface CanadaDocument {
  id: ID;
  name: string;
  owner: Assignee;
  category: CanadaDocumentCategory;
  status: CanadaDocumentStatus;
  expiryDate: string | null;
  deadline: string | null;
  notes?: string;
  completedAt: string | null;
  createdAt: string;
}

/** 'estudos' is reused for the LinkedIn/career checklist (Aba Estudos). */
export type CanadaChecklistCategory = "brasil" | "chegada" | "instalacao" | "estudos";
export type CanadaChecklistStatus = "pendente" | "concluido";
export type CanadaChecklistPriority = "baixa" | "media" | "alta";

export interface CanadaChecklistItem {
  id: ID;
  category: CanadaChecklistCategory;
  title: string;
  description?: string;
  assignedTo: Assignee;
  status: CanadaChecklistStatus;
  priority: CanadaChecklistPriority;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

/** A researched city candidate (comparator in Aba Logística). */
export interface CanadaCity {
  id: ID;
  name: string;
  province: string;
  pros: string[];
  cons: string[];
  avgRent1br: number | null; // CAD
  notes?: string;
  isFavorite: boolean;
  isChosen: boolean;
  createdAt: string;
}

export type CanadaNoteCategory = "visto" | "cidade" | "trabalho" | "moradia" | "geral";

/** A freeform research note (also used for career/English-level entries). */
export interface CanadaNote {
  id: ID;
  title: string;
  content: string;
  category: CanadaNoteCategory;
  createdBy: ID;
  createdAt: string;
}

/* --- Minha Renda (Fase 15B) ----------------------------------------------- */

export type IncomeSourceType = "fixo" | "variavel" | "beneficio";

export interface IncomeSource {
  id: string;
  label: string;
  type: IncomeSourceType;
  amount: number; // monthly value
  active: boolean;
  note?: string;
}

/** Personal income profile (one row per user — id equals userId). */
export interface IncomeProfile {
  id: ID; // = userId (singleton per user)
  userId: ID;
  sources: IncomeSource[];
  monthlyExpenses: number; // legacy fixed value — expenses are now itemized (see MonthlyExpense)
  investmentGoalPct: number; // % of fixed income to invest
  flowsysInvestmentPct: number; // % of the Flowsys source to invest
  showExpensesDetail?: boolean;
  updatedAt: string;
}

/* --- Gastos mensais (Fase 15C) -------------------------------------------- */

export type MonthlyExpenseCategory =
  | "moradia"
  | "alimentacao"
  | "transporte"
  | "saude"
  | "educacao"
  | "lazer"
  | "cartao"
  | "financiamento"
  | "assinatura"
  | "investimento"
  | "outro";

export type ExpenseRecurrence = "mensal" | "parcelado" | "eventual";

/** An itemized monthly expense in the personal budget. */
export interface MonthlyExpense {
  id: ID;
  userId: ID;
  name: string;
  category: MonthlyExpenseCategory;
  amount: number;
  recurrence: ExpenseRecurrence;
  installmentsTotal?: number | null;
  installmentsPaid: number;
  dueDay?: number | null; // 1–31
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** A snapshot of total income for a given month (edit history). */
export interface IncomeHistoryEntry {
  id: ID;
  userId: ID;
  month: string; // "YYYY-MM"
  totalFixed: number;
  totalVariable: number;
  note?: string;
  createdAt: string;
}

/** Top-level shape of the mock store persisted to localStorage. */
export interface FlowTaskData {
  users: User[];
  tasks: Task[];
  projects: Project[];
  finances: FinanceEntry[];
  debts: Debt[];
  goals: Goal[];
  weddingTasks: WeddingTask[];
  weddingBudget: WeddingBudgetItem[];
  weddingVendors: WeddingVendor[];
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  taskPrompts: TaskPrompt[];
  notes: Note[];
  investments: Investment[];
  investmentContributions: InvestmentContribution[];
  patrimonySnapshots: PatrimonySnapshot[];
  incomeProfiles: IncomeProfile[];
  incomeHistory: IncomeHistoryEntry[];
  monthlyExpenses: MonthlyExpense[];
  canadaDecisions: CanadaDecision[];
  canadaDocuments: CanadaDocument[];
  canadaChecklist: CanadaChecklistItem[];
  canadaCities: CanadaCity[];
  canadaNotes: CanadaNote[];
  weddingDate: string | null;
  weddingVenueName?: string | null;
  weddingVenueAddress?: string | null;
}
