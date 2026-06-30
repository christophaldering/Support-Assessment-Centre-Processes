"use client";

import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--eds-space-4)",
        marginBottom: "var(--eds-space-6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--eds-space-3)", minWidth: 0 }}>
        {icon && (
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--eds-radius-lg)",
              background: "var(--eds-terracotta-ghost)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--eds-terracotta)",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: "var(--eds-text-3xl)",
              fontWeight: 700,
              color: "var(--eds-terracotta)",
              fontFamily: "'Playfair Display', serif",
              margin: 0,
              lineHeight: "1.2",
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              style={{
                fontSize: "var(--eds-text-sm)",
                color: "var(--eds-text-secondary)",
                margin: "var(--eds-space-1) 0 0",
                lineHeight: "1.5",
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--eds-space-2)", flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
