/** Pre-defined prompt categories (users may also type a custom one). */
export const PROMPT_CATEGORIES = ["Instagram", "Facebook", "WhatsApp", "Email", "Blog", "Geral"] as const;

/** Resolve a display color (CSS) for a prompt category. */
export function promptCategoryColor(category: string): string {
  switch (category) {
    case "Instagram":
      return "var(--brand-purple)";
    case "Facebook":
      return "#1877F2";
    case "WhatsApp":
      return "#25D366";
    case "Email":
      return "#F59E0B";
    case "Blog":
      return "var(--brand-cyan)";
    case "Geral":
      return "var(--text-secondary)";
    default:
      return "var(--brand-purple-light)";
  }
}
