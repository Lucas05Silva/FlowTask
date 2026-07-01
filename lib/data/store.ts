import type { FlowTaskData } from "@/types";
import { seedData } from "./seed";

/**
 * Mock data store backed by localStorage.
 *
 * This is the single boundary between the UI and "the database". When we move
 * to Supabase, only this module (and the hooks that call it) changes — the
 * components keep consuming the same hooks.
 */

const KEY = "flowtask:data";
const VERSION_KEY = "flowtask:version";
const VERSION = "6";

let cache: FlowTaskData | null = null;
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function persist(data: FlowTaskData): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    localStorage.setItem(VERSION_KEY, VERSION);
  } catch {
    /* storage full / unavailable — keep in-memory only */
  }
}

function load(): FlowTaskData {
  if (cache) return cache;
  if (!isBrowser()) {
    cache = seedData();
    return cache;
  }
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const raw = storedVersion === VERSION ? localStorage.getItem(KEY) : null;
  if (raw) {
    try {
      cache = JSON.parse(raw) as FlowTaskData;
      return cache;
    } catch {
      /* fall through to seed */
    }
  }
  cache = seedData();
  persist(cache);
  return cache;
}

function emit(): void {
  for (const l of listeners) l();
}

/** Current snapshot (stable reference until a write replaces it). */
export function getData(): FlowTaskData {
  return load();
}

/** Server snapshot for useSyncExternalStore (seed, never persisted). */
export function getServerData(): FlowTaskData {
  return seedData();
}

/**
 * Apply an immutable update. The updater receives the current data and must
 * return the next data object (new reference).
 */
export function updateData(updater: (data: FlowTaskData) => FlowTaskData): void {
  const next = updater(load());
  cache = next;
  persist(next);
  emit();
}

/** Reset everything back to the seed (used by "limpar dados" / dev). */
export function resetData(): void {
  cache = seedData();
  persist(cache);
  emit();
}

/** Subscribe to store changes; returns an unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (isBrowser() && listeners.size === 1) {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (isBrowser() && listeners.size === 0) {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function onStorage(e: StorageEvent): void {
  if (e.key === KEY && e.newValue) {
    try {
      cache = JSON.parse(e.newValue) as FlowTaskData;
      emit();
    } catch {
      /* ignore malformed cross-tab payload */
    }
  }
}
