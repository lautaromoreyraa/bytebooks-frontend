import type { ReactNode } from "react";

type Variant = "shelf" | "search" | "bookmark" | "warning";

function Glyph({ variant }: { variant: Variant }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10 text-brass-500" aria-hidden="true">
      {variant === "shelf" && (
        <g {...common}>
          <path d="M8 12h9v24H8zM19 15h8v21h-8z" />
          <path d="M30.5 16.5l7.8 2-4.6 19-7.8-2z" />
          <path d="M6 40h36" />
        </g>
      )}
      {variant === "search" && (
        <g {...common}>
          <circle cx="21" cy="21" r="11" />
          <path d="M29.5 29.5L40 40M16 21h10" />
        </g>
      )}
      {variant === "bookmark" && (
        <g {...common}>
          <path d="M14 8h20v32l-10-7-10 7z" />
          <path d="M20 18h8" />
        </g>
      )}
      {variant === "warning" && (
        <g {...common}>
          <path d="M24 9l16 28H8z" />
          <path d="M24 20v8M24 32.5v.5" />
        </g>
      )}
    </svg>
  );
}

interface Props {
  variant?: Variant;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({
  variant = "shelf",
  title,
  description,
  action,
}: Props) {
  return (
    <div className="animate-fade-up rounded-2xl border border-dashed border-ink-700/80 bg-ink-900/40 px-6 py-14 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-ink-700/70 bg-ink-850 shadow-card">
        <Glyph variant={variant} />
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight text-ink-50">
        {title}
      </h3>
      <p className="prose-measure mx-auto mt-2 text-sm text-ink-400">{description}</p>
      {action && <div className="mt-6 flex justify-center gap-3">{action}</div>}
    </div>
  );
}
