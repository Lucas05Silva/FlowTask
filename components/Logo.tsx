import { cn } from "@/lib/utils";

interface LogoProps {
  showText?: boolean;
  size?: number;
  className?: string;
}

/** FlowTask brand mark — a flowing check glyph in the FlowSys gradient. */
export function Logo({ showText = true, size = 32, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="grid shrink-0 place-items-center rounded-[10px] shadow-soft"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #ad88ed 0%, #312199 100%)",
        }}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 13.5l4.5 4.5L20 6.5"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M4 7.5h7" stroke="#a0dde4" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </span>
      {showText && (
        <span
          className="font-[family-name:var(--font-poppins)] text-lg font-bold tracking-tight text-content"
          style={{ fontSize: size * 0.56 }}
        >
          Flow<span className="text-brand">Task</span>
        </span>
      )}
    </span>
  );
}
