"use client";

/* Variable values are seeded from the prompt defaults when the modal opens. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { Copy, Check, ChevronDown, History } from "lucide-react";
import type { TaskPrompt } from "@/types";
import { useData } from "@/hooks/useData";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { renderPrompt } from "@/lib/prompts";
import { relativeTime, cn } from "@/lib/utils";
import { PromptVariableInput } from "./PromptVariableInput";
import { PromptPreview } from "./PromptPreview";

interface PromptUseModalProps {
  open: boolean;
  prompt: TaskPrompt | null;
  onClose: () => void;
  onUse: (values: Record<string, string>) => void;
}

function initialValues(prompt: TaskPrompt | null): Record<string, string> {
  if (!prompt) return {};
  const v: Record<string, string> = {};
  for (const variable of prompt.variables) v[variable.key] = variable.defaultValue ?? "";
  return v;
}

export function PromptUseModal({ open, prompt, onClose, onUse }: PromptUseModalProps) {
  const data = useData();
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues(prompt));
      setCopied(false);
      setShowHistory(false);
    }
  }, [open, prompt]);

  const rendered = useMemo(() => (prompt ? renderPrompt(prompt.content, values) : ""), [prompt, values]);

  if (!prompt) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(rendered);
    } catch {
      // Fallback for non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = rendered;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    onUse(values);
    toast({ variant: "success", title: "Prompt copiado! 📋" });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const history = prompt.usageHistory.slice(0, 5);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={prompt.title}
      className="sm:max-w-2xl"
      footer={
        <Button
          size="lg"
          icon={copied ? Check : Copy}
          onClick={handleCopy}
          className={cn("w-full justify-center", copied && "bg-success hover:bg-success")}
        >
          {copied ? "Copiado!" : "Copiar Prompt"}
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Variables */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-content">Preencher variáveis</h3>
          {prompt.variables.length === 0 ? (
            <p className="text-sm text-muted">Este prompt não tem variáveis — é só copiar. 🙂</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {prompt.variables.map((v) => (
                <PromptVariableInput
                  key={v.key}
                  variable={v}
                  value={values[v.key] ?? ""}
                  onChange={(val) => setValues((prev) => ({ ...prev, [v.key]: val }))}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live preview */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-content">Preview</h3>
          <PromptPreview content={prompt.content} values={values} />
        </div>
      </div>

      {/* Usage history */}
      <div className="mt-5 rounded-input border border-line">
        <button
          type="button"
          onClick={() => setShowHistory((s) => !s)}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-content"
        >
          <History className="size-4 text-muted" /> Histórico de uso ({prompt.usageHistory.length})
          <ChevronDown className={cn("ml-auto size-4 text-muted transition-transform", showHistory && "rotate-180")} />
        </button>
        {showHistory && (
          <div className="border-t border-line p-3">
            {history.length === 0 ? (
              <p className="text-xs text-muted">Ainda não foi usado.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((u) => {
                  const who = data.users.find((x) => x.id === u.usedBy);
                  const vals = Object.values(u.variablesUsed).filter(Boolean).join(" · ");
                  return (
                    <li key={u.id} className="text-xs text-muted">
                      <span className="font-medium text-content">{who?.name ?? "Alguém"}</span> — {relativeTime(u.usedAt)}
                      {vals && <span className="block truncate text-[11px]">{vals}</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
