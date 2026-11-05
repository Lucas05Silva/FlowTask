import type { FlowTaskData, User } from "@/types";

/** Fixed users (Supabase Auth UUIDs). Shared data. */
export const KNOWN_USERS: { id: string; email: string; name: string; emoji: string }[] = [
  { id: "a5f1faa0-587c-4545-8b70-d7820a5075cc", email: "lukasoliveira47210@gmail.com", name: "Lucas", emoji: "🦁" },
  { id: "6c813876-52e7-48b6-bfb9-91c70439c9d8", email: "thaiifranca10@gmail.com", name: "Thaiane", emoji: "🦋" },
];

function freshUser(u: (typeof KNOWN_USERS)[number], createdAt: string): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: null,
    avatarEmoji: u.emoji,
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
    projects: [],
    finances: [],
    debts: [],
    goals: [],
    taskPrompts: [],
    notes: [],
    investments: [],
    investmentContributions: [],
    patrimonySnapshots: [],
    incomeProfiles: [],
    incomeHistory: [],
    monthlyExpenses: [],
    canadaDecisions: [],
    canadaDocuments: [],
    canadaChecklist: [],
    canadaCities: [],
    canadaNotes: [],
    monthlyPlans: [],
    monthlyPlanItems: [],
    financialIdeas: [],
    dreams: [],
  };
}
