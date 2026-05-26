"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Assessment {
  id: string;
  name: string;
  status: string;
  candidateCount?: number;
}

interface ContextPanelProps {
  workspaceSlug: string;
  workspaceName: string;
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
  const color = colors[status] ?? "var(--eds-status-gray)";
  return (
    <span
      style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        display: "inline-block",
      }}
    />
  );
}

function AssessmentContextNav({ assessmentId, base }: { assessmentId: string; base: string }) {
  const pathname = usePathname();
  const items = [
    { label: "Übersicht", href: `${base}/assessments/${assessmentId}` },
    { label: "Kandidaten", href: `${base}/assessments/${assessmentId}/candidates` },
    { label: "Beobachtungen", href: `${base}/assessments/${assessmentId}/ratings` },
    { label: "Konsolidierung", href: `${base}/assessments/${assessmentId}/consolidation` },
    { label: "Ergebnisse", href: `${base}/assessments/${assessmentId}/results` },
    { label: "Portal-Verwaltung", href: `${base}/assessments/${assessmentId}/portal` },
    { label: "Fallstudie", href: `${base}/assessments/${assessmentId}/case-study` },
    { label: "Tools", href: `${base}/assessments/${assessmentId}/tools` },
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

export default function ContextPanel({ workspaceSlug, workspaceName }: ContextPanelProps) {
  const pathname = usePathname();
  const base = `/w/${workspaceSlug}/admin`;
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/w/${workspaceSlug}/assessments`)
      .then((r) => r.json())
      .then((data) => {
        const raw: Record<string, unknown>[] = Array.isArray(data) ? data : (data.assessments ?? []);
        const mapped: Assessment[] = raw.slice(0, 8).map((a) => ({
          id: a.id as string,
          name: (a.name ?? a.title) as string,
          status: a.status as string,
          candidateCount: (a._count as Record<string, number> | undefined)?.candidates,
        }));
        setAssessments(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceSlug]);

  const assessmentIdMatch = pathname.match(/\/assessments\/([^/]+)/);
  const activeAssessmentId = assessmentIdMatch?.[1] ?? null;
  const activeAssessment = assessments.find((a) => a.id === activeAssessmentId);

  const isOnAssessmentsPage = pathname.startsWith(`${base}/assessments`) || pathname === base;

  const sectionItems: { label: string; href: string; match?: string }[] = [
    { label: "Dashboard", href: base, match: base },
    { label: "Assessments", href: `${base}/assessments`, match: `${base}/assessments` },
    { label: "Case Study", href: `${base}/data-room`, match: `${base}/data-room` },
    { label: "Datenraum (ConVia)", href: `${base}/dr`, match: `${base}/dr` },
    { label: "ConVia Einrichtung", href: `${base}/dr/setup`, match: `${base}/dr/setup` },
    { label: "Übungen & Module", href: `${base}/modules`, match: `${base}/modules` },
    { label: "Baustein-Bibliothek", href: `${base}/exercise-library`, match: `${base}/exercise-library` },
    { label: "Analytics & Berichte", href: `${base}/analytics`, match: `${base}/analytics` },
    { label: "People", href: `${base}/users`, match: `${base}/users` },
  ];

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
      <div
        style={{
          padding: "14px 12px 8px",
          borderBottom: "1px solid var(--eds-border)",
        }}
      >
        <div
          style={{
            fontSize: "var(--eds-text-xs)",
            fontWeight: 600,
            color: "var(--eds-text-tertiary)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          {activeAssessment ? "Assessment" : "Navigation"}
        </div>
        {activeAssessment ? (
          <div>
            <Link
              href={`${base}/assessments`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "var(--eds-text-sm)",
                color: "var(--eds-text-tertiary)",
                textDecoration: "none",
                marginBottom: "8px",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Alle Assessments
            </Link>
            <div
              style={{
                fontSize: "var(--eds-text-sm)",
                fontWeight: 500,
                color: "var(--eds-text-primary)",
                lineHeight: "1.3",
              }}
            >
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
          <div
            style={{
              fontSize: "var(--eds-text-sm)",
              fontWeight: 500,
              color: "var(--eds-text-primary)",
            }}
          >
            {workspaceName}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: "8px 8px", display: "flex", flexDirection: "column", gap: "1px" }}>
        {activeAssessment ? (
          <AssessmentContextNav assessmentId={activeAssessment.id} base={base} />
        ) : (
          <>
            {sectionItems.map((item) => {
              const isActive = item.match
                ? pathname === item.match || (item.match !== base && pathname.startsWith(item.match))
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "block",
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
                  {item.label}
                </Link>
              );
            })}

            <div
              style={{
                fontSize: "var(--eds-text-xs)",
                fontWeight: 600,
                color: "var(--eds-text-tertiary)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "10px 8px 4px",
              }}
            >
              Assessments
            </div>

            {loading && (
              <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: "28px",
                      borderRadius: "var(--eds-radius-sm)",
                      background: "var(--eds-bg-sunken)",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            )}

            {!loading && assessments.length === 0 && (
              <div
                style={{
                  padding: "8px",
                  fontSize: "var(--eds-text-sm)",
                  color: "var(--eds-text-tertiary)",
                }}
              >
                Keine Assessments
              </div>
            )}

            {!loading &&
              assessments.map((a) => {
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
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
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
