import { Fragment, type ReactNode } from "react";

interface PromptPreviewProps {
  content: string;
  values: Record<string, string>;
  className?: string;
}

const VAR_REGEX = /\{([^}]+)\}/g;

/** Renders the prompt with variables substituted; unfilled tokens highlighted amber. */
export function PromptPreview({ content, values, className }: PromptPreviewProps) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let i = 0;

  for (const match of content.matchAll(VAR_REGEX)) {
    const start = match.index ?? 0;
    if (start > lastIndex) nodes.push(<Fragment key={`t${i}`}>{content.slice(lastIndex, start)}</Fragment>);
    const key = match[1].trim();
    const value = values[key];
    if (value && value.trim() !== "") {
      nodes.push(
        <span key={`v${i}`} className="rounded bg-success/15 px-0.5 text-content">
          {value}
        </span>,
      );
    } else {
      nodes.push(
        <span key={`v${i}`} className="rounded bg-prio-alta/20 px-0.5 font-medium text-prio-alta">
          {match[0]}
        </span>,
      );
    }
    lastIndex = start + match[0].length;
    i++;
  }
  if (lastIndex < content.length) nodes.push(<Fragment key="tail">{content.slice(lastIndex)}</Fragment>);

  return (
    <div
      className={
        "max-h-64 overflow-y-auto whitespace-pre-wrap rounded-input border border-line bg-panel p-3 font-mono text-[13px] leading-relaxed text-content " +
        (className ?? "")
      }
    >
      {nodes.length > 0 ? nodes : <span className="text-muted">O preview aparece aqui…</span>}
    </div>
  );
}
