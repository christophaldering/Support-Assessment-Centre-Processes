"use client";

import { ReactNode } from "react";

interface Column {
  key: string;
  label: string;
  width?: string;
}

interface Row {
  id: string;
  [key: string]: ReactNode;
}

interface DataTableProps {
  columns: Column[];
  rows: Row[];
  rowActions?: (row: Row) => ReactNode;
}

export function DataTable({ columns, rows, rowActions }: DataTableProps) {
  return (
    <div
      style={{
        background: "var(--eds-bg-surface)",
        border: "1px solid var(--eds-border)",
        borderRadius: "var(--eds-radius-xl)",
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr
            style={{
              background: "var(--eds-bg-sunken)",
              borderBottom: "1px solid var(--eds-border)",
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: "var(--eds-space-3) var(--eds-space-4)",
                  textAlign: "left",
                  fontSize: "var(--eds-text-xs)",
                  fontWeight: 600,
                  color: "var(--eds-text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  width: col.width,
                  fontFamily: "var(--eds-font-sans)",
                }}
              >
                {col.label}
              </th>
            ))}
            {rowActions && (
              <th
                style={{
                  padding: "var(--eds-space-3) var(--eds-space-4)",
                  width: "120px",
                }}
              />
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              style={{
                borderBottom:
                  i < rows.length - 1 ? "1px solid var(--eds-border)" : "none",
                transition: "background var(--eds-transition-fast)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--eds-bg-sunken)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "var(--eds-space-3) var(--eds-space-4)",
                    fontSize: "var(--eds-text-md)",
                    color: "var(--eds-text-primary)",
                    verticalAlign: "middle",
                  }}
                >
                  {row[col.key]}
                </td>
              ))}
              {rowActions && (
                <td
                  style={{
                    padding: "var(--eds-space-2) var(--eds-space-4)",
                    textAlign: "right",
                    verticalAlign: "middle",
                  }}
                >
                  {rowActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
