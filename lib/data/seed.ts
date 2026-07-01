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

/** Local (no-Z) ISO datetime for a day offset + time, e.g. "2026-07-03T14:00:00". */
function dt(offset: number, hour: number, min = 0): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${day(offset)}T${pad(hour)}:${pad(min)}:00`;
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
    weddingDate: null,
    weddingVenueName: null,
    weddingVenueAddress: null,
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
      { id: "e1", title: "Reunião com cliente Incont Care", startDatetime: dt(3, 14, 0), endDatetime: dt(3, 15, 0), category: "flowsys", location: "Google Meet", notes: null, isAllDay: false, createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "e2", title: "Aniversário da mãe do Lucas", startDatetime: dt(8, 0, 0), endDatetime: dt(8, 23, 59), category: "pessoal", location: null, notes: null, isAllDay: true, createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "e3", title: "Visita ao salão de festas", startDatetime: dt(12, 10, 0), endDatetime: dt(12, 12, 0), category: "casamento", location: "Rua das Flores, 123", notes: null, isAllDay: false, createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "e4", title: "Entrega da geladeira", startDatetime: dt(18, 9, 0), endDatetime: dt(18, 12, 0), category: "apartamento", location: "Apartamento", notes: null, isAllDay: false, createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "e5", title: "Consulta dentista Thaiane", startDatetime: dt(22, 16, 0), endDatetime: dt(22, 17, 0), category: "pessoal", location: null, notes: null, isAllDay: false, createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "e6", title: "Call alinhamento tráfego pago", startDatetime: dt(5, 11, 0), endDatetime: dt(5, 11, 30), category: "flowsys", location: null, notes: null, isAllDay: false, createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "e7", title: "Churrasco com amigos", startDatetime: dt(26, 12, 0), endDatetime: dt(26, 18, 0), category: "pessoal", location: "Casa do Pedro", notes: null, isAllDay: false, createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "e8", title: "Feira de móveis planejados", startDatetime: dt(19, 14, 0), endDatetime: dt(19, 17, 0), category: "apartamento", location: "Expo Center", notes: null, isAllDay: false, createdBy: LUCAS_ID, createdAt: nowISO },
    ],
    projects: [
      {
        id: "p1", clientName: "Incont Care", projectName: "Landing Page Institucional", serviceType: "landing_page",
        status: "fazendo", startDate: day(-10), deadline: day(10), value: 2500, assignee: "lucas",
        steps: [
          { id: "ps1", title: "Briefing", status: "concluido", order: 0, completedAt: at(-9, 14) },
          { id: "ps2", title: "Wireframe", status: "concluido", order: 1, completedAt: at(-6, 16) },
          { id: "ps3", title: "Design", status: "pendente", order: 2, completedAt: null },
          { id: "ps4", title: "Desenvolvimento", status: "pendente", order: 3, completedAt: null },
          { id: "ps5", title: "Testes", status: "pendente", order: 4, completedAt: null },
          { id: "ps6", title: "Deploy", status: "pendente", order: 5, completedAt: null },
        ],
        notes: "Cliente quer foco em conversão.", createdAt: nowISO, completedAt: null,
      },
      {
        id: "p2", clientName: "Rosangela Coaching", projectName: "MKlink Bio", serviceType: "mklink",
        status: "fazendo", startDate: day(-5), deadline: day(5), value: 800, assignee: "thaiane",
        steps: [
          { id: "ps7", title: "Briefing", status: "concluido", order: 0, completedAt: at(-4, 10) },
          { id: "ps8", title: "Conteúdo", status: "concluido", order: 1, completedAt: at(-2, 11) },
          { id: "ps9", title: "Design", status: "pendente", order: 2, completedAt: null },
          { id: "ps10", title: "Publicação", status: "pendente", order: 3, completedAt: null },
        ],
        notes: "", createdAt: nowISO, completedAt: null,
      },
      {
        id: "p3", clientName: "Dr. Marcos Ortopedia", projectName: "Site Completo", serviceType: "site",
        status: "a_fazer", startDate: day(1), deadline: day(30), value: 4500, assignee: "ambos",
        steps: [
          { id: "ps11", title: "Briefing", status: "pendente", order: 0, completedAt: null },
          { id: "ps12", title: "Wireframe", status: "pendente", order: 1, completedAt: null },
          { id: "ps13", title: "Design", status: "pendente", order: 2, completedAt: null },
          { id: "ps14", title: "Desenvolvimento Front", status: "pendente", order: 3, completedAt: null },
          { id: "ps15", title: "Desenvolvimento Back", status: "pendente", order: 4, completedAt: null },
          { id: "ps16", title: "Testes", status: "pendente", order: 5, completedAt: null },
          { id: "ps17", title: "Deploy", status: "pendente", order: 6, completedAt: null },
        ],
        notes: "", createdAt: nowISO, completedAt: null,
      },
      {
        id: "p4", clientName: "Padaria Bella Massa", projectName: "Automação WhatsApp", serviceType: "automacao",
        status: "a_fazer", startDate: day(5), deadline: day(20), value: 1800, assignee: "lucas",
        steps: [
          { id: "ps18", title: "Mapeamento de fluxos", status: "pendente", order: 0, completedAt: null },
          { id: "ps19", title: "Configuração", status: "pendente", order: 1, completedAt: null },
          { id: "ps20", title: "Testes", status: "pendente", order: 2, completedAt: null },
          { id: "ps21", title: "Treinamento", status: "pendente", order: 3, completedAt: null },
        ],
        notes: "", createdAt: nowISO, completedAt: null,
      },
      {
        id: "p5", clientName: "Studio Pilates Vida", projectName: "Tráfego Pago Google/Meta", serviceType: "trafego_pago",
        status: "fazendo", startDate: day(-15), deadline: day(15), value: 1200, assignee: "thaiane",
        steps: [
          { id: "ps22", title: "Análise de público", status: "concluido", order: 0, completedAt: at(-13, 10) },
          { id: "ps23", title: "Criativos", status: "concluido", order: 1, completedAt: at(-10, 15) },
          { id: "ps24", title: "Campanhas Google", status: "pendente", order: 2, completedAt: null },
          { id: "ps25", title: "Campanhas Meta", status: "pendente", order: 3, completedAt: null },
          { id: "ps26", title: "Otimização", status: "pendente", order: 4, completedAt: null },
        ],
        notes: "Contrato mensal recorrente.", createdAt: nowISO, completedAt: null,
      },
      {
        id: "p6", clientName: "Fut Palhano", projectName: "Landing Page Torneio", serviceType: "landing_page",
        status: "feito", startDate: day(-29), deadline: day(-15), value: 2000, assignee: "lucas",
        steps: [
          { id: "ps27", title: "Briefing", status: "concluido", order: 0, completedAt: at(-28, 10) },
          { id: "ps28", title: "Design", status: "concluido", order: 1, completedAt: at(-24, 14) },
          { id: "ps29", title: "Desenvolvimento", status: "concluido", order: 2, completedAt: at(-20, 16) },
          { id: "ps30", title: "Deploy", status: "concluido", order: 3, completedAt: at(-16, 11) },
        ],
        notes: "Entregue no prazo.", createdAt: nowISO, completedAt: at(-16, 11),
      },
    ],
    finances: [
      { id: "f1", type: "income", amount: 2000, description: "Projeto LP Fut Palhano", date: day(-17), category: "flowsys", tags: [], isRecurring: false, recurrenceRule: null, createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "f2", type: "income", amount: 1200, description: "Mensalidade tráfego Studio Pilates", date: day(0), category: "flowsys", tags: [], isRecurring: true, recurrenceRule: "mensal", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "f3", type: "income", amount: 600, description: "Freelance design social media", date: day(-11), category: "freelance", tags: [], isRecurring: false, recurrenceRule: null, createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "f4", type: "income", amount: 800, description: "Projeto MKlink Rosangela", date: day(-3), category: "flowsys", tags: [], isRecurring: false, recurrenceRule: null, createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "f5", type: "expense", amount: 1500, description: "Aluguel", date: day(4), category: "moradia", tags: ["fixo"], isRecurring: true, recurrenceRule: "mensal", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "f6", type: "expense", amount: 450, description: "Mercado semanal", date: day(-9), category: "alimentacao", tags: [], isRecurring: false, recurrenceRule: null, createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "f7", type: "expense", amount: 250, description: "Gasolina", date: day(-13), category: "transporte", tags: [], isRecurring: false, recurrenceRule: null, createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "f8", type: "expense", amount: 70, description: "Netflix + Spotify", date: day(-16), category: "lazer", tags: ["fixo"], isRecurring: true, recurrenceRule: "mensal", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "f9", type: "expense", amount: 30, description: "Curso Next.js Udemy", date: day(-21), category: "educacao", tags: [], isRecurring: false, recurrenceRule: null, createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "f10", type: "expense", amount: 180, description: "Jantar aniversário", date: day(-6), category: "lazer", tags: [], isRecurring: false, recurrenceRule: null, createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "f11", type: "expense", amount: 95, description: "Farmácia", date: day(-19), category: "saude", tags: [], isRecurring: false, recurrenceRule: null, createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "f12", type: "expense", amount: 45, description: "Domínio + hosting FlowSys", date: day(-30), category: "flowsys_custo", tags: ["fixo"], isRecurring: true, recurrenceRule: "mensal", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "f13", type: "expense", amount: 85, description: "Uber", date: day(-11), category: "transporte", tags: [], isRecurring: false, recurrenceRule: null, createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "f14", type: "expense", amount: 120, description: "iFood", date: day(-8), category: "alimentacao", tags: [], isRecurring: false, recurrenceRule: null, createdBy: THAIANE_ID, createdAt: nowISO },
    ],
    debts: [
      { id: "d1", name: "Cartão Nubank", totalAmount: 3200, paidAmount: 1600, installmentsTotal: 8, installmentsPaid: 4, dueDay: 10, interestRate: 0, status: "ativa", notes: "", createdBy: LUCAS_ID, createdAt: nowISO, paidAt: null },
      { id: "d2", name: "Empréstimo pessoal", totalAmount: 5000, paidAmount: 2000, installmentsTotal: 10, installmentsPaid: 4, dueDay: 15, interestRate: 1.5, status: "ativa", notes: "", createdBy: THAIANE_ID, createdAt: nowISO, paidAt: null },
      { id: "d3", name: "Financiamento notebook", totalAmount: 4800, paidAmount: 3200, installmentsTotal: 12, installmentsPaid: 8, dueDay: 20, interestRate: 0, status: "ativa", notes: "", createdBy: LUCAS_ID, createdAt: nowISO, paidAt: null },
    ],
    goals: [
      { id: "g_proj", title: "Fechar 5 projetos no mês", description: "Meta de faturamento FlowSys", type: "projeto", targetAmount: 5, currentAmount: 3, deadline: day(20), category: null, linkedModule: "projetos", xpReward: 200, status: "em_andamento", createdBy: LUCAS_ID, createdAt: nowISO, completedAt: null },
      { id: "g_sofa", title: "Sofá 3 lugares", description: "Reserva para o sofá da sala", type: "financeira", targetAmount: 3500, currentAmount: 1200, deadline: day(90), category: "apartamento", linkedModule: "apartamento", xpReward: 150, status: "em_andamento", createdBy: THAIANE_ID, createdAt: nowISO, completedAt: null },
      { id: "g_buffet", title: "Reserva para buffet", description: "Guardar para o buffet", type: "financeira", targetAmount: 8000, currentAmount: 2500, deadline: day(183), category: "casamento", linkedModule: "casamento", xpReward: 150, status: "em_andamento", createdBy: LUCAS_ID, createdAt: nowISO, completedAt: null },
      { id: "g_emergency", title: "Reserva de emergência", description: "Reserva de segurança", type: "financeira", targetAmount: 10000, currentAmount: 4300, deadline: day(365), category: "reserva_emergencia", linkedModule: null, xpReward: 150, status: "em_andamento", createdBy: LUCAS_ID, createdAt: nowISO, completedAt: null },
      { id: "g_fridge", title: "Geladeira nova", description: "Nova geladeira para a cozinha", type: "financeira", targetAmount: 4000, currentAmount: 4000, deadline: day(-1), category: "apartamento", linkedModule: "apartamento", xpReward: 150, status: "concluida", createdBy: THAIANE_ID, createdAt: nowISO, completedAt: at(-11, 12) },
      
      { id: "g_seed_1", title: "Entregar 5 projetos este mês", description: "Entregas da FlowSys no prazo", type: "projeto", targetAmount: 5, currentAmount: 2, unit: "projetos", deadline: "2026-07-31", category: null, linkedModule: "projetos", xpReward: 100, status: "em_andamento", createdBy: LUCAS_ID, createdAt: nowISO, completedAt: null },
      {
        id: "g_seed_2",
        title: "Estudar 1h por dia",
        description: "Manter o ritmo de estudos diários",
        type: "pessoal",
        targetAmount: 7,
        currentAmount: 2,
        unit: "dias",
        checklist: [
          { id: "ci1", title: "Segunda", completed: true },
          { id: "ci2", title: "Terça", completed: true },
          { id: "ci3", title: "Quarta", completed: false },
          { id: "ci4", title: "Quinta", completed: false },
          { id: "ci5", title: "Sexta", completed: false },
          { id: "ci6", title: "Sábado", completed: false },
          { id: "ci7", title: "Domingo", completed: false }
        ],
        deadline: day(6),
        category: null,
        linkedModule: null,
        xpReward: 50,
        status: "em_andamento",
        createdBy: LUCAS_ID,
        createdAt: nowISO,
        completedAt: null
      },
      {
        id: "g_seed_3",
        title: "Mobiliar sala completa",
        description: "Itens prioritários da sala do apartamento",
        type: "apartamento",
        targetAmount: 5,
        currentAmount: 0,
        unit: "itens",
        checklist: [
          { id: "ci8", title: "Sofá", completed: false },
          { id: "ci9", title: "Mesa centro", completed: false },
          { id: "ci10", title: "Rack TV", completed: false },
          { id: "ci11", title: "Tapete", completed: false },
          { id: "ci12", title: "Cortina", completed: false }
        ],
        deadline: "2026-09-30",
        category: "apartamento",
        linkedModule: "apartamento",
        xpReward: 80,
        status: "em_andamento",
        createdBy: THAIANE_ID,
        createdAt: nowISO,
        completedAt: null
      },
      { id: "g_seed_4", title: "Definir 3 fornecedores do casamento", description: "Orçar e assinar contratos", type: "casamento", targetAmount: 3, currentAmount: 0, unit: "fornecedores", deadline: "2026-08-31", category: "casamento", linkedModule: "casamento", xpReward: 60, status: "em_andamento", createdBy: THAIANE_ID, createdAt: nowISO, completedAt: null },
      { id: "g_seed_5", title: "Fazer exercício 4x por semana", description: "Academia, corrida ou esportes", type: "pessoal", targetAmount: 4, currentAmount: 1, unit: "treinos", deadline: day(5), category: null, linkedModule: null, xpReward: 30, status: "em_andamento", createdBy: LUCAS_ID, createdAt: nowISO, completedAt: null }
    ],
    apartmentItems: [
      // Sala
      { id: "ai_s1", room: "sala", name: "Sofá 3 lugares retrátil", estimatedCost: 3500, actualCost: null, priority: "essencial", status: "pesquisando", purchaseDeadline: "2026-09-30", storeLink: null, notes: "", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai_s2", room: "sala", name: "Mesa de centro", estimatedCost: 600, actualCost: null, priority: "importante", status: "pesquisando", purchaseDeadline: "2026-09-30", storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "ai_s3", room: "sala", name: "Rack para TV 65'", estimatedCost: 1200, actualCost: null, priority: "essencial", status: "orcado", purchaseDeadline: "2026-08-31", storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "ai_s4", room: "sala", name: "Tapete 2x3m", estimatedCost: 450, actualCost: null, priority: "desejavel", status: "pesquisando", purchaseDeadline: null, storeLink: null, notes: "", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai_s5", room: "sala", name: "Cortina sala", estimatedCost: 350, actualCost: null, priority: "importante", status: "pesquisando", purchaseDeadline: null, storeLink: null, notes: "", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai_s6", room: "sala", name: "Painel de parede", estimatedCost: 800, actualCost: null, priority: "desejavel", status: "pesquisando", purchaseDeadline: null, storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },

      // Quarto
      { id: "ai_q1", room: "quarto", name: "Cama box casal", estimatedCost: 2800, actualCost: 2650, priority: "essencial", status: "comprado", purchaseDeadline: null, storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "ai_q2", room: "quarto", name: "Guarda-roupa 6 portas", estimatedCost: 2500, actualCost: null, priority: "essencial", status: "orcado", purchaseDeadline: "2026-08-31", storeLink: null, notes: "", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai_q3", room: "quarto", name: "Criado-mudo (x2)", estimatedCost: 600, actualCost: null, priority: "importante", status: "pesquisando", purchaseDeadline: null, storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "ai_q4", room: "quarto", name: "Colchão ortopédico", estimatedCost: 1800, actualCost: 1750, priority: "essencial", status: "comprado", purchaseDeadline: null, storeLink: null, notes: "", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai_q5", room: "quarto", name: "Cortina blackout", estimatedCost: 280, actualCost: null, priority: "importante", status: "pesquisando", purchaseDeadline: null, storeLink: null, notes: "", createdBy: THAIANE_ID, createdAt: nowISO },

      // Cozinha
      { id: "ai_c1", room: "cozinha", name: "Geladeira frost free", estimatedCost: 4000, actualCost: 3800, priority: "essencial", status: "entregue", purchaseDeadline: null, storeLink: null, notes: "Frost free", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai_c2", room: "cozinha", name: "Fogão 5 bocas", estimatedCost: 1800, actualCost: 1750, priority: "essencial", status: "comprado", purchaseDeadline: null, storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "ai_c3", room: "cozinha", name: "Microondas 30L", estimatedCost: 650, actualCost: null, priority: "essencial", status: "orcado", purchaseDeadline: null, storeLink: null, notes: "", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai_c4", room: "cozinha", name: "Jogo de panelas", estimatedCost: 400, actualCost: 380, priority: "essencial", status: "comprado", purchaseDeadline: null, storeLink: null, notes: "", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai_c5", room: "cozinha", name: "Mesa de jantar 6 lugares", estimatedCost: 1500, actualCost: null, priority: "essencial", status: "pesquisando", purchaseDeadline: "2026-09-30", storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },

      // Banheiro
      { id: "ai_b1", room: "banheiro", name: "Armário com espelho", estimatedCost: 500, actualCost: null, priority: "importante", status: "pesquisando", purchaseDeadline: null, storeLink: null, notes: "", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai_b2", room: "banheiro", name: "Jogo de toalhas", estimatedCost: 200, actualCost: 180, priority: "desejavel", status: "comprado", purchaseDeadline: null, storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },

      // Lavanderia
      { id: "ai_l1", room: "lavanderia", name: "Máquina de lavar 11kg", estimatedCost: 2200, actualCost: null, priority: "essencial", status: "orcado", purchaseDeadline: "2026-08-31", storeLink: null, notes: "", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai_l2", room: "lavanderia", name: "Varal de teto", estimatedCost: 150, actualCost: 130, priority: "essencial", status: "comprado", purchaseDeadline: null, storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },

      // Escritório
      { id: "ai_e1", room: "escritório", name: "Mesa de escritório 1.40m", estimatedCost: 800, actualCost: null, priority: "essencial", status: "pesquisando", purchaseDeadline: "2026-08-31", storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "ai_e2", room: "escritório", name: "Cadeira ergonômica", estimatedCost: 1200, actualCost: null, priority: "essencial", status: "pesquisando", purchaseDeadline: "2026-08-31", storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO },
      { id: "ai_e3", room: "escritório", name: "Monitor secundário 24'", estimatedCost: 900, actualCost: null, priority: "importante", status: "pesquisando", purchaseDeadline: null, storeLink: null, notes: "", createdBy: THAIANE_ID, createdAt: nowISO },
      { id: "ai_e4", room: "escritório", name: "Luminária de mesa", estimatedCost: 150, actualCost: null, priority: "desejavel", status: "pesquisando", purchaseDeadline: null, storeLink: null, notes: "", createdBy: LUCAS_ID, createdAt: nowISO }
    ],
    weddingTasks: [
      { id: "wt1", title: "Definir data do casamento", description: "", deadline: null, assignee: "ambos", status: "a_fazer", category: "geral", createdAt: nowISO, completedAt: null },
      { id: "wt2", title: "Pesquisar locais para cerimônia", description: "", deadline: "2026-08-31", assignee: "thaiane", status: "a_fazer", category: "cerimonia", createdAt: nowISO, completedAt: null },
      { id: "wt3", title: "Pesquisar locais para recepção", description: "", deadline: "2026-08-31", assignee: "thaiane", status: "a_fazer", category: "recepcao", createdAt: nowISO, completedAt: null },
      { id: "wt4", title: "Definir lista de convidados", description: "", deadline: "2026-07-31", assignee: "thaiane", status: "fazendo", category: "geral", createdAt: nowISO, completedAt: null },
      { id: "wt5", title: "Pesquisar fotógrafo", description: "", deadline: "2026-09-30", assignee: "lucas", status: "a_fazer", category: "geral", createdAt: nowISO, completedAt: null },
      { id: "wt6", title: "Pesquisar buffet", description: "", deadline: "2026-09-30", assignee: "thaiane", status: "a_fazer", category: "recepcao", createdAt: nowISO, completedAt: null },
      { id: "wt7", title: "Escolher modelo do vestido", description: "", deadline: "2026-10-31", assignee: "thaiane", status: "a_fazer", category: "visual", createdAt: nowISO, completedAt: null },
      { id: "wt8", title: "Escolher terno", description: "", deadline: "2026-10-31", assignee: "lucas", status: "a_fazer", category: "visual", createdAt: nowISO, completedAt: null },
      { id: "wt9", title: "Pesquisar convites", description: "", deadline: null, assignee: "thaiane", status: "a_fazer", category: "geral", createdAt: nowISO, completedAt: null },
      { id: "wt10", title: "Providenciar documentação civil", description: "", deadline: null, assignee: "lucas", status: "a_fazer", category: "documentacao", createdAt: nowISO, completedAt: null },
      { id: "wt11", title: "Escolher alianças", description: "", deadline: "2026-10-31", assignee: "ambos", status: "a_fazer", category: "geral", createdAt: nowISO, completedAt: null },
      { id: "wt12", title: "Definir playlist/DJ", description: "", deadline: null, assignee: "lucas", status: "a_fazer", category: "recepcao", createdAt: nowISO, completedAt: null },
      { id: "wt13", title: "Pesquisar decoração", description: "", deadline: null, assignee: "thaiane", status: "a_fazer", category: "recepcao", createdAt: nowISO, completedAt: null },
      { id: "wt14", title: "Organizar lua de mel", description: "", deadline: null, assignee: "ambos", status: "a_fazer", category: "geral", createdAt: nowISO, completedAt: null }
    ],
    weddingBudget: [
      { id: "wb1", category: "local", estimatedCost: 5000, actualCost: 0, notes: "" },
      { id: "wb2", category: "buffet", estimatedCost: 8000, actualCost: 0, notes: "" },
      { id: "wb3", category: "decoracao", estimatedCost: 3000, actualCost: 0, notes: "" },
      { id: "wb4", category: "foto_video", estimatedCost: 4000, actualCost: 0, notes: "" },
      { id: "wb5", category: "vestuario", estimatedCost: 4500, actualCost: 0, notes: "" },
      { id: "wb6", category: "aliancas", estimatedCost: 2000, actualCost: 0, notes: "" },
      { id: "wb7", category: "convites", estimatedCost: 800, actualCost: 0, notes: "" },
      { id: "wb8", category: "musica", estimatedCost: 2500, actualCost: 0, notes: "" },
      { id: "wb9", category: "lua_de_mel", estimatedCost: 6000, actualCost: 0, notes: "" },
      { id: "wb10", category: "outros", estimatedCost: 2000, actualCost: 0, notes: "" }
    ],
    weddingVendors: [
      { id: "wv1", name: "Studio Lens Fotografia", service: "Fotografia", contactPhone: "(41) 99999-1234", contactEmail: "studio@lens.com", quotedValue: 3800, status: "pesquisando", notes: "" },
      { id: "wv2", name: "Buffet Sabor & Arte", service: "Buffet", contactPhone: "(41) 98888-5678", contactEmail: "contato@saborarte.com", quotedValue: 7500, status: "pesquisando", notes: "" },
      { id: "wv3", name: "DJ Rafael", service: "Música/DJ", contactPhone: "(41) 97777-9012", contactEmail: "djrafael@gmail.com", quotedValue: 2200, status: "pesquisando", notes: "" }
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
      { id: "n2", userId: LUCAS_ID, type: "divida", title: "Dívida vencendo", message: "Cartão de crédito vence in 5 dias", isRead: false, createdAt: at(0, 8) },
      { id: "n3", userId: THAIANE_ID, type: "conquista", title: "Conquista!", message: "Você desbloqueou Primeiro passo", isRead: true, createdAt: at(-18, 9) },
    ]
  };
}
