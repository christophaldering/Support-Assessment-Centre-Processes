"use client";

import { ReactNode } from "react";

interface CollectionGridProps {
  children: ReactNode;
}

export function CollectionGrid({ children }: CollectionGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "var(--eds-space-4)",
      }}
    >
      {children}
    </div>
  );
}
