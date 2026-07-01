"use client";

/* Preferences load from localStorage on mount — setState in effect is intentional. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface NotifPrefs {
  dailySummary: boolean;
  deadlineAlerts: boolean;
  achievements: boolean;
}

const STORAGE_KEY = "flowtask:notif-prefs";
const DEFAULTS: NotifPrefs = { dailySummary: true, deadlineAlerts: true, achievements: false };

const OPTIONS: { key: keyof NotifPrefs; label: string; desc: string }[] = [
  { key: "dailySummary", label: "Resumo diário por email", desc: "Tarefas e compromissos do dia" },
  { key: "deadlineAlerts", label: "Alertas de prazo por email", desc: "Quando algo está perto de vencer" },
  { key: "achievements", label: "Conquistas por email", desc: "Ao desbloquear um novo badge" },
];

export function NotificationPrefsCard() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  function toggle(key: keyof NotifPrefs) {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <Card className="p-5">
      <CardTitle className="mb-1 text-sm font-extrabold text-content flex items-center gap-2">
        <Mail className="size-4 text-brand" /> Preferências de notificação
      </CardTitle>
      <p className="mb-4 text-xs text-muted">Escolha o que quer receber por email.</p>

      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <div key={opt.key} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-content">{opt.label}</p>
              <p className="text-xs text-muted">{opt.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[opt.key]}
              aria-label={opt.label}
              onClick={() => toggle(opt.key)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                prefs[opt.key] ? "bg-brand" : "bg-panel border border-line",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow-soft transition-transform",
                  prefs[opt.key] ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-input bg-cyan/10 px-3 py-2 text-center text-xs font-medium text-cyan-dark">
        Notificações por email serão ativadas em breve! 📧
      </p>
    </Card>
  );
}
