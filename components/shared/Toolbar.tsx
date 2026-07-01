"use client";

import { ReactNode } from "react";

interface TabItem {
  key: string;
  label: string;
}

interface ToolbarProps {
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  filters?: ReactNode;
}

export function Toolbar({ tabs, activeTab, onTabChange, filters }: ToolbarProps) {
  const hasTabs = tabs && tabs.length > 0;
  const hasFilters = !!filters;

  if (!hasTabs && !hasFilters) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {hasTabs && (
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid var(--eds-border)",
          }}
        >
          {tabs!.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange?.(tab.key)}
                data-testid={`tab-${tab.key}`}
                style={{
                  padding: "var(--eds-space-2) var(--eds-space-4)",
                  fontSize: "var(--eds-text-md)",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--eds-text-brand)" : "var(--eds-text-tertiary)",
                  background: "none",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid var(--eds-terracotta)"
                    : "2px solid transparent",
                  marginBottom: "-1px",
                  cursor: "pointer",
                  transition: "color var(--eds-transition-fast)",
                  fontFamily: "var(--eds-font-sans)",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--eds-text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--eds-text-tertiary)";
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
      {hasFilters && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--eds-space-2)",
            flexWrap: "wrap",
            paddingTop: hasTabs ? "var(--eds-space-4)" : 0,
          }}
        >
          {filters}
        </div>
      )}
    </div>
  );
}
