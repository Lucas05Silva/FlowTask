"use client";

import { useState } from "react";
import { ChevronDown, CircleDot, CircleDashed, CheckCircle2, ExternalLink, MapPin, HelpCircle } from "lucide-react";
import type { CanadaDecision, CanadaDecisionCategory } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { DECISION_CATEGORY_META, VISA_TYPES, VISA_INFO_LINK } from "@/lib/canada-data";
import { formatDate, cn } from "@/lib/utils";

interface CanadaDecisionsProps {
  decisions: CanadaDecision[];
  onAnswer: (id: string, answer: string) => void;
  onSetStatus: (id: string, status: CanadaDecision["status"]) => void;
}

const STATUS_META: Record<CanadaDecision["status"], { label: string; color: string; icon: typeof CircleDot }> = {
  pendente: { label: "Pendente", color: "var(--danger)", icon: CircleDashed },
  pesquisando: { label: "Pesquisando", color: "var(--warning)", icon: CircleDot },
  decidido: { label: "Decidido", color: "var(--success)", icon: CheckCircle2 },
};

function DecisionCard({
  decision,
  blocked,
  onAnswer,
  onSetStatus,
}: {
  decision: CanadaDecision;
  blocked: boolean;
  onAnswer: (answer: string) => void;
  onSetStatus: (status: CanadaDecision["status"]) => void;
}) {
  const [responding, setResponding] = useState(false);
  const [draft, setDraft] = useState(decision.answer ?? "");
  const status = STATUS_META[decision.status];
  const StatusIcon = status.icon;

  return (
    <Card
      className={cn(
        "flex flex-col gap-3",
        decision.status === "decidido" ? "border-success/40" : "border-brand/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge color={undefined} className="mb-1.5">
            {DECISION_CATEGORY_META[decision.category].label}
          </Badge>
          <h3 className="font-semibold text-content">{decision.question}</h3>
        </div>
        <span
          className="flex shrink-0 items-center gap-1 rounded-badge px-2 py-0.5 text-[11px] font-semibold"
          style={{ color: status.color, backgroundColor: `color-mix(in srgb, ${status.color} 16%, transparent)` }}
        >
          <StatusIcon className="size-3" />
          {status.label}
        </span>
      </div>

      {blocked && decision.status !== "decidido" && (
        <p className="rounded-input bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
          ⚠️ Aguardando decisão da cidade
        </p>
      )}

      {decision.answer && decision.status === "decidido" ? (
        <p className="rounded-input bg-success/10 px-3 py-2 text-sm font-medium text-content">{decision.answer}</p>
      ) : responding ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escreva a resposta..."
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setResponding(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={!draft.trim()}
              onClick={() => {
                onAnswer(draft);
                setResponding(false);
              }}
            >
              Decidido ✓
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setResponding(true)}>
            + Responder
          </Button>
          {decision.status === "pendente" && (
            <Button size="sm" variant="ghost" onClick={() => onSetStatus("pesquisando")}>
              Marcar como pesquisando
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export function CanadaDecisions({ decisions, onAnswer, onSetStatus }: CanadaDecisionsProps) {
  const [visaOpen, setVisaOpen] = useState(false);
  const cityDecided = decisions.some((d) => d.category === "cidade" && d.status === "decidido");

  const pending = decisions.filter((d) => d.status !== "decidido");
  const decided = decisions.filter((d) => d.status === "decidido");
  const [showDecided, setShowDecided] = useState(false);

  return (
    <div className="space-y-5">
      {/* Visa accordion */}
      <Card padded={false} className="overflow-hidden">
        <button
          type="button"
          onClick={() => setVisaOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-content">
            ℹ️ Principais tipos de visto para o Canadá
          </span>
          <ChevronDown className={cn("size-4 text-muted transition-transform", visaOpen && "rotate-180")} />
        </button>
        {visaOpen && (
          <div className="border-t border-line px-4 py-3.5">
            <ul className="space-y-2 text-sm text-content">
              {VISA_TYPES.map((v) => (
                <li key={v.name}>
                  <strong>{v.name}</strong> — <span className="text-muted">{v.description}</span>
                </li>
              ))}
            </ul>
            <a
              href={VISA_INFO_LINK}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              Saiba mais no site do governo canadense <ExternalLink className="size-3" />
            </a>
          </div>
        )}
      </Card>

      {decisions.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nenhuma decisão tomada ainda"
          description="Comece pela cidade! 🗺️"
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {pending.map((d) => (
              <DecisionCard
                key={d.id}
                decision={d}
                blocked={d.category === "visto" && !cityDecided}
                onAnswer={(answer) => onAnswer(d.id, answer)}
                onSetStatus={(status) => onSetStatus(d.id, status)}
              />
            ))}
          </div>

          {decided.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowDecided((o) => !o)}
                className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-content"
              >
                <ChevronDown className={cn("size-4 transition-transform", showDecided && "rotate-180")} />
                Decisões tomadas ({decided.length})
              </button>
              {showDecided && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {decided.map((d) => (
                    <DecisionCard
                      key={d.id}
                      decision={d}
                      blocked={false}
                      onAnswer={(answer) => onAnswer(d.id, answer)}
                      onSetStatus={(status) => onSetStatus(d.id, status)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
