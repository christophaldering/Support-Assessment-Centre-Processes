"use client";

import React from "react";

interface ListRowProps {
  title: string;
  meta?: string;
  right?: React.ReactNode;
  statusColor?: string;
  onClick?: () => void;
  "data-testid"?: string;
}

export function ListRow({
  title,
  meta,
  right,
  statusColor,
  onClick,
  "data-testid": testId,
}: ListRowProps) {
  const isInteractive = !!onClick;

  return (
    <div
      className="group"
      onClick={onClick}
      data-testid={testId}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--eds-space-4)",
        padding: "var(--eds-space-3) var(--eds-space-5)",
        borderBottom: "1px solid var(--eds-border)",
        cursor: isInteractive ? "pointer" : "default",
        transition: "background var(--eds-transition-fast), padding-left var(--eds-transition-base)",
        background: "var(--eds-bg-surface)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (isInteractive) {
          (e.currentTarget as HTMLElement).style.background = "var(--eds-z-ghost)";
          (e.currentTarget as HTMLElement).style.paddingLeft = "var(--eds-space-6)";
        }
      }}
      onMouseLeave={(e) => {
        if (isInteractive) {
          (e.currentTarget as HTMLElement).style.background = "var(--eds-bg-surface)";
          (e.currentTarget as HTMLElement).style.paddingLeft = "var(--eds-space-5)";
        }
      }}
    >
      {statusColor && (
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: statusColor,
            flexShrink: 0,
          }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--eds-font-sans)",
            fontSize: "15.5px",
            fontWeight: 600,
            color: "var(--eds-text-primary)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </p>
        {meta && (
          <p
            style={{
              fontFamily: "var(--eds-font-sans)",
              fontSize: "13.5px",
              color: "var(--eds-text-secondary)",
              margin: "2px 0 0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {meta}
          </p>
        )}
      </div>

      {right && (
        <div
          style={{
            flexShrink: 0,
            fontFamily: "var(--eds-font-sans)",
            fontSize: "13px",
            color: "var(--eds-text-secondary)",
          }}
        >
          {right}
        </div>
      )}

      {isInteractive && (
        <svg
          style={{
            width: 14,
            height: 14,
            color: "var(--eds-z)",
            flexShrink: 0,
            opacity: 0,
            transition: "opacity var(--eds-transition-fast)",
          }}
          className="group-hover:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      )}
    </div>
  );
}

interface ListRowsProps {
  children: React.ReactNode;
  label?: string;
}

export function ListRows({ children, label }: ListRowsProps) {
  return (
    <div
      style={{
        background: "var(--eds-bg-surface)",
        border: "1px solid var(--eds-border)",
        borderRadius: "var(--eds-radius-lg)",
        overflow: "hidden",
      }}
    >
      {label && (
        <div
          style={{
            padding: "var(--eds-space-3) var(--eds-space-5)",
            borderBottom: "1px solid var(--eds-border)",
            fontFamily: "var(--eds-font-sans)",
            fontSize: "var(--eds-text-sm)",
            fontWeight: 600,
            color: "var(--eds-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: ".07em",
            background: "var(--eds-bg-sunken)",
          }}
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
