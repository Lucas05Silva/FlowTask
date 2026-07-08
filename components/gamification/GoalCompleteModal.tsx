"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fireBigConfetti } from "@/lib/confetti";
import type { Goal } from "@/types";

interface GoalCompleteModalProps {
  open: boolean;
  goal: Goal | null;
  onClose: () => void;
  onViewGoals: () => void;
}

export function GoalCompleteModal({ open, goal, onClose, onViewGoals }: GoalCompleteModalProps) {
  // Fire extra big confetti on open
  useEffect(() => {
    if (open && goal) {
      void fireBigConfetti();
      const t1 = setTimeout(() => void fireBigConfetti(), 800);
      const t2 = setTimeout(() => void fireBigConfetti(), 1800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [open, goal]);

  if (!goal) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md overflow-hidden rounded-card border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] via-surface to-surface p-6 text-center shadow-2xl"
          >
            {/* Sparkles elements */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 text-amber-500/10 pointer-events-none select-none">
              <Trophy className="size-48 stroke-[0.5px] fill-current" />
            </div>

            <div className="relative space-y-5">
              {/* Trophy icon */}
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-600 dark:text-amber-400 shadow-lg animate-bounce">
                <Trophy className="size-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  🏆 Meta Concluída!
                </h3>
                <p className="text-sm text-muted-foreground font-semibold">
                  Parabéns! Vocês atingiram o objetivo juntos.
                </p>
              </div>

              {/* Goal details card */}
              <div className="rounded-input border border-line bg-panel/30 p-4 space-y-3.5 text-left">
                <h4 className="text-md font-extrabold text-content text-center">
                  "{goal.title}"
                </h4>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                    <span>Progresso Final</span>
                    <span className="text-success flex items-center gap-1">
                      <CheckCircle className="size-3.5" /> {goal.targetAmount}/{goal.targetAmount} {goal.unit || "itens"}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-panel">
                    <div className="h-full w-full bg-success rounded-full" />
                  </div>
                </div>
              </div>

              {/* Rewards */}
              <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 border border-brand/20 px-4 py-2 text-sm font-black text-brand">
                <Star className="size-4 fill-brand/20 animate-spin" />
                <span>+{goal.xpReward} XP Concedidos!</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={onViewGoals}
                  className="flex-1 border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 font-bold"
                >
                  Ver Metas
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-md shadow-amber-500/20"
                >
                  Continuar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
