import type { FlowTaskData, User } from "@/types";

/** Fixed users (Supabase Auth UUIDs). Shared data; individual XP/streaks live here. */
export const KNOWN_USERS: { id: string; email: string; name: string; emoji: string }[] = [
  { id: "a5f1faa0-587c-4545-8b70-d7820a5075cc", email: "lukasoliveira47210@gmail.com", name: "Lucas", emoji: "🦁" },
  { id: "6c813876-52e7-48b6-bfb9-91c70439c9d8", email: "thaiifranca10@gmail.com", name: "Thaiane", emoji: "🦋" },
];

/** Achievement catalogue (definitions, not user progress). */
export const ACHIEVEMENTS: FlowTaskData["achievements"] = [
  { id: "ach_first_step", key: "primeiro_passo", title: "Primeiro passo", description: "Concluiu a primeira tarefa", icon: "Footprints", xpReward: 20 },
  { id: "ach_week", key: "semana_produtiva", title: "Semana produtiva", description: "7 dias de streak", icon: "Flame", xpReward: 50 },
  { id: "ach_month", key: "mes_de_fogo", title: "Mês de fogo", description: "30 dias de streak", icon: "Zap", xpReward: 200 },
  { id: "ach_client", key: "cliente_feliz", title: "Cliente feliz", description: "Entregou o primeiro projeto FlowSys", icon: "Smile", xpReward: 100 },
  { id: "ach_machine", key: "maquina_entregas", title: "Máquina de entregas", description: "Entregou 10 projetos", icon: "Rocket", xpReward: 300 },
  { id: "ach_debt_zero", key: "divida_zero", title: "Dívida zero", description: "Quitou uma dívida", icon: "BadgeCheck", xpReward: 100 },
  { id: "ach_saver", key: "poupador", title: "Poupador", description: "Primeira meta financeira atingida", icon: "PiggyBank", xpReward: 150 },
  { id: "ach_nest", key: "ninho_pronto", title: "Ninho pronto", description: "100% dos itens do apê comprados", icon: "Home", xpReward: 200 },
  { id: "ach_iaccept", key: "sim_eu_aceito", title: "Sim, eu aceito", description: "Todas as tarefas do casamento concluídas", icon: "Heart", xpReward: 250 },
  { id: "ach_couple", key: "casal_produtivo", title: "Casal produtivo", description: "Lucas e Thaiane no mesmo nível", icon: "Users", xpReward: 100 },
  { id: "ach_duo", key: "dupla_dinamica", title: "Dupla dinâmica", description: "Ambos com streak ativo de 7+ dias", icon: "Sparkles", xpReward: 150 },
];

function freshUser(u: (typeof KNOWN_USERS)[number], createdAt: string): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: null,
    avatarEmoji: u.emoji,
    xp: 0,
    level: 1,
    streakCount: 0,
    streakRecord: 0,
    streakLastDate: null,
    themePreference: "system",
    createdAt,
  };
}

/** A clean, empty dataset — the real starting point (no demo/mock data). */
export function emptyState(): FlowTaskData {
  const now = new Date().toISOString();
  return {
    users: KNOWN_USERS.map((u) => freshUser(u, now)),
    tasks: [],
    events: [],
    projects: [],
    finances: [],
    debts: [],
    goals: [],
    apartmentItems: [],
    weddingTasks: [],
    weddingBudget: [],
    weddingVendors: [],
    achievements: ACHIEVEMENTS,
    userAchievements: [],
    notifications: [],
    taskPrompts: [],
    notes: [],
    weddingDate: null,
    weddingVenueName: null,
    weddingVenueAddress: null,
  };
}
