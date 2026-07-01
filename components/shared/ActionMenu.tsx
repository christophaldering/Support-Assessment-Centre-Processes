"use client";

import { useState, useRef, useEffect } from "react";

interface ActionItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface ActionMenuProps {
  actions: ActionItem[];
  label?: string;
}

export function ActionMenu({ actions, label }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        data-testid="button-action-menu"
        aria-label={label ?? "Weitere Aktionen"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          height: "36px",
          padding: label ? "0 12px" : "0",
          width: label ? "auto" : "36px",
          borderRadius: "var(--eds-radius-md)",
          border: "1px solid var(--eds-border)",
          background: "var(--eds-bg-surface)",
          color: "var(--eds-text-secondary)",
          cursor: "pointer",
          fontSize: "var(--eds-text-md)",
          fontFamily: "var(--eds-font-sans)",
          transition: "background var(--eds-transition-fast)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--eds-bg-sunken)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--eds-bg-surface)";
        }}
      >
        {label && <span>{label}</span>}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            background: "var(--eds-bg-surface)",
            border: "1px solid var(--eds-border)",
            borderRadius: "var(--eds-radius-lg)",
            boxShadow: "var(--eds-shadow-md)",
            minWidth: "190px",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); setOpen(false); }}
              data-testid={`action-menu-item-${i}`}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "var(--eds-space-2) var(--eds-space-4)",
                fontSize: "var(--eds-text-md)",
                color: action.variant === "danger"
                  ? "var(--eds-status-red)"
                  : "var(--eds-text-primary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "background var(--eds-transition-fast)",
                fontFamily: "var(--eds-font-sans)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  action.variant === "danger"
                    ? "var(--eds-status-red-bg)"
                    : "var(--eds-bg-sunken)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "none";
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
