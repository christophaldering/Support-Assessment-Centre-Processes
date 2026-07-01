"use client";

import React from "react";

interface WhisperProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  "data-testid"?: string;
}

export function Whisper({ icon, children, onClick, "data-testid": testId }: WhisperProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      data-testid={testId}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--eds-space-2)",
        padding: "var(--eds-space-2) 0",
        fontFamily: "var(--eds-font-sans)",
        fontSize: "var(--eds-text-md)",
        color: "var(--eds-text-tertiary)",
        background: "none",
        border: "none",
        cursor: onClick ? "pointer" : "default",
        width: "100%",
        textAlign: "left",
        transition: "color var(--eds-transition-fast)",
      }}
      onMouseEnter={onClick ? (e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--eds-z)";
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--eds-text-tertiary)";
      } : undefined}
    >
      {icon && (
        <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {icon}
        </span>
      )}
      <span>{children}</span>
    </Tag>
  );
}
