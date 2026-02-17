"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { varexiaData, assessmentQuestions } from "@/lib/case-studies/varexia";

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

interface CaseStudyFromDB {
  id: string;
  dataJson: any;
  questionsJson: any;
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
  caseStudyData?: CaseStudyFromDB | null;
}

interface ConsentInfo {
  id: string;
  templateId: string;
  templateName: string;
  status: string;
  grantedAt: string | null;
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

const exerciseTypeIcons: Record<string, string> = {
  presentation: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5",
  interview: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155",
  group_discussion: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  case_study: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  role_play: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  in_tray: "M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z",
  psychometric: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0012 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5",
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

function formatCurrency(value: number): string {
  return `€${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const dataRoomTabList = [
  { id: "overview", label: "Übersicht" },
  { id: "briefing", label: "Strategisches Briefing" },
  { id: "communications", label: "Kommunikation" },
  { id: "dataroom", label: "Datenraum" },
  { id: "financials", label: "Finanzanalyse" },
  { id: "assessment", label: "Bewertung" },
];

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
  const [consents, setConsents] = useState<ConsentInfo[]>([]);
  const [view, setView] = useState<"welcome" | "modules" | "detail" | "dataroom">("welcome");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [dataRoomTab, setDataRoomTab] = useState<string>("overview");
  const [selectedEmailId, setSelectedEmailId] = useState<string>("e1");

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

  if (assessmentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Assessment wird geladen&hellip;</p>
        </div>
      </div>
    );
  }

  if (noAssessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 max-w-lg" data-testid="text-no-assessment">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-brand-blue/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-brand-navy mb-2">Kein Assessment zugewiesen</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Ihnen wurde noch kein Assessment zugewiesen. Sie werden benachrichtigt, sobald ein Assessment für Sie bereitsteht.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  const totalDuration = assessment.exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);
  const currentExercise = assessment.exercises.find(e => e.id === selectedExerciseId) || null;
  const exerciseDocs = currentExercise
    ? (assessment.documents.filter(d => d.exerciseId === currentExercise.id))
    : [];
  const todayFormatted = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dbCaseStudy = assessment.caseStudyData;
  const data = dbCaseStudy?.dataJson || varexiaData;
  const questions = dbCaseStudy?.questionsJson || assessmentQuestions;
  const selectedEmail = data.emails?.find((e: any) => e.id === selectedEmailId);

  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExerciseId(exercise.id);
    if (exercise.type === "case_study") {
      setView("dataroom");
      setDataRoomTab("overview");
    } else {
      setView("detail");
    }
  };

  const handleBackToModules = () => {
    setView("modules");
    setSelectedExerciseId(null);
  };

  if (view === "welcome") {
    return (
      <div className="min-h-screen flex flex-col bg-white relative overflow-hidden" data-testid="candidate-portal">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-blue/[0.03] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-navy/[0.02] rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 mb-12" data-testid="text-workspace-name">
            {user.workspaceName}
          </p>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-brand-navy text-center mb-4" data-testid="text-welcome-greeting">
            Willkommen, {user.name}
          </h1>

          <p className="text-lg text-slate-400 mb-12 text-center" data-testid="text-today-date">
            {todayFormatted}
          </p>

          <div className="text-center mb-12 max-w-lg">
            <h2 className="text-xl font-semibold text-brand-navy mb-2" data-testid="text-assessment-name">
              {assessment.name}
            </h2>
            <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
              {assessment.location && (
                <span className="flex items-center gap-1.5" data-testid="text-assessment-location">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                  </svg>
                  {assessment.location}
                </span>
              )}
              <span data-testid="text-exercise-count">
                {assessment.exercises.length} {assessment.exercises.length === 1 ? "Übung" : "Übungen"}
              </span>
              {totalDuration > 0 && (
                <span className="text-slate-300">·</span>
              )}
              {totalDuration > 0 && (
                <span data-testid="text-total-duration">ca. {totalDuration} Min.</span>
              )}
            </div>
          </div>

          <button
            onClick={() => setView("modules")}
            data-testid="button-start-assessment"
            className="group inline-flex items-center gap-3 bg-brand-blue hover:bg-blue-600 text-white font-semibold text-lg px-10 py-4 rounded-2xl shadow-lg shadow-brand-blue/25 hover:shadow-xl hover:shadow-brand-blue/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            Assessment starten
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (view === "modules") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50" data-testid="candidate-portal">
        <header className="bg-brand-navy text-white shadow-lg shrink-0">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-blue/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
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

        <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <p className="text-sm text-slate-400 mb-1">Willkommen zurück</p>
            <h1 className="text-2xl font-serif font-bold text-brand-navy" data-testid="text-welcome-back">
              {user.name}
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assessment.exercises.map((exercise, index) => (
              <button
                key={exercise.id}
                onClick={() => handleExerciseClick(exercise)}
                data-testid={`card-exercise-${exercise.id}`}
                className="group bg-white border border-slate-200 rounded-2xl p-6 text-left shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center text-xs font-bold text-brand-blue">
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-blue transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={exerciseTypeIcons[exercise.type] || exerciseTypeIcons.other} />
                    </svg>
                  </div>
                </div>

                <h3 className="text-base font-bold text-brand-navy mb-2 group-hover:text-brand-blue transition-colors">
                  {exercise.name}
                </h3>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-medium text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-full">
                    {exerciseTypeLabels[exercise.type] || exercise.type}
                  </span>
                  {exercise.duration && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {exercise.duration} Min.
                    </span>
                  )}
                </div>

                {exercise.instructions && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {exercise.instructions}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <span className="text-xs font-medium text-brand-blue group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Öffnen
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (view === "detail" && currentExercise) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50" data-testid="candidate-portal">
        <header className="bg-brand-navy text-white shadow-lg shrink-0">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-blue/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
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

        <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
          <button
            onClick={handleBackToModules}
            data-testid="button-back-modules"
            className="text-sm text-slate-500 hover:text-brand-blue transition-colors flex items-center gap-1.5 mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Zurück zu den Modulen
          </button>

          <div className="mb-6">
            <h1 className="text-3xl font-serif font-bold text-brand-navy mb-3" data-testid="text-exercise-name">
              {currentExercise.name}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded-full" data-testid="text-exercise-type">
                {exerciseTypeLabels[currentExercise.type] || currentExercise.type}
              </span>
              {currentExercise.duration && (
                <span className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full" data-testid="text-exercise-duration">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {currentExercise.duration} Minuten
                </span>
              )}
            </div>
          </div>

          {currentExercise.instructions && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-6" data-testid="card-exercise-instructions">
              <h3 className="text-sm font-semibold text-brand-navy mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                Anweisungen
              </h3>
              <div
                className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap"
                data-testid="text-exercise-instructions"
              >
                {currentExercise.instructions}
              </div>
            </div>
          )}

          {exerciseDocs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm" data-testid="card-exercise-documents">
              <h3 className="text-sm font-semibold text-brand-navy mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Dokumente
              </h3>
              <div className="space-y-2">
                {exerciseDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
                    data-testid={`doc-item-${doc.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(doc.id)}
                      disabled={downloadingId === doc.id}
                      data-testid={`button-download-${doc.id}`}
                      className="flex items-center gap-1.5 text-xs font-medium text-brand-blue hover:text-brand-navy bg-white border border-slate-200 hover:border-brand-blue/30 rounded-lg px-3 py-1.5 transition-colors shrink-0 ml-3"
                    >
                      {downloadingId === doc.id ? (
                        <div className="w-3.5 h-3.5 border border-brand-blue border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      )}
                      Herunterladen
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!currentExercise.instructions && exerciseDocs.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center" data-testid="text-no-exercise-content">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">Für diese Übung sind noch keine Anweisungen oder Dokumente hinterlegt.</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (view === "dataroom") {
    return (
      <div className="min-h-screen flex flex-col bg-white text-slate-900" data-testid="candidate-portal">
        <header className="bg-slate-900 text-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToModules}
                className="text-xs font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
                data-testid="button-back-modules"
              >
                ← Zurück zu den Modulen
              </button>
              <span className="text-sm font-bold tracking-tight font-serif">{currentExercise?.name || "Fallstudie"}</span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Case Study</span>
            </div>
            <button
              onClick={handleLogout}
              data-testid="button-logout"
              className="text-xs font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </header>

        <nav className="bg-slate-50 border-b border-slate-200 sticky top-14 z-40">
          <div className="max-w-7xl mx-auto px-6 flex overflow-x-auto">
            {dataRoomTabList.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDataRoomTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  dataRoomTab === tab.id
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">

          {dataRoomTab === "overview" && (
            <div className="space-y-8" data-testid="section-overview">
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-8 text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 text-xs font-medium mb-4">
                  Strategic Review Required
                </div>
                <h1 className="text-3xl font-serif font-bold mb-2">{data.name}</h1>
                <p className="text-slate-300 max-w-xl text-lg leading-relaxed">{data.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className={`rounded-xl border p-5 ${
                      metric.trend.includes("down") ? "border-l-4 border-l-red-500" : "border-l-4 border-l-slate-300"
                    }`}
                    data-testid={`kpi-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{metric.label}</span>
                    <div className="text-2xl font-serif font-bold text-slate-900 mt-1">{metric.value}</div>
                    {metric.trend.includes("down") && (
                      <p className="text-xs text-red-600 mt-1 font-medium">↓ Attention Required</p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-serif font-bold text-slate-800">Business Unit Overview</h2>
                  <span className="text-sm text-slate-400">FY 2025 Snapshot</span>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  {data.businessUnits.map((bu) => (
                    <div key={bu.id} className="rounded-xl border border-slate-200 p-5 hover:border-slate-400 transition-colors" data-testid={`bu-${bu.id}`}>
                      <h3 className="text-base font-semibold text-slate-800 mb-1">{bu.name}</h3>
                      <div className="text-xs font-mono text-slate-500 mb-3">
                        Revenue: €{bu.revenue}bn · Margin: {bu.margin}%
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Key Performance Indicators</span>
                        <ul className="space-y-1">
                          {bu.kpis.map((kpi, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5">
                              <span className="text-slate-300">→</span> {kpi}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <span className="text-[10px] font-bold uppercase block mb-1 text-amber-700">Strategic Tension</span>
                        <p className="text-sm text-amber-900 italic">&ldquo;{bu.tension}&rdquo;</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {dataRoomTab === "briefing" && (
            <div className="max-w-3xl mx-auto space-y-8" data-testid="section-briefing">
              <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">Strategic Briefing</h1>
                <p className="text-sm text-slate-500">Independent Assessment · Confidential</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-8 space-y-6 text-slate-700 leading-relaxed">
                <h2 className="text-lg font-serif font-bold text-slate-900">Your Role</h2>
                <p>
                  You have been appointed as an <strong>independent external assessor</strong> to evaluate the
                  strategic situation of <strong>Varexia SE</strong>, a diversified European conglomerate with a dual management structure.
                </p>
                <hr className="border-slate-100" />
                <h2 className="text-lg font-serif font-bold text-slate-900">Situation</h2>
                <p>
                  The Supervisory Board has called an extraordinary session following a <strong>significant decline in
                  market capitalization</strong> and <strong>growing investor concerns</strong> about the group&apos;s
                  conglomerate structure. Multiple business units face diverging strategic tensions,
                  and the CFO has flagged potential covenant breach risk.
                </p>
                <hr className="border-slate-100" />
                <h2 className="text-lg font-serif font-bold text-slate-900">Your Task</h2>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Review all available materials: financial data, business unit profiles, internal communications, and balance sheet details.</li>
                  <li>Identify key patterns, tensions, and interdependencies across the organization.</li>
                  <li>Formulate a structured assessment with clear recommendations for the Executive Board.</li>
                </ol>
                <hr className="border-slate-100" />
                <h2 className="text-lg font-serif font-bold text-slate-900">Constraints</h2>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Time-limited exercise: prioritize clarity over completeness.</li>
                  <li>All data is fictional but structurally realistic.</li>
                  <li>You may reference specific data points to support your arguments.</li>
                  <li>There is no single &ldquo;correct&rdquo; answer — the quality of reasoning matters.</li>
                </ul>
              </div>
            </div>
          )}

          {dataRoomTab === "communications" && (
            <div className="flex gap-4 h-[calc(100vh-12rem)]" data-testid="section-communications">
              <div className="w-1/3 rounded-xl border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm">Inbox</span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">{data.emails.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {data.emails.map((email) => (
                    <button
                      key={email.id}
                      onClick={() => setSelectedEmailId(email.id)}
                      className={`flex flex-col w-full text-left p-4 border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                        selectedEmailId === email.id ? "bg-slate-100 border-l-4 border-l-slate-800" : "border-l-4 border-l-transparent"
                      }`}
                      data-testid={`button-email-${email.id}`}
                    >
                      <div className="flex justify-between items-start w-full mb-1">
                        <span className={`text-xs font-semibold ${!email.read ? "text-slate-900" : "text-slate-500"}`}>
                          {email.from.split(",")[0]}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">{email.date.split(",")[1]?.trim()}</span>
                      </div>
                      <span className={`text-xs line-clamp-1 ${!email.read ? "font-medium text-slate-800" : "text-slate-600"}`}>
                        {email.subject}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {email.content.substring(0, 90).replace(/\n/g, " ")}...
                      </span>
                      {email.important && (
                        <span className="text-[9px] mt-1.5 inline-block border border-red-200 text-red-600 bg-red-50 rounded-full px-2 py-0.5 w-fit">
                          Important
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 rounded-xl border border-slate-200 flex flex-col overflow-hidden bg-white">
                {selectedEmail ? (
                  <>
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <h2 className="text-lg font-serif font-bold text-slate-900 mb-3" data-testid="text-email-subject">{selectedEmail.subject}</h2>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {selectedEmail.from.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900" data-testid="text-email-from">{selectedEmail.from}</div>
                          <div className="text-[10px] text-slate-400">{selectedEmail.date}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-w-3xl" data-testid="text-email-body">
                      {selectedEmail.content}
                    </div>
                    <div className="px-8 py-4 border-t border-slate-100 text-[10px] text-slate-400 italic flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      This message is confidential and intended solely for the Executive Board.
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300">
                    <p>Select an email to read</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {dataRoomTab === "dataroom" && (
            <div className="space-y-8" data-testid="section-dataroom">
              <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Data Room</h1>
                <p className="text-sm text-slate-400">Consolidated financial statements and business unit performance data</p>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                  <h3 className="font-serif font-bold text-slate-900">Year-over-Year Performance</h3>
                  <p className="text-xs text-slate-400">Revenue & EBITDA by Business Unit (€ bn)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-yoy">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Business Unit</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">FY24 Rev</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">FY25 Rev</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">Δ Rev</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">FY24 EBITDA</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">FY25 EBITDA</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">Δ EBITDA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.businessUnits.map((bu) => (
                        <tr key={bu.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-6 py-3 font-medium text-slate-800">{bu.name}</td>
                          <td className="text-right px-4 py-3 font-mono text-slate-400">{bu.yoy.revenue}</td>
                          <td className="text-right px-4 py-3 font-mono font-semibold text-slate-900">{bu.financials.revenue}</td>
                          <td className={`text-right px-4 py-3 font-mono ${bu.yoy.deltaRevenue > 0 ? "text-green-600" : bu.yoy.deltaRevenue < 0 ? "text-red-600" : "text-slate-400"}`}>
                            {bu.yoy.deltaRevenue > 0 ? `+${bu.yoy.deltaRevenue}` : bu.yoy.deltaRevenue}
                          </td>
                          <td className="text-right px-4 py-3 font-mono text-slate-400">{bu.yoy.ebitda}</td>
                          <td className="text-right px-4 py-3 font-mono font-semibold text-slate-900">{bu.financials.ebitda}</td>
                          <td className={`text-right px-4 py-3 font-mono ${bu.yoy.deltaEbitda > 0 ? "text-green-600" : bu.yoy.deltaEbitda < 0 ? "text-red-600" : "text-slate-400"}`}>
                            {bu.yoy.deltaEbitda > 0 ? `+${bu.yoy.deltaEbitda}` : bu.yoy.deltaEbitda === 0 ? "0" : bu.yoy.deltaEbitda}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                    <h3 className="font-serif font-bold text-slate-900">Assets</h3>
                    <p className="text-xs text-slate-400">Consolidated Balance Sheet FY 2025 (€ Millions)</p>
                  </div>
                  <table className="w-full text-sm" data-testid="table-assets">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-6 py-2 text-xs font-semibold text-slate-500">Line Item</th>
                        <th className="text-right px-6 py-2 text-xs font-semibold text-slate-500">Value (€ mn)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Non-Current Assets</td></tr>
                      {data.detailedBalanceSheet.assets.nonCurrent.map((item) => (
                        <tr key={item.item} className="border-b border-slate-50">
                          <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                          <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 border-t-2 border-slate-200">
                        <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Non-Current Assets</td>
                        <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">€61,747.00</td>
                      </tr>
                      <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Current Assets</td></tr>
                      {data.detailedBalanceSheet.assets.current.map((item) => (
                        <tr key={item.item} className="border-b border-slate-50">
                          <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                          <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 border-t-2 border-slate-200">
                        <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Current Assets</td>
                        <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">€17,993.00</td>
                      </tr>
                      <tr className="bg-slate-800 text-white">
                        <td className="px-6 py-2 font-bold text-xs">TOTAL ASSETS</td>
                        <td className="text-right px-6 py-2 font-bold text-xs font-mono">€79,740.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                    <h3 className="font-serif font-bold text-slate-900">Equity & Liabilities</h3>
                    <p className="text-xs text-slate-400">Consolidated Balance Sheet FY 2025 (€ Millions)</p>
                  </div>
                  <table className="w-full text-sm" data-testid="table-equity">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-6 py-2 text-xs font-semibold text-slate-500">Line Item</th>
                        <th className="text-right px-6 py-2 text-xs font-semibold text-slate-500">Value (€ mn)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Equity</td></tr>
                      {data.detailedBalanceSheet.equityLiabilities.equity.map((item) => (
                        <tr key={item.item} className="border-b border-slate-50">
                          <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                          <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 border-t-2 border-slate-200">
                        <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Equity</td>
                        <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">€21,904.00</td>
                      </tr>
                      <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Non-Current Liabilities</td></tr>
                      {data.detailedBalanceSheet.equityLiabilities.nonCurrentLiabilities.map((item) => (
                        <tr key={item.item} className="border-b border-slate-50">
                          <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                          <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 border-t-2 border-slate-200">
                        <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Non-Current Liab.</td>
                        <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">€43,853.00</td>
                      </tr>
                      <tr className="bg-slate-50/50"><td className="px-6 py-2 font-bold text-slate-700 text-xs uppercase" colSpan={2}>Current Liabilities</td></tr>
                      {data.detailedBalanceSheet.equityLiabilities.currentLiabilities.map((item) => (
                        <tr key={item.item} className="border-b border-slate-50">
                          <td className="px-6 pl-10 py-1.5 text-xs text-slate-600">{item.item}</td>
                          <td className="text-right px-6 py-1.5 text-xs font-mono text-slate-900">{formatCurrency(item.value)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 border-t-2 border-slate-200">
                        <td className="px-6 py-2 font-bold text-xs text-slate-900">Total Current Liab.</td>
                        <td className="text-right px-6 py-2 font-bold text-xs font-mono text-slate-900">€13,983.00</td>
                      </tr>
                      <tr className="bg-slate-800 text-white">
                        <td className="px-6 py-2 font-bold text-xs">TOTAL EQUITY & LIAB.</td>
                        <td className="text-right px-6 py-2 font-bold text-xs font-mono">€79,740.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">Business Unit Profiles</h2>
                <div className="grid md:grid-cols-2 gap-5">
                  {data.businessUnits.map((bu) => (
                    <div key={bu.id} className="rounded-xl border border-slate-200 p-5 hover:border-slate-400 transition-colors" data-testid={`dataroom-bu-${bu.id}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-serif font-bold text-slate-900">{bu.name}</h3>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Business Unit</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">Revenue</span>
                          <div className="text-xl font-mono font-semibold text-slate-900">€{bu.financials.revenue}bn</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">EBITDA Margin</span>
                          <div className={`text-xl font-mono font-semibold ${bu.financials.margin > 10 ? "text-green-700" : "text-slate-900"}`}>
                            {bu.financials.margin}%
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">KPIs</span>
                        <ul className="space-y-1">
                          {bu.kpis.map((kpi, i) => (
                            <li key={i} className="text-xs text-slate-600">→ {kpi}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <span className="text-[10px] font-bold uppercase text-amber-700 block mb-1">Strategic Tension</span>
                        <p className="text-sm text-amber-900 italic">&ldquo;{bu.tension}&rdquo;</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-6">
                <h3 className="font-serif font-bold text-slate-900 mb-4">Corporate Structure & Governance</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Organization</h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
                      <li><strong>Legal Form:</strong> European Stock Corporation (SE)</li>
                      <li><strong>Management Structure:</strong> Dual Board (Management Board + Supervisory Board)</li>
                      <li><strong>Headquarters:</strong> Europe</li>
                      <li><strong>Listing:</strong> Publicly Listed</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Key Figures</h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
                      <li><strong>Total Employees:</strong> 284,000 FTE</li>
                      <li><strong>Market Cap:</strong> €28.7 bn (Significant recent decline)</li>
                      <li><strong>Group Revenue:</strong> €42.0 bn</li>
                      <li><strong>Group EBIT:</strong> €1.4 bn</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {dataRoomTab === "financials" && (
            <div className="space-y-8" data-testid="section-financials">
              <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Financial Analysis</h1>
                <p className="text-sm text-slate-400">Consolidated financial visualization · FY 2025</p>
              </div>

              <div className="rounded-xl border border-slate-200 p-6">
                <h3 className="font-serif font-bold text-slate-900 mb-1">Revenue vs. EBITDA by Unit</h3>
                <p className="text-xs text-slate-400 mb-5">€ Billions</p>
                <div className="space-y-4">
                  {data.businessUnits.map((bu) => {
                    const maxRevenue = Math.max(...data.businessUnits.map((b) => b.revenue));
                    return (
                      <div key={bu.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{bu.name}</span>
                          <span className="font-mono text-slate-500">€{bu.revenue}bn / €{bu.ebitda}bn</span>
                        </div>
                        <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-slate-300 rounded-full" style={{ width: `${(bu.revenue / maxRevenue) * 100}%` }} />
                          <div className="absolute inset-y-0 left-0 bg-slate-800 rounded-full" style={{ width: `${(bu.ebitda / maxRevenue) * 100}%` }} />
                        </div>
                        <div className="flex gap-4 text-[10px] text-slate-400">
                          <span>Margin: {bu.margin}%</span>
                          <span>Employees: {bu.employees.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-800" /> EBITDA</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-300" /> Revenue</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-6">
                <h3 className="font-serif font-bold text-slate-900 mb-1">Balance Sheet Structure</h3>
                <p className="text-xs text-slate-400 mb-5">Summarized (€ Billions)</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Assets</h4>
                    {data.balanceSheet.filter((b) => b.type === "asset").map((item) => (
                      <div key={item.name} className="flex justify-between py-2 border-b border-slate-50 text-sm">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="font-mono font-semibold text-slate-900">€{item.value}bn</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold text-sm border-t-2 border-slate-200 mt-1">
                      <span>Total</span>
                      <span className="font-mono">€79.74bn</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Equity & Liabilities</h4>
                    {data.balanceSheet.filter((b) => b.type === "liability").map((item) => (
                      <div key={item.name} className="flex justify-between py-2 border-b border-slate-50 text-sm">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="font-mono font-semibold text-slate-900">€{item.value}bn</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold text-sm border-t-2 border-slate-200 mt-1">
                      <span>Total</span>
                      <span className="font-mono">€79.74bn</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-6">
                <h3 className="font-serif font-bold text-slate-900 mb-1">Profitability Profile</h3>
                <p className="text-xs text-slate-400 mb-5">EBITDA Margin by Business Unit</p>
                <div className="space-y-3">
                  {[...data.businessUnits].sort((a, b) => b.margin - a.margin).map((bu) => (
                    <div key={bu.id} className="flex items-center gap-4">
                      <span className="text-xs text-slate-600 w-48 shrink-0 truncate">{bu.name}</span>
                      <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden relative">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full ${bu.margin > 10 ? "bg-green-600" : bu.margin > 7 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${(bu.margin / 20) * 100}%` }}
                        />
                        <span className="absolute inset-0 flex items-center pl-3 text-xs font-mono font-bold text-white drop-shadow">
                          {bu.margin}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {dataRoomTab === "assessment" && (
            <div className="max-w-3xl mx-auto space-y-8" data-testid="section-assessment">
              <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Executive Assessment</h1>
                <p className="text-sm text-slate-400">Formulate your analysis and strategic recommendations</p>
              </div>

              <div className="rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Part I: Analysis</h2>
                <div className="space-y-6">
                  {questions.analysis.map((q, i) => (
                    <div key={i}>
                      <label className="text-sm font-medium text-slate-700 block mb-2">{i + 1}. {q}</label>
                      <textarea
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-colors min-h-[120px] resize-y"
                        placeholder="Ihre Analyse..."
                        data-testid={`textarea-analysis-${i}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-serif font-bold text-slate-900 mb-4">Part II: Strategic Conclusions</h2>
                <div className="space-y-6">
                  {questions.conclusions.map((q, i) => (
                    <div key={i}>
                      <label className="text-sm font-medium text-slate-700 block mb-2">{i + 1}. {q}</label>
                      <textarea
                        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-colors min-h-[120px] resize-y"
                        placeholder="Ihre Schlussfolgerungen..."
                        data-testid={`textarea-conclusions-${i}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center py-4">
                <p className="text-xs text-slate-400 italic">
                  Dies ist eine diagnostische Übung. Ihre Antworten werden nicht automatisch gespeichert.
                </p>
              </div>
            </div>
          )}
        </main>

        <footer className="border-t border-slate-100 py-6">
          <p className="text-center text-xs text-slate-300">
            &copy; Christoph Aldering &middot; Private initiative / concept
          </p>
        </footer>
      </div>
    );
  }

  return null;
}
