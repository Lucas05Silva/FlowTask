"use client";

import { useState } from "react";
import { Star, Check, Plus, X, ExternalLink, Square, CheckSquare, Trash2 } from "lucide-react";
import type { CanadaCity, CanadaChecklistItem } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoalProgress } from "@/components/goals/GoalProgress";
import { CHECKLIST_CATEGORY_META, CHECKLIST_PRIORITY_META, COST_OF_LIVING_LINK } from "@/lib/canada-data";
import { formatBRL, cn } from "@/lib/utils";

interface CanadaLogisticaProps {
  cities: CanadaCity[];
  checklist: CanadaChecklistItem[];
  onAddCityPoint: (id: string, kind: "pros" | "cons", text: string) => void;
  onRemoveCityPoint: (id: string, kind: "pros" | "cons", index: number) => void;
  onToggleFavoriteCity: (id: string) => void;
  onChooseCity: (id: string) => void;
  onToggleChecklist: (id: string) => void;
}

function CityPointList({
  points,
  kind,
  onAdd,
  onRemove,
}: {
  points: string[];
  kind: "pros" | "cons";
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase text-muted">{kind === "pros" ? "Pontos positivos" : "Pontos negativos"}</p>
      <ul className="space-y-1">
        {points.map((p, i) => (
          <li key={i} className="group flex items-center justify-between gap-1 text-xs text-content">
            <span className={cn(kind === "pros" ? "text-success" : "text-danger")}>{kind === "pros" ? "+" : "−"}</span>
            <span className="min-w-0 flex-1 truncate">{p}</span>
            <button onClick={() => onRemove(i)} className="text-muted opacity-0 group-hover:opacity-100">
              <X className="size-3" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              onAdd(draft);
              setDraft("");
            }
          }}
          placeholder={kind === "pros" ? "+ adicionar ponto positivo" : "+ adicionar ponto negativo"}
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}

export function CanadaLogistica({
  cities,
  checklist,
  onAddCityPoint,
  onRemoveCityPoint,
  onToggleFavoriteCity,
  onChooseCity,
  onToggleChecklist,
}: CanadaLogisticaProps) {
  const chosen = cities.some((c) => c.isChosen);
  const phases: CanadaChecklistItem["category"][] = ["brasil", "chegada", "instalacao"];

  return (
    <div className="space-y-6">
      {/* City comparator */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-content">Comparador de cidades</h3>
          <a
            href={COST_OF_LIVING_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
          >
            Custo de vida no Numbeo <ExternalLink className="size-3" />
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <Card
              key={city.id}
              className={cn("flex flex-col gap-3", city.isChosen && "border-success ring-1 ring-success/30")}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-content">{city.name}</h4>
                  <p className="text-xs text-muted">{city.province}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleFavoriteCity(city.id)}
                  aria-label="Favoritar"
                  className={cn("shrink-0", city.isFavorite ? "text-warning" : "text-muted")}
                >
                  <Star className={cn("size-5", city.isFavorite && "fill-current")} />
                </button>
              </div>

              {city.avgRent1br != null && (
                <p className="text-sm font-semibold text-content">
                  CAD {city.avgRent1br.toLocaleString("pt-BR")}/mês <span className="text-xs font-normal text-muted">(1 quarto)</span>
                </p>
              )}

              {city.isChosen && (
                <Badge color="var(--success)" className="w-fit">
                  <Check className="size-3" /> Cidade escolhida
                </Badge>
              )}

              <CityPointList
                points={city.pros}
                kind="pros"
                onAdd={(t) => onAddCityPoint(city.id, "pros", t)}
                onRemove={(i) => onRemoveCityPoint(city.id, "pros", i)}
              />
              <CityPointList
                points={city.cons}
                kind="cons"
                onAdd={(t) => onAddCityPoint(city.id, "cons", t)}
                onRemove={(i) => onRemoveCityPoint(city.id, "cons", i)}
              />

              {!city.isChosen && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={chosen}
                  onClick={() => onChooseCity(city.id)}
                  className="mt-1"
                >
                  Escolher esta cidade
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Checklist by phase */}
      <div className="space-y-4">
        <h3 className="font-semibold text-content">Checklist de logística</h3>
        {phases.map((phase) => {
          const items = checklist.filter((c) => c.category === phase);
          if (items.length === 0) return null;
          const done = items.filter((i) => i.status === "concluido").length;
          const meta = CHECKLIST_CATEGORY_META[phase];
          return (
            <Card key={phase} padded={false} className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-panel/40 px-4 py-3">
                <h4 className="font-semibold text-content">
                  {meta.emoji} {meta.label}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">{done}/{items.length}</span>
                  <div className="w-16">
                    <GoalProgress current={done} target={items.length} size="sm" color="var(--brand-purple)" />
                  </div>
                </div>
              </div>
              <div className="divide-y divide-line/60">
                {items.map((item) => {
                  const isDone = item.status === "concluido";
                  const prio = CHECKLIST_PRIORITY_META[item.priority];
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isDone}
                        onClick={() => onToggleChecklist(item.id)}
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-input border transition-colors",
                          isDone ? "border-success bg-success/10 text-success" : "border-line text-muted hover:border-brand",
                        )}
                      >
                        {isDone ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                      </button>
                      <span className={cn("min-w-0 flex-1 text-sm text-content", isDone && "text-muted line-through")}>
                        {item.title}
                      </span>
                      <Badge color="var(--text-secondary)" className="text-[10px] uppercase">
                        {item.assignedTo === "ambos" ? "Ambos" : item.assignedTo}
                      </Badge>
                      <Badge color={prio.color} className="text-[10px] uppercase">
                        {prio.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
