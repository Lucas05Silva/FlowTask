"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Flame,
  CheckCircle2,
  Rocket,
  BadgeCheck,
  PiggyBank,
  Sparkles,
  Trophy,
  Calendar,
  Layers,
  ChevronRight,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useData } from "@/hooks/useData";
import { resetData } from "@/lib/data/store";
import { levelFromXp } from "@/lib/gamification";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { XPBar } from "@/components/gamification/XPBar";
import { AchievementBadge } from "@/components/gamification/AchievementBadge";
import { Ranking } from "@/components/gamification/Ranking";
import { NotificationPrefsCard } from "@/components/notifications/NotificationPrefsCard";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "Claro ☀️" },
  { value: "dark", label: "Escuro 🌙" },
  { value: "system", label: "Sistema 💻" },
] as const;

export default function PerfilPage() {
  const { user } = useAuth();
  const { setting, setSetting } = useTheme();
  const data = useData();

  const unlocked = useMemo(
    () => new Set(data.userAchievements.filter((ua) => ua.userId === user?.id).map((ua) => ua.achievementId)),
    [data.userAchievements, user?.id],
  );

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
  const level = levelFromXp(user.xp);

  // Stagger items variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Meu perfil" subtitle="Acompanhe sua jornada, conquistas e configurações." />

      {/* HEADER CARD */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden rounded-card border border-brand/20 bg-gradient-to-r from-brand/10 via-pink-500/[0.04] to-purple-500/10 p-6 md:p-8 shadow-soft"
      >
        <div className="absolute -right-8 -top-8 text-brand/5 pointer-events-none transition-colors hidden md:block select-none">
          <Trophy className="size-64 stroke-[0.5px] fill-current" />
        </div>

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <Avatar user={user} size={92} ring className="shadow-pop" />
            <div className="space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-2xl font-black text-content">{user.name}</h2>
                <span className="self-center sm:self-auto">
                  <LevelBadge xp={user.xp} size={24} showTitle />
                </span>
              </div>
              <p className="text-sm text-muted">{user.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted font-bold mt-1">
                <Calendar className="size-3.5" />
                <span>Membro desde {formatDate(user.createdAt, { month: "long", year: "numeric" })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 bg-panel/30 border border-line/45 rounded-card p-4 self-center md:self-auto shadow-sm">
            <div className="text-center px-2">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Streak Ativo</span>
              <span className="mt-1 block">
                <StreakCounter count={user.streakCount} size="md" />
              </span>
            </div>
            <div className="w-[1px] h-8 bg-line/45 shrink-0" />
            <div className="text-center px-2">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Nível</span>
              <span className="text-base font-black text-content mt-1 block">{level.level}</span>
            </div>
            <div className="w-[1px] h-8 bg-line/45 shrink-0" />
            <div className="text-center px-2">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Conquistas</span>
              <span className="text-base font-black text-content mt-1 block">{unlocked.size} / 11</span>
            </div>
          </div>
        </div>

        {/* XP Track in Header */}
        <div className="mt-6 border-t border-line/40 pt-5">
          <XPBar xp={user.xp} />
        </div>
      </motion.div>

      {/* BODY COLUMNS */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN (Col span 2) - Stats and Achievements */}
        <div className="lg:col-span-2 space-y-6">
          {/* STATS SECTION */}
          <Card className="p-5">
            <CardTitle className="mb-4 text-base font-extrabold text-content flex items-center gap-2">
              <Layers className="size-4.5 text-brand" /> Estatísticas Gerais
            </CardTitle>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              <StatCard label="XP Acumulado" value={user.xp} detail="Total de pontos" color="border-purple-100/25 text-brand" />
              <StatCard label="Tarefas Concluídas" value={stats?.completedTasks ?? 0} detail="Finalizadas com sucesso" color="border-emerald-100/25 text-success" />
              <StatCard label="Projetos Entregues" value={stats?.completedProjects ?? 0} detail="Fluxo FlowSys concluído" color="border-blue-100/25 text-blue-500" />
              <StatCard label="Streak Recorde" value={user.streakRecord || user.streakCount} detail="Melhor sequência" color="border-orange-100/25 text-orange-500" />
              <StatCard label="Dívidas Quitadas" value={stats?.paidDebts ?? 0} detail="Eliminadas do financeiro" color="border-red-100/25 text-danger" />
              <StatCard label="Metas Atingidas" value={stats?.reachedGoals ?? 0} detail="Sonhos realizados" color="border-amber-100/25 text-amber-500" />
            </div>
          </Card>

          {/* ACHIEVEMENTS GRID MURAL */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-content flex items-center gap-2">
                  <Award className="size-4.5 text-pink-500" /> Mural de Conquistas
                </CardTitle>
                <p className="text-xs text-muted mt-0.5">
                  Complete metas e tarefas para desbloquear badges exclusivos.
                </p>
              </div>
              <span className="text-xs font-black text-pink-500 bg-pink-500/5 border border-pink-500/10 px-2.5 py-1 rounded-full shrink-0">
                {unlocked.size} / {data.achievements.length} Desbloqueadas
              </span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {data.achievements.map((ach) => {
                const isUnlocked = unlocked.has(ach.id);
                const uaRecord = data.userAchievements.find((ua) => ua.userId === user.id && ua.achievementId === ach.id);
                const dateUnlocked = uaRecord ? uaRecord.unlockedAt : null;

                return (
                  <motion.div key={ach.id} variants={itemVariants}>
                    <AchievementBadge
                      achievement={ach}
                      unlocked={isUnlocked}
                      unlockedAt={dateUnlocked}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </Card>
        </div>

        {/* RIGHT COLUMN (Col span 1) - Ranking, Preferences, Demo Data Reset */}
        <div className="lg:col-span-1 space-y-6">
          {/* RANKING COMPARATIVE CARD */}
          <Card className="p-5 border-pink-100/20 shadow-sm">
            <CardTitle className="mb-4 text-base font-extrabold text-content flex items-center gap-2">
              <Trophy className="size-4.5 text-pink-500" /> Comparativo de Ranking
            </CardTitle>
            <Ranking variant="full" />
          </Card>

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

          {/* NOTIFICATION PREFERENCES */}
          <NotificationPrefsCard />

          {/* DEMO DATA RESTORE */}
          <Card className="p-5 border-dashed border-line">
            <CardTitle className="mb-1 text-sm font-extrabold text-content">Dados de Demonstração</CardTitle>
            <p className="mb-4 text-xs leading-relaxed text-muted">
              A plataforma está rodando localmente. Você pode redefinir o banco de dados para os valores iniciais de seed a qualquer momento.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-bold text-muted hover:text-danger hover:border-danger/30 transition-colors justify-center"
              onClick={() => {
                if (confirm("Deseja redefinir todo o banco de dados local? Essa ação é irreversível.")) {
                  resetData();
                }
              }}
            >
              Restaurar Base de Seed
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
