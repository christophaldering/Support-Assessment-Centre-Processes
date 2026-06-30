"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, ReactNode } from "react";
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

function NavLink({ href, label, match, base, indented = false, icon }: {
  href: string; label: string; match?: string; base: string; indented?: boolean; icon?: ReactNode;
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
        display: "flex",
        alignItems: "center",
        gap: "var(--eds-space-2)",
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
      {icon && (
        <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0, opacity: isActive ? 1 : 0.6 }}>
          {icon}
        </span>
      )}
      {label}
    </Link>
  );
}

function FilteredNavLink({ routeSegment, href, label, featureFlags, isMaster, base, indented, icon }: {
  routeSegment: string;
  href: string;
  label: string;
  featureFlags: Record<string, boolean> | null;
  isMaster: boolean;
  base: string;
  indented?: boolean;
  icon?: ReactNode;
}) {
  const moduleKey = NAV_MODULE_MAP[routeSegment];

  if (!moduleKey) {
    return <NavLink href={href} label={label} base={base} indented={indented} icon={icon} />;
  }

  const released = isModuleReleased(moduleKey, featureFlags, isMaster);
  if (!isMaster && !released) return null;

  const workspaceReleased = featureFlags == null || featureFlags[moduleKey] !== false;
  if (isMaster && !workspaceReleased) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <NavLink href={href} label={label} base={base} indented={indented} icon={icon} />
        <span style={{
          fontSize: "9px", fontWeight: 600, letterSpacing: "0.04em",
          color: "var(--eds-text-tertiary)", opacity: 0.55, flexShrink: 0,
        }}>
          Beta
        </span>
      </div>
    );
  }

  return <NavLink href={href} label={label} base={base} indented={indented} icon={icon} />;
}

function CollapsibleGroup({ label, children, defaultOpen, forceOpen }: {
  label: string; children: ReactNode; defaultOpen?: boolean; forceOpen?: boolean;
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

function DataroomContextNav({ base }: { base: string }) {
  const pathname = usePathname() ?? "";
  const items = [
    { label: "Freigabe-Links", href: `${base}/document-sharing` },
    { label: "Konfiguration", href: `${base}/document-sharing/setup`, indented: true },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      <div style={{
        fontSize: "var(--eds-text-xs)", fontWeight: 600,
        color: "var(--eds-text-tertiary)", letterSpacing: "0.06em",
        textTransform: "uppercase", padding: "6px 8px 4px",
      }}>
        Externe Freigabe</div>
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

// ── Nav-Icons (14px, currentColor) ────────────────────────────────────────────
const I = { s: 14, w: "1.5", r: "round" as const, j: "round" as const };

function IcoDocument()    { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>; }
function IcoTarget()      { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }
function IcoChecklist()   { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg>; }
function IcoCube()        { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>; }
function IcoBookshelf()   { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
function IcoFolder()      { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
function IcoBarChart()    { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/><line x1="3" y1="20" x2="21" y2="20"/></svg>; }
function IcoDownload()    { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IcoFeather()     { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>; }
function IcoPeople()      { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IcoShield()      { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IcoKey()         { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>; }
function IcoPaintbrush()  { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3z"/><path d="M9 8c-2 3-4 3.5-7 4l8 8c1-.5 3-1.5 4-7"/><path d="M14.5 17.5 4.5 15"/></svg>; }
function IcoPalette()     { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.042a1.8 1.8 0 0 1 1.8-1.8h2.133C18.436 16.345 21 13.954 21 11c0-4.893-4.028-9-9-9z"/></svg>; }
function IcoMic()         { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>; }
function IcoBrain()       { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.16A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.16A2.5 2.5 0 0 0 14.5 2z"/></svg>; }
function IcoCog()         { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>; }
function IcoPrompt()      { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>; }
function IcoShare()       { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>; }
function IcoGrid()        { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function IcoClipboard()   { return <svg width={I.s} height={I.s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={I.w} strokeLinecap={I.r} strokeLinejoin={I.j}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>; }

export default function ContextPanel({ workspaceSlug, workspaceName, isMaster, userRoles }: ContextPanelProps) {
  const pathname = usePathname() ?? "";
  const base = `/w/${workspaceSlug}/admin`;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean> | null>(null);

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
      .catch(() => {});
  }, [workspaceSlug]);

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

  const diagnostikRoutes = [
    `${base}/requirements`, `${base}/competencies`, `${base}/observation-sheets`,
  ];
  const diagnostikActive = diagnostikRoutes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  const uebungsRoutes = [
    `${base}/exercise-library`, `${base}/case-studio`, `${base}/modules`,
  ];
  const uebungsActive = uebungsRoutes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  const verwaltungRoutes = [
    `${base}/users`, `${base}/consents`, `${base}/access-requests`,
    `${base}/brand-rules`, `${base}/theme`, `${base}/ai-governance`,
    `${base}/intelligence`, `${base}/audio`, `${base}/document-sharing`,
    `${base}/prompt-library`,
  ];
  const verwaltungActive = verwaltungRoutes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  const isDrRoute = pathname.startsWith(`${base}/document-sharing`);

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

        {isDrRoute && isMaster ? (
          <DataroomContextNav base={base} />
        ) : activeAssessment ? (
          <AssessmentContextNav assessmentId={activeAssessment.id} base={base} />
        ) : (
          <>
            {/* ── Gruppe 1: Kern-Navigation ── */}
            <NavLink href={base}                  label="Dashboard"   match={base} base={base} icon={<IcoGrid />} />
            <NavLink href={`${base}/assessments`} label="Assessments"             base={base} icon={<IcoClipboard />} />

            {/* ── Gruppe 2: Diagnostik-Aufbau (einklappbar, forceOpen wenn aktiv) ── */}
            <CollapsibleGroup label="Diagnostik-Aufbau" defaultOpen={diagnostikActive} forceOpen={diagnostikActive}>
              <FilteredNavLink routeSegment="requirements"       href={`${base}/requirements`}       label="Anforderungsanalyse"  icon={<IcoDocument />}   {...flagProps} />
              <FilteredNavLink routeSegment="competencies"       href={`${base}/competencies`}       label="Kompetenzmanagement"  icon={<IcoTarget />}     {...flagProps} />
              <FilteredNavLink routeSegment="observation-sheets" href={`${base}/observation-sheets`} label="Beobachtungsbögen"    icon={<IcoChecklist />}  {...flagProps} />
            </CollapsibleGroup>

            {/* ── Gruppe 3: Übungsentwicklung (einklappbar, forceOpen wenn aktiv) ── */}
            <CollapsibleGroup label="Übungsentwicklung" defaultOpen={uebungsActive} forceOpen={uebungsActive}>
              <FilteredNavLink routeSegment="exercise-library" href={`${base}/exercise-library`} label="Baustein-Bibliothek"    icon={<IcoBookshelf />}  {...flagProps} />
              <FilteredNavLink routeSegment="case-studio"      href={`${base}/case-studio`}      label="Fallstudien-Werkstatt"  icon={<IcoFolder />}     {...flagProps} />
              <FilteredNavLink routeSegment="modules"          href={`${base}/modules`}          label="Modul-Designer"         icon={<IcoCube />}       {...flagProps} />
            </CollapsibleGroup>

            {/* ── Gruppe 4: Durchführung & Auswertung ── */}
            <GroupLabel label="Auswertung" />
            <FilteredNavLink routeSegment="analytics"  href={`${base}/analytics`}  label="Analytics & Berichte"  icon={<IcoBarChart />}   {...flagProps} />
            <FilteredNavLink routeSegment="reports"    href={`${base}/reports`}    label="Berichte (Export)"     icon={<IcoDownload />}   {...flagProps} />
            <FilteredNavLink routeSegment="gutachten"  href={`${base}/gutachten`}  label="Gutachten-Generator"   icon={<IcoFeather />}    {...flagProps} />

            {/* ── Gruppe 5: Verwaltung (einklappbar) ── */}
            <CollapsibleGroup label="Verwaltung" defaultOpen={verwaltungActive} forceOpen={verwaltungActive}>
              <FilteredNavLink routeSegment="users"             href={`${base}/users`}             label="People"                       icon={<IcoPeople />}      {...flagProps} />
              <FilteredNavLink routeSegment="consents"          href={`${base}/consents`}          label="Consent-Management"           icon={<IcoShield />}      {...flagProps} />
              <FilteredNavLink routeSegment="access-requests"   href={`${base}/access-requests`}   label="Zugriffsanfragen"             icon={<IcoKey />}         {...flagProps} />
              <FilteredNavLink routeSegment="brand-rules"       href={`${base}/brand-rules`}       label="Corporate Design"             icon={<IcoPaintbrush />}  {...flagProps} />
              <FilteredNavLink routeSegment="theme"             href={`${base}/theme`}             label="Theming"                      icon={<IcoPalette />}     {...flagProps} />
              <FilteredNavLink routeSegment="ai-governance"     href={`${base}/ai-governance`}     label="AI-Governance"                icon={<IcoCog />}         {...flagProps} />
              <FilteredNavLink routeSegment="intelligence"      href={`${base}/intelligence`}      label="Advanced Intelligence"        icon={<IcoBrain />}       {...flagProps} />
              <FilteredNavLink routeSegment="audio"             href={`${base}/audio`}             label="Audio & Transkription"        icon={<IcoMic />}         {...flagProps} />
              <FilteredNavLink routeSegment="prompt-library"    href={`${base}/prompt-library`}    label="KI-Prompts"                   icon={<IcoPrompt />}      {...flagProps} />
              <FilteredNavLink routeSegment="document-sharing"  href={`${base}/document-sharing`}  label="Externe Dokumentenfreigabe"   icon={<IcoShare />}       {...flagProps} />
            </CollapsibleGroup>
          </>
        )}
      </div>
    </aside>
  );
}
