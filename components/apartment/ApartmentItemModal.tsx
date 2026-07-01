"use client";

import { useState, useEffect } from "react";
import { Trash2, AlertCircle, Sparkles } from "lucide-react";
import type { ApartmentItem, ItemPriority, ItemStatus } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";

import { cn } from "@/lib/utils";

interface ApartmentItemModalProps {
  open: boolean;
  item: ApartmentItem | null;
  onClose: () => void;
  onCreate: (form: any) => any;
  onUpdate: (id: string, patch: any) => any;
  onDelete: (id: string) => void;
  onCelebrate: (result: any) => void;
}

const ROOM_OPTIONS = [
  { value: "sala", label: "Sala 📺" },
  { value: "quarto", label: "Quarto 🛏️" },
  { value: "cozinha", label: "Cozinha 🍳" },
  { value: "banheiro", label: "Banheiro 🚿" },
  { value: "lavanderia", label: "Lavanderia 🧺" },
  { value: "escritório", label: "Escritório 💻" },
  { value: "outro", label: "Outro cômodo... 🚪" },
];

export function ApartmentItemModal({
  open,
  item,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onCelebrate,
}: ApartmentItemModalProps) {
  const [name, setName] = useState("");
  const [roomSelect, setRoomSelect] = useState("sala");
  const [customRoom, setCustomRoom] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [actualCost, setActualCost] = useState<number | null>(null);
  const [priority, setPriority] = useState<ItemPriority>("essencial");
  const [status, setStatus] = useState<ItemStatus>("pesquisando");
  const [purchaseDeadline, setPurchaseDeadline] = useState("");
  const [storeLink, setStoreLink] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync editing item on load
  useEffect(() => {
    if (open) {
      setError(null);
      setConfirmDelete(false);
      if (item) {
        setName(item.name);
        const lowerRoom = item.room.toLowerCase().trim();
        const isStandard = ["sala", "quarto", "cozinha", "banheiro", "lavanderia", "escritório"].includes(lowerRoom);
        if (isStandard) {
          setRoomSelect(lowerRoom);
          setCustomRoom("");
        } else {
          setRoomSelect("outro");
          setCustomRoom(item.room);
        }
        setEstimatedCost(item.estimatedCost);
        setActualCost(item.actualCost);
        setPriority(item.priority);
        setStatus(item.status);
        setPurchaseDeadline(item.purchaseDeadline ? item.purchaseDeadline.slice(0, 10) : "");
        setStoreLink(item.storeLink || "");
        setNotes(item.notes || "");
      } else {
        setName("");
        setRoomSelect("sala");
        setCustomRoom("");
        setEstimatedCost(0);
        setActualCost(null);
        setPriority("essencial");
        setStatus("pesquisando");
        setPurchaseDeadline("");
        setStoreLink("");
        setNotes("");
      }
    }
  }, [item, open]);

  // If status is changed to comprado/entregue, populate actual cost with estimated if empty
  useEffect(() => {
    const isCompleted = status === "comprado" || status === "entregue";
    if (isCompleted && actualCost === null) {
      setActualCost(estimatedCost);
    } else if (!isCompleted) {
      setActualCost(null);
    }
  }, [status]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Insira o nome do item.");
      return;
    }

    const finalRoom = roomSelect === "outro" ? customRoom.trim() : roomSelect;
    if (!finalRoom) {
      setError("Insira o nome do cômodo.");
      return;
    }

    if (estimatedCost <= 0) {
      setError("O custo estimado deve ser maior que zero.");
      return;
    }

    const isCompleted = status === "comprado" || status === "entregue";
    if (isCompleted && (actualCost === null || actualCost <= 0)) {
      setError("O custo real (pago) é obrigatório ao marcar como comprado/entregue.");
      return;
    }

    const payload = {
      name: name.trim(),
      room: finalRoom.toLowerCase(),
      estimatedCost,
      actualCost: isCompleted ? actualCost : null,
      priority,
      status,
      purchaseDeadline: purchaseDeadline || null,
      storeLink: storeLink.trim() || null,
      notes: notes.trim(),
    };

    let res = null;
    if (item) {
      res = onUpdate(item.id, payload);
    } else {
      res = onCreate(payload);
    }

    if (res) {
      onCelebrate(res);
    }
    onClose();
  };

  const isCompleted = status === "comprado" || status === "entregue";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Editar item de mobília" : "Novo item de mobília"}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
            <Sparkles className="size-3.5 text-amber-500" /> +20 XP ao comprar
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-brand">
              Salvar
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Item Name */}
        <div>
          <Label htmlFor="ai-name">Nome do item *</Label>
          <Input
            id="ai-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Sofá retrátil, Microondas 30L"
            autoFocus
          />
          {error && <p className="mt-1 text-xs text-danger font-semibold">{error}</p>}
        </div>

        {/* Room select */}
        <div className="grid gap-3 grid-cols-2">
          <div>
            <Label htmlFor="ai-room-sel">Cômodo *</Label>
            <Select id="ai-room-sel" value={roomSelect} onChange={(e) => setRoomSelect(e.target.value)}>
              {ROOM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="ai-status">Status</Label>
            <Select id="ai-status" value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)}>
              <option value="pesquisando">Pesquisando 🔍</option>
              <option value="orcado">Orçado 📄</option>
              <option value="comprado">Comprado 🛒</option>
              <option value="entregue">Entregue ✅</option>
            </Select>
          </div>
        </div>

        {/* Custom Room Input if "outro" */}
        {roomSelect === "outro" && (
          <div>
            <Label htmlFor="ai-custom-room">Nome do cômodo customizado *</Label>
            <Input
              id="ai-custom-room"
              value={customRoom}
              onChange={(e) => setCustomRoom(e.target.value)}
              placeholder="Ex: Sacada, Closet, Corredor"
            />
          </div>
        )}

        {/* Financial: Estimated & Actual Cost */}
        <div className="grid gap-3 grid-cols-2">
          <div>
            <Label htmlFor="ai-est">Custo estimado *</Label>
            <CurrencyInput
              id="ai-est"
              value={estimatedCost}
              onChange={(val) => setEstimatedCost(val)}
              className="text-brand font-semibold"
            />
          </div>
          <div>
            <Label htmlFor="ai-act" className={cn(!isCompleted && "opacity-50")}>
              Custo real (pago) {isCompleted && "*"}
            </Label>
            <CurrencyInput
              id="ai-act"
              value={actualCost ?? 0}
              onChange={(val) => setActualCost(val)}
              disabled={!isCompleted}
              className={cn(isCompleted ? "text-success border-success/20 focus:border-success font-semibold" : "bg-panel text-muted")}
            />
          </div>
        </div>

        {/* Priority Chips */}
        <div>
          <Label>Prioridade</Label>
          <div className="grid grid-cols-3 gap-2 border border-line p-1 rounded-input bg-panel/30">
            {(["essencial", "importante", "desejavel"] as ItemPriority[]).map((p) => {
              const active = priority === p;
              const colorMap = {
                essencial: "text-danger",
                importante: "text-warning",
                desejavel: "text-info",
              };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "py-1.5 text-xs font-bold rounded capitalize transition-all",
                    active
                      ? `bg-surface shadow-sm border border-line/20 ${colorMap[p]}`
                      : "text-muted hover:text-content"
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Deadline & Store Link */}
        <div className="grid gap-3 grid-cols-2">
          <div>
            <Label htmlFor="ai-deadline">Prazo de compra</Label>
            <Input id="ai-deadline" type="date" value={purchaseDeadline} onChange={(e) => setPurchaseDeadline(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="ai-link">Link da loja</Label>
            <Input
              id="ai-link"
              value={storeLink}
              onChange={(e) => setStoreLink(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="ai-notes">Observações</Label>
          <Textarea
            id="ai-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Modelo, cor, dimensões ou loja recomendada..."
            rows={2}
          />
        </div>

        {/* Delete option in Edit Mode */}
        {item && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger font-semibold">Excluir este item?</span>
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
                icon={Trash2}
                className="w-full justify-center text-danger hover:bg-danger/5"
                onClick={() => setConfirmDelete(true)}
              >
                Excluir item do apê
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
