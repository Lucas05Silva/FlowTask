"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import type { DocumentFormData } from "@/hooks/useCanada";
import { DOCUMENT_CATEGORY_META } from "@/lib/canada-data";

interface NewDocumentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: DocumentFormData) => void;
}

function emptyForm(): DocumentFormData {
  return { name: "", owner: "ambos", category: "outro", expiryDate: null, deadline: null, notes: "" };
}

export function NewDocumentModal({ open, onClose, onSubmit }: NewDocumentModalProps) {
  const [form, setForm] = useState<DocumentFormData>(emptyForm());

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  function patch(p: Partial<DocumentFormData>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    onSubmit(form);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adicionar documento"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!form.name.trim()}>
            Adicionar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="doc-name">Nome *</Label>
          <Input
            id="doc-name"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Ex: Visto de trabalho"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="doc-owner">Responsável</Label>
            <Select id="doc-owner" value={form.owner} onChange={(e) => patch({ owner: e.target.value as DocumentFormData["owner"] })}>
              <option value="lucas">Lucas</option>
              <option value="thaiane">Thaiane</option>
              <option value="ambos">Ambos</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="doc-category">Categoria</Label>
            <Select id="doc-category" value={form.category} onChange={(e) => patch({ category: e.target.value as DocumentFormData["category"] })}>
              {Object.entries(DOCUMENT_CATEGORY_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="doc-expiry">Validade</Label>
            <Input
              id="doc-expiry"
              type="date"
              value={form.expiryDate ?? ""}
              onChange={(e) => patch({ expiryDate: e.target.value || null })}
            />
          </div>
          <div>
            <Label htmlFor="doc-deadline">Prazo para obter</Label>
            <Input
              id="doc-deadline"
              type="date"
              value={form.deadline ?? ""}
              onChange={(e) => patch({ deadline: e.target.value || null })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="doc-notes">Observação</Label>
          <Textarea id="doc-notes" value={form.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="Opcional" />
        </div>
      </div>
    </Modal>
  );
}
