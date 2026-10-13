"use client";

import { useMemo, useState } from "react";
import { FileCheck, Plus, Trash2, AlertTriangle } from "lucide-react";
import type { CanadaDocument, CanadaDocumentStatus, Assignee } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { GoalProgress } from "@/components/goals/GoalProgress";
import { EmptyState } from "@/components/ui/EmptyState";
import { DOCUMENT_CATEGORY_META, DOCUMENT_STATUS_META } from "@/lib/canada-data";
import { formatDate, daysUntil, pct, cn } from "@/lib/utils";
import type { DocumentFormData } from "@/hooks/useCanada";
import { NewDocumentModal } from "./NewDocumentModal";

interface CanadaDocumentsProps {
  documents: CanadaDocument[];
  onSetStatus: (id: string, status: CanadaDocumentStatus) => void;
  onAdd: (form: DocumentFormData) => void;
  onDelete: (id: string) => void;
}

const GROUPS: { key: Assignee; label: string }[] = [
  { key: "lucas", label: "Lucas" },
  { key: "thaiane", label: "Thaiane" },
  { key: "ambos", label: "Ambos" },
];

const STATUS_OPTIONS: CanadaDocumentStatus[] = ["pendente", "em_andamento", "concluido", "nao_aplicavel"];

export function CanadaDocuments({ documents, onSetStatus, onAdd, onDelete }: CanadaDocumentsProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const groups = useMemo(() => {
    return GROUPS.map((g) => {
      const list = documents.filter((d) => d.owner === g.key);
      const done = list.filter((d) => d.status === "concluido" || d.status === "nao_aplicavel").length;
      return { ...g, list, done, total: list.length };
    }).filter((g) => g.total > 0);
  }, [documents]);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
          Adicionar documento
        </Button>
      </div>

      {documents.length === 0 ? (
        <EmptyState icon={FileCheck} title="Nenhum documento cadastrado" description="Adicione os documentos necessários para a jornada." />
      ) : (
        groups.map((g) => (
          <Card key={g.key} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-content">{g.label}</h3>
              <span className="text-xs font-semibold text-muted">
                {g.done}/{g.total} documentos {g.done === g.total ? "✅" : ""}
              </span>
            </div>
            <GoalProgress current={g.done} target={g.total} size="sm" color="var(--brand-cyan-dark)" />

            <div className="divide-y divide-line/60">
              {g.list.map((doc) => {
                const expirySoon = doc.expiryDate && daysUntil(doc.expiryDate) <= 540 && daysUntil(doc.expiryDate) >= 0;
                const meta = DOCUMENT_STATUS_META[doc.status];
                return (
                  <div key={doc.id} className="group flex flex-wrap items-center gap-2 py-2.5">
                    <Select
                      value={doc.status}
                      onChange={(e) => onSetStatus(doc.id, e.target.value as CanadaDocumentStatus)}
                      className="h-8 w-auto min-w-[140px] text-xs"
                      style={{ color: meta.color }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {DOCUMENT_STATUS_META[s].label}
                        </option>
                      ))}
                    </Select>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm font-medium text-content",
                        (doc.status === "concluido" || doc.status === "nao_aplicavel") && "text-muted line-through",
                      )}
                    >
                      {doc.name}
                    </span>
                    <Badge color="var(--brand-purple)" className="text-[10px] uppercase">
                      {DOCUMENT_CATEGORY_META[doc.category].label}
                    </Badge>
                    {doc.expiryDate && (
                      <span
                        className={cn(
                          "text-[11px] font-medium",
                          expirySoon ? "text-danger" : "text-muted",
                        )}
                      >
                        {expirySoon && <AlertTriangle className="mr-1 inline size-3" />}
                        Validade: {formatDate(doc.expiryDate)}
                        {expirySoon && " · Renovar"}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(doc.id)}
                      aria-label="Remover documento"
                      className="rounded-input p-1.5 text-muted opacity-0 transition-colors hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}

      <NewDocumentModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={onAdd} />
    </div>
  );
}
