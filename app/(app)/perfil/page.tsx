"use client";

import { useMemo } from "react";
import {
  Award,
  Footprints,
  CalendarCheck,
  Flame,
  Smile,
  Rocket,
  BadgeCheck,
  PiggyBank,
  Home,
  Heart,
  Users,
  Sparkles,
  type LucideIcon,
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
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Footprints, CalendarCheck, Flame, Smile, Rocket, BadgeCheck, PiggyBank, Home, Heart, Users, Sparkles,
};

const THEME_OPTIONS = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
] as const;

export default function PerfilPage() {
  const { user } = useAuth();
  const { setting, setSetting } = useTheme();
  const data = useData();

  const unlocked = useMemo(
    () => new Set(data.userAchievements.filter((ua) => ua.userId === user?.id).map((ua) => ua.achievementId)),
    [data.userAchievements, user?.id],
  );

  if (!user) return null;
  const level = levelFromXp(user.xp);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Meu perfil" subtitle="Seu progresso, conquistas e preferências." />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar user={user} size={88} ring />
            <h2 className="mt-3 text-xl font-bold text-content">{user.name}</h2>
            <p className="text-sm text-muted">{user.email}</p>
            <div className="mt-3">
              <LevelBadge xp={user.xp} size={32} showTitle />
            </div>
            <div className="mt-4 w-full">
              <XPBar xp={user.xp} />
            </div>
            <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center">
              <Stat label="Streak" value={<StreakCounter count={user.streakCount} />} />
              <Stat label="Nível" value={<span className="font-bold text-content">{level.level}</span>} />
              <Stat label="Conquistas" value={<span className="font-bold text-content">{unlocked.size}</span>} />
            </div>
          </div>
        </Card>

        {/* Preferences + achievements */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardTitle className="mb-3">Preferência de tema</CardTitle>
            <div className="flex gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSetting(opt.value)}
                  className={cn(
                    "flex-1 rounded-input border px-3 py-2.5 text-sm font-medium transition-colors",
                    setting === opt.value
                      ? "border-brand bg-brand/10 text-brand-dark"
                      : "border-line text-muted hover:bg-panel",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-1">Mural de conquistas</CardTitle>
            <p className="mb-4 text-sm text-muted">
              {unlocked.size} de {data.achievements.length} desbloqueadas
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.achievements.map((ach) => {
                const Icon = ICONS[ach.icon] ?? Award;
                const got = unlocked.has(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-card border p-4 text-center transition-all",
                      got ? "border-brand/40 bg-brand/5" : "border-line opacity-55 grayscale",
                    )}
                    title={ach.description}
                  >
                    <span
                      className={cn(
                        "grid size-12 place-items-center rounded-full",
                        got ? "bg-brand/15 text-brand" : "bg-panel text-muted",
                      )}
                    >
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <span className="text-xs font-semibold leading-tight text-content">{ach.title}</span>
                    <span className="text-[11px] leading-tight text-muted">{ach.description}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-1">Dados de demonstração</CardTitle>
            <p className="mb-4 text-sm text-muted">
              A plataforma está rodando com dados fictícios (fase mock). Você pode restaurar o estado inicial a qualquer momento.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("Restaurar todos os dados de demonstração?")) resetData();
              }}
            >
              Restaurar dados de demonstração
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-input bg-panel py-2">
      <div className="flex justify-center text-sm">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted">{label}</div>
    </div>
  );
}
