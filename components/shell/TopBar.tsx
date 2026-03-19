"use client";

import { usePathname } from "next/navigation";

interface TopBarProps {
  workspaceSlug: string;
  workspaceName: string;
  userDisplayName: string;
  userRoles: string[];
  isMaster: boolean;
  onCommandPalette?: () => void;
}

function breadcrumbFromPath(pathname: string, workspaceName: string, slug: string): string[] {
  const base = `/w/${slug}/admin`;
  const relative = pathname.replace(base, "").replace(/^\//, "");
  const segments = relative.split("/").filter(Boolean);

  const labels: Record<string, string> = {
    "": "Dashboard",
    assessments: "Assessments",
    users: "People",
    modules: "Content",
    "case-study-builder": "Case Studio",
    "case-study-dataroom": "Fallstudie-Verwaltung",
    analytics: "Insights",
    gutachten: "Gutachten",
    requirements: "Anforderungsanalyse",
    competencies: "Kompetenzmanagement",
    "exercise-library": "Baustein-Bibliothek",
    "observation-sheets": "Beobachtungsbögen",
    "brand-rules": "Corporate Design",
    intelligence: "Advanced Intelligence",
    consents: "Einwilligungen",
    "ai-governance": "AI Governance",
    "data-room": "Fallstudie-Verwaltung",
    theme: "Einstellungen",
    "observation-sheet-templates": "Beobachtungsbögen",
  };

  const crumbs = [workspaceName];
  segments.forEach((seg) => {
    if (labels[seg]) crumbs.push(labels[seg]);
  });

  return crumbs;
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        background: "var(--eds-terracotta)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        flexShrink: 0,
      }}
      title={name}
      data-testid="topbar-avatar"
    >
      {initials || "?"}
    </div>
  );
}

export default function TopBar({
  workspaceSlug,
  workspaceName,
  userDisplayName,
  userRoles,
  isMaster,
  onCommandPalette,
}: TopBarProps) {
  const pathname = usePathname();
  const crumbs = breadcrumbFromPath(pathname, workspaceName, workspaceSlug);
  const roleLabel = isMaster ? "Master Admin" : (userRoles[0] ?? "");

  return (
    <header
      data-testid="shell-topbar"
      style={{
        height: "var(--eds-topbar-height)",
        background: "var(--eds-bg-surface)",
        borderBottom: "1px solid var(--eds-border)",
        display: "flex",
        alignItems: "center",
        paddingLeft: "12px",
        paddingRight: "16px",
        gap: "0",
        gridColumn: "1 / -1",
        zIndex: "var(--eds-z-sticky)",
        flexShrink: 0,
      }}
    >
      <nav
        aria-label="Breadcrumb"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          minWidth: 0,
        }}
      >
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
            {i > 0 && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--eds-text-tertiary)" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
            <span
              style={{
                fontSize: "var(--eds-text-sm)",
                color: i === crumbs.length - 1 ? "var(--eds-text-primary)" : "var(--eds-text-tertiary)",
                fontWeight: i === crumbs.length - 1 ? 500 : 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={onCommandPalette}
          data-testid="topbar-command-palette"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--eds-bg-sunken)",
            border: "1px solid var(--eds-border)",
            borderRadius: "var(--eds-radius-md)",
            padding: "4px 10px",
            fontSize: "var(--eds-text-sm)",
            color: "var(--eds-text-tertiary)",
            cursor: "pointer",
            height: "28px",
            minWidth: "140px",
            fontFamily: "var(--eds-font-sans)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span style={{ flex: 1 }}>Suche…</span>
          <kbd
            style={{
              fontSize: "10px",
              background: "var(--eds-border)",
              borderRadius: "3px",
              padding: "1px 4px",
              color: "var(--eds-text-secondary)",
              fontFamily: "inherit",
            }}
          >
            ⌘K
          </kbd>
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            paddingLeft: "8px",
            borderLeft: "1px solid var(--eds-border)",
          }}
        >
          {roleLabel && (
            <span
              style={{
                fontSize: "var(--eds-text-xs)",
                color: "var(--eds-text-tertiary)",
                display: "none",
              }}
              className="hidden sm:inline"
            >
              {roleLabel}
            </span>
          )}
          <UserAvatar name={userDisplayName} />
        </div>
      </div>
    </header>
  );
}
