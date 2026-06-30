"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isModuleReleased, NAV_MODULE_MAP } from "@/lib/feature-flags";

interface Assessment {
  id: string;
  name: string;
  status: string;
  candidateCount?: number;
}

interface ContextPanelProps {
  workspaceSlug: string;
  workspaceName: string;
  userRoles: string[];
  isMaster: boolean;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active:       "var(--eds-status-green)",
    in_progress:  "var(--eds-status-green)",
    preparation:  "var(--eds-status-amber)",
    draft:        "var(--eds-status-amber)",
    completed:    "var(--eds-status-gray)",
    archived:     "var(--eds-status-gray)",
  };
  return (
    <span style={{
      width: "6px", height: "6px", borderRadius: "50%",
      background: colors[status] ?? "var(--eds-status-gray)",
      flexShrink: 0, display: "inline-block",
    }} />
  );
}

function GroupLabel({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: "var(--eds-text-xs)",
      fontWeight: 600,
      color: "var(--eds-text-tertiary)",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      padding: "10px 8px 3px",
      userSelect: "none",
    }}>
      {label}
    </div>
  );
}

function NavLink({ href, label, match, base, indented = false }: {
  href: string; label: string; match?: string; base: string; indented?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const effectiveMatch = match ?? href;
  const isActive = effectiveMatch === base
    ? pathname === effectiveMatch
    : pathname === effectiveMatch || pathname.startsWith(effectiveMatch + "/");

  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: indented ? "4px 8px 4px 20px" : "5px 8px",
        fontSize: "var(--eds-text-sm)",
        color: isActive ? "var(--eds-terracotta)" : "var(--eds-text-secondary)",
        background: isActive ? "var(--eds-terracotta-ghost)" : "transparent",
        borderRadius: "var(--eds-radius-sm)",
        textDecoration: "none",
        fontWeight: isActive ? 500 : 400,
        transition: "background var(--eds-transition-fast), color var(--eds-transition-fast)",
        borderLeft: isActive ? "2px solid var(--eds-terracotta)" : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "var(--eds-bg-sunken)";
          (e.currentTarget as HTMLElement).style.color = "var(--eds-text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--eds-text-secondary)";
        }
      }}
    >
      {label}
    </Link>
  );
}

/** Wraps NavLink with feature-flag filtering.
 *  - routeSegment: the URL segment after /admin/ (e.g. "analytics", "data-room")
 *  - Masters: always visible; if the workspace flag is off → subtle "Beta" label
 *  - Non-masters: hidden when not released
 */
function FilteredNavLink({ routeSegment, href, label, featureFlags, isMaster, base, indented }: {
  routeSegment: string;
  href: string;
  label: string;
  featureFlags: Record<string, boolean> | null;
  isMaster: boolean;
  base: string;
  indented?: boolean;
}) {
  const moduleKey = NAV_MODULE_MAP[routeSegment];

  // No flag entry → always visible (e.g. dashboard, assessments)
  if (!moduleKey) {
    return <NavLink href={href} label={label} base={base} indented={indented} />;
  }

  const released = isModuleReleased(moduleKey, featureFlags, isMaster);

  // Non-master and not released → hide
  if (!isMaster && !released) return null;

  // Master + workspace has flag explicitly off → show with subtle Beta indicator
  const workspaceReleased = featureFlags == null || featureFlags[moduleKey] !== false;
  if (isMaster && !workspaceReleased) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <NavLink href={href} label={label} base={base} indented={indented} />
        <span style={{
          fontSize: "9px", fontWeight: 600, letterSpacing: "0.04em",
          color: "var(--eds-text-tertiary)", opacity: 0.55, flexShrink: 0,
        }}>
          Beta
        </span>
      </div>
    );
  }

  return <NavLink href={href} label={label} base={base} indented={indented} />;
}

function CollapsibleGroup({ label, children, defaultOpen, forceOpen }: {
  label: string; children: React.ReactNode; defaultOpen?: boolean; forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const isOpen = forceOpen || open;
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "10px 8px 3px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "var(--eds-text-xs)",
          fontWeight: 600,
          color: "var(--eds-text-tertiary)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          userSelect: "none",
        }}
      >
        {label}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          style={{ transition: "transform 0.15s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.5 }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}

function AssessmentContextNav({ assessmentId, base }: { assessmentId: string; base: string }) {
  const pathname = usePathname() ?? "";
  const items = [
    { label: "Übersicht",         href: `${base}/assessments/${assessmentId}` },
    { label: "Kandidaten",        href: `${base}/assessments/${assessmentId}/candidates` },
    { label: "Beobachtungen",     href: `${base}/assessments/${assessmentId}/ratings` },
    { label: "Konsolidierung",    href: `${base}/assessments/${assessmentId}/consolidation` },
    { label: "Ergebnisse",        href: `${base}/assessments/${assessmentId}/results` },
    { label: "Portal-Verwaltung", href: `${base}/assessments/${assessmentId}/portal` },
    { label: "Fallstudie",        href: `${base}/assessments/${assessmentId}/case-study` },
    { label: "Tools",             href: `${base}/assessments/${assessmentId}/tools` },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "block",
              padding: "5px 12px 5px 20px",
              fontSize: "var(--eds-text-sm)",
              color: isActive ? "var(--eds-terracotta)" : "var(--eds-text-secondary)",
              background: isActive ? "var(--eds-terracotta-ghost)" : "transparent",
              borderRadius: "var(--eds-radius-sm)",
              textDecoration: "none",
              fontWeight: isActive ? 500 : 400,
              transition: "background var(--eds-transition-fast), color var(--eds-transition-fast)",
              borderLeft: isActive ? "2px solid var(--eds-terracotta)" : "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = "var(--eds-bg-sunken)";
                (e.currentTarget as HTMLElement).style.color = "var(--eds-text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--eds-text-secondary)";
              }
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Mini-nav shown in ContextPanel when the user is on a /dr route (Master only) */
function DataroomContextNav({ base }: { base: string }) {
  const pathname = usePathname() ?? "";
  const items = [
    { label: "Zugriffslinks", href: `${base}/dr` },
    { label: "Konfiguration", href: `${base}/dr/setup`, indented: true },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      <div style={{
        fontSize: "var(--eds-text-xs)", fontWeight: 600,
        color: "var(--eds-text-tertiary)", letterSpacing: "0.06em",
        textTransform: "uppercase", padding: "6px 8px 4px",
      }}>
        Datenraum-Tracking
      </div>
      {items.map((item) => {
        const isActive = item.indented
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "block",
              padding: item.indented ? "4px 8px 4px 20px" : "5px 8px",
              fontSize: "var(--eds-text-sm)",
              color: isActive ? "var(--eds-terracotta)" : "var(--eds-text-secondary)",
              background: isActive ? "var(--eds-terracotta-ghost)" : "transparent",
              borderRadius: "var(--eds-radius-sm)",
              textDecoration: "none",
              fontWeight: isActive ? 500 : 400,
              transition: "background var(--eds-transition-fast), color var(--eds-transition-fast)",
              borderLeft: isActive ? "2px solid var(--eds-terracotta)" : "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = "var(--eds-bg-sunken)";
                (e.currentTarget as HTMLElement).style.color = "var(--eds-text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--eds-text-secondary)";
              }
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function ContextPanel({ workspaceSlug, workspaceName, isMaster, userRoles }: ContextPanelProps) {
  const pathname = usePathname() ?? "";
  const base = `/w/${workspaceSlug}/admin`;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean> | null>(null);

  // Fetch assessments
  useEffect(() => {
    fetch(`/api/w/${workspaceSlug}/assessments`)
      .then((r) => r.json())
      .then((data) => {
        const raw: Record<string, unknown>[] = Array.isArray(data) ? data : (data.assessments ?? []);
        setAssessments(raw.slice(0, 8).map((a) => ({
          id: a.id as string,
          name: (a.name ?? a.title) as string,
          status: a.status as string,
          candidateCount: (a._count as Record<string, number> | undefined)?.candidates,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceSlug]);

  // Fetch feature flags
  useEffect(() => {
    fetch(`/api/w/${workspaceSlug}/feature-flags`)
      .then((r) => r.json())
      .then((data) => {
        setFeatureFlags(data.featureFlags ?? data ?? null);
      })
      .catch(() => {});
  }, [workspaceSlug]);

  const assessmentIdMatch = pathname.match(/\/assessments\/([^/]+)/);
  const activeAssessmentId = assessmentIdMatch?.[1] ?? null;
  const activeAssessment = assessments.find((a) => a.id === activeAssessmentId);

  // Verwaltung group: auto-open when any sub-route is active
  const verwaltungRoutes = [
    `${base}/users`, `${base}/consents`, `${base}/access-requests`,
    `${base}/brand-rules`, `${base}/theme`, `${base}/ai-governance`,
    `${base}/intelligence`, `${base}/audio`,
  ];
  const verwaltungActive = verwaltungRoutes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Sonderfunktionen: /dr routes — only Master sees the context nav there
  const isDrRoute = pathname.startsWith(`${base}/dr`);

  // Helper to build FilteredNavLink props
  const flagProps = { featureFlags, isMaster, base };

  return (
    <aside
      data-testid="shell-context-panel"
      style={{
        width: "var(--eds-context-width)",
        minWidth: "var(--eds-context-width)",
        background: "var(--eds-bg-surface)",
        borderRight: "1px solid var(--eds-border)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: "14px 12px 8px", borderBottom: "1px solid var(--eds-border)" }}>
        <div style={{
          fontSize: "var(--eds-text-xs)", fontWeight: 600,
          color: "var(--eds-text-tertiary)", letterSpacing: "0.06em",
          textTransform: "uppercase", marginBottom: "6px",
        }}>
          {isDrRoute ? "Sonderfunktionen" : activeAssessment ? "Assessment" : "Navigation"}
        </div>
        {activeAssessment && !isDrRoute ? (
          <div>
            <Link
              href={`${base}/assessments`}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "var(--eds-text-sm)", color: "var(--eds-text-tertiary)", textDecoration: "none", marginBottom: "8px" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              Alle Assessments
            </Link>
            <div style={{ fontSize: "var(--eds-text-sm)", fontWeight: 500, color: "var(--eds-text-primary)", lineHeight: "1.3" }}>
              {activeAssessment.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <StatusDot status={activeAssessment.status} />
                <span style={{ fontSize: "var(--eds-text-xs)", color: "var(--eds-text-tertiary)", textTransform: "capitalize" }}>
                  {activeAssessment.status}
                </span>
              </div>
              {activeAssessment.candidateCount !== undefined && (
                <span style={{ fontSize: "var(--eds-text-xs)", color: "var(--eds-text-tertiary)" }}>
                  · {activeAssessment.candidateCount} TN
                </span>
              )}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "var(--eds-text-sm)", fontWeight: 500, color: "var(--eds-text-primary)" }}>
            {workspaceName}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: "8px 8px 16px", display: "flex", flexDirection: "column", gap: "1px" }}>

        {/* Sonderfunktionen: /dr route — Master-only mini-nav */}
        {isDrRoute && isMaster ? (
          <DataroomContextNav base={base} />
        ) : activeAssessment ? (
          <AssessmentContextNav assessmentId={activeAssessment.id} base={base} />
        ) : (
          <>
            {/* ── Dashboard + Assessments (keine Gruppe) ── */}
            <NavLink href={base}                   label="Dashboard"   match={base} base={base} />
            <NavLink href={`${base}/assessments`}  label="Assessments"             base={base} />

            {/* ── Diagnostik-Aufbau ── */}
            <GroupLabel label="Diagnostik-Aufbau" />
            <FilteredNavLink routeSegment="requirements"       href={`${base}/requirements`}       label="Anforderungsanalyse"  {...flagProps} />
            <FilteredNavLink routeSegment="competencies"       href={`${base}/competencies`}       label="Kompetenzmanagement"  {...flagProps} />
            <FilteredNavLink routeSegment="observation-sheets" href={`${base}/observation-sheets`} label="Beobachtungsbögen"    {...flagProps} />

            {/* ── Übungsentwicklung ── */}
            <GroupLabel label="Übungsentwicklung" />
            <FilteredNavLink routeSegment="modules"          href={`${base}/modules`}          label="Modul-Designer"       {...flagProps} />
            <FilteredNavLink routeSegment="exercise-library" href={`${base}/exercise-library`} label="Baustein-Bibliothek"  {...flagProps} />
            <FilteredNavLink routeSegment="data-room"        href={`${base}/data-room`}        label="Fallstudie"           {...flagProps} />

            {/* ── Durchführung & Auswertung ── */}
            <GroupLabel label="Durchführung & Auswertung" />
            <FilteredNavLink routeSegment="analytics"  href={`${base}/analytics`}  label="Analytics & Berichte"  {...flagProps} />
            <FilteredNavLink routeSegment="reports"    href={`${base}/reports`}    label="Berichte (Export)"     {...flagProps} />
            <FilteredNavLink routeSegment="gutachten"  href={`${base}/gutachten`}  label="Gutachten-Generator"   {...flagProps} />

            {/* ── Verwaltung (einklappbar, öffnet bei aktiver Route) ── */}
            <CollapsibleGroup label="Verwaltung" defaultOpen={verwaltungActive} forceOpen={verwaltungActive}>
              <FilteredNavLink routeSegment="users"            href={`${base}/users`}            label="People"                {...flagProps} />
              <FilteredNavLink routeSegment="consents"         href={`${base}/consents`}         label="Consent-Management"    {...flagProps} />
              <FilteredNavLink routeSegment="access-requests"  href={`${base}/access-requests`}  label="Zugriffsanfragen"      {...flagProps} />
              <FilteredNavLink routeSegment="brand-rules"      href={`${base}/brand-rules`}      label="Corporate Design"      {...flagProps} />
              <FilteredNavLink routeSegment="theme"            href={`${base}/theme`}            label="Theming"               {...flagProps} />
              <FilteredNavLink routeSegment="ai-governance"    href={`${base}/ai-governance`}    label="AI-Governance"         {...flagProps} />
              <FilteredNavLink routeSegment="intelligence"     href={`${base}/intelligence`}      label="Advanced Intelligence" {...flagProps} />
              <FilteredNavLink routeSegment="audio"            href={`${base}/audio`}            label="Audio & Transkription" {...flagProps} />
              <FilteredNavLink routeSegment="prompt-library"  href={`${base}/prompt-library`}   label="KI-Prompts"            {...flagProps} />
            </CollapsibleGroup>

            {/* ── Live-Assessments-Liste ── */}
            <GroupLabel label="Assessments" />

            {loading && (
              <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: "28px", borderRadius: "var(--eds-radius-sm)", background: "var(--eds-bg-sunken)", animation: "pulse 1.5s ease-in-out infinite" }} />
                ))}
              </div>
            )}

            {!loading && assessments.length === 0 && (
              <div style={{ padding: "8px", fontSize: "var(--eds-text-sm)", color: "var(--eds-text-tertiary)" }}>
                Keine Assessments
              </div>
            )}

            {!loading && assessments.map((a) => {
              const href = `${base}/assessments/${a.id}`;
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={a.id}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 8px",
                    fontSize: "var(--eds-text-sm)",
                    color: isActive ? "var(--eds-terracotta)" : "var(--eds-text-secondary)",
                    background: isActive ? "var(--eds-terracotta-ghost)" : "transparent",
                    borderRadius: "var(--eds-radius-sm)",
                    textDecoration: "none",
                    fontWeight: isActive ? 500 : 400,
                    transition: "background var(--eds-transition-fast), color var(--eds-transition-fast)",
                    borderLeft: isActive ? "2px solid var(--eds-terracotta)" : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "var(--eds-bg-sunken)";
                      (e.currentTarget as HTMLElement).style.color = "var(--eds-text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--eds-text-secondary)";
                    }
                  }}
                >
                  <StatusDot status={a.status} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.name}
                  </span>
                </Link>
              );
            })}
          </>
        )}
      </div>
    </aside>
  );
}
