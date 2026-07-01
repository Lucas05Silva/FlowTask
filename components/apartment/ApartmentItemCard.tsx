"use client";

import { Search, FileText, ShoppingCart, Check, ExternalLink, Calendar, MessageSquare, AlertCircle } from "lucide-react";
import type { ApartmentItem } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatBRL, countdownLabel, daysUntil } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ApartmentItemCardProps {
  item: ApartmentItem;
  onClick: (item: ApartmentItem) => void;
}

const PRIORITY_META = {
  essencial: { label: "Essencial", color: "var(--danger)" },
  importante: { label: "Importante", color: "var(--warning)" },
  desejavel: { label: "Desejável", color: "var(--cat-pessoal)" },
} as const;

const STATUS_META = {
  pesquisando: { label: "Pesquisando", icon: Search, color: "var(--text-secondary)", bg: "bg-panel" },
  orcado: { label: "Orçado", icon: FileText, color: "var(--warning)", bg: "bg-warning/10" },
  comprado: { label: "Comprado", icon: ShoppingCart, color: "var(--brand-purple)", bg: "bg-brand/10" },
  entregue: { label: "Entregue", icon: Check, color: "var(--success)", bg: "bg-success/10" },
} as const;

export function ApartmentItemCard({ item, onClick }: ApartmentItemCardProps) {
  const priority = PRIORITY_META[item.priority] || { label: item.priority, color: "var(--text-secondary)" };
  const status = STATUS_META[item.status] || { label: item.status, icon: Search, color: "var(--text-secondary)", bg: "bg-panel" };
  const StatusIcon = status.icon;

  const isCompleted = item.status === "comprado" || item.status === "entregue";
  
  // Economy calculation
  const actualCostVal = item.actualCost ?? 0;
  const difference = item.estimatedCost - actualCostVal;
  const hasDiff = isCompleted && item.actualCost !== null;

  // Deadline calculation
  const deadlineDays = item.purchaseDeadline ? daysUntil(item.purchaseDeadline) : Infinity;
  const isAtrasado = !isCompleted && deadlineDays < 0;
  const isClose = !isCompleted && deadlineDays >= 0 && deadlineDays <= 7;

  return (
    <Card
      onClick={() => onClick(item)}
      className={cn(
        "group cursor-pointer select-none border border-line bg-surface p-4 transition-all duration-200 hover:scale-[1.015] hover:shadow-pop",
        isAtrasado && "border-danger/30 hover:border-danger/55",
        isClose && "border-warning/35 hover:border-warning/55"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Item Name */}
          <h4 className="font-bold text-sm text-content truncate group-hover:text-brand transition-colors">
            {item.name}
          </h4>

          {/* Badges row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider border"
              style={{ color: priority.color, borderColor: `${priority.color}25`, backgroundColor: `${priority.color}05` }}
            >
              {priority.label}
            </span>
            <span
              className={cn("inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider border border-transparent", status.bg)}
              style={{ color: status.color }}
            >
              <StatusIcon className="size-2.5" />
              {status.label}
            </span>
          </div>
        </div>

        {/* Store external Link button */}
        {item.storeLink && (
          <a
            href={item.storeLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()} // do not open edit modal
            className="grid size-8 place-items-center rounded-input border border-line bg-panel text-muted hover:bg-surface hover:text-content shrink-0 transition-colors"
            title="Acessar link da loja"
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>

      {/* Description / Notes */}
      {item.notes && (
        <p className="mt-2.5 text-xs text-muted leading-relaxed line-clamp-2 flex items-start gap-1">
          <MessageSquare className="size-3 text-muted/65 shrink-0 mt-0.5" />
          <span>{item.notes}</span>
        </p>
      )}

      {/* Financial Details row */}
      <div className="mt-3.5 flex flex-col gap-1 border-t border-line/45 pt-3 text-xs">
        <div className="flex items-center justify-between font-semibold">
          <span className="text-muted">Estimado:</span>
          <span className="text-content font-bold">{formatBRL(item.estimatedCost)}</span>
        </div>

        {isCompleted && item.actualCost !== null && (
          <div className="flex items-center justify-between font-semibold">
            <span className="text-muted">Pago:</span>
            <span className="text-content font-bold">{formatBRL(item.actualCost)}</span>
          </div>
        )}

        {/* Economy indicator */}
        {hasDiff && (
          <div className="mt-1 flex items-center justify-end">
            {difference > 0 ? (
              <span className="text-[10px] font-bold text-success bg-success/5 border border-success/15 px-1.5 py-0.5 rounded">
                Economizou {formatBRL(difference)}
              </span>
            ) : difference < 0 ? (
              <span className="text-[10px] font-bold text-danger bg-danger/5 border border-danger/15 px-1.5 py-0.5 rounded">
                Estourou {formatBRL(Math.abs(difference))}
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-muted bg-panel border border-line/40 px-1.5 py-0.5 rounded">
                No orçamento
              </span>
            )}
          </div>
        )}
      </div>

      {/* Deadline row */}
      {item.purchaseDeadline && !isCompleted && (
        <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold text-muted uppercase tracking-wider bg-panel/30 border border-line/35 px-2 py-1 rounded">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3 text-muted/80" /> Compra
          </span>
          <span className={cn(isAtrasado ? "text-danger" : isClose ? "text-warning" : "text-content")}>
            {countdownLabel(item.purchaseDeadline)}
          </span>
        </div>
      )}
    </Card>
  );
}
