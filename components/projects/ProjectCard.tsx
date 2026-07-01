"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronDown, ListChecks, Wallet } from "lucide-react";
import type { Project } from "@/types";
import { useData } from "@/hooks/useData";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ASSIGNEE_META, PROJECT_STATUS_META, SERVICE_TYPE_META } from "@/lib/constants";
import { cn, formatBRL, formatDate } from "@/lib/utils";
import { ProjectSteps } from "./ProjectSteps";
import { deadlineState, projectProgress, projectStatusColor, serviceColor } from "./project-utils";

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
  onToggleStep: (project: Project, stepId: string) => void;
  onComplete: (project: Project) => void;
}

export function ProjectCard({ project, onOpen, onToggleStep, onComplete }: ProjectCardProps) {
  const data = useData();
  const [expanded, setExpanded] = useState(false);
  const progress = projectProgress(project);
  const deadline = deadlineState(project);
  const assignees = project.assignee === "ambos" ? data.users : data.users.filter((u) => u.id === project.assignee);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-card border bg-surface p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop",
        project.status === "fazendo" ? "border-l-4 border-l-brand border-y-line border-r-line" : "border-line",
        deadline.overdue && "border-danger/40",
        project.status === "feito" && "opacity-75",
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="min-w-0 flex-1 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted">{project.clientName}</p>
              <h3 className="mt-0.5 truncate text-base font-semibold text-content">{project.projectName}</h3>
            </div>
            <ChevronDown className={cn("mt-1 size-4 shrink-0 text-muted transition-transform", expanded && "rotate-180")} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge color={serviceColor(project.serviceType)}>{SERVICE_TYPE_META[project.serviceType].label}</Badge>
            <Badge color={projectStatusColor(project.status)}>{PROJECT_STATUS_META[project.status].label}</Badge>
            <Badge color={deadline.color} className={deadline.overdue ? "animate-pulse" : undefined}>
              <CalendarDays className="size-3.5" />
              {deadline.label}
            </Badge>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2 md:justify-end">
          <span className="flex -space-x-1.5">
            {assignees.map((u) => (
              <Avatar key={u.id} user={u} size={28} className="ring-1 ring-surface" />
            ))}
          </span>
          <Button variant="outline" size="sm" onClick={() => onOpen(project)}>
            Editar
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted">
            <span>Progresso</span>
            <span>{progress.done}/{progress.total} etapas</span>
          </div>
          <ProgressBar value={progress.pct} color={project.status === "feito" ? "var(--success)" : "var(--brand-purple)"} />
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-content">
          <Wallet className="size-4 text-muted" />
          {formatBRL(project.value)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted">
          <ListChecks className="size-4" />
          {ASSIGNEE_META[project.assignee].label}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-line pt-4">
              <div className="mb-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
                <span>Inicio: {formatDate(project.startDate, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                <span>Deadline: {formatDate(project.deadline, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
              </div>
              {project.notes && <p className="mb-3 rounded-input bg-panel px-3 py-2 text-sm text-muted">{project.notes}</p>}
              <ProjectSteps steps={project.steps} onToggle={(stepId) => onToggleStep(project, stepId)} />
              {project.status !== "feito" && progress.total > 0 && progress.done === progress.total && (
                <Button className="mt-3 w-full justify-center" onClick={() => onComplete(project)}>
                  Marcar projeto como feito
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
