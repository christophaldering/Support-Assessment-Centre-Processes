"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface UserData {
  id: string;
  name: string;
  email: string;
  roles: string[];
  workspaceSlug: string;
  workspaceName: string;
  assessmentId: string | null;
}

interface AssessmentInfo {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
}

interface PortalTile {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  available: boolean;
}

export default function PortalHomePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const meResp = await fetch(`/api/auth/me`);
        if (!meResp.ok) {
          router.push(`/w/${workspaceSlug}/login`);
          return;
        }
        const meData = await meResp.json();
        setUser(meData);

        if (meData.assessmentId) {
          try {
            const aResp = await fetch(
              `/api/w/${workspaceSlug}/assessments/${meData.assessmentId}`
            );
            if (aResp.ok) {
              const aData = await aResp.json();
              setAssessment(aData);
            }
          } catch {}
        }
      } catch {
        router.push(`/w/${workspaceSlug}/login`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workspaceSlug, router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--eds-bg-canvas)",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid var(--eds-border)",
            borderTop: "3px solid var(--eds-terracotta)",
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
          }}
        />
      </div>
    );
  }

  const base = `/w/${workspaceSlug}`;

  const tiles: PortalTile[] = [
    {
      id: "assessment",
      title: "Mein Assessment",
      subtitle: assessment ? assessment.name : "Ihre Aufgaben und Übungen",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="9" y="2" width="13" height="16" rx="2" />
          <path d="M9 6H2v16h13v-4" />
          <path d="M13 10h4M13 14h4" />
        </svg>
      ),
      href: `${base}/assessment`,
      color: "var(--eds-terracotta)",
      available: true,
    },
    {
      id: "case-study",
      title: "Case Study",
      subtitle: "Unterlagen, Dokumente & Fallstudien",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      ),
      href: `${base}/assessment`,
      color: "var(--eds-lagune)",
      available: !!assessment,
    },
    {
      id: "observer",
      title: "Beobachtungsbogen",
      subtitle: "Ratings und Bewertungen",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      href: `${base}/observer`,
      color: "var(--eds-status-amber)",
      available: user?.roles?.includes("OBSERVER") ?? false,
    },
    {
      id: "profile",
      title: "Mein Profil",
      subtitle: "Zugangsdaten und Einstellungen",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      href: `${base}/change-password`,
      color: "var(--eds-text-secondary)",
      available: true,
    },
  ];

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--eds-bg-canvas)",
        fontFamily: "var(--eds-font-sans)",
      }}
    >
      <div
        style={{
          background: "var(--eds-bg-surface)",
          borderBottom: "1px solid var(--eds-border)",
          padding: "20px 32px",
        }}
      >
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "var(--eds-text-xs)",
              color: "var(--eds-text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
              margin: "0 0 4px",
            }}
          >
            {user?.workspaceName ?? workspaceSlug}
          </p>
          <h1
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "var(--eds-text-primary)",
              margin: 0,
            }}
          >
            Willkommen, {user?.name ?? "Teilnehmer"}
          </h1>
          {assessment && (
            <p
              style={{
                fontSize: "var(--eds-text-sm)",
                color: "var(--eds-text-secondary)",
                marginTop: "6px",
                marginBottom: 0,
              }}
            >
              {assessment.name}
              {assessment.startDate && (
                <> · {formatDate(assessment.startDate)}
                  {assessment.endDate && assessment.endDate !== assessment.startDate
                    ? ` – ${formatDate(assessment.endDate)}`
                    : ""}
                </>
              )}
              {assessment.location && <> · {assessment.location}</>}
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "32px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {tiles.map((tile) => (
            <Link
              key={tile.id}
              href={tile.available ? tile.href : "#"}
              data-testid={`portal-tile-${tile.id}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "20px",
                background: "var(--eds-bg-surface)",
                borderRadius: "var(--eds-radius-lg)",
                border: "1px solid var(--eds-border)",
                textDecoration: "none",
                opacity: tile.available ? 1 : 0.45,
                cursor: tile.available ? "pointer" : "not-allowed",
                transition: "box-shadow var(--eds-transition-base), transform var(--eds-transition-fast)",
              }}
              onMouseEnter={(e) => {
                if (tile.available) {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--eds-shadow-md)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}
              onClick={tile.available ? undefined : (e) => e.preventDefault()}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--eds-radius-md)",
                  background: `color-mix(in srgb, ${tile.color} 12%, transparent)`,
                  color: tile.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {tile.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "var(--eds-text-sm)",
                    fontWeight: 600,
                    color: "var(--eds-text-primary)",
                    marginBottom: "3px",
                  }}
                >
                  {tile.title}
                </div>
                <div
                  style={{
                    fontSize: "var(--eds-text-xs)",
                    color: "var(--eds-text-secondary)",
                    lineHeight: "1.4",
                  }}
                >
                  {tile.subtitle}
                </div>
              </div>
              {tile.available && (
                <div
                  style={{
                    marginTop: "auto",
                    fontSize: "var(--eds-text-xs)",
                    color: tile.color,
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    fontWeight: 500,
                  }}
                >
                  Öffnen
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
