"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface UserData {
  id: string;
  name: string;
  email: string;
  roles: string[];
  forcePasswordChange: boolean;
  workspaceSlug: string;
  workspaceName: string;
  assessmentId: string | null;
}

interface Assessment {
  id: string;
  name: string;
  status: string;
  description: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface Exercise {
  id: string;
  name: string;
  type: string;
  instructions: string | null;
  duration: number | null;
  sortOrder: number;
  status: string;
}

interface AssessmentDetail extends Assessment {
  exercises: Exercise[];
  documents: DocumentItem[];
}

interface DocumentItem {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  exerciseId: string | null;
  createdAt: string;
}

const exerciseTypeLabels: Record<string, string> = {
  presentation: "Präsentation",
  interview: "Interview",
  group_discussion: "Gruppendiskussion",
  case_study: "Fallstudie",
  role_play: "Rollenspiel",
  in_tray: "Postkorb",
  psychometric: "Psychometrisch",
  other: "Sonstiges",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusLabel(status: string): string {
  switch (status) {
    case "draft": return "Entwurf";
    case "active": return "Aktiv";
    case "completed": return "Abgeschlossen";
    case "archived": return "Archiviert";
    default: return status;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "completed": return "bg-slate-100 text-slate-600";
    case "draft": return "bg-yellow-100 text-yellow-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

export default function ObserverPortal() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, AssessmentDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          router.push(`/w/${workspaceSlug}/login`);
          return;
        }
        const data = await res.json();
        if (data.forcePasswordChange) {
          router.push(`/w/${workspaceSlug}/change-password`);
          return;
        }
        if (!data.roles.includes("OBSERVER")) {
          if (data.roles.includes("CANDIDATE")) {
            router.push(`/w/${workspaceSlug}/assessment`);
          } else {
            router.push(`/w/${workspaceSlug}/admin`);
          }
          return;
        }
        setUser(data);
      })
      .catch(() => router.push(`/w/${workspaceSlug}/login`))
      .finally(() => setLoading(false));
  }, [router, workspaceSlug]);

  useEffect(() => {
    if (!user) return;
    setAssessmentsLoading(true);
    fetch(`/api/w/${workspaceSlug}/assessments`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setAssessments(data);
      })
      .catch(() => {})
      .finally(() => setAssessmentsLoading(false));
  }, [user, workspaceSlug]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!detailCache[id]) {
      setDetailLoading(id);
      try {
        const res = await fetch(`/api/w/${workspaceSlug}/assessments/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDetailCache((prev) => ({ ...prev, [id]: data }));
        }
      } catch {}
      setDetailLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/w/${workspaceSlug}/login`);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-400">Laden…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-lg font-bold tracking-tight">
            {user.workspaceName}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/70">{user.name}</span>
            <button
              onClick={handleLogout}
              data-testid="button-logout"
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-navy mb-1" data-testid="text-title">
            Beobachter-Portal
          </h1>
          <p className="text-sm text-slate-500">Zugewiesene Assessments und Übungen</p>
        </div>

        {assessmentsLoading && (
          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <p className="text-sm text-slate-400 text-center">Laden…</p>
          </div>
        )}

        {!assessmentsLoading && assessments.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8" data-testid="text-no-assessments">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-brand-navy mb-2">Keine Assessments vorhanden</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Es sind derzeit keine Assessments für Sie verfügbar.
              </p>
            </div>
          </div>
        )}

        {!assessmentsLoading && assessments.length > 0 && (
          <div className="space-y-4 mb-8">
            {assessments.map((assessment) => {
              const isExpanded = expandedId === assessment.id;
              const detail = detailCache[assessment.id];
              const isLoadingDetail = detailLoading === assessment.id;

              return (
                <div
                  key={assessment.id}
                  className="bg-white border border-slate-200 rounded-xl"
                  data-testid={`card-assessment-${assessment.id}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-brand-navy" data-testid={`text-assessment-name-${assessment.id}`}>
                          {assessment.name}
                        </h2>
                        {assessment.description && (
                          <p className="text-sm text-slate-600 mt-1" data-testid={`text-assessment-description-${assessment.id}`}>
                            {assessment.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ml-3 ${statusColor(assessment.status)}`}
                        data-testid={`text-assessment-status-${assessment.id}`}
                      >
                        {statusLabel(assessment.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                      {assessment.location && (
                        <div className="flex items-center gap-1.5" data-testid={`text-assessment-location-${assessment.id}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                          </svg>
                          {assessment.location}
                        </div>
                      )}
                      {assessment.startDate && (
                        <div className="flex items-center gap-1.5" data-testid={`text-assessment-dates-${assessment.id}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          {formatDate(assessment.startDate)}
                          {assessment.endDate && ` – ${formatDate(assessment.endDate)}`}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => toggleExpand(assessment.id)}
                      data-testid={`button-expand-${assessment.id}`}
                      className="text-sm font-medium text-brand-blue hover:text-brand-navy transition-colors flex items-center gap-1.5"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                      {isExpanded ? "Übungen ausblenden" : "Übungen anzeigen"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/50">
                      {isLoadingDetail && (
                        <p className="text-sm text-slate-400 text-center py-4">Laden…</p>
                      )}

                      {!isLoadingDetail && detail && detail.exercises.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4" data-testid={`text-no-exercises-${assessment.id}`}>
                          Keine Übungen vorhanden.
                        </p>
                      )}

                      {!isLoadingDetail && detail && detail.exercises.length > 0 && (
                        <div className="space-y-3">
                          {detail.exercises.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="bg-white border border-slate-200 rounded-xl p-5"
                              data-testid={`card-exercise-${exercise.id}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-brand-navy" data-testid={`text-exercise-name-${exercise.id}`}>
                                  {exercise.name}
                                </h4>
                                <span className="text-xs font-medium bg-brand-blue/10 text-brand-blue px-2.5 py-1 rounded-full whitespace-nowrap ml-3">
                                  {exerciseTypeLabels[exercise.type] || exercise.type}
                                </span>
                              </div>
                              {exercise.duration && (
                                <p className="text-xs text-slate-500 mb-2" data-testid={`text-exercise-duration-${exercise.id}`}>
                                  Dauer: {exercise.duration} Minuten
                                </p>
                              )}
                              {exercise.instructions && (
                                <p className="text-sm text-slate-600" data-testid={`text-exercise-instructions-${exercise.id}`}>
                                  {exercise.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!assessmentsLoading && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6" data-testid="card-documents-info">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-brand-navy mb-1">Unterlagen</h3>
                <p className="text-sm text-slate-500">
                  Relevante Unterlagen und Dokumente werden Ihnen während des Assessments zur Verfügung gestellt.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href={`/w/${workspaceSlug}/change-password`}
            className="text-sm text-slate-400 hover:text-brand-blue transition-colors"
            data-testid="link-change-password"
          >
            Passwort ändern
          </Link>
        </div>
      </main>

      <footer className="border-t py-6 border-slate-200">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
