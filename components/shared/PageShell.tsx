"use client";

import React, { CSSProperties } from "react";
import { Breadcrumb } from "./Breadcrumb";

type Zone = "start" | "assessment" | "resource" | "admin";
type MaxWidth = "standard" | "wide" | "narrow";

const ZONE_VARS: Record<Zone, { color: string; ghost: string }> = {
  start:      { color: "var(--eds-zone-start)",      ghost: "var(--eds-zone-start-ghost)" },
  assessment: { color: "var(--eds-zone-assessment)", ghost: "var(--eds-zone-assessment-ghost)" },
  resource:   { color: "var(--eds-zone-resource)",   ghost: "var(--eds-zone-resource-ghost)" },
  admin:      { color: "var(--eds-zone-admin)",      ghost: "var(--eds-zone-admin-ghost)" },
};

const MAX_WIDTH_CLASS: Record<MaxWidth, string> = {
  narrow:   "max-w-3xl",
  standard: "max-w-5xl",
  wide:     "",
};

interface Props {
  zone: Zone;
  breadcrumb: { label: string; href?: string }[];
  zoneLabel: string;
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  segments?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: MaxWidth;
}

export function PageShell({
  zone,
  breadcrumb,
  zoneLabel,
  title,
  description,
  primaryAction,
  segments,
  toolbar,
  children,
  maxWidth = "standard",
}: Props) {
  const zv = ZONE_VARS[zone];
  const mwClass = MAX_WIDTH_CLASS[maxWidth];

  const rootStyle: CSSProperties = {
    "--eds-z": zv.color,
    "--eds-z-ghost": zv.ghost,
  } as CSSProperties;

  return (
    <div style={rootStyle} className="min-h-full bg-[var(--eds-bg-app)]">
      <div className={`mx-auto w-full px-6 py-8 ${mwClass}`}>
        <Breadcrumb items={breadcrumb} />

        <div className="mt-4 mb-1 flex items-center gap-2.5">
          <div
            className="shrink-0 rounded-full"
            style={{ width: 34, height: 3, backgroundColor: "var(--eds-z)" }}
          />
          <span
            style={{
              color: "var(--eds-z)",
              fontSize: "11.5px",
              fontWeight: 700,
              letterSpacing: ".11em",
              textTransform: "uppercase",
              fontFamily: "var(--eds-font-sans)",
            }}
          >
            {zoneLabel}
          </span>
        </div>

        <div className="flex items-start justify-between gap-6 mb-2">
          <h1
            style={{
              fontFamily: "var(--eds-serif)",
              fontSize: 45,
              fontWeight: 500,
              letterSpacing: "-.015em",
              lineHeight: 1.03,
              color: "var(--eds-text-primary)",
              margin: 0,
            }}
          >
            {title}
          </h1>
          {primaryAction && (
            <div className="shrink-0 pt-2">{primaryAction}</div>
          )}
        </div>

        {description && (
          <p
            style={{
              fontFamily: "var(--eds-font-sans)",
              fontSize: 16,
              color: "var(--eds-text-secondary)",
              maxWidth: "46ch",
              margin: "var(--eds-space-2) 0 var(--eds-space-6)",
            }}
          >
            {description}
          </p>
        )}

        {segments && <div className="mt-5">{segments}</div>}
        {toolbar && <div className="mt-3">{toolbar}</div>}

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
