"use client";

import { useMemo, useState } from "react";
import { Briefcase, Plus } from "lucide-react";
import type { Project } from "@/types";
import { useProjects, type ProjectFormData } from "@/hooks/useProjects";
import { useGamification } from "@/components/providers/GamificationProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectFilters, DEFAULT_PROJECT_FILTERS, type ProjectFilterState } from "./ProjectFilters";
import { ProjectList } from "./ProjectList";
import { ProjectModal } from "./ProjectModal";
import { ProjectStats } from "./ProjectStats";

export function ProjectsPage() {
  const { projects, createProject, updateProject, deleteProject, toggleStep, setStatus } = useProjects();
  const { celebrate } = useGamification();
  const { toast } = useToast();

  const [filters, setFilters] = useState<ProjectFilterState>(DEFAULT_PROJECT_FILTERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return projects.filter((project) => {
      if (filters.status !== "all" && project.status !== filters.status) return false;
      if (filters.serviceType !== "all" && project.serviceType !== filters.serviceType) return false;
      if (filters.assignee !== "all" && project.assignee !== filters.assignee && project.assignee !== "ambos") return false;
      if (q && !project.clientName.toLowerCase().includes(q) && !project.projectName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [projects, filters]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setModalOpen(true);
  }

  function handleUpdate(id: string, form: ProjectFormData) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    updateProject(id, {
      clientName: form.clientName,
      projectName: form.projectName,
      serviceType: form.serviceType,
      startDate: form.startDate,
      deadline: form.deadline,
      value: form.value,
      assignee: form.assignee,
      notes: form.notes,
      steps: form.steps,
      status: form.status === "feito" && project.status !== "feito" ? project.status : form.status,
      completedAt: form.status === "feito" && project.status === "feito" ? project.completedAt : null,
    });
    if (form.status === "feito" && project.status !== "feito") {
      const result = setStatus(id, "feito");
      if (result) celebrate(result, { big: true });
    }
  }

  function completeProject(project: Project) {
    const result = setStatus(project.id, "feito");
    if (result) celebrate(result, { big: true });
  }

  function handleToggleStep(project: Project, stepId: string) {
    const out = toggleStep(project.id, stepId);
    if (out.result) celebrate(out.result);
    if (out.result) toast({ variant: "success", title: "Etapa concluida", description: "+30 XP creditados." });
    if (out.allDone) {
      const shouldComplete = window.confirm("Todas as etapas foram concluidas. Marcar projeto como Feito?");
      if (shouldComplete) completeProject(project);
    }
  }

  const hasProjects = projects.length > 0;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Projetos FlowSys"
        subtitle="Controle entregas, deadlines, etapas e receita por cliente."
        action={
          <Button icon={Plus} onClick={openNew} className="hidden md:inline-flex">
            Novo projeto
          </Button>
        }
      />

      <div className="space-y-5">
        <ProjectStats />
        <ProjectFilters filters={filters} onChange={setFilters} />

        {filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={hasProjects ? "Nada por aqui com esses filtros" : "Nenhum projeto ainda"}
            description={
              hasProjects
                ? "Tente ajustar a busca, status, servico ou responsavel."
                : "Adicione seu primeiro projeto e acompanhe cada entrega."
            }
            action={<Button icon={Plus} onClick={openNew}>Novo projeto</Button>}
          />
        ) : (
          <ProjectList
            projects={filtered}
            onOpen={openEdit}
            onToggleStep={handleToggleStep}
            onComplete={completeProject}
          />
        )}
      </div>

      <button
        onClick={openNew}
        aria-label="Novo projeto"
        className="fixed bottom-20 right-4 z-30 grid size-14 place-items-center rounded-full bg-brand text-white shadow-pop transition-transform hover:scale-105 active:scale-95 md:hidden"
      >
        <Plus className="size-6" />
      </button>

      <ProjectModal
        open={modalOpen}
        project={editing}
        onClose={() => setModalOpen(false)}
        onCreate={createProject}
        onUpdate={handleUpdate}
        onDelete={deleteProject}
      />
    </div>
  );
}
