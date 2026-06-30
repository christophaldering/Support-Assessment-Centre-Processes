"use client";

import { ReactNode } from "react";

interface CardProps {
  variant: "primary" | "secondary";
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function Card({ variant, children, style, className }: CardProps) {
  const isPrimary = variant === "primary";
  return (
    <div
      className={className}
      style={{
        background: "var(--eds-bg-surface)",
        borderRadius: "var(--eds-radius-xl)",
        border: `1px solid ${isPrimary ? "var(--eds-card-primary-border)" : "var(--eds-card-secondary-border)"}`,
        boxShadow: isPrimary ? "var(--eds-card-primary-shadow)" : "var(--eds-card-secondary-shadow)",
        padding: "var(--eds-space-6)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
