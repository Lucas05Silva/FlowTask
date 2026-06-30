"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface LevelUpModalProps {
  open: boolean;
  level: number;
  title: string;
  onClose: () => void;
}

export function LevelUpModal({ open, level, title, onClose }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Subiu para o nível ${level}`}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 18, stiffness: 280 }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-card border border-line bg-surface p-8 text-center shadow-pop"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32"
              style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(173,136,237,0.35), transparent)" }}
            />
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 220, delay: 0.1 }}
              className="relative mx-auto grid size-24 place-items-center rounded-full text-white shadow-pop"
              style={{ background: "linear-gradient(135deg, #ad88ed, #312199)" }}
            >
              <span className="font-[family-name:var(--font-poppins)] text-4xl font-bold">{level}</span>
            </motion.div>
            <p className="relative mt-5 text-sm font-semibold uppercase tracking-wide text-brand">Subiu de nível!</p>
            <h2 className="relative mt-1 text-2xl font-bold text-content">{title}</h2>
            <p className="relative mt-2 text-sm text-muted">
              Você alcançou o nível {level}. Continue assim — Thaiane e Lucas estão de olho! 🚀
            </p>
            <Button className="relative mt-6 w-full justify-center" onClick={onClose}>
              Bora continuar!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
