import type { FlowTaskData } from "@/types";

/** yyyy-mm-dd offset from today by `days`. */
function day(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** ISO datetime offset from today by `days`, at `hour`. */
function at(offset: number, hour: number, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

const nowISO = new Date().toISOString();

export const LUCAS_ID = "lucas";
export const THAIANE_ID = "thaiane";

/** Catalogue of all unlockable achievements (prompt §7.4). */
const ACHIEVEMENTS: FlowTaskData["achievements"] = [
  { id: "ach_first_step", key: "primeiro_passo", title: "Primeiro passo", description: "Concluiu a primeira tarefa", icon: "Footprints", xpReward: 20 },
  { id: "ach_week", key: "semana_produtiva", title: "Semana produtiva", description: "7 dias de streak", icon: "CalendarCheck", xpReward: 50 },
  { id: "ach_month", key: "mes_de_fogo", title: "Mês de fogo", description: "30 dias de streak", icon: "Flame", xpReward: 200 },
  { id: "ach_client", key: "cliente_feliz", title: "Cliente feliz", description: "Entregou o primeiro projeto FlowSys", icon: "Smile", xpReward: 100 },
  { id: "ach_machine", key: "maquina_entregas", title: "Máquina de entregas", description: "Entregou 10 projetos", icon: "Rocket", xpReward: 300 },
  { id: "ach_debt_zero", key: "divida_zero", title: "Dívida zero", description: "Quitou uma dívida", icon: "BadgeCheck", xpReward: 100 },
  { id: "ach_saver", key: "poupador", title: "Poupador", description: "Primeira meta financeira atingida", icon: "PiggyBank", xpReward: 150 },
  { id: "ach_nest", key: "ninho_pronto", title: "Ninho pronto", description: "100% dos itens do apê comprados", icon: "Home", xpReward: 200 },
  { id: "ach_iaccept", key: "sim_eu_aceito", title: "Sim, eu aceito", description: "Todas as tarefas do casamento concluídas", icon: "Heart", xpReward: 250 },
  { id: "ach_couple", key: "casal_produtivo", title: "Casal produtivo", description: "Lucas e Thaiane no mesmo nível", icon: "Users", xpReward: 100 },
  { id: "ach_duo", key: "dupla_dinamica", title: "Dupla dinâmica", description: "Ambos com streak ativo de 7+ dias", icon: "Sparkles", xpReward: 150 },
];

export function seedData(): FlowTaskData {
  return {
    weddingDate: day(280),
    users: [
      {
        id: LUCAS_ID,
        email: "lukasoliveira47210@gmail.com",
        name: "Lucas",
        avatarUrl: null,
        avatarEmoji: "🦁",
        xp: 1180,
        level: 5,
        streakCount: 9,
        streakLastDate: day(0),
        themePreference: "system",
        createdAt: nowISO,
      },
      {
        id: THAIANE_ID,
        email: "thaiane@flowtask.app",
        name: "Thaiane",
        avatarUrl: null,
        avatarEmoji: "🦋",
        xp: 940,
        level: 4,
        streakCount: 6,
        streakLastDate: day(0),
        themePreference: "system",
        createdAt: nowISO,
      },
    ],
    tasks: [
      // — Lucas —
      {
        id: "t1", title: "Finalizar LP Incont Care", description: "Última revisão antes de entregar ao cliente.",
        dueDate: day(3), priority: "alta", category: "flowsys", status: "fazendo", assignee: "lucas",
        subtasks: [
          { id: "s1", title: "Hero section", done: true },
          { id: "s2", title: "Seção benefícios", done: true },
          { id: "s3", title: "Formulário de contato", done: false },
          { id: "s4", title: "Responsividade", done: false },
          { id: "s5", title: "Teste cross-browser", done: false },
        ],
        isRecurring: false, recurrenceRule: null, parentTaskId: null, goalId: "g_proj",
        xpReward: 25, order: 0, createdBy: LUCAS_ID, createdAt: nowISO, completedAt: null,
      },
      {
        id: "t2", title: "Estudar Next.js Server Actions", description: "",
        dueDate: day(5), priority: "media", category: "pessoal", status: "a_fazer", assignee: "lucas",
        subtasks: [], isRecurring: false, recurrenceRule: null, parentTaskId: null, goalId: null,
        xpReward: 15, order: 1, createdBy: LUCAS_ID, createdAt: nowISO, completedAt: null,
      },
      {
        id: "t3", title: "Pagar conta de luz", description: "",
        dueDate: day(10), priority: "alta", category: "financeiro", status: "a_fazer", assignee: "lucas",
        subtasks: [], isRecurring: false, recurrenceRule: null, parentTaskId: null, goalId: null,
        xpReward: 25, order: 2, createdBy: LUCAS_ID, createdAt: nowISO, completedAt: null,
      },
      {
        id: "t4", title: "Pesquisar sofás 3 lugares", description: "Retrátil, até R$ 3.500.",
        dueDate: day(15), priority: "media", category: "apartamento", status: "a_fazer", assignee: "lucas",
        subtasks: [], isRecurring: false, recurrenceRule: null, parentTaskId: null, goalId: "g_sofa",
        xpReward: 15, order: 3, createdBy: LUCAS_ID, createdAt: nowISO, completedAt: null,
      },
      {
        id: "t5", title: "Ligar para fotógrafo casamento", description: "Pedir orçamento e disponibilidade.",
        dueDate: day(7), priority: "alta", category: "casamento", status: "a_fazer", assignee: "lucas",
        subtasks: [], isRecurring: false, recurrenceRule: null, parentTaskId: null, goalId: null,
        xpReward: 25, order: 4, createdBy: LUCAS_ID, createdAt: nowISO, completedAt: null,
      },
      // — Thaiane —
      {
        id: "t6", title: "Criar estratégia tráfego pago cliente X", description: "",
        dueDate: day(4), priority: "alta", category: "flowsys", status: "fazendo", assignee: "thaiane",
        subtasks: [
          { id: "s6", title: "Análise de público", done: true },
          { id: "s7", title: "Definir criativos", done: false },
          { id: "s8", title: "Configurar campanhas", done: false },
          { id: "s9", title: "Orçamento", done: false },
        ],
        isRecurring: false, recurrenceRule: null, parentTaskId: null, goalId: null,
        xpReward: 25, order: 5, createdBy: THAIANE_ID, createdAt: nowISO, completedAt: null,
      },
      {
        id: "t7", title: "Organizar lista de convidados", description: "",
        dueDate: day(20), priority: "media", category: "casamento", status: "a_fazer", assignee: "thaiane",
        subtasks: [], isRecurring: false, recurrenceRule: null, parentTaskId: null, goalId: null,
        xpReward: 15, order: 6, createdBy: THAIANE_ID, createdAt: nowISO, completedAt: null,
      },
      {
        id: "t8", title: "Orçar mesa de jantar 6 lugares", description: "",
        dueDate: day(25), priority: "baixa", category: "apartamento", status: "a_fazer", assignee: "thaiane",
        subtasks: [], isRecurring: false, recurrenceRule: null, parentTaskId: null, goalId: null,
        xpReward: 10, order: 7, createdBy: THAIANE_ID, createdAt: nowISO, completedAt: null,
      },
      {
        id: "t9", title: "Conferir fatura do cartão", description: "",
        dueDate: day(1), priority: "urgente", category: "financeiro", status: "a_fazer", assignee: "thaiane",
        subtasks: [], isRecurring: false, recurrenceRule: null, parentTaskId: null, goalId: null,
        xpReward: 50, order: 8, createdBy: THAIANE_ID, createdAt: nowISO, completedAt: null,
      },
      {
        id: "t10", title: "Postar conteúdo FlowSys Instagram", description: "Post semanal de autoridade.",
        dueDate: day(2), priority: "media", category: "flowsys", status: "a_fazer", assignee: "thaiane",
        subtasks: [], isRecurring: true, recurrenceRule: "semanal", parentTaskId: null, goalId: null,
        xpReward: 15, order: 9, createdBy: THAIANE_ID, createdAt: nowISO, completedAt: null,
      },
      // — Ambos —
      {
        id: "t11", title: "Reunião alinhamento semanal FlowSys", description: "",
        dueDate: day(0), priority: "media", category: "flowsys", status: "a_fazer", assignee: "ambos",
        subtasks: [], isRecurring: true, recurrenceRule: "semanal", parentTaskId: null, goalId: null,
        xpReward: 15, order: 10, createdBy: LUCAS_ID, createdAt: nowISO, completedAt: null,
      },
      {
        id: "t12", title: "Visitar apartamento decorado referência", description: "",
        dueDate: day(12), priority: "baixa", category: "apartamento", status: "a_fazer", assignee: "ambos",
        subtasks: [], isRecurring: false, recurrenceRule: null, parentTaskId: null, goalId: null,
        xpReward: 10, order: 11, createdBy: THAIANE_ID, createdAt: nowISO, completedAt: null,
      },
      // — Exemplo concluído (demo de stats/streak) —
      {
        id: "t13", title: "Treino na academia", description: "",
        dueDate: day(0), priority: "baixa", category: "pessoal", status: "concluida", assignee: "lucas",
        subtasks: [], isRecurring: true, recurrenceRule: "diaria", parentTaskId: null, goalId: null,
        xpReward: 10, order: 12, createdBy: LUCAS_ID, createdAt: nowISO, completedAt: at(0, 7),
      },
    ],
    events: [
      { id: "e1", title: "Entrega LP Incont Care", startDatetime: at(0, 18), endDatetime: at(0, 19), category: "flowsys", location: null, notes: "Deadline final", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "e2", title: "Degustação Buffet", startDatetime: at(3, 15), endDatetime: at(3, 17), category: "casamento", location: "Espaço Villa", notes: null, createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "e3", title: "Entrega do sofá", startDatetime: at(6, 10), endDatetime: at(6, 12), category: "apartamento", location: null, notes: null, createdBy: THAIANE_ID, createdAt: nowISO },
    ],
    projects: [
      {
        id: "p1", clientName: "Incont Care", projectName: "LP Incont Care", serviceType: "landing_page",
        status: "fazendo", startDate: day(-12), deadline: day(0), value: 2800, assignee: "lucas",
        steps: [
          { id: "ps1", title: "Briefing", status: "feito", order: 0, completedAt: at(-10, 14) },
          { id: "ps2", title: "Design", status: "feito", order: 1, completedAt: at(-5, 16) },
          { id: "ps3", title: "Desenvolvimento", status: "fazendo", order: 2, completedAt: null },
          { id: "ps4", title: "Deploy + revisão", status: "a_fazer", order: 3, completedAt: null },
        ],
        notes: "Cliente quer foco em conversão.", createdAt: nowISO, completedAt: null,
      },
      {
        id: "p2", clientName: "Rosangela", projectName: "MKlink Rosangela", serviceType: "mklink",
        status: "a_fazer", startDate: day(-2), deadline: day(9), value: 1200, assignee: "ambos",
        steps: [
          { id: "ps5", title: "Coletar links e conteúdo", status: "a_fazer", order: 0, completedAt: null },
          { id: "ps6", title: "Montar página", status: "a_fazer", order: 1, completedAt: null },
        ],
        notes: "", createdAt: nowISO, completedAt: null,
      },
      {
        id: "p3", clientName: "ServTech", projectName: "Site institucional", serviceType: "site",
        status: "feito", startDate: day(-40), deadline: day(-8), value: 4500, assignee: "lucas",
        steps: [
          { id: "ps7", title: "Tudo", status: "feito", order: 0, completedAt: at(-8, 12) },
        ],
        notes: "Entregue e pago.", createdAt: nowISO, completedAt: at(-8, 12),
      },
    ],
    finances: [
      { id: "f1", type: "income", amount: 4500, description: "Projeto ServTech", date: day(-8), category: "FlowSys", tags: ["projeto"], isRecurring: false, recurrenceRule: null, createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "f2", type: "income", amount: 2800, description: "50% LP Incont Care", date: day(-12), category: "FlowSys", tags: [], isRecurring: false, recurrenceRule: null, createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "f3", type: "expense", amount: 1800, description: "Aluguel", date: day(-5), category: "Moradia", tags: ["fixo"], isRecurring: true, recurrenceRule: "mensal", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "f4", type: "expense", amount: 650, description: "Mercado", date: day(-3), category: "Alimentação", tags: [], isRecurring: false, recurrenceRule: null, createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "f5", type: "expense", amount: 1200, description: "Entrada da geladeira", date: day(-2), category: "Apê", tags: ["apartamento"], isRecurring: false, recurrenceRule: null, createdBy: THAIANE_ID, createdAt: nowISO },
    ],
    debts: [
      { id: "d1", name: "Cartão de crédito", totalAmount: 3000, paidAmount: 1800, installmentsRemaining: 4, dueDay: 10, interestRate: 0, status: "ativa", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "d2", name: "Financiamento móveis", totalAmount: 6000, paidAmount: 1500, installmentsRemaining: 9, dueDay: 20, interestRate: 1.99, status: "ativa", createdBy: THAIANE_ID, createdAt: nowISO },
    ],
    goals: [
      { id: "g_proj", title: "Fechar 5 projetos no mês", description: "Meta de faturamento FlowSys", type: "projeto", targetAmount: 5, currentAmount: 3, deadline: day(20), category: null, linkedModule: "projetos", xpReward: 200, status: "em_andamento", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "g_sofa", title: "Sofá novo", description: "Reserva para o sofá da sala", type: "financeira", targetAmount: 3500, currentAmount: 2100, deadline: day(45), category: "apartamento", linkedModule: "financeiro", xpReward: 150, status: "em_andamento", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "g_buffet", title: "Buffet do casamento", description: "Guardar para o buffet", type: "casamento", targetAmount: 15000, currentAmount: 6000, deadline: day(180), category: "casamento", linkedModule: "casamento", xpReward: 150, status: "em_andamento", createdBy: LUCAS_ID, createdAt: nowISO },
    ],
    apartmentItems: [
      { id: "ai1", room: "sala", name: "Sofá 3 lugares", estimatedCost: 3500, actualCost: null, priority: "essencial", status: "pesquisando", purchaseDeadline: day(45), storeLink: null, notes: "", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai2", room: "cozinha", name: "Geladeira", estimatedCost: 4200, actualCost: 4000, priority: "essencial", status: "comprado", purchaseDeadline: null, storeLink: null, notes: "Frost free", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai3", room: "quarto", name: "Cama box queen", estimatedCost: 2500, actualCost: null, priority: "essencial", status: "orcado", purchaseDeadline: day(30), storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "ai4", room: "sala", name: "Smart TV 55\"", estimatedCost: 2800, actualCost: null, priority: "importante", status: "pesquisando", purchaseDeadline: day(60), storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },
    ],
    weddingTasks: [
      { id: "wt1", title: "Escolher local da cerimônia", description: "", deadline: day(30), assignee: "ambos", status: "fazendo", createdAt: nowISO, completedAt: null },
      { id: "wt2", title: "Contratar fotógrafo", description: "", deadline: day(60), assignee: "lucas", status: "a_fazer", createdAt: nowISO, completedAt: null },
      { id: "wt3", title: "Definir lista de convidados", description: "", deadline: day(20), assignee: "thaiane", status: "a_fazer", createdAt: nowISO, completedAt: null },
      { id: "wt4", title: "Reservar data no cartório", description: "", deadline: day(15), assignee: "ambos", status: "concluida", createdAt: nowISO, completedAt: at(-3, 11) },
    ],
    weddingBudget: [
      { id: "wb1", category: "Local", estimatedCost: 8000, actualCost: 0, notes: "" },
      { id: "wb2", category: "Buffet", estimatedCost: 15000, actualCost: 0, notes: "" },
      { id: "wb3", category: "Fotografia/Vídeo", estimatedCost: 5000, actualCost: 0, notes: "" },
      { id: "wb4", category: "Decoração", estimatedCost: 4000, actualCost: 0, notes: "" },
      { id: "wb5", category: "Vestuário", estimatedCost: 6000, actualCost: 1500, notes: "Sinal do ateliê" },
    ],
    weddingVendors: [
      { id: "wv1", name: "Studio Luz & Arte", service: "Fotografia", contactPhone: "(11) 90000-0000", contactEmail: null, quotedValue: 5000, status: "orcado", notes: "" },
      { id: "wv2", name: "Espaço Villa", service: "Local + Buffet", contactPhone: "(11) 91111-1111", contactEmail: "contato@villa.com", quotedValue: 22000, status: "pesquisando", notes: "Degustação marcada" },
    ],
    achievements: ACHIEVEMENTS,
    userAchievements: [
      { id: "ua1", userId: LUCAS_ID, achievementId: "ach_first_step", unlockedAt: at(-20, 9) },
      { id: "ua2", userId: LUCAS_ID, achievementId: "ach_client", unlockedAt: at(-8, 12) },
      { id: "ua3", userId: LUCAS_ID, achievementId: "ach_week", unlockedAt: at(-2, 10) },
      { id: "ua4", userId: THAIANE_ID, achievementId: "ach_first_step", unlockedAt: at(-18, 9) },
    ],
    notifications: [
      { id: "n1", userId: LUCAS_ID, type: "prazo", title: "Entrega hoje", message: "LP Incont Care vence hoje", isRead: false, createdAt: at(0, 8) },
      { id: "n2", userId: LUCAS_ID, type: "divida", title: "Dívida vencendo", message: "Cartão de crédito vence em 5 dias", isRead: false, createdAt: at(0, 8) },
      { id: "n3", userId: THAIANE_ID, type: "conquista", title: "Conquista!", message: "Você desbloqueou Primeiro passo", isRead: true, createdAt: at(-18, 9) },
    ],
  };
}
