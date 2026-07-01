"use client";

import { ReactNode } from "react";
import { Breadcrumb } from "./Breadcrumb";
import { PageHeader } from "./PageHeader";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

type MaxWidth = "standard" | "wide" | "narrow";

interface PageShellProps {
  breadcrumb: BreadcrumbItem[];
  title: string;
  description: string;
  icon?: ReactNode;
  primaryAction?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  maxWidth?: MaxWidth;
}

const MAX_WIDTH_MAP: Record<MaxWidth, string> = {
  narrow: "768px",
  standard: "1024px",
  wide: "100%",
};

export function PageShell({
  breadcrumb,
  title,
  description,
  icon,
  primaryAction,
  toolbar,
  children,
  maxWidth = "standard",
}: PageShellProps) {
  const containerWidth = MAX_WIDTH_MAP[maxWidth];

  return (
    <div
      style={{
        padding: "var(--eds-space-8) var(--eds-space-6)",
        maxWidth: containerWidth,
        width: "100%",
      }}
    >
      <Breadcrumb items={breadcrumb} />

      <PageHeader
        title={title}
        description={description}
        icon={icon}
        actions={primaryAction}
      />

      {toolbar && (
        <div
          style={{
            marginBottom: "var(--eds-space-6)",
          }}
        >
          {toolbar}
        </div>
      )}

      {children}
    </div>
  );
}
