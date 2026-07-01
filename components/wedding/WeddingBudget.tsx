"use client";

import { useState, useMemo } from "react";
import { Plus, DollarSign, TrendingUp, HelpCircle, Save, X, Edit2 } from "lucide-react";
import type { WeddingBudgetItem } from "@/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { formatBRL } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface WeddingBudgetProps {
  budget: WeddingBudgetItem[];
  onUpdateCategory: (id: string, patch: Partial<WeddingBudgetItem>) => void;
  onCreateCategory: (category: string, estimatedCost: number) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  local: "Local/Espaço 🏰",
  buffet: "Buffet/Alimentação 🍽️",
  decoracao: "Decoração 🌸",
  foto_video: "Fotografia e Vídeo 📸",
  vestuario: "Vestuário 👗",
  aliancas: "Alianças 💍",
  convites: "Convites ✉️",
  musica: "Música/DJ 🎵",
  lua_de_mel: "Lua de Mel ✈️",
  outros: "Outros 📦",
};

export function WeddingBudget({
  budget,
  onUpdateCategory,
  onCreateCategory,
}: WeddingBudgetProps) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editEstimated, setEditEstimated] = useState(0);
  const [editActual, setEditActual] = useState(0);
  const [editNotes, setEditNotes] = useState("");

  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEstimated, setNewCatEstimated] = useState(0);
  const [newCatError, setNewCatError] = useState<string | null>(null);

  // Financial aggregates
  const totals = useMemo(() => {
    const estimated = budget.reduce((sum, b) => sum + b.estimatedCost, 0);
    const actual = budget.reduce((sum, b) => sum + b.actualCost, 0);
    return {
      estimated,
      actual,
      difference: estimated - actual,
      percentage: estimated > 0 ? Math.min(100, Math.round((actual / estimated) * 100)) : 0,
    };
  }, [budget]);

  // Donut chart calculations
  const chartSegments = useMemo(() => {
    const total = totals.estimated || 1;
    let accumulatedAngle = 0;
    const colors = [
      "#EC4899", // pink-500
      "#A855F7", // purple-500
      "#3B82F6", // blue-500
      "#14B8A6", // teal-500
      "#F59E0B", // amber-500
      "#EF4444", // red-500
      "#10B981", // emerald-500
      "#6366F1", // indigo-500
      "#EC4899",
      "#6B7280", // gray-500
    ];

    return budget
      .filter((b) => b.estimatedCost > 0)
      .map((b, idx) => {
        const pct = (b.estimatedCost / total) * 100;
        const angle = (b.estimatedCost / total) * 360;
        const segment = {
          id: b.id,
          label: CATEGORY_LABELS[b.category] || b.category,
          estimated: b.estimatedCost,
          color: colors[idx % colors.length],
          percentage: Math.round(pct),
          startAngle: accumulatedAngle,
        };
        accumulatedAngle += angle;
        return segment;
      });
  }, [budget, totals.estimated]);

  const handleEditClick = (item: WeddingBudgetItem) => {
    setEditingRow(item.id);
    setEditEstimated(item.estimatedCost);
    setEditActual(item.actualCost);
    setEditNotes(item.notes || "");
  };

  const handleSaveClick = (id: string) => {
    onUpdateCategory(id, {
      estimatedCost: editEstimated,
      actualCost: editActual,
      notes: editNotes,
    });
    setEditingRow(null);
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) {
      setNewCatError("Insira o nome da categoria.");
      return;
    }
    const cleanName = newCatName.trim().toLowerCase();
    const exists = budget.some((b) => b.category === cleanName);
    if (exists) {
      setNewCatError("Categoria já cadastrada.");
      return;
    }
    onCreateCategory(cleanName, newCatEstimated);
    setNewCatOpen(false);
    setNewCatName("");
    setNewCatEstimated(0);
    setNewCatError(null);
  };

  return (
    <div className="space-y-6">
      {/* Resumo financeiro (3 cards) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-pink-100/25 bg-surface">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Orçamento Casamento</span>
            <span className="rounded-full bg-pink-50 text-pink-500 p-2">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-content">{formatBRL(totals.estimated)}</h3>
            <p className="mt-1 text-xs text-muted">Estimativa total planejada</p>
          </div>
        </Card>

        <Card className="border-pink-100/25 bg-surface">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Gasto Atual (Pago)</span>
            <span className="rounded-full bg-success/10 text-success p-2">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-success">{formatBRL(totals.actual)}</h3>
            <p className="mt-1 text-xs text-muted">Total pago até o momento</p>
          </div>
        </Card>

        <Card className="border-pink-100/25 bg-surface">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Economia / Excesso</span>
            <span
              className={cn(
                "rounded-full p-2",
                totals.difference >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              )}
            >
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className={cn("text-2xl font-bold", totals.difference >= 0 ? "text-success" : "text-danger")}>
              {totals.difference >= 0 ? "+" : ""}
              {formatBRL(totals.difference)}
            </h3>
            <p className="mt-1 text-xs text-muted">Diferença planejado vs gasto</p>
          </div>
        </Card>
      </div>

      {/* Progress slider track */}
      <Card className="space-y-3.5 border-pink-100/25 bg-gradient-to-br from-panel/30 to-panel/70">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-muted">Progresso do Gasto</span>
          <span className="font-bold text-pink-500">{totals.percentage}% gasto</span>
        </div>
        <div className="h-3 w-full rounded-full bg-panel overflow-hidden border border-line/35">
          <div style={{ width: `${totals.percentage}%` }} className="h-full bg-pink-500 rounded-full transition-all duration-300" />
        </div>
      </Card>

      {/* Layout columns: Left table, Right donut chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Budget list table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-pink-100/25 bg-surface">
            <div className="flex items-center justify-between border-b border-line/45 pb-3">
              <CardTitle className="text-sm font-bold text-content">Distribuição do Orçamento</CardTitle>
              <Button
                onClick={() => setNewCatOpen(!newCatOpen)}
                size="sm"
                icon={Plus}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                Nova Categoria
              </Button>
            </div>

            {/* Inline add input panel */}
            {newCatOpen && (
              <div className="mt-3 grid gap-3 p-3 bg-panel/30 border border-line/40 rounded-input">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="nbc-name">Nome da Categoria</Label>
                    <Input
                      id="nbc-name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Ex: Cerimonialista, Doces"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nbc-est">Estimado (R$)</Label>
                    <Input
                      id="nbc-est"
                      type="number"
                      value={newCatEstimated || ""}
                      onChange={(e) => setNewCatEstimated(Number(e.target.value))}
                      placeholder="Ex: 1500"
                    />
                  </div>
                </div>
                {newCatError && <p className="text-xs text-danger font-semibold">{newCatError}</p>}
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setNewCatOpen(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleCreateCategory} className="bg-pink-500 text-white">
                    Confirmar
                  </Button>
                </div>
              </div>
            )}

            {/* List entries */}
            <div className="mt-4 divide-y divide-line/45">
              {budget.map((item) => {
                const isEditing = editingRow === item.id;
                const rowDiff = item.estimatedCost - item.actualCost;
                const ratio = item.estimatedCost > 0 ? Math.min(100, Math.round((item.actualCost / item.estimatedCost) * 100)) : 0;

                return (
                  <div key={item.id} className="py-3 text-xs">
                    {isEditing ? (
                      /* Editing Form Row */
                      <div className="space-y-3 p-3 bg-panel/40 border border-pink-100/10 rounded-input">
                        <div className="font-bold text-sm text-pink-500 capitalize">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <Label>Estimado (R$)</Label>
                            <Input
                              type="number"
                              value={editEstimated}
                              onChange={(e) => setEditEstimated(Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Pago/Real (R$)</Label>
                            <Input
                              type="number"
                              value={editActual}
                              onChange={(e) => setEditActual(Number(e.target.value))}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Observações</Label>
                          <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Detalhes ou sinal..." />
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" icon={X} onClick={() => setEditingRow(null)}>
                            Cancelar
                          </Button>
                          <Button size="sm" icon={Save} onClick={() => handleSaveClick(item.id)} className="bg-pink-500 text-white">
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Standard Row View */
                      <div className="group flex flex-col gap-2 p-1">
                        <div className="flex items-center justify-between font-semibold">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="capitalize font-bold text-content truncate">
                              {CATEGORY_LABELS[item.category] || item.category}
                            </span>
                            <button
                              onClick={() => handleEditClick(item)}
                              className="opacity-0 group-hover:opacity-100 hover:text-pink-500 p-0.5 text-muted transition-all shrink-0"
                              title="Editar linha"
                            >
                              <Edit2 className="size-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 font-bold">
                            <span className="text-muted">Est: {formatBRL(item.estimatedCost)}</span>
                            <span className="text-content">Pago: {formatBRL(item.actualCost)}</span>
                            <span className={cn(rowDiff >= 0 ? "text-success" : "text-danger")}>
                              {rowDiff >= 0 ? "+" : ""}
                              {formatBRL(rowDiff)}
                            </span>
                          </div>
                        </div>

                        {/* Ratio visual mini track */}
                        {item.estimatedCost > 0 && (
                          <div className="relative h-1.5 w-full bg-panel rounded-full overflow-hidden">
                            <div
                              style={{ width: `${ratio}%` }}
                              className={cn("h-full rounded-full", ratio > 100 ? "bg-danger" : "bg-pink-500")}
                            />
                          </div>
                        )}

                        {item.notes && <p className="text-[11px] text-muted italic leading-relaxed">{item.notes}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Custom SVG Donut Chart */}
        <div className="lg:col-span-1">
          <Card className="border-pink-100/25 bg-surface flex flex-col items-center justify-center p-6 h-full min-h-[350px]">
            <CardTitle className="text-sm font-bold text-content mb-6 self-start">Gráfico de Distribuição</CardTitle>

            {chartSegments.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 text-xs text-muted flex-1">
                <HelpCircle className="size-8 text-muted/65 mb-2" />
                <span>Nenhuma estimativa de custo inserida para gerar o gráfico.</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-6 w-full flex-1">
                {/* SVG Donut */}
                <div className="relative size-44 shrink-0">
                  <svg className="size-full rotate-[-90deg]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--line)" strokeWidth="8" />
                    {chartSegments.map((seg, idx) => {
                      const totalEstimated = totals.estimated || 1;
                      const ratio = seg.estimated / totalEstimated;
                      const circumference = 2 * Math.PI * 40; // ~251.3
                      const strokeDasharray = `${ratio * circumference} ${circumference}`;
                      const strokeDashoffset = -((seg.startAngle / 360) * circumference);

                      return (
                        <circle
                          key={seg.id}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="10"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      );
                    })}
                  </svg>
                  {/* Core display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Total</span>
                    <span className="text-sm font-extrabold text-content">{formatBRL(totals.estimated)}</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="grid gap-2 grid-cols-2 text-[10px] font-semibold w-full max-h-48 overflow-y-auto pr-1">
                  {chartSegments.map((seg) => (
                    <div key={seg.id} className="flex items-center gap-1.5 truncate">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-muted truncate">{seg.label}:</span>
                      <span className="text-content font-bold shrink-0">{seg.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
