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

interface Exercise {
  id: string;
  name: string;
  type: string;
  instructions: string | null;
  duration: number | null;
  sortOrder: number;
  status: string;
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

interface AssessmentData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  exercises: Exercise[];
  documents: DocumentItem[];
}

interface ConsentInfo {
  id: string;
  templateId: string;
  templateName: string;
  status: string;
  grantedAt: string | null;
}

const exerciseTypeLabels: Record<string, string> = {
  presentation: "Pr\u00e4sentation",
  interview: "Interview",
  group_discussion: "Gruppendiskussion",
  case_study: "Fallstudie",
  role_play: "Rollenspiel",
  in_tray: "Postkorb",
  psychometric: "Psychometrisch",
  other: "Sonstiges",
};

const exerciseTypeIcons: Record<string, string> = {
  presentation: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5",
  interview: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155",
  group_discussion: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  case_study: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  role_play: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  in_tray: "M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z",
  psychometric: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5",
  other: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
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
    case "active": return "bg-green-100 text-green-700 border-green-200";
    case "completed": return "bg-slate-100 text-slate-600 border-slate-200";
    case "draft": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

type TabView = "overview" | "exercises" | "documents" | "consent";

export default function CandidateAssessmentPortal() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [noAssessment, setNoAssessment] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>("overview");
  const [consents, setConsents] = useState<ConsentInfo[]>([]);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

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
        if (!data.roles.includes("CANDIDATE")) {
          router.push(`/w/${workspaceSlug}/admin`);
          return;
        }
        setUser(data);
      })
      .catch(() => router.push(`/w/${workspaceSlug}/login`))
      .finally(() => setLoading(false));
  }, [router, workspaceSlug]);

  useEffect(() => {
    if (!user) return;
    setAssessmentLoading(true);
    fetch(`/api/w/${workspaceSlug}/my-assessment`)
      .then(async (res) => {
        if (res.status === 404) {
          setNoAssessment(true);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        setAssessment(data);
      })
      .catch(() => {})
      .finally(() => setAssessmentLoading(false));

    fetch(`/api/w/${workspaceSlug}/consents/my`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setConsents(data);
        }
      })
      .catch(() => {});
  }, [user, workspaceSlug]);

  const handleDownload = async (docId: string) => {
    setDownloadingId(docId);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/my-assessment/documents/${docId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }
    } catch {
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/w/${workspaceSlug}/login`);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Laden&hellip;</p>
        </div>
      </div>
    );
  }

  const totalDuration = assessment?.exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0) || 0;
  const generalDocs = assessment?.documents.filter(d => !d.exerciseId) || [];
  const exerciseDocs = assessment?.documents.filter(d => d.exerciseId) || [];

  const tabs: { id: TabView; label: string; count?: number }[] = [
    { id: "overview", label: "\u00dcbersicht" },
    { id: "exercises", label: "\u00dcbungen", count: assessment?.exercises.length },
    { id: "documents", label: "Unterlagen", count: assessment?.documents.length },
    { id: "consent", label: "Einwilligungen", count: consents.length },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-navy text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-blue/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="font-serif text-lg font-bold tracking-tight" data-testid="text-workspace-name">
              {user.workspaceName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs text-white/70" data-testid="text-user-name">{user.name}</span>
            </div>
            <span className="text-[10px] font-medium bg-brand-blue/20 text-brand-blue px-2 py-0.5 rounded-full border border-brand-blue/30">
              Kandidat*in
            </span>
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

      <main className="flex-1">
        {assessmentLoading && (
          <div className="max-w-4xl mx-auto w-full px-6 py-16">
            <div className="bg-white border border-slate-200 rounded-xl p-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Assessment wird geladen&hellip;</p>
              </div>
            </div>
          </div>
        )}

        {!assessmentLoading && noAssessment && (
          <div className="max-w-3xl mx-auto w-full px-6 py-16">
            <div className="bg-white border border-slate-200 rounded-2xl p-12" data-testid="text-no-assessment">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-brand-blue/10 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-brand-navy mb-2">Kein Assessment zugewiesen</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Ihnen wurde noch kein Assessment zugewiesen. Sie werden benachrichtigt, sobald ein Assessment f&uuml;r Sie bereitsteht.
                </p>
              </div>
            </div>
          </div>
        )}

        {!assessmentLoading && assessment && (
          <div className="max-w-4xl mx-auto w-full px-6 py-8">
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Willkommen, {user.name}</p>
                  <h1 className="text-2xl font-bold text-brand-navy font-serif" data-testid="text-welcome">
                    Kandidat*innen-Portal
                  </h1>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusColor(assessment.status)}`}
                  data-testid="text-assessment-status"
                >
                  {statusLabel(assessment.status)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm" data-testid="card-assessment-info">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-navy/5 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-brand-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-brand-navy" data-testid="text-assessment-name">
                    {assessment.name}
                  </h2>
                  {assessment.description && (
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed" data-testid="text-assessment-description">
                      {assessment.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                {assessment.startDate && (
                  <div data-testid="text-assessment-dates">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Datum</p>
                    <p className="text-sm font-medium text-slate-700">
                      {formatDate(assessment.startDate)}
                      {assessment.endDate && ` \u2013 ${formatDate(assessment.endDate)}`}
                    </p>
                    {assessment.startDate && daysUntil(assessment.startDate) > 0 && (
                      <p className="text-[10px] text-brand-blue font-medium mt-0.5">
                        in {daysUntil(assessment.startDate)} Tagen
                      </p>
                    )}
                  </div>
                )}
                {assessment.location && (
                  <div data-testid="text-assessment-location">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Ort</p>
                    <p className="text-sm font-medium text-slate-700">{assessment.location}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">&Uuml;bungen</p>
                  <p className="text-sm font-medium text-slate-700">{assessment.exercises.length}</p>
                </div>
                {totalDuration > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Gesamtdauer</p>
                    <p className="text-sm font-medium text-slate-700">ca. {totalDuration} Min.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-brand-navy text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id ? "bg-white/20" : "bg-slate-100"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="space-y-6" data-testid="tab-content-overview">
                {assessment.startDate && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-brand-navy mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      Zeitplan
                    </h3>
                    <div className="bg-brand-navy/5 rounded-xl p-5">
                      <p className="text-sm font-medium text-brand-navy mb-1">
                        {formatDateLong(assessment.startDate)}
                      </p>
                      {assessment.endDate && assessment.startDate !== assessment.endDate && (
                        <p className="text-sm text-slate-500">
                          bis {formatDateLong(assessment.endDate)}
                        </p>
                      )}
                      {assessment.location && (
                        <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                          </svg>
                          {assessment.location}
                        </p>
                      )}
                      {daysUntil(assessment.startDate) > 0 && (
                        <div className="mt-4 pt-4 border-t border-brand-navy/10">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-brand-blue">{daysUntil(assessment.startDate)}</span>
                            </div>
                            <span className="text-sm text-slate-600">Tage bis zum Assessment</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {assessment.exercises.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-brand-navy flex items-center gap-2">
                        <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                        </svg>
                        Ihre &Uuml;bungen
                      </h3>
                      <button
                        onClick={() => setActiveTab("exercises")}
                        className="text-xs font-medium text-brand-blue hover:text-brand-blue-dark transition-colors"
                        data-testid="link-view-exercises"
                      >
                        Details ansehen &rarr;
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {assessment.exercises.slice(0, 6).map((exercise) => (
                        <div
                          key={exercise.id}
                          className="bg-slate-50 rounded-xl p-4 border border-slate-100"
                          data-testid={`card-exercise-preview-${exercise.id}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0">
                              <svg className="w-3.5 h-3.5 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={exerciseTypeIcons[exercise.type] || exerciseTypeIcons.other} />
                              </svg>
                            </div>
                            <span className="text-[10px] font-medium text-brand-blue bg-brand-blue/10 px-1.5 py-0.5 rounded-full">
                              {exerciseTypeLabels[exercise.type] || exercise.type}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-700 line-clamp-2">{exercise.name}</p>
                          {exercise.duration && (
                            <p className="text-xs text-slate-400 mt-1">{exercise.duration} Min.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assessment.documents.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-brand-navy flex items-center gap-2">
                        <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        Unterlagen
                      </h3>
                      <button
                        onClick={() => setActiveTab("documents")}
                        className="text-xs font-medium text-brand-blue hover:text-brand-blue-dark transition-colors"
                        data-testid="link-view-documents"
                      >
                        Alle anzeigen &rarr;
                      </button>
                    </div>
                    <p className="text-sm text-slate-500">
                      {assessment.documents.length} Unterlage{assessment.documents.length !== 1 ? "n" : ""} verf&uuml;gbar
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-slate-700">Datenschutz</h3>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-3">
                      Ihre Einwilligungen und Datenschutzinformationen k&ouml;nnen Sie jederzeit einsehen.
                    </p>
                    <button
                      onClick={() => setActiveTab("consent")}
                      className="text-xs font-medium text-brand-blue hover:text-brand-blue-dark transition-colors"
                      data-testid="link-view-consents"
                    >
                      Einwilligungen ansehen &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-slate-700">Konto</h3>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-3">
                      Passwort &auml;ndern oder Ihre Kontoinformationen verwalten.
                    </p>
                    <Link
                      href={`/w/${workspaceSlug}/change-password`}
                      className="text-xs font-medium text-brand-blue hover:text-brand-blue-dark transition-colors"
                    >
                      Passwort &auml;ndern &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "exercises" && (
              <div className="space-y-4" data-testid="tab-content-exercises">
                {assessment.exercises.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-brand-navy mb-2">Noch keine &Uuml;bungen</h3>
                    <p className="text-sm text-slate-500">Die &Uuml;bungen werden in K&uuml;rze bereitgestellt.</p>
                  </div>
                ) : (
                  assessment.exercises.map((exercise, idx) => {
                    const relatedDocs = exerciseDocs.filter(d => d.exerciseId === exercise.id);
                    const isExpanded = expandedExercise === exercise.id;
                    return (
                      <div
                        key={exercise.id}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                        data-testid={`card-exercise-${exercise.id}`}
                      >
                        <button
                          onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                          className="w-full text-left p-6 flex items-start gap-4"
                          data-testid={`button-toggle-exercise-${exercise.id}`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-brand-blue">{idx + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-brand-navy text-base" data-testid={`text-exercise-name-${exercise.id}`}>
                                  {exercise.name}
                                </h4>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-xs font-medium bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full">
                                    {exerciseTypeLabels[exercise.type] || exercise.type}
                                  </span>
                                  {exercise.duration && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {exercise.duration} Minuten
                                    </span>
                                  )}
                                  {relatedDocs.length > 0 && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                      </svg>
                                      {relatedDocs.length} Unterlage{relatedDocs.length !== 1 ? "n" : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <svg className={`w-5 h-5 text-slate-300 transition-transform shrink-0 mt-1 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </div>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-6 pb-6 pt-0 ml-14 border-t border-slate-100 mt-0 pt-4">
                            {exercise.instructions && (
                              <div className="mb-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Instruktionen</p>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line" data-testid={`text-exercise-instructions-${exercise.id}`}>
                                  {exercise.instructions}
                                </p>
                              </div>
                            )}
                            {relatedDocs.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Zugeordnete Unterlagen</p>
                                <div className="space-y-2">
                                  {relatedDocs.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                                        <p className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</p>
                                      </div>
                                      <button
                                        onClick={() => handleDownload(doc.id)}
                                        disabled={downloadingId === doc.id}
                                        data-testid={`button-download-${doc.id}`}
                                        className="ml-3 text-xs font-medium text-brand-blue hover:text-brand-blue-dark transition-colors disabled:opacity-50"
                                      >
                                        {downloadingId === doc.id ? "Laden\u2026" : "Herunterladen"}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {!exercise.instructions && relatedDocs.length === 0 && (
                              <p className="text-sm text-slate-400 italic">Keine weiteren Details verf&uuml;gbar.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-6" data-testid="tab-content-documents">
                {assessment.documents.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-brand-navy mb-2">Keine Unterlagen</h3>
                    <p className="text-sm text-slate-500">Es sind derzeit keine Unterlagen f&uuml;r Sie verf&uuml;gbar.</p>
                  </div>
                ) : (
                  <>
                    {generalDocs.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Allgemeine Unterlagen</h3>
                        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm">
                          {generalDocs.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between px-5 py-4" data-testid={`row-document-${doc.id}`}>
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0">
                                  <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-brand-navy truncate" data-testid={`text-document-name-${doc.id}`}>{doc.name}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{doc.fileName} &middot; {formatFileSize(doc.fileSize)}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownload(doc.id)}
                                disabled={downloadingId === doc.id}
                                data-testid={`button-download-${doc.id}`}
                                className="ml-4 text-xs font-medium text-white bg-brand-blue hover:bg-brand-blue-dark rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 shrink-0"
                              >
                                {downloadingId === doc.id ? "Laden\u2026" : "Download"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {exerciseDocs.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">&Uuml;bungsbezogene Unterlagen</h3>
                        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm">
                          {exerciseDocs.map((doc) => {
                            const exercise = assessment.exercises.find(e => e.id === doc.exerciseId);
                            return (
                              <div key={doc.id} className="flex items-center justify-between px-5 py-4" data-testid={`row-document-${doc.id}`}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                    </svg>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-brand-navy truncate">{doc.name}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                      {exercise ? exercise.name : "\u00dcbung"} &middot; {formatFileSize(doc.fileSize)}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDownload(doc.id)}
                                  disabled={downloadingId === doc.id}
                                  data-testid={`button-download-${doc.id}`}
                                  className="ml-4 text-xs font-medium text-white bg-brand-blue hover:bg-brand-blue-dark rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 shrink-0"
                                >
                                  {downloadingId === doc.id ? "Laden\u2026" : "Download"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "consent" && (
              <div className="space-y-4" data-testid="tab-content-consent">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-700">Datenschutz & Einwilligungen</h3>
                      <p className="text-xs text-slate-400">DSGVO-konformes Consent-Management</p>
                    </div>
                  </div>

                  {consents.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                      <p className="text-sm text-slate-500">
                        Derzeit liegen keine Einwilligungsanfragen vor.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {consents.map((consent) => (
                        <div key={consent.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-5 py-4" data-testid={`row-consent-${consent.id}`}>
                          <div>
                            <p className="text-sm font-medium text-slate-700">{consent.templateName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {consent.status === "granted" && consent.grantedAt
                                ? `Erteilt am ${formatDate(consent.grantedAt)}`
                                : consent.status === "pending"
                                ? "Ausstehend"
                                : consent.status}
                            </p>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            consent.status === "granted"
                              ? "bg-green-100 text-green-700"
                              : consent.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {consent.status === "granted" ? "Erteilt" : consent.status === "pending" ? "Ausstehend" : consent.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ihre Daten werden gem&auml;&szlig; der DSGVO verarbeitet. Sie k&ouml;nnen Ihre Einwilligungen jederzeit widerrufen.
                      Wenden Sie sich bei Fragen an den Workspace-Administrator.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t py-6 border-slate-200 bg-white">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
