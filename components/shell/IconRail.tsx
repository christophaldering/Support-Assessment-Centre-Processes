"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface RailItem {
  id: string;
  label: string;
  href: string;
  roles: string[];
  icon: React.ReactNode;
  matchPrefix?: string;
  separator?: false;
}

interface SeparatorItem {
  separator: true;
  id: string;
}

type NavItem = RailItem | SeparatorItem;

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 12l10 5 10-5" />
      <path d="M2 17l10 5 10-5" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 19h18" />
      <path d="M5 19V9l4 4 3-6 4 3 3-5" />
    </svg>
  );
}

function HexIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8.66 5v10L12 22 3.34 17V7L12 2z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

/** Datenbank/Speicher-Icon für externe Dokumentenfreigabe (Sonderfunktionen, nur Master) */
function DatabaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

interface IconRailProps {
  workspaceSlug: string;
  userRoles: string[];
  isMaster: boolean;
}

export default function IconRail({ workspaceSlug, userRoles, isMaster }: IconRailProps) {
  const pathname = usePathname() ?? "";
  const base = `/w/${workspaceSlug}/admin`;

  const navItems: NavItem[] = [
    {
      id: "assessments",
      label: "Assessments",
      href: base,
      matchPrefix: base,
      roles: ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN", "MODERATOR", "OBSERVER", "PROJECT_OFFICE", "CLIENT"],
      icon: <GridIcon />,
    },
    {
      id: "people",
      label: "People",
      href: `${base}/users`,
      matchPrefix: `${base}/users`,
      roles: ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN", "MODERATOR"],
      icon: <PersonIcon />,
    },
    {
      id: "content",
      label: "Content",
      href: `${base}/modules`,
      matchPrefix: `${base}/modules`,
      roles: ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN", "MODERATOR"],
      icon: <LayersIcon />,
    },
    {
      id: "insights",
      label: "Insights",
      href: `${base}/analytics`,
      matchPrefix: `${base}/analytics`,
      roles: ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN", "MODERATOR", "CLIENT"],
      icon: <ChartIcon />,
    },
    ...(isMaster
      ? [
          {
            id: "platform",
            label: "Platform",
            href: "/admin/workspaces",
            roles: ["MASTER_ADMIN"],
            icon: <HexIcon />,
          } as RailItem,
          {
            id: "dataroom",
            label: "Externe Dokumentenfreigabe",
            href: `${base}/dr`,
            matchPrefix: `${base}/document-sharing`,
            roles: ["MASTER_ADMIN"],
            icon: <DatabaseIcon />,
          } as RailItem,
        ]
      : []),
    { id: "sep1", separator: true },
    {
      id: "settings",
      label: "Workspace-Einstellungen",
      href: `${base}/theme`,
      matchPrefix: `${base}/theme`,
      roles: ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN"],
      icon: <GearIcon />,
    },
  ];

  return (
    <aside
      style={{
        width: "var(--eds-rail-width)",
        minWidth: "var(--eds-rail-width)",
        background: "var(--eds-text-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "8px",
        paddingBottom: "8px",
        gap: "2px",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {navItems.map((item) => {
        if ("separator" in item && item.separator) {
          return (
            <div
              key={item.id}
              style={{
                width: "28px",
                height: "1px",
                background: "rgba(255,255,255,0.1)",
                margin: "6px 0",
              }}
            />
          );
        }

        const railItem = item as RailItem;
        const visible = isMaster || railItem.roles.some((r) => userRoles.includes(r));
        if (!visible) return null;

        const isActive = railItem.matchPrefix
          ? pathname === railItem.matchPrefix || (railItem.matchPrefix !== base && pathname.startsWith(railItem.matchPrefix))
          : pathname === railItem.href;

        return (
          <Link
            key={railItem.id}
            href={railItem.href}
            title={railItem.label}
            data-testid={`rail-${railItem.id}`}
            style={{
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--eds-radius-md)",
              color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
              background: isActive ? "var(--eds-terracotta)" : "transparent",
              transition: "background var(--eds-transition-base), color var(--eds-transition-base)",
              textDecoration: "none",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
              }
            }}
          >
            {railItem.icon}
          </Link>
        );
      })}
    </aside>
  );
}
