import type { FlowTaskData } from "@/types";
import { emptyState, ACHIEVEMENTS } from "./initialState";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Data store — boundary between the UI and the normalized Supabase schema.
 *
 * The app keeps working with one synchronous in-memory `FlowTaskData` object
 * (consumed via useData). This module:
 *  - hydrates that object from the per-module tables on login,
 *  - on every `updateData`, diffs the previous vs next state per collection and
 *    writes only the affected rows to the matching table (debounced),
 *  - syncs across devices via Realtime.
 * So each module effectively reads/writes its own Supabase table, with no hook
 * or component changes.
 */

type CollKey =
  | "users" | "tasks" | "events" | "projects" | "finances" | "debts" | "goals"
  | "apartmentItems" | "weddingTasks" | "weddingBudget" | "weddingVendors"
  | "userAchievements" | "notifications" | "taskPrompts";

/** FlowTaskData array field → Supabase table. */
const COLLECTIONS: { key: CollKey; table: string; noDelete?: boolean }[] = [
  { key: "users", table: "users", noDelete: true },
  { key: "tasks", table: "tasks" },
  { key: "events", table: "calendar_events" },
  { key: "projects", table: "projects" },
  { key: "finances", table: "finances_entries" },
  { key: "debts", table: "debts" },
  { key: "goals", table: "goals" },
  { key: "apartmentItems", table: "apartment_items" },
  { key: "weddingTasks", table: "wedding_tasks" },
  { key: "weddingBudget", table: "wedding_budget" },
  { key: "weddingVendors", table: "wedding_vendors" },
  { key: "userAchievements", table: "user_achievements" },
  { key: "notifications", table: "notifications" },
  { key: "taskPrompts", table: "task_prompts" },
];
const WEDDING_CONFIG_TABLE = "wedding_config";

/* --- key case mapping (top-level only; jsonb values kept as-is) ------------- */
const camelToSnake = (k: string) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const snakeToCamel = (k: string) => k.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());

type Row = Record<string, unknown>;
type Entity = { id: string } & Record<string, unknown>;

function rowFromEntity(e: Entity): Row {
  const out: Row = {};
  for (const k of Object.keys(e)) out[camelToSnake(k)] = (e as Row)[k];
  return out;
}
function entityFromRow(r: Row): Entity {
  const out: Row = {};
  for (const k of Object.keys(r)) out[snakeToCamel(k)] = r[k];
  return out as Entity;
}

/* --- module state ---------------------------------------------------------- */
const SERVER_STATE = emptyState();
let cache: FlowTaskData = emptyState();
let hydrated = false;
let hydrating = false;
let hydrateError: string | null = null;
let channel: RealtimeChannel | null = null;
let suppressRealtimeUntil = 0;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/* --- write queue ----------------------------------------------------------- */
type Op =
  | { kind: "upsert"; table: string; row: Row }
  | { kind: "delete"; table: string; id: string };
let queue: Op[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/* --------------------------------------------------------------------------- */
/* Snapshot API                                                                */
/* --------------------------------------------------------------------------- */
export function getData(): FlowTaskData {
  return cache;
}
export function getServerData(): FlowTaskData {
  return SERVER_STATE;
}
export function getHydrated(): boolean {
  return hydrated;
}
export function getHydrateError(): string | null {
  return hydrateError;
}
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/* --------------------------------------------------------------------------- */
/* Writes (diff + debounced flush)                                             */
/* --------------------------------------------------------------------------- */
function diffCollection(
  table: string,
  prev: Entity[],
  next: Entity[],
  noDelete: boolean,
): void {
  const prevById = new Map(prev.map((x) => [x.id, x]));
  const nextById = new Map(next.map((x) => [x.id, x]));
  for (const [id, item] of nextById) {
    const p = prevById.get(id);
    if (!p || JSON.stringify(p) !== JSON.stringify(item)) {
      queue.push({ kind: "upsert", table, row: rowFromEntity(item) });
    }
  }
  if (!noDelete) {
    for (const id of prevById.keys()) {
      if (!nextById.has(id)) queue.push({ kind: "delete", table, id });
    }
  }
}

function enqueueDiff(prev: FlowTaskData, next: FlowTaskData): void {
  for (const c of COLLECTIONS) {
    const a = (prev[c.key] as unknown as Entity[]) ?? [];
    const b = (next[c.key] as unknown as Entity[]) ?? [];
    if (a !== b) diffCollection(c.table, a, b, !!c.noDelete);
  }
  // wedding_config singleton
  if (
    prev.weddingDate !== next.weddingDate ||
    prev.weddingVenueName !== next.weddingVenueName ||
    prev.weddingVenueAddress !== next.weddingVenueAddress
  ) {
    queue.push({
      kind: "upsert",
      table: WEDDING_CONFIG_TABLE,
      row: {
        id: "shared",
        wedding_date: next.weddingDate,
        wedding_venue_name: next.weddingVenueName ?? null,
        wedding_venue_address: next.weddingVenueAddress ?? null,
      },
    });
  }
  scheduleFlush();
}

function scheduleFlush(): void {
  if (!supabaseConfigured || !hydrated) return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 400);
}

async function flush(): Promise<void> {
  if (!supabaseConfigured || queue.length === 0) return;
  const ops = queue;
  queue = [];
  const sb = getSupabase();
  suppressRealtimeUntil = Date.now() + 2000;

  // Batch upserts per table.
  const upsertsByTable = new Map<string, Row[]>();
  const deletesByTable = new Map<string, string[]>();
  for (const op of ops) {
    if (op.kind === "upsert") {
      const list = upsertsByTable.get(op.table) ?? [];
      list.push(op.row);
      upsertsByTable.set(op.table, list);
    } else {
      const list = deletesByTable.get(op.table) ?? [];
      list.push(op.id);
      deletesByTable.set(op.table, list);
    }
  }
  try {
    for (const [table, rows] of upsertsByTable) {
      const { error } = await sb.from(table).upsert(rows);
      if (error) console.warn(`[store] upsert ${table} failed:`, error.message);
    }
    for (const [table, ids] of deletesByTable) {
      const { error } = await sb.from(table).delete().in("id", ids);
      if (error) console.warn(`[store] delete ${table} failed:`, error.message);
    }
  } catch (e) {
    console.warn("[store] flush error:", e);
  }
  suppressRealtimeUntil = Date.now() + 2000;
}

export function updateData(updater: (data: FlowTaskData) => FlowTaskData): void {
  const prev = cache;
  const next = updater(prev);
  cache = next;
  emit();
  enqueueDiff(prev, next);
}

/* --------------------------------------------------------------------------- */
/* Hydration + Realtime                                                        */
/* --------------------------------------------------------------------------- */
async function fetchAll(): Promise<FlowTaskData> {
  const sb = getSupabase();
  const next = emptyState();
  const results = await Promise.all(COLLECTIONS.map((c) => sb.from(c.table).select("*")));
  results.forEach((res, i) => {
    const c = COLLECTIONS[i];
    if (res.error) {
      throw new Error(`${c.table}: ${res.error.message}`);
    }
    (next as unknown as Record<string, unknown>)[c.key] = (res.data ?? []).map((r) =>
      entityFromRow(r as Row),
    );
  });
  next.achievements = ACHIEVEMENTS;
  if (!next.users || next.users.length === 0) next.users = emptyState().users;

  const cfg = await sb.from(WEDDING_CONFIG_TABLE).select("*").eq("id", "shared").maybeSingle();
  if (cfg.data) {
    next.weddingDate = (cfg.data as Row).wedding_date as string | null;
    next.weddingVenueName = (cfg.data as Row).wedding_venue_name as string | null;
    next.weddingVenueAddress = (cfg.data as Row).wedding_venue_address as string | null;
  }
  return next;
}

function subscribeRealtime(): void {
  if (!supabaseConfigured || channel) return;
  const sb = getSupabase();
  channel = sb
    .channel("flowtask_sync")
    .on("postgres_changes", { event: "*", schema: "public" }, () => {
      if (Date.now() < suppressRealtimeUntil) return;
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(async () => {
        try {
          cache = await fetchAll();
          emit();
        } catch (e) {
          console.warn("[store] realtime refresh failed:", e);
        }
      }, 500);
    })
    .subscribe();
}

/** Fetch everything after login. Safe to call multiple times. */
export async function hydrate(): Promise<void> {
  if (!supabaseConfigured || hydrated || hydrating) return;
  hydrating = true;
  hydrateError = null;
  try {
    cache = await fetchAll();
    hydrated = true;
    emit();
    subscribeRealtime();
  } catch (e) {
    hydrateError = e instanceof Error ? e.message : "Falha ao carregar dados.";
    console.warn("[store] hydrate failed:", hydrateError);
    emit();
  } finally {
    hydrating = false;
  }
}

/** Retry after a hydrate error. */
export async function retryHydrate(): Promise<void> {
  hydrated = false;
  await hydrate();
}

export function teardownData(): void {
  if (channel) {
    try {
      getSupabase().removeChannel(channel);
    } catch {
      /* ignore */
    }
    channel = null;
  }
  if (flushTimer) clearTimeout(flushTimer);
  if (refreshTimer) clearTimeout(refreshTimer);
  queue = [];
  hydrated = false;
  hydrateError = null;
  cache = emptyState();
  emit();
}

/** Wipe ALL data (real "limpar dados") — deletes every row, keeps users zeroed. */
export async function resetData(): Promise<void> {
  if (!supabaseConfigured) {
    cache = emptyState();
    emit();
    return;
  }
  const sb = getSupabase();
  suppressRealtimeUntil = Date.now() + 4000;
  try {
    for (const c of COLLECTIONS) {
      if (c.key === "users") continue;
      await sb.from(c.table).delete().neq("id", "___none___");
    }
    await sb.from(WEDDING_CONFIG_TABLE).delete().neq("id", "___none___");
    // Zero the user profiles.
    const fresh = emptyState();
    await sb.from("users").upsert(fresh.users.map((u) => rowFromEntity(u as unknown as Entity)));
    cache = fresh;
    hydrated = true;
    emit();
  } catch (e) {
    console.warn("[store] resetData failed:", e);
  }
}
