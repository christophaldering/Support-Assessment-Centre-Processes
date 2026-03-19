"use client";

import { useEffect, useState, useCallback } from "react";
import TopBar from "./TopBar";
import IconRail from "./IconRail";
import ContextPanel from "./ContextPanel";
import AIPanel from "./AIPanel";
import CommandPalette from "./CommandPalette";

interface ShellClientProps {
  workspaceSlug: string;
  workspaceName: string;
  userDisplayName: string;
  userRoles: string[];
  isMaster: boolean;
  children: React.ReactNode;
}

export default function ShellClient({
  workspaceSlug,
  workspaceName,
  userDisplayName,
  userRoles,
  isMaster,
  children,
}: ShellClientProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <div
        data-testid="eds-shell"
        style={{
          display: "grid",
          gridTemplateRows: "var(--eds-topbar-height) 1fr",
          gridTemplateColumns: "var(--eds-rail-width) var(--eds-context-width) 1fr var(--eds-ai-panel-width)",
          height: "100dvh",
          overflow: "hidden",
          fontFamily: "var(--eds-font-sans)",
          background: "var(--eds-bg-app)",
        }}
        className="eds-shell"
      >
        <TopBar
          workspaceSlug={workspaceSlug}
          workspaceName={workspaceName}
          userDisplayName={userDisplayName}
          userRoles={userRoles}
          isMaster={isMaster}
          onCommandPalette={openPalette}
        />

        <IconRail
          workspaceSlug={workspaceSlug}
          userRoles={userRoles}
          isMaster={isMaster}
        />

        <ContextPanel
          workspaceSlug={workspaceSlug}
          workspaceName={workspaceName}
        />

        <main
          data-testid="shell-main-content"
          style={{
            overflowY: "auto",
            overflowX: "hidden",
            background: "var(--eds-bg-app)",
            minWidth: 0,
          }}
        >
          {children}
        </main>

        <AIPanel workspaceSlug={workspaceSlug} />
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={closePalette}
        workspaceSlug={workspaceSlug}
      />

      <style>{`
        @media (max-width: 768px) {
          .eds-shell {
            grid-template-rows: var(--eds-topbar-height) 1fr 52px !important;
            grid-template-columns: 1fr !important;
          }
          .eds-shell [data-testid="shell-topbar"] {
            grid-column: 1 !important;
          }
          [data-testid="rail-assessments"],
          [data-testid="shell-context-panel"],
          [data-testid="shell-ai-panel"] {
            display: none !important;
          }
          [data-testid="shell-main-content"] {
            grid-column: 1 !important;
            grid-row: 2 !important;
          }
        }
      `}</style>
    </>
  );
}
