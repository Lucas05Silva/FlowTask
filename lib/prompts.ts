import type { PromptVariable } from "@/types";

const VAR_REGEX = /\{([^}]+)\}/g;

/** "nome_cliente" → "Nome Do Cliente" (snake/kebab → Title Case). */
export function labelFromKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Extract unique variables from a prompt's content.
 * Preserves label/defaultValue from `existing` when a key is unchanged.
 */
export function parseVariables(content: string, existing: PromptVariable[] = []): PromptVariable[] {
  const byKey = new Map(existing.map((v) => [v.key, v]));
  const seen = new Set<string>();
  const result: PromptVariable[] = [];
  for (const match of content.matchAll(VAR_REGEX)) {
    const key = match[1].trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const prev = byKey.get(key);
    result.push({
      key,
      label: prev?.label ?? labelFromKey(key),
      defaultValue: prev?.defaultValue,
    });
  }
  return result;
}

/**
 * Replace {key} tokens with provided values. Missing/empty values keep the
 * literal {key} token so the user can see what still needs filling.
 */
export function renderPrompt(content: string, values: Record<string, string>): string {
  return content.replace(VAR_REGEX, (whole, rawKey) => {
    const key = String(rawKey).trim();
    const v = values[key];
    return v && v.trim() !== "" ? v : whole;
  });
}
