"use client";

import { ReactNode } from "react";

interface MasterDetailLayoutProps {
  list: ReactNode;
  detail: ReactNode;
}

export function MasterDetailLayout({ list, detail }: MasterDetailLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        minHeight: "0",
        flex: "1",
      }}
    >
      <aside
        style={{
          width: "300px",
          flexShrink: 0,
          borderRight: "1px solid var(--eds-border)",
          background: "var(--eds-bg-surface)",
          overflowY: "auto",
          padding: "var(--eds-space-4)",
        }}
      >
        {list}
      </aside>
      <main
        style={{
          flex: "1",
          minWidth: 0,
          overflowY: "auto",
          padding: "var(--eds-space-6)",
        }}
      >
        {detail}
      </main>
    </div>
  );
}
