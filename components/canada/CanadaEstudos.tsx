"use client";

import { useState } from "react";
import { Plus, Trash2, Square, CheckSquare, GraduationCap } from "lucide-react";
import type { CanadaNote, CanadaChecklistItem } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { GoalProgress } from "@/components/goals/GoalProgress";
import { KNOWN_USERS } from "@/lib/data/initialState";
import { cn } from "@/lib/utils";

interface CanadaEstudosProps {
  notes: CanadaNote[];
  checklist: CanadaChecklistItem[];
  onAddNote: (form: { title: string; content: string; category: CanadaNote["category"] }) => void;
  onUpdateNote: (id: string, patch: Partial<CanadaNote>) => void;
  onDeleteNote: (id: string) => void;
  onToggleChecklist: (id: string) => void;
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const EXAMS = ["IELTS", "CELPIP", "TOEFL", "Outro"];
const CERT_PREFIX = "[cert] ";
const RESEARCH_PREFIX = "[pesquisa] ";

interface EnglishPlan {
  level: string;
  target: string;
  exam: string;
  examDate: string;
}

function parsePlan(content: string | undefined): EnglishPlan {
  try {
    const parsed = content ? JSON.parse(content) : {};
    return { level: parsed.level ?? "B1", target: parsed.target ?? "C1", exam: parsed.exam ?? "IELTS", examDate: parsed.examDate ?? "" };
  } catch {
    return { level: "B1", target: "C1", exam: "IELTS", examDate: "" };
  }
}

function EnglishCard({
  userName,
  note,
  onSave,
}: {
  userName: string;
  note: CanadaNote | undefined;
  onSave: (plan: EnglishPlan) => void;
}) {
  const plan = parsePlan(note?.content);

  function patch(p: Partial<EnglishPlan>) {
    onSave({ ...plan, ...p });
  }

  return (
    <Card className="flex flex-col gap-3">
      <h4 className="font-semibold text-content">{userName}</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`level-${userName}`}>Nível atual</Label>
          <Select id={`level-${userName}`} value={plan.level} onChange={(e) => patch({ level: e.target.value })}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`target-${userName}`}>Meta de proficiência</Label>
          <Select id={`target-${userName}`} value={plan.target} onChange={(e) => patch({ target: e.target.value })}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`exam-${userName}`}>Exame alvo</Label>
          <Select id={`exam-${userName}`} value={plan.exam} onChange={(e) => patch({ exam: e.target.value })}>
            {EXAMS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`date-${userName}`}>Data prevista</Label>
          <Input id={`date-${userName}`} type="date" value={plan.examDate} onChange={(e) => patch({ examDate: e.target.value })} />
        </div>
      </div>
    </Card>
  );
}

function SimpleNoteList({
  title,
  placeholder,
  notes,
  prefix,
  onAdd,
  onDelete,
}: {
  title: string;
  placeholder: string;
  notes: CanadaNote[];
  prefix: string;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <Card className="flex flex-col gap-3">
      <h4 className="font-semibold text-content">{title}</h4>
      <ul className="space-y-1.5">
        {notes.map((n) => (
          <li key={n.id} className="group flex items-center justify-between gap-2 rounded-input bg-panel/40 px-3 py-2 text-sm text-content">
            <span className="min-w-0 flex-1 truncate">{n.title.replace(prefix, "")}</span>
            <button onClick={() => onDelete(n.id)} className="text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100">
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              onAdd(draft);
              setDraft("");
            }
          }}
          placeholder={placeholder}
          className="h-9"
        />
        <Button
          size="sm"
          icon={Plus}
          onClick={() => {
            if (draft.trim()) {
              onAdd(draft);
              setDraft("");
            }
          }}
        >
          Adicionar
        </Button>
      </div>
    </Card>
  );
}

export function CanadaEstudos({ notes, checklist, onAddNote, onUpdateNote, onDeleteNote, onToggleChecklist }: CanadaEstudosProps) {
  const certs = notes.filter((n) => n.category === "trabalho" && n.title.startsWith(CERT_PREFIX));
  const research = notes.filter((n) => n.category === "trabalho" && n.title.startsWith(RESEARCH_PREFIX));
  const linkedinItems = checklist.filter((c) => c.category === "estudos");
  const linkedinDone = linkedinItems.filter((c) => c.status === "concluido").length;

  function savePlan(userId: string, userName: string, plan: EnglishPlan) {
    const existing = notes.find((n) => n.category === "geral" && n.title === `Inglês-${userId}`);
    const content = JSON.stringify(plan);
    if (existing) onUpdateNote(existing.id, { content });
    else onAddNote({ title: `Inglês-${userId}`, content, category: "geral" });
  }

  return (
    <div className="space-y-5">
      {/* English */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-content">
          <GraduationCap className="size-4.5 text-brand" /> Inglês
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {KNOWN_USERS.map((u) => (
            <EnglishCard
              key={u.id}
              userName={u.name}
              note={notes.find((n) => n.category === "geral" && n.title === `Inglês-${u.id}`)}
              onSave={(plan) => savePlan(u.id, u.name, plan)}
            />
          ))}
        </div>
      </div>

      {/* Certifications */}
      <SimpleNoteList
        title="Certificações"
        placeholder="Ex: AWS Cloud Practitioner"
        notes={certs}
        prefix={CERT_PREFIX}
        onAdd={(text) => onAddNote({ title: `${CERT_PREFIX}${text}`, content: "", category: "trabalho" })}
        onDelete={onDeleteNote}
      />

      {/* Market research */}
      <SimpleNoteList
        title="Pesquisa de mercado"
        placeholder="Ex: Dev frontend tem alta demanda em Toronto"
        notes={research}
        prefix={RESEARCH_PREFIX}
        onAdd={(text) => onAddNote({ title: `${RESEARCH_PREFIX}${text}`, content: "", category: "trabalho" })}
        onDelete={onDeleteNote}
      />

      {/* LinkedIn checklist */}
      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-panel/40 px-4 py-3">
          <h4 className="font-semibold text-content">💼 LinkedIn</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted">{linkedinDone}/{linkedinItems.length}</span>
            <div className="w-16">
              <GoalProgress current={linkedinDone} target={linkedinItems.length} size="sm" color="var(--brand-purple)" />
            </div>
          </div>
        </div>
        <div className="divide-y divide-line/60">
          {linkedinItems.map((item) => {
            const isDone = item.status === "concluido";
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
                <span className={cn("text-sm text-content", isDone && "text-muted line-through")}>{item.title}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
