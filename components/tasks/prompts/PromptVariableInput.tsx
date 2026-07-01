import type { PromptVariable } from "@/types";
import { cn } from "@/lib/utils";

interface PromptVariableInputProps {
  variable: PromptVariable;
  value: string;
  onChange: (value: string) => void;
}

export function PromptVariableInput({ variable, value, onChange }: PromptVariableInputProps) {
  const filled = value.trim() !== "";
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-content" htmlFor={`var-${variable.key}`}>
        {variable.label}
      </label>
      <input
        id={`var-${variable.key}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={variable.defaultValue ? variable.defaultValue : `Digite ${variable.label}…`}
        className={cn(
          "h-10 w-full rounded-input border bg-surface px-3 text-sm text-content placeholder:text-muted focus-visible:outline-none",
          filled ? "border-success/60 focus:border-success" : "border-prio-alta/50 focus:border-prio-alta",
        )}
      />
    </div>
  );
}
