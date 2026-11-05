"use client";

import { useCallback } from "react";
import type { Assignee, Project, ProjectStatus, ProjectStep, ServiceType } from "@/types";
import { updateData } from "@/lib/data/store";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { uid } from "@/lib/utils";

export interface ProjectFormData {
  clientName: string;
  projectName: string;
  serviceType: ServiceType;
  status: ProjectStatus;
  startDate: string;
  deadline: string;
  value: number;
  assignee: Assignee;
  notes: string;
  steps: ProjectStep[];
}

export function useProjects() {
  const data = useData();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const createProject = useCallback((form: ProjectFormData) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: uid("p"),
      clientName: form.clientName.trim(),
      projectName: form.projectName.trim(),
      serviceType: form.serviceType,
      status: form.status,
      startDate: form.startDate,
      deadline: form.deadline,
      value: form.value,
      assignee: form.assignee,
      notes: form.notes.trim(),
      steps: form.steps,
      createdAt: now,
      completedAt: form.status === "feito" ? now : null,
    };
    updateData((d) => ({ ...d, projects: [...d.projects, project] }));
  }, []);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    updateData((d) => ({
      ...d,
      projects: d.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    updateData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));
  }, []);

  /** Toggle a step. Returns allDone=true when this completion finished every step of an open project. */
  const toggleStep = useCallback(
    (projectId: string, stepId: string): { completed: boolean; allDone: boolean } => {
      let out = { completed: false, allDone: false };
      if (!userId) return out;

      updateData((d) => {
        const project = d.projects.find((p) => p.id === projectId);
        const step = project?.steps.find((s) => s.id === stepId);
        if (!project || !step) return d;

        const completing = step.status === "pendente";
        const now = new Date().toISOString();
        const steps = project.steps.map((s) =>
          s.id === stepId
            ? { ...s, status: completing ? ("concluido" as const) : ("pendente" as const), completedAt: completing ? now : null }
            : s,
        );
        const projects = d.projects.map((p) => (p.id === projectId ? { ...p, steps } : p));
        const allDone = steps.length > 0 && steps.every((s) => s.status === "concluido");

        out = { completed: completing, allDone: completing && allDone && project.status !== "feito" };
        return { ...d, projects };
      });

      return out;
    },
    [userId],
  );

  /** Mark a project done: sets status/feito + completedAt. */
  const completeProject = useCallback(
    (id: string) => {
      if (!userId) return;
      updateData((d) => {
        const project = d.projects.find((p) => p.id === id);
        if (!project || project.status === "feito") return d;
        const now = new Date().toISOString();
        const projects = d.projects.map((p) => (p.id === id ? { ...p, status: "feito" as ProjectStatus, completedAt: now } : p));
        return { ...d, projects };
      });
    },
    [userId],
  );

  const setStatus = useCallback(
    (id: string, status: ProjectStatus) => {
      if (status === "feito") return completeProject(id);
      updateData((d) => ({
        ...d,
        projects: d.projects.map((p) => (p.id === id ? { ...p, status, completedAt: null } : p)),
      }));
    },
    [completeProject],
  );

  return {
    projects: data.projects,
    createProject,
    updateProject,
    deleteProject,
    toggleStep,
    completeProject,
    setStatus,
  };
}
