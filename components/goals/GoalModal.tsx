"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, HelpCircle, ArrowRight, AlertCircle, Trophy } from "lucide-react";
import type { Goal, GoalType, GoalCheckItem } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { uid } from "@/lib/utils";

interface GoalModalProps {
  open: boolean;
  goal: Goal | null;
  onClose: () => void;
  onCreate: (form: any) => any;
  onUpdate: (id: string, patch: any) => void;
  onDelete: (id: string) => void;
}

const DEFAULT_XP_MAP: Record<GoalType, number> = {
  projeto: 100,
  pessoal: 50,
  apartamento: 80,
  casamento: 60,
  financeira: 150,
};

export function GoalModal({ open, goal, onClose, onCreate, onUpdate, onDelete }: GoalModalProps) {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GoalType>("pessoal");
  const [progressMode, setProgressMode] = useState<"numerical" | "checklist">("numerical");
  const [targetAmount, setTargetAmount] = useState<number>(1);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [unit, setUnit] = useState("");
  
  // Checklist building
  const [checklist, setChecklist] = useState<GoalCheckItem[]>([]);
  const [newCheckItemText, setNewCheckItemText] = useState("");

  const [deadline, setDeadline] = useState("");
  const [xpReward, setXpReward] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync state with editing goal
  useEffect(() => {
    if (open) {
      setError(null);
      setConfirmDelete(false);
      if (goal) {
        setTitle(goal.title);
        setDescription(goal.description || "");
        setType(goal.type);
        const isCheck = goal.checklist && goal.checklist.length > 0;
        setProgressMode(isCheck ? "checklist" : "numerical");
        setTargetAmount(goal.targetAmount);
        setCurrentAmount(goal.currentAmount);
        setUnit(goal.unit || "");
        setChecklist(goal.checklist || []);
        setDeadline(goal.deadline ? goal.deadline.slice(0, 10) : "");
        setXpReward(goal.xpReward);
      } else {
        setTitle("");
        setDescription("");
        setType("pessoal");
        setProgressMode("numerical");
        setTargetAmount(1);
        setCurrentAmount(0);
        setUnit("");
        setChecklist([]);
        setNewCheckItemText("");
        setDeadline("");
        setXpReward(DEFAULT_XP_MAP.pessoal);
      }
    }
  }, [goal, open]);

  // Suggest XP rewards when type changes
  useEffect(() => {
    if (!goal) {
      setXpReward(DEFAULT_XP_MAP[type] || 50);
    }
  }, [type, goal]);

  const handleAddCheckItem = () => {
    if (!newCheckItemText.trim()) return;
    setChecklist([
      ...checklist,
      { id: uid("ci"), title: newCheckItemText.trim(), completed: false },
    ]);
    setNewCheckItemText("");
  };

  const handleRemoveCheckItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError("Dê um título à meta.");
      return;
    }

    if (type === "financeira") {
      alert("Metas financeiras devem ser criadas no painel Financeiro.");
      return;
    }

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      type,
      deadline: deadline || null,
      xpReward,
      category: null,
      linkedModule: type !== "pessoal" ? type : null,
    };

    if (progressMode === "checklist") {
      if (checklist.length === 0) {
        setError("Adicione pelo menos um item ao checklist.");
        return;
      }
      payload.checklist = checklist;
      payload.targetAmount = checklist.length;
      payload.currentAmount = checklist.filter((item) => item.completed).length;
      payload.unit = "itens";
    } else {
      if (targetAmount <= 0) {
        setError("O valor alvo deve ser maior que zero.");
        return;
      }
      payload.checklist = [];
      payload.targetAmount = targetAmount;
      payload.currentAmount = currentAmount;
      payload.unit = unit.trim() || undefined;
    }

    if (goal) {
      onUpdate(goal.id, payload);
    } else {
      onCreate(payload);
    }
    onClose();
  };

  const isFinancialType = type === "financeira";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={goal ? "Editar meta" : "Nova meta"}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
            <Trophy className="size-3.5 text-amber-500" /> +{xpReward} XP ao atingir
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            {!isFinancialType && (
              <Button onClick={handleSave} className="bg-brand">
                Salvar
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <Label htmlFor="g-title">Título da meta *</Label>
          <Input
            id="g-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Ler 5 livros, Estudar inglês..."
            autoFocus
          />
          {error && <p className="mt-1 text-xs text-danger font-semibold">{error}</p>}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="g-desc">Descrição</Label>
          <Textarea
            id="g-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes adicionais, links…"
          />
        </div>

        {/* Type & Deadline */}
        <div className="grid gap-3 grid-cols-2">
          <div>
            <Label htmlFor="g-type">Tipo de Meta</Label>
            <Select id="g-type" value={type} onChange={(e) => setType(e.target.value as GoalType)}>
              <option value="pessoal">Pessoal</option>
              <option value="projeto">Projeto</option>
              <option value="apartamento">Apartamento</option>
              <option value="casamento">Casamento</option>
              <option value="financeira">Financeira 💰</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="g-deadline">Prazo final</Label>
            <Input id="g-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>

        {/* Special view for financial type */}
        {isFinancialType ? (
          <div className="rounded-input bg-amber-500/5 border border-amber-500/10 p-3.5 text-xs text-muted space-y-2.5">
            <div className="flex gap-2 items-start">
              <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                Metas do tipo <strong>Financeira</strong> pertencem e são geradas diretamente pelo Módulo Financeiro, garantindo que depósitos e orçamentos fiquem sincronizados.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              iconRight={ArrowRight}
              onClick={() => {
                onClose();
                router.push("/financeiro");
              }}
              className="w-full justify-center border-amber-500/20 text-amber-600 hover:bg-amber-500/5"
            >
              Ir para o Módulo Financeiro
            </Button>
          </div>
        ) : (
          <>
            {/* Progress Mode Toggle */}
            <div>
              <Label>Modo de Progresso</Label>
              <div className="grid grid-cols-2 gap-2 border border-line p-1 rounded-input bg-panel/30">
                <button
                  type="button"
                  onClick={() => setProgressMode("numerical")}
                  className={`py-1.5 text-xs font-bold rounded transition-all ${
                    progressMode === "numerical"
                      ? "bg-surface shadow-sm text-brand border border-line/20"
                      : "text-muted hover:text-content"
                  }`}
                >
                  Numérico
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMode("checklist")}
                  className={`py-1.5 text-xs font-bold rounded transition-all ${
                    progressMode === "checklist"
                      ? "bg-surface shadow-sm text-brand border border-line/20"
                      : "text-muted hover:text-content"
                  }`}
                >
                  Checklist
                </button>
              </div>
            </div>

            {/* Progress: Numerical Form fields */}
            {progressMode === "numerical" && (
              <div className="grid gap-3 grid-cols-3">
                <div>
                  <Label htmlFor="g-current">Atual</Label>
                  <Input
                    id="g-current"
                    type="number"
                    step="any"
                    min={0}
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="g-target">Alvo</Label>
                  <Input
                    id="g-target"
                    type="number"
                    step="any"
                    min={1}
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label htmlFor="g-unit">Unidade</Label>
                  <Input
                    id="g-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Ex: treinos, km"
                  />
                </div>
              </div>
            )}

            {/* Progress: Checklist builder fields */}
            {progressMode === "checklist" && (
              <div className="space-y-2.5">
                <Label htmlFor="g-check-add">Adicionar Itens ao Checklist</Label>
                <div className="flex gap-2">
                  <Input
                    id="g-check-add"
                    value={newCheckItemText}
                    onChange={(e) => setNewCheckItemText(e.target.value)}
                    placeholder="Ex: Comprar passaporte..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCheckItem();
                      }
                    }}
                  />
                  <Button type="button" size="sm" icon={Plus} onClick={handleAddCheckItem}>
                    Adicionar
                  </Button>
                </div>

                {checklist.length > 0 && (
                  <div className="border border-line/65 rounded-input bg-panel/30 max-h-40 overflow-y-auto divide-y divide-line/40">
                    {checklist.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 text-xs">
                        <span className="truncate font-semibold text-content">{item.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCheckItem(item.id)}
                          className="text-muted hover:text-danger p-1 rounded hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* XP reward */}
            <div>
              <Label htmlFor="g-xp">Recompensa de Experiência (XP)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="g-xp"
                  type="number"
                  min={10}
                  max={1000}
                  value={xpReward}
                  onChange={(e) => setXpReward(parseInt(e.target.value, 10) || 10)}
                  className="w-28 text-center font-bold text-brand"
                />
                <span className="text-xs text-muted font-medium flex items-center gap-1">
                  <HelpCircle className="size-3.5 text-muted" /> XP ganho ao atingir 100% da meta.
                </span>
              </div>
            </div>
          </>
        )}

        {/* Delete option in Edit Mode */}
        {goal && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger font-semibold">Excluir esta meta?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Não
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onDelete(goal.id);
                    onClose();
                  }}
                >
                  Sim, excluir
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                icon={Trash2}
                className="w-full justify-center text-danger hover:bg-danger/5"
                onClick={() => setConfirmDelete(true)}
              >
                Excluir meta
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
