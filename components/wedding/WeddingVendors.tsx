"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Phone, Mail, FileText, CheckCircle, HelpCircle, MessageSquare } from "lucide-react";
import type { WeddingVendor, VendorStatus } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatBRL } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface WeddingVendorsProps {
  vendors: WeddingVendor[];
  onVendorClick: (vendor: WeddingVendor) => void;
  onCreateClick: () => void;
}

const STATUS_META = {
  pesquisando: { label: "Pesquisando", color: "var(--text-secondary)", bg: "bg-panel" },
  orcado: { label: "Orçado", color: "var(--warning)", bg: "bg-warning/10" },
  contratado: { label: "Contratado", color: "var(--brand-purple)", bg: "bg-brand/10" },
  pago: { label: "Pago", color: "var(--success)", bg: "bg-success/10" },
} as const;

export function WeddingVendors({ vendors, onVendorClick, onCreateClick }: WeddingVendorsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todas" | VendorStatus>("todas");

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch =
        !searchQuery ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.service.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === "todas" || v.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [vendors, searchQuery, filterStatus]);

  const totalContractedVal = useMemo(() => {
    return vendors
      .filter((v) => v.status === "contratado" || v.status === "pago")
      .reduce((sum, v) => sum + v.quotedValue, 0);
  }, [vendors]);

  return (
    <div className="space-y-6">
      {/* Resumo de Fornecedores */}
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 border-pink-100/35 bg-gradient-to-br from-panel/30 to-panel/70">
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Total Contratado / Fechado</h4>
          <h3 className="text-2xl font-extrabold text-pink-500">{formatBRL(totalContractedVal)}</h3>
        </div>
        <div className="flex gap-4 text-xs font-semibold text-muted">
          <div>
            Pesquisando: <span className="text-content font-bold">{vendors.filter((v) => v.status === "pesquisando").length}</span>
          </div>
          <div>
            Contratados: <span className="text-content font-bold">{vendors.filter((v) => v.status === "contratado" || v.status === "pago").length}</span>
          </div>
        </div>
      </Card>

      {/* Toolbar filters */}
      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center border-pink-100/35">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar fornecedor ou serviço..."
            className="pl-9"
          />
        </div>

        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="md:w-56 shrink-0"
        >
          <option value="todas">Todos status</option>
          <option value="pesquisando">Pesquisando</option>
          <option value="orcado">Orçado</option>
          <option value="contratado">Contratado</option>
          <option value="pago">Pago</option>
        </Select>

        <Button
          onClick={onCreateClick}
          size="sm"
          icon={Plus}
          className="bg-pink-500 hover:bg-pink-600 text-white font-bold shrink-0 self-start md:self-auto"
        >
          Novo fornecedor
        </Button>
      </Card>

      {/* Grid of vendors */}
      {filteredVendors.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Nenhum fornecedor encontrado!"
          description={
            searchQuery || filterStatus !== "todas"
              ? "Experimente mudar as opções de filtragem."
              : "Cadastre os fornecedores pesquisados ou orçados para o seu casamento 🌸"
          }
          action={
            !searchQuery &&
            filterStatus === "todas" && (
              <Button size="sm" onClick={onCreateClick} className="bg-pink-500 hover:bg-pink-600 text-white font-bold">
                Cadastrar primeiro fornecedor
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => {
            const meta = STATUS_META[vendor.status] || { label: vendor.status, color: "var(--text-secondary)", bg: "bg-panel" };

            return (
              <Card
                key={vendor.id}
                onClick={() => onVendorClick(vendor)}
                className="group cursor-pointer select-none border border-line bg-surface p-4 hover:scale-[1.015] hover:shadow-pop transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-content truncate group-hover:text-pink-500 transition-colors">
                      {vendor.name}
                    </h4>
                    <p className="text-xs text-muted font-medium mt-0.5">{vendor.service}</p>
                  </div>
                  {/* Status Badge */}
                  <span
                    className={cn(
                      "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider border border-transparent shrink-0",
                      meta.bg
                    )}
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>

                {/* Quoted Cost details */}
                <div className="mt-3.5 flex items-center justify-between border-t border-line/45 pt-3 text-xs font-semibold">
                  <span className="text-muted">Valor cotado:</span>
                  <span className="text-content font-bold text-sm">{formatBRL(vendor.quotedValue)}</span>
                </div>

                {/* Contact list details */}
                {(vendor.contactPhone || vendor.contactEmail) && (
                  <div className="mt-3.5 flex flex-col gap-2 rounded-input bg-panel/30 border border-line/35 p-2.5 text-xs font-medium text-muted">
                    {vendor.contactPhone && (
                      <a
                        href={`tel:${vendor.contactPhone.replace(/\D/g, "")}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 hover:text-pink-500 transition-colors truncate"
                      >
                        <Phone className="size-3.5 shrink-0 text-muted/65" />
                        <span>{vendor.contactPhone}</span>
                      </a>
                    )}
                    {vendor.contactEmail && (
                      <a
                        href={`mailto:${vendor.contactEmail}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 hover:text-pink-500 transition-colors truncate"
                      >
                        <Mail className="size-3.5 shrink-0 text-muted/65" />
                        <span>{vendor.contactEmail}</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Notes */}
                {vendor.notes && (
                  <p className="mt-3 text-[11px] text-muted flex items-start gap-1 line-clamp-2 leading-relaxed">
                    <MessageSquare className="size-3 text-muted/65 mt-0.5 shrink-0" />
                    <span>{vendor.notes}</span>
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
