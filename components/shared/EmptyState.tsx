"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--eds-space-12) var(--eds-space-8)",
        textAlign: "center",
        gap: "var(--eds-space-3)",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--eds-text-tertiary)",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--eds-space-1)", alignItems: "center" }}>
        <p
          style={{
            fontSize: "var(--eds-text-md)",
            fontWeight: 500,
            color: "var(--eds-text-primary)",
            margin: 0,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: "var(--eds-text-sm)",
            color: "var(--eds-text-secondary)",
            margin: 0,
            maxWidth: "320px",
            lineHeight: "1.5",
          }}
        >
          {description}
        </p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: "var(--eds-space-2)",
            padding: "var(--eds-space-2) var(--eds-space-5)",
            background: "var(--eds-terracotta)",
            color: "var(--eds-text-inverse)",
            border: "none",
            borderRadius: "var(--eds-radius-md)",
            fontSize: "var(--eds-text-sm)",
            fontWeight: 500,
            cursor: "pointer",
            transition: "opacity var(--eds-transition-fast)",
            fontFamily: "var(--eds-font-sans)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
