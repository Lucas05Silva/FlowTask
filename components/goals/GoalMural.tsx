"use client";

import { Trophy, Calendar, Award } from "lucide-react";
import type { Goal } from "@/types";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

interface GoalMuralProps {
  completedGoals: Goal[];
}

export function GoalMural({ completedGoals }: GoalMuralProps) {
  if (completedGoals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-panel border border-line text-muted mb-4">
          <Trophy className="size-7" />
        </span>
        <h4 className="font-bold text-sm text-content">Seu Mural está vazio</h4>
        <p className="text-xs text-muted max-w-[260px] mt-1 leading-relaxed">
          Conclua metas pessoais, de projetos ou financeiras para vê-las brilhando aqui no mural de conquistas! 🏆
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 overflow-hidden min-h-[400px] pb-10">
      {/* CSS Floating Gold Particles Injection */}
      <style>{`
        @keyframes floatGold {
          0% { transform: translateY(110%) scale(0.3) rotate(0deg); opacity: 0; }
          30% { opacity: 0.8; }
          80% { opacity: 0.4; }
          100% { transform: translateY(-20px) scale(1.1) rotate(360deg); opacity: 0; }
        }
        .gold-sparkle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(251,191,36,0.95) 0%, rgba(245,158,11,0.2) 70%);
          pointer-events: none;
          z-index: 0;
          box-shadow: 0 0 8px rgba(251,191,36,0.6);
        }
      `}</style>

      {/* Sparkles particles background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(12)].map((_, i) => {
          const size = Math.floor(Math.random() * 8) + 6;
          const left = Math.floor(Math.random() * 95);
          const duration = Math.floor(Math.random() * 6) + 4;
          const delay = Math.floor(Math.random() * 4);

          return (
            <div
              key={i}
              className="gold-sparkle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                bottom: "-10px",
                animation: `floatGold ${duration}s infinite linear`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="size-5 text-amber-500 animate-pulse" />
          <h3 className="font-bold text-sm text-content">Mural de Conquistas ({completedGoals.length})</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {completedGoals.map((g) => (
            <Card
              key={g.id}
              className="relative overflow-hidden border-amber-400/40 bg-gradient-to-br from-amber-500/[0.02] to-amber-600/[0.04] shadow-amber-500/[0.02] border-t-4 border-t-amber-500/80 hover:shadow-pop hover:scale-[1.015] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                  <Award className="size-5" />
                </span>

                <span className="text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded border border-amber-500/20 tracking-wider">
                  +{g.xpReward} XP
                </span>
              </div>

              <div className="mt-3">
                <h4 className="font-bold text-sm text-content truncate pr-4 text-amber-900 dark:text-amber-400">
                  {g.title}
                </h4>
                {g.description && (
                  <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
                    {g.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-amber-400/15 flex items-center justify-between text-[10px] font-bold text-muted uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3 text-amber-500" /> Concluída em
                </span>
                <span className="text-content">
                  {g.completedAt ? formatDate(g.completedAt.slice(0, 10)) : "—"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
