"use client";

/* Form state is re-synced from the selected project whenever the modal opens. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import type { Assignee, Project, ProjectStatus, ServiceType } from "@/types";
import type { ProjectFormData } from "@/hooks/useProjects";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ASSIGNEE_META, PROJECT_STATUS_META, SERVICE_TYPE_META } from "@/lib/constants";
import { XP } from "@/lib/gamification";
import { todayISO } from "@/lib/utils";
import { ProjectSteps } from "./ProjectSteps";
import { ASSIGNEES, PROJECT_STATUS_ORDER, SERVICE_TYPES } from "./project-utils";

interface ProjectModalProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onCreate: (form: ProjectFormData) => void;
  onUpdate: (id: string, form: ProjectFormData) => void;
  onDelete: (id: string) => void;
}

function emptyForm(): ProjectFormData {
  return {
    clientName: "",
    projectName: "",
    serviceType: "landing_page",
    status: "a_fazer",
    startDate: todayISO(),
    deadline: todayISO(),
    value: 0,
    assignee: "lucas",
    notes: "",
    steps: [],
  };
}

function fromProject(project: Project): ProjectFormData {
  return {
    clientName: project.clientName,
    projectName: project.projectName,
    serviceType: project.serviceType,
    status: project.status,
    startDate: project.startDate,
    deadline: project.deadline,
    value: project.value,
    assignee: project.assignee,
    notes: project.notes,
    steps: project.steps,
  };
}

export function ProjectModal({ open, project, onClose, onCreate, onUpdate, onDelete }: ProjectModalProps) {
  const [form, setForm] = useState<ProjectFormData>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = project !== null;

  useEffect(() => {
    if (!open) return;
    setForm(project ? fromProject(project) : emptyForm());
    setError(null);
    setConfirmDelete(false);
  }, [open, project]);

  const patch = (p: Partial<ProjectFormData>) => setForm((f) => ({ ...f, ...p }));

  function handleSave() {
    if (!form.clientName.trim() || !form.projectName.trim()) {
      setError("Preencha cliente e nome do projeto.");
      return;
    }
    if (form.deadline < form.startDate) {
      setError("O deadline precisa ser igual ou posterior ao inicio.");
      return;
    }
    const normalized = {
      ...form,
      clientName: form.clientName.trim(),
      projectName: form.projectName.trim(),
      notes: form.notes.trim(),
      steps: form.steps.map((s, index) => ({ ...s, title: s.title.trim(), order: index })).filter((s) => s.title),
    };
    if (isEdit && project) onUpdate(project.id, normalized);
    else onCreate(normalized);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar projeto" : "Novo projeto"}
      className="sm:max-w-2xl"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <Star className="size-4" /> +{XP.projectComplete} XP ao concluir
          </span>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="project-client">Cliente *</Label>
            <Input
              id="project-client"
              value={form.clientName}
              onChange={(e) => patch({ clientName: e.target.value })}
              placeholder="Nome do cliente"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="project-name">Projeto *</Label>
            <Input
              id="project-name"
              value={form.projectName}
              onChange={(e) => patch({ projectName: e.target.value })}
              placeholder="Nome da entrega"
            />
          </div>
        </div>
        {error && <p className="rounded-input bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="project-service">Servico</Label>
            <Select id="project-service" value={form.serviceType} onChange={(e) => patch({ serviceType: e.target.value as ServiceType })}>
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>{SERVICE_TYPE_META[type].label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="project-status">Status</Label>
            <Select id="project-status" value={form.status} onChange={(e) => patch({ status: e.target.value as ProjectStatus })}>
              {PROJECT_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>{PROJECT_STATUS_META[status].label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="project-assignee">Responsavel</Label>
            <Select id="project-assignee" value={form.assignee} onChange={(e) => patch({ assignee: e.target.value as Assignee })}>
              {ASSIGNEES.map((assignee) => (
                <option key={assignee} value={assignee}>{ASSIGNEE_META[assignee].label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="project-start">Inicio</Label>
            <Input id="project-start" type="date" value={form.startDate} onChange={(e) => patch({ startDate: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="project-deadline">Deadline</Label>
            <Input id="project-deadline" type="date" value={form.deadline} onChange={(e) => patch({ deadline: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="project-value">Valor R$</Label>
            <Input
              id="project-value"
              type="number"
              min={0}
              step={50}
              value={form.value}
              onChange={(e) => patch({ value: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="project-notes">Notas</Label>
          <Textarea
            id="project-notes"
            value={form.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="Links, combinados, observacoes..."
          />
        </div>

        <div>
          <Label>Etapas</Label>
          <ProjectSteps steps={form.steps} onChange={(steps) => patch({ steps })} editable />
        </div>

        {isEdit && project && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger">Excluir este projeto?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Nao</Button>
                <Button variant="danger" size="sm" onClick={() => { onDelete(project.id); onClose(); }}>Sim, excluir</Button>
              </div>
            ) : (
              <Button variant="ghost" icon={Trash2} className="w-full justify-center text-danger" onClick={() => setConfirmDelete(true)}>
                Excluir projeto
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
