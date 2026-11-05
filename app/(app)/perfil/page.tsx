"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Layers } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useData } from "@/hooks/useData";
import { resetData } from "@/lib/data/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { Button } from "@/components/ui/Button";
import { cn, formatDate } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "Claro ☀️" },
  { value: "dark", label: "Escuro 🌙" },
  { value: "system", label: "Sistema 💻" },
] as const;

export default function PerfilPage() {
  const { user } = useAuth();
  const { setting, setSetting } = useTheme();
  const data = useData();

  const stats = useMemo(() => {
    if (!user) return null;

    // Completed tasks for user (either assigned to user, 'ambos', or created by user)
    const isMe = (assignee: string) =>
      assignee === "ambos" || assignee === (user.name.toLowerCase() === "lucas" ? "lucas" : "thaiane");

    const completedTasks = data.tasks.filter(
      (t) => t.status === "concluida" && (isMe(t.assignee) || t.createdBy === user.id)
    ).length;

    // Delivered projects (either assigned to user, 'ambos')
    const completedProjects = data.projects.filter(
      (p) => p.status === "feito" && (isMe(p.assignee) || p.assignee === "ambos")
    ).length;

    // Paid debts (created by user)
    const paidDebts = data.debts.filter(
      (d) => d.status === "quitada" && d.createdBy === user.id
    ).length;

    // Reached goals (created by user)
    const reachedGoals = data.goals.filter(
      (g) => g.status === "concluida" && g.createdBy === user.id
    ).length;

    return {
      completedTasks,
      completedProjects,
      paidDebts,
      reachedGoals,
    };
  }, [data, user]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Meu perfil" subtitle="Seus dados e configurações." />

      {/* HEADER CARD */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden rounded-card border border-brand/20 bg-gradient-to-r from-brand/10 via-pink-500/[0.04] to-purple-500/10 p-6 md:p-8 shadow-soft"
      >
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <AvatarUpload />
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-content">{user.name}</h2>
            <p className="text-sm text-muted">{user.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted font-bold mt-1">
              <Calendar className="size-3.5" />
              <span>Membro desde {formatDate(user.createdAt, { month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* BODY COLUMNS */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN (Col span 2) - Stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <CardTitle className="mb-4 text-base font-extrabold text-content flex items-center gap-2">
              <Layers className="size-4.5 text-brand" /> Estatísticas Gerais
            </CardTitle>

            <div className="grid gap-3 grid-cols-2">
              <StatCard label="Tarefas Concluídas" value={stats?.completedTasks ?? 0} detail="Finalizadas com sucesso" color="border-emerald-100/25 text-success" />
              <StatCard label="Projetos Entregues" value={stats?.completedProjects ?? 0} detail="Fluxo FlowSys concluído" color="border-blue-100/25 text-blue-500" />
              <StatCard label="Dívidas Quitadas" value={stats?.paidDebts ?? 0} detail="Eliminadas do financeiro" color="border-red-100/25 text-danger" />
              <StatCard label="Metas Atingidas" value={stats?.reachedGoals ?? 0} detail="Sonhos realizados" color="border-amber-100/25 text-amber-500" />
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN (Col span 1) - Preferences, Data Reset */}
        <div className="lg:col-span-1 space-y-6">
          {/* THEME PREFERENCES CARD */}
          <Card className="p-5">
            <CardTitle className="mb-3 text-sm font-extrabold text-content">Preferência de Tema</CardTitle>
            <div className="flex gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSetting(opt.value)}
                  className={cn(
                    "flex-1 rounded-input border px-2 py-2 text-xs font-extrabold transition-all",
                    setting === opt.value
                      ? "border-brand bg-brand/10 text-brand-dark"
                      : "border-line text-muted hover:bg-panel hover:text-content",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Card>

          {/* DANGER ZONE — wipe all data */}
          <Card className="p-5 border-dashed border-danger/30">
            <CardTitle className="mb-1 text-sm font-extrabold text-content">Zona de perigo</CardTitle>
            <p className="mb-4 text-xs leading-relaxed text-muted">
              Apaga <strong>todos os dados reais</strong> (tarefas, finanças, projetos, metas, etc.) e recomeça do zero. Sincroniza com o Supabase e afeta os dois. Esta ação é irreversível.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-bold text-muted hover:text-danger hover:border-danger/30 transition-colors justify-center"
              onClick={() => {
                if (confirm("Apagar TODOS os dados e recomeçar do zero? Esta ação é irreversível e afeta Lucas e Thaiane.")) {
                  resetData();
                }
              }}
            >
              Limpar todos os dados
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  detail: string;
  color?: string;
}

function StatCard({ label, value, detail, color }: StatCardProps) {
  return (
    <div className={cn("rounded-card border border-line bg-surface/40 p-4 text-center shadow-soft flex flex-col justify-between min-h-[105px]", color)}>
      <span className="text-[10px] text-muted font-bold uppercase tracking-wider block truncate">
        {label}
      </span>
      <span className="text-2xl font-black block my-1">
        {value}
      </span>
      <span className="text-[9px] text-muted block truncate font-medium">
        {detail}
      </span>
    </div>
  );
}
