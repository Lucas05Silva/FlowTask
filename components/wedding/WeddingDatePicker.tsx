"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface WeddingDatePickerProps {
  open: boolean;
  onClose: () => void;
  currentDate: string | null;
  currentVenue: string | null;
  currentAddress: string | null;
  onSave: (config: { weddingDate: string | null; venueName?: string | null; venueAddress?: string | null }) => any;
  onCelebrate: (result: any) => void;
}

export function WeddingDatePicker({
  open,
  onClose,
  currentDate,
  currentVenue,
  currentAddress,
  onSave,
  onCelebrate,
}: WeddingDatePickerProps) {
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (open) {
      setDate(currentDate ? currentDate.slice(0, 10) : "");
      setVenue(currentVenue || "");
      setAddress(currentAddress || "");
    }
  }, [open, currentDate, currentVenue, currentAddress]);

  const handleSave = async () => {
    const res = onSave({
      weddingDate: date || null,
      venueName: venue.trim() || null,
      venueAddress: address.trim() || null,
    });

    if (res) {
      onCelebrate(res);
      // Trigger romantic pink & gold confetti!
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#F472B6", "#FCD34D", "#FB7185", "#F59E0B"],
        });
      } catch (e) {
        console.error(e);
      }
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agendar o Grande Dia 💍"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-pink-500 to-brand text-white font-bold">
            Confirmar Data
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-muted leading-relaxed">
          Defina a data especial e o local do casamento para ativar a contagem regressiva e os marcos no calendário.
        </p>

        {/* Date Input */}
        <div>
          <Label htmlFor="wd-date" className="flex items-center gap-1.5 text-pink-500 font-semibold">
            <Calendar className="size-4" /> Data do Casamento *
          </Label>
          <Input
            id="wd-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-pink-300/30 focus:border-pink-500 font-semibold text-content"
          />
        </div>

        {/* Venue Name */}
        <div>
          <Label htmlFor="wd-venue">Nome do Local</Label>
          <Input
            id="wd-venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Ex: Villa Garden, Paróquia de São José"
          />
        </div>

        {/* Venue Address */}
        <div>
          <Label htmlFor="wd-address" className="flex items-center gap-1.5">
            <MapPin className="size-4 text-muted" /> Endereço do Local
          </Label>
          <Input
            id="wd-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Av. das Flores, 1234 - Curitiba"
          />
        </div>

        <div className="flex items-center gap-2 rounded-input bg-pink-500/5 border border-pink-500/15 p-3 text-xs text-pink-600 font-semibold dark:text-pink-400">
          <Sparkles className="size-4 shrink-0 text-amber-500" />
          <span>Contagem regressiva romântica será exibida no painel!</span>
        </div>
      </div>
    </Modal>
  );
}
