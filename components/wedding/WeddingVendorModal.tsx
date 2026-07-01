"use client";

import { useState, useEffect } from "react";
import { Trash2, Phone, Mail, FileText, Sparkles } from "lucide-react";
import type { WeddingVendor, VendorStatus } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";

interface WeddingVendorModalProps {
  open: boolean;
  item: WeddingVendor | null;
  onClose: () => void;
  onCreate: (form: any) => any;
  onUpdate: (id: string, patch: any) => any;
  onDelete: (id: string) => void;
  onCelebrate: (result: any) => void;
}

const SERVICE_OPTIONS = [
  "Local",
  "Buffet",
  "Fotografia",
  "Vídeo",
  "Decoração",
  "Música/DJ",
  "Vestuário",
  "Alianças",
  "Convites",
  "Cerimonialista",
  "Doces/Bolo",
  "Outro",
];

export function WeddingVendorModal({
  open,
  item,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onCelebrate,
}: WeddingVendorModalProps) {
  const [name, setName] = useState("");
  const [service, setService] = useState("Local");
  const [customService, setCustomService] = useState("");
  const [quotedValue, setQuotedValue] = useState<number>(0);
  const [status, setStatus] = useState<VendorStatus>("pesquisando");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setConfirmDelete(false);
      if (item) {
        setName(item.name);
        const isStandard = SERVICE_OPTIONS.includes(item.service);
        if (isStandard) {
          setService(item.service);
          setCustomService("");
        } else {
          setService("Outro");
          setCustomService(item.service);
        }
        setQuotedValue(item.quotedValue);
        setStatus(item.status);
        setContactPhone(item.contactPhone || "");
        setContactEmail(item.contactEmail || "");
        setNotes(item.notes || "");
      } else {
        setName("");
        setService("Local");
        setCustomService("");
        setQuotedValue(0);
        setStatus("pesquisando");
        setContactPhone("");
        setContactEmail("");
        setNotes("");
      }
    }
  }, [item, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Insira o nome do fornecedor.");
      return;
    }

    const finalService = service === "Outro" ? customService.trim() : service;
    if (!finalService) {
      setError("Insira o tipo de serviço.");
      return;
    }

    if (quotedValue <= 0) {
      setError("O valor orçado deve ser maior que zero.");
      return;
    }

    const payload = {
      name: name.trim(),
      service: finalService,
      quotedValue,
      status,
      contactPhone: contactPhone.trim() || null,
      contactEmail: contactEmail.trim() || null,
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
      // Confetti burst on contratar
      if (status === "contratado" && (!item || item.status !== "contratado")) {
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
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
      title={item ? "Editar fornecedor" : "Novo fornecedor"}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-500">
            <Sparkles className="size-3.5 text-amber-500" /> +30 XP ao contratar
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
        {/* Name */}
        <div>
          <Label htmlFor="wv-name">Nome do fornecedor *</Label>
          <Input
            id="wv-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Buffet Real, Banda Som Perfeito"
            autoFocus
          />
          {error && <p className="mt-1 text-xs text-danger font-semibold">{error}</p>}
        </div>

        {/* Service & Status */}
        <div className="grid gap-3 grid-cols-2">
          <div>
            <Label htmlFor="wv-service">Serviço *</Label>
            <Select id="wv-service" value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="wv-status">Status</Label>
            <Select id="wv-status" value={status} onChange={(e) => setStatus(e.target.value as VendorStatus)}>
              <option value="pesquisando">Pesquisando 🔍</option>
              <option value="orcado">Orçado 📄</option>
              <option value="contratado">Contratado 🤝</option>
              <option value="pago">Pago ✅</option>
            </Select>
          </div>
        </div>

        {/* Custom Service Input if "Outro" */}
        {service === "Outro" && (
          <div>
            <Label htmlFor="wv-custom-service">Descreva o serviço *</Label>
            <Input
              id="wv-custom-service"
              value={customService}
              onChange={(e) => setCustomService(e.target.value)}
              placeholder="Ex: Lembrancinhas, Bartender, Cabine de Fotos"
            />
          </div>
        )}

        {/* Financial: Quoted Value */}
        <div>
          <Label htmlFor="wv-value" className="flex items-center gap-1">
            <FileText className="size-3 text-muted" /> Valor do Orçamento *
          </Label>
          <CurrencyInput
            id="wv-value"
            value={quotedValue}
            onChange={(val) => setQuotedValue(val)}
            className="text-pink-500 font-semibold"
          />
        </div>

        {/* Contacts */}
        <div className="grid gap-3 grid-cols-2">
          <div>
            <Label htmlFor="wv-phone" className="flex items-center gap-1">
              <Phone className="size-3 text-muted" /> Telefone
            </Label>
            <Input
              id="wv-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="(41) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="wv-email" className="flex items-center gap-1">
              <Mail className="size-3 text-muted" /> Email
            </Label>
            <Input
              id="wv-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contato@fornecedor.com"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="wv-notes">Observações</Label>
          <Textarea
            id="wv-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Formas de pagamento, prazo de entrega, itens inclusos..."
            rows={2}
          />
        </div>

        {/* Delete option */}
        {item && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-input bg-danger/10 p-2">
                <span className="flex-1 text-sm text-danger font-semibold">Excluir este fornecedor?</span>
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
                <Trash2 className="mr-2 size-4" /> Excluir fornecedor
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
