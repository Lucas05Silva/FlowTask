"use client";

import { useSyncExternalStore } from "react";
import type { FlowTaskData } from "@/types";
import { getData, getServerData, subscribe } from "@/lib/data/store";

/**
 * Subscribe a component to the whole store. Derive slices with `useMemo`
 * inside the component (returning a stable reference from getSnapshot is
 * required by useSyncExternalStore, so we never select inline here).
 */
export function useData(): FlowTaskData {
  return useSyncExternalStore(subscribe, getData, getServerData);
}
