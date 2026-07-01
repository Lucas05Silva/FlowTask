"use client";

import { useState, useEffect } from "react";
import { Trash2, Calendar, User, Tag, Sparkles } from "lucide-react";
import type { WeddingTask, Assignee, TaskStatus } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface WeddingTaskModalProps {
  open: boolean;
  item: WeddingTask | null;
  onClose: () => void;
  onCreate: (form: any) => any;
  onUpdate: (id: string, patch: any) => any;
  onDelete: (id: string) => void;
  onCelebrate: (result: any) => void;
}

const CATEGORY_OPTIONS = [
  { value: "cerimonia", label: "Cerimônia 💒" },
  { value: "recepcao", label: "Recepção 🎉" },
  { value: "visual", label: "Visual (Vestido/Terno) 👗" },
  { value: "documentacao", label: "Documentação 📄" },
  { value: "geral", label: "Geral ✨" },
];

export function WeddingTaskModal({
  open,
  item,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onCelebrate,
}: WeddingTaskModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("geral");
  const [assignee, setAssignee] = useState<Assignee>("ambos");
  const [status, setStatus] = useState<TaskStatus>("a_fazer");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setConfirmDelete(false);
      if (item) {
        setTitle(item.title);
        setCategory(item.category || "geral");
        setAssignee(item.assignee);
        setStatus(item.status);
        setDeadline(item.deadline ? item.deadline.slice(0, 10) : "");
        setDescription(item.description || "");
      } else {
        setTitle("");
        setCategory("geral");
        setAssignee("ambos");
        setStatus("a_fazer");
        setDeadline("");
        setDescription("");
      }
    }
  }, [item, open]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Insira o título da tarefa.");
      return;
    }

    const payload = {
      title: title.trim(),
      category: category.trim(),
      assignee,
      status,
      deadline: deadline || null,
      description: description.trim(),
    };

    let res = null;
    if (item) {
      res = onUpdate(item.id, payload);
    } else {
      res = onCreate(payload);
    }

    if (res) {
      onCelebrate(res);
      // Confetti check
      if (status === "concluida" && (!item || item.status !== "concluida")) {
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.65 },
            colors: ["#F472B6", "#FCD34D", "#FB7185", "#F59E0B"],
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Editar tarefa do casamento" : "Nova tarefa do casamento"}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-500">
            <Sparkles className="size-3.5 text-amber-500" /> +20 XP ao concluir
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-pink-500 hover:bg-pink-600 text-white font-bold">
              Salvar
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <Label htmlFor="wt-title">Título da tarefa *</Label>
          <Input
            id="wt-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Degustação do bolo, Escolher convites"
            autoFocus
          />
          {error && <p className="mt-1 text-xs text-danger font-semibold">{error}</p>}
        </div>

        {/* Category & Status */}
        <div className="grid gap-3 grid-cols-2">
          <div>
            <Label htmlFor="wt-cat" className="flex items-center gap-1">
              <Tag className="size-3 text-muted" /> Categoria
            </Label>
            <Select id="wt-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="wt-status">Status</Label>
            <Select id="wt-status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              <option value="a_fazer">A fazer ⏳</option>
              <option value="fazendo">Fazendo 🛠️</option>
              <option value="concluida">Concluída ✅</option>
            </Select>
          </div>
        </div>

        {/* Assignee & Deadline */}
        <div className="grid gap-3 grid-cols-2">
          <div>
            <Label htmlFor="wt-assignee" className="flex items-center gap-1">
              <User className="size-3 text-muted" /> Responsável
            </Label>
            <Select id="wt-assignee" value={assignee} onChange={(e) => setAssignee(e.target.value as Assignee)}>
              <option value="lucas">Lucas 🦁</option>
              <option value="thaiane">Thaiane 🦋</option>
              <option value="ambos">Ambos 💍</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="wt-deadline" className="flex items-center gap-1">
              <Calendar className="size-3 text-muted" /> Prazo
            </Label>
            <Input id="wt-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="wt-desc">Descrição / Detalhes</Label>
          <Textarea
            id="wt-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Anotações sobre a tarefa, fornecedor recomendado, observações..."
            rows={2}
          />
        </div>

        {/* Delete option */}
        {item && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger font-semibold">Excluir esta tarefa?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Não
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onDelete(item.id);
                    onClose();
                  }}
                >
                  Sim, excluir
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-center text-danger hover:bg-danger/5"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-2 size-4" /> Excluir tarefa
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
