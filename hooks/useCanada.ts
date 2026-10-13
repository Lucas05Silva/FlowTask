"use client";

import { useCallback, useMemo } from "react";
import type {
  CanadaDecision,
  CanadaDecisionCategory,
  CanadaDocument,
  CanadaDocumentCategory,
  CanadaDocumentStatus,
  CanadaChecklistItem,
  CanadaChecklistCategory,
  CanadaChecklistPriority,
  CanadaCity,
  CanadaNote,
  CanadaNoteCategory,
  Assignee,
  FlowTaskData,
} from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { levelFromXp, XP, type CelebrationResult } from "@/lib/gamification";
import { uid, todayISO, pct } from "@/lib/utils";
import {
  DECISION_SEED,
  DOCUMENT_SEED,
  CITY_SEED,
  CHECKLIST_SEED,
} from "@/lib/canada-data";

export interface DocumentFormData {
  name: string;
  owner: Assignee;
  category: CanadaDocumentCategory;
  expiryDate: string | null;
  deadline: string | null;
  notes: string;
}

export interface ChecklistFormData {
  category: CanadaChecklistCategory;
  title: string;
  description: string;
  assignedTo: Assignee;
  priority: CanadaChecklistPriority;
  dueDate: string | null;
}

export interface CityFormData {
  name: string;
  province: string;
  avgRent1br: number | null;
  notes: string;
}

export interface NoteFormData {
  title: string;
  content: string;
  category: CanadaNoteCategory;
}

/** Progress per aba (0–100) plus an overall weighted percentage. */
export interface CanadaProgress {
  decisions: { done: number; total: number; pct: number };
  documents: { done: number; total: number; pct: number };
  checklist: { done: number; total: number; pct: number };
  overallPct: number;
}

export function useCanada() {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const decisions = data.canadaDecisions || [];
  const documents = data.canadaDocuments || [];
  const checklist = data.canadaChecklist || [];
  const cities = data.canadaCities || [];
  const notes = data.canadaNotes || [];

  /* ---- gamification helper (mirror of useInvestments.rewardUser) ---------- */
  const rewardUser = useCallback(
    (d: FlowTaskData, xpReward: number): { nextData: FlowTaskData; result: CelebrationResult | null } => {
      if (!userId) return { nextData: d, result: null };
      const users = d.users.map((u) => ({ ...u }));
      const me = users.find((u) => u.id === userId);
      if (!me) return { nextData: d, result: null };
      const levelBefore = levelFromXp(me.xp).level;
      me.xp += xpReward;
      const after = levelFromXp(me.xp);
      me.level = after.level;
      return {
        nextData: { ...d, users },
        result: {
          xpGained: xpReward,
          leveledUp: after.level > levelBefore,
          newLevel: after.level,
          newTitle: after.title,
          achievements: [],
          streakCount: me.streakCount,
        },
      };
    },
    [userId],
  );

  /* ---- progress ------------------------------------------------------------ */
  const getProgress = useCallback((): CanadaProgress => {
    // "Logística" counts only the travel-prep phases — the Estudos/LinkedIn
    // checklist is tracked separately inside its own tab.
    const logistica = checklist.filter((c) => c.category !== "estudos");
    const decisionsDone = decisions.filter((d) => d.status === "decidido").length;
    const documentsDone = documents.filter((d) => d.status === "concluido" || d.status === "nao_aplicavel").length;
    const checklistDone = logistica.filter((c) => c.status === "concluido").length;
    const decisionsPct = pct(decisionsDone, decisions.length);
    const documentsPct = pct(documentsDone, documents.length);
    const checklistPct = pct(checklistDone, logistica.length);
    // Simple equal-weight average across the three trackable lists.
    const totals = [decisions.length, documents.length, logistica.length];
    const parts = [decisionsPct, documentsPct, checklistPct].filter((_, i) => totals[i] > 0);
    const overallPct = parts.length > 0 ? Math.round(parts.reduce((s, p) => s + p, 0) / parts.length) : 0;
    return {
      decisions: { done: decisionsDone, total: decisions.length, pct: decisionsPct },
      documents: { done: documentsDone, total: documents.length, pct: documentsPct },
      checklist: { done: checklistDone, total: logistica.length, pct: checklistPct },
      overallPct,
    };
  }, [decisions, documents, checklist]);

  /** The "Qual nossa data alvo de partida?" decision's answer, if decided. */
  const targetDepartureDate = useMemo(() => {
    const d = decisions.find((x) => x.category === "prazo" && x.status === "decidido" && x.answer);
    const parsed = d?.answer ? new Date(d.answer) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? d!.answer : null;
  }, [decisions]);

  /* ---- decisions ------------------------------------------------------------ */
  const answerDecision = useCallback(
    (id: string, answer: string): CelebrationResult | null => {
      let celebration: CelebrationResult | null = null;
      updateData((d) => {
        const target = d.canadaDecisions.find((x) => x.id === id);
        const wasDecided = target?.status === "decidido";
        const nextDecisions = d.canadaDecisions.map((x) =>
          x.id === id
            ? { ...x, answer: answer.trim(), status: "decidido" as const, decidedAt: new Date().toISOString() }
            : x,
        );
        let next: FlowTaskData = { ...d, canadaDecisions: nextDecisions };
        if (!wasDecided) {
          const { nextData, result } = rewardUser(next, XP.canadaStep);
          celebration = result;
          next = nextData;
        }
        return next;
      });
      return celebration;
    },
    [rewardUser],
  );

  const setDecisionStatus = useCallback((id: string, status: CanadaDecision["status"]) => {
    updateData((d) => ({
      ...d,
      canadaDecisions: d.canadaDecisions.map((x) => (x.id === id ? { ...x, status } : x)),
    }));
  }, []);

  /* ---- documents ------------------------------------------------------------ */
  const addDocument = useCallback(
    (form: DocumentFormData) => {
      updateData((d) => {
        const doc: CanadaDocument = {
          id: uid("cdoc"),
          name: form.name.trim(),
          owner: form.owner,
          category: form.category,
          status: "pendente",
          expiryDate: form.expiryDate,
          deadline: form.deadline,
          notes: form.notes.trim() || undefined,
          completedAt: null,
          createdAt: new Date().toISOString(),
        };
        return { ...d, canadaDocuments: [...d.canadaDocuments, doc] };
      });
    },
    [],
  );

  const setDocumentStatus = useCallback(
    (id: string, status: CanadaDocumentStatus): CelebrationResult | null => {
      let celebration: CelebrationResult | null = null;
      updateData((d) => {
        const target = d.canadaDocuments.find((x) => x.id === id);
        const wasDone = target?.status === "concluido" || target?.status === "nao_aplicavel";
        const willBeDone = status === "concluido" || status === "nao_aplicavel";
        const nextDocuments = d.canadaDocuments.map((x) =>
          x.id === id
            ? { ...x, status, completedAt: willBeDone ? x.completedAt || new Date().toISOString() : null }
            : x,
        );
        let next: FlowTaskData = { ...d, canadaDocuments: nextDocuments };
        if (!wasDone && willBeDone) {
          const { nextData, result } = rewardUser(next, XP.canadaStep);
          celebration = result;
          next = nextData;
        }
        return next;
      });
      return celebration;
    },
    [rewardUser],
  );

  const deleteDocument = useCallback((id: string) => {
    updateData((d) => ({ ...d, canadaDocuments: d.canadaDocuments.filter((x) => x.id !== id) }));
  }, []);

  /* ---- checklist ------------------------------------------------------------ */
  const addChecklistItem = useCallback((form: ChecklistFormData) => {
    updateData((d) => {
      const item: CanadaChecklistItem = {
        id: uid("cchk"),
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        assignedTo: form.assignedTo,
        status: "pendente",
        priority: form.priority,
        dueDate: form.dueDate,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };
      return { ...d, canadaChecklist: [...d.canadaChecklist, item] };
    });
  }, []);

  const toggleChecklistItem = useCallback(
    (id: string): CelebrationResult | null => {
      let celebration: CelebrationResult | null = null;
      updateData((d) => {
        const target = d.canadaChecklist.find((x) => x.id === id);
        if (!target) return d;
        const willBeDone = target.status !== "concluido";
        const nextChecklist = d.canadaChecklist.map((x) =>
          x.id === id
            ? {
                ...x,
                status: willBeDone ? ("concluido" as const) : ("pendente" as const),
                completedAt: willBeDone ? new Date().toISOString() : null,
              }
            : x,
        );
        let next: FlowTaskData = { ...d, canadaChecklist: nextChecklist };
        if (willBeDone) {
          const { nextData, result } = rewardUser(next, XP.canadaStep);
          celebration = result;
          next = nextData;
        }
        return next;
      });
      return celebration;
    },
    [rewardUser],
  );

  const deleteChecklistItem = useCallback((id: string) => {
    updateData((d) => ({ ...d, canadaChecklist: d.canadaChecklist.filter((x) => x.id !== id) }));
  }, []);

  /* ---- cities ---------------------------------------------------------------- */
  const addCity = useCallback((form: CityFormData) => {
    updateData((d) => {
      const city: CanadaCity = {
        id: uid("ccity"),
        name: form.name.trim(),
        province: form.province.trim(),
        pros: [],
        cons: [],
        avgRent1br: form.avgRent1br,
        notes: form.notes.trim() || undefined,
        isFavorite: false,
        isChosen: false,
        createdAt: new Date().toISOString(),
      };
      return { ...d, canadaCities: [...d.canadaCities, city] };
    });
  }, []);

  const addCityPoint = useCallback((id: string, kind: "pros" | "cons", text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    updateData((d) => ({
      ...d,
      canadaCities: d.canadaCities.map((c) => (c.id === id ? { ...c, [kind]: [...c[kind], trimmed] } : c)),
    }));
  }, []);

  const removeCityPoint = useCallback((id: string, kind: "pros" | "cons", index: number) => {
    updateData((d) => ({
      ...d,
      canadaCities: d.canadaCities.map((c) =>
        c.id === id ? { ...c, [kind]: c[kind].filter((_, i) => i !== index) } : c,
      ),
    }));
  }, []);

  const toggleFavoriteCity = useCallback((id: string) => {
    updateData((d) => ({
      ...d,
      canadaCities: d.canadaCities.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)),
    }));
  }, []);

  const chooseCity = useCallback((id: string): CelebrationResult | null => {
    let celebration: CelebrationResult | null = null;
    updateData((d) => {
      const nextCities = d.canadaCities.map((c) => ({ ...c, isChosen: c.id === id }));
      const { nextData, result } = rewardUser({ ...d, canadaCities: nextCities }, XP.canadaStep);
      celebration = result;
      return nextData;
    });
    return celebration;
  }, [rewardUser]);

  const deleteCity = useCallback((id: string) => {
    updateData((d) => ({ ...d, canadaCities: d.canadaCities.filter((c) => c.id !== id) }));
  }, []);

  /* ---- notes ------------------------------------------------------------------ */
  const addNote = useCallback(
    (form: NoteFormData) => {
      if (!userId) return;
      updateData((d) => {
        const note: CanadaNote = {
          id: uid("cnote"),
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        };
        return { ...d, canadaNotes: [...d.canadaNotes, note] };
      });
    },
    [userId],
  );

  const updateNote = useCallback((id: string, patch: Partial<CanadaNote>) => {
    updateData((d) => ({
      ...d,
      canadaNotes: d.canadaNotes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    updateData((d) => ({ ...d, canadaNotes: d.canadaNotes.filter((n) => n.id !== id) }));
  }, []);

  /* ---- seed (go-forward lists, runs once, idempotent by name) --------------- */
  const seedIfEmpty = useCallback(() => {
    if (!userId) return;
    if (typeof window === "undefined") return;
    const flagKey = "flowtask_canada_seed_v1";
    if (window.localStorage.getItem(flagKey)) return;
    window.localStorage.setItem(flagKey, "1");

    const nowIso = new Date().toISOString();

    updateData((d) => {
      const nextDecisions = [...d.canadaDecisions];
      for (const s of DECISION_SEED) {
        if (nextDecisions.some((x) => x.question === s.question)) continue;
        nextDecisions.push({
          id: uid("cdec"),
          category: s.category,
          question: s.question,
          answer: null,
          status: "pendente",
          decidedAt: null,
          createdAt: nowIso,
        });
      }

      const nextDocuments = [...d.canadaDocuments];
      for (const s of DOCUMENT_SEED) {
        if (nextDocuments.some((x) => x.name === s.name && x.owner === s.owner)) continue;
        nextDocuments.push({
          id: uid("cdoc"),
          name: s.name,
          owner: s.owner,
          category: s.category,
          status: "pendente",
          expiryDate: null,
          deadline: null,
          completedAt: null,
          createdAt: nowIso,
        });
      }

      const nextCities = [...d.canadaCities];
      for (const s of CITY_SEED) {
        if (nextCities.some((x) => x.name === s.name)) continue;
        nextCities.push({
          id: uid("ccity"),
          name: s.name,
          province: s.province,
          pros: [],
          cons: [],
          avgRent1br: s.avgRent1br,
          isFavorite: false,
          isChosen: false,
          createdAt: nowIso,
        });
      }

      const nextChecklist = [...d.canadaChecklist];
      for (const s of CHECKLIST_SEED) {
        if (nextChecklist.some((x) => x.title === s.title && x.category === s.category)) continue;
        nextChecklist.push({
          id: uid("cchk"),
          category: s.category,
          title: s.title,
          assignedTo: s.assignedTo,
          priority: s.priority,
          status: "pendente",
          dueDate: null,
          completedAt: null,
          createdAt: nowIso,
        });
      }

      return {
        ...d,
        canadaDecisions: nextDecisions,
        canadaDocuments: nextDocuments,
        canadaCities: nextCities,
        canadaChecklist: nextChecklist,
      };
    });
  }, [userId]);

  return {
    decisions,
    documents,
    checklist,
    cities,
    notes,
    getProgress,
    targetDepartureDate,
    // decisions
    answerDecision,
    setDecisionStatus,
    // documents
    addDocument,
    setDocumentStatus,
    deleteDocument,
    // checklist
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    // cities
    addCity,
    addCityPoint,
    removeCityPoint,
    toggleFavoriteCity,
    chooseCity,
    deleteCity,
    // notes
    addNote,
    updateNote,
    deleteNote,
    // seed
    seedIfEmpty,
  };
}
