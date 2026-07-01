"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Circle, Clock3, type LucideIcon } from "lucide-react";
import type { Project, ProjectStatus } from "@/types";
import { PROJECT_STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./ProjectCard";
import { PROJECT_STATUS_ORDER } from "./project-utils";

interface ProjectListProps {
  projects: Project[];
  onOpen: (project: Project) => void;
  onToggleStep: (project: Project, stepId: string) => void;
  onComplete: (project: Project) => void;
}

const ICONS: Record<ProjectStatus, LucideIcon> = {
  a_fazer: Circle,
  fazendo: Clock3,
  feito: CheckCircle2,
};

export function ProjectList({ projects, onOpen, onToggleStep, onComplete }: ProjectListProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ feito: true });

  return (
    <div className="space-y-5">
      {PROJECT_STATUS_ORDER.map((status) => {
        const group = projects.filter((p) => p.status === status);
        const Icon = ICONS[status];
        const isCollapsed = collapsed[status];

        return (
          <section key={status}>
            <button
              type="button"
              onClick={() => setCollapsed((c) => ({ ...c, [status]: !c[status] }))}
              className="mb-3 flex w-full items-center gap-2"
            >
              <Icon className="size-4 text-muted" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-content">
                {PROJECT_STATUS_META[status].label}
              </h2>
              <span className="rounded-badge bg-panel px-2 py-0.5 text-xs font-medium text-muted">{group.length}</span>
              <ChevronDown className={cn("ml-auto size-4 text-muted transition-transform", isCollapsed && "-rotate-90")} />
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {group.length === 0 ? (
                    <p className="rounded-card border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                      Nenhum projeto neste status.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      <AnimatePresence mode="popLayout">
                        {group.map((project) => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            onOpen={onOpen}
                            onToggleStep={onToggleStep}
                            onComplete={onComplete}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}
    </div>
  );
}
