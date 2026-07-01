"use client";

import { useCallback, useMemo } from "react";
import type { TaskPrompt, PromptUsage } from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { parseVariables } from "@/lib/prompts";
import { uid } from "@/lib/utils";

export interface PromptFormData {
  title: string;
  description: string;
  category: string;
  content: string;
  /** Variable config (labels + defaults), keyed order follows the content. */
  variables: { key: string; label: string; defaultValue?: string }[];
}

export function useTaskPrompts() {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const prompts = useMemo(() => data.taskPrompts ?? [], [data.taskPrompts]);

  const getPromptsByTask = useCallback(
    (taskId: string) => prompts.filter((p) => p.taskId === taskId),
    [prompts],
  );

  const createPrompt = useCallback(
    (taskId: string, form: PromptFormData) => {
      if (!userId) return;
      const now = new Date().toISOString();
      const variables = parseVariables(form.content, form.variables);
      const prompt: TaskPrompt = {
        id: uid("pr"),
        taskId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim() || "Geral",
        content: form.content,
        variables,
        usageHistory: [],
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
      };
      updateData((d) => ({ ...d, taskPrompts: [...(d.taskPrompts ?? []), prompt] }));
    },
    [userId],
  );

  const updatePrompt = useCallback(
    (promptId: string, form: PromptFormData) => {
      const now = new Date().toISOString();
      const variables = parseVariables(form.content, form.variables);
      updateData((d) => ({
        ...d,
        taskPrompts: (d.taskPrompts ?? []).map((p) =>
          p.id === promptId
            ? {
                ...p,
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                category: form.category.trim() || "Geral",
                content: form.content,
                variables,
                updatedAt: now,
                updatedBy: userId ?? p.updatedBy,
              }
            : p,
        ),
      }));
    },
    [userId],
  );

  const deletePrompt = useCallback((promptId: string) => {
    updateData((d) => ({ ...d, taskPrompts: (d.taskPrompts ?? []).filter((p) => p.id !== promptId) }));
  }, []);

  const recordUsage = useCallback(
    (promptId: string, variablesUsed: Record<string, string>) => {
      if (!userId) return;
      const usage: PromptUsage = {
        id: uid("pu"),
        usedBy: userId,
        usedAt: new Date().toISOString(),
        variablesUsed,
      };
      updateData((d) => ({
        ...d,
        taskPrompts: (d.taskPrompts ?? []).map((p) =>
          p.id === promptId ? { ...p, usageHistory: [usage, ...p.usageHistory].slice(0, 50) } : p,
        ),
      }));
    },
    [userId],
  );

  const getLastUsage = useCallback(
    (promptId: string): PromptUsage | null => {
      const p = prompts.find((x) => x.id === promptId);
      return p && p.usageHistory.length > 0 ? p.usageHistory[0] : null;
    },
    [prompts],
  );

  const getUsageCount = useCallback(
    (promptId: string): number => prompts.find((x) => x.id === promptId)?.usageHistory.length ?? 0,
    [prompts],
  );

  return {
    prompts,
    getPromptsByTask,
    createPrompt,
    updatePrompt,
    deletePrompt,
    recordUsage,
    getLastUsage,
    getUsageCount,
  };
}
