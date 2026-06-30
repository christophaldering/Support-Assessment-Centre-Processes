"use client";

import type { DocumentOrigin } from "@/lib/document-origin";

interface DocumentOriginBadgeProps {
  origin: DocumentOrigin;
  size?: "sm" | "md";
}

const ORIGIN_CONFIG: Record<
  DocumentOrigin,
  { label: string; bg: string; text: string }
> = {
  PROVIDED: {
    label: "Hochgeladen",
    bg: "bg-slate-100",
    text: "text-slate-600",
  },
  DERIVED: {
    label: "KI-aufbereitet",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  GENERATED: {
    label: "KI-generiert",
    bg: "bg-purple-50",
    text: "text-purple-600",
  },
};

export function DocumentOriginBadge({
  origin,
  size = "sm",
}: DocumentOriginBadgeProps) {
  const config = ORIGIN_CONFIG[origin];
  const padding = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${padding} ${config.bg} ${config.text}`}
      data-testid={`badge-origin-${origin.toLowerCase()}`}
      title={`Herkunft: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
