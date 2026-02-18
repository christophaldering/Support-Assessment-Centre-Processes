"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

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

interface PortalDoc {
  id: string;
  exerciseId: string | null;
  category: string;
  title: string;
  description: string | null;
  objectPath: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  releaseStatus: string;
  sortOrder: number;
}

interface SelfAssessmentItem {
  id: string;
  title: string;
  description: string | null;
  schemaJson: any;
  releaseStatus: string;
}

interface SelfAssessmentResponse {
  id: string;
  selfAssessmentId: string;
  responsesJson: any;
  status: string;
  submittedAt: string | null;
}

interface CaseStudyData {
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
  portalDocuments: PortalDoc[];
  selfAssessments: SelfAssessmentItem[];
  selfAssessmentResponses: SelfAssessmentResponse[];
  unlockedPhases: string[];
  caseStudyData: CaseStudyData | null;
}

const exerciseTypeLabels: Record<string, string> = {
  presentation: "Präsentation",
  interview: "Interview",
  interview_guide: "Interview-Leitfaden",
  group_discussion: "Gruppendiskussion",
  case_study: "Fallstudie",
  role_play: "Rollenspiel",
  behavior_simulation: "Verhaltenssimulation",
  fact_finding: "Fact-Finding",
  in_tray: "Postkorb",
  psychometric: "Psychometrischer Test",
  psychometric_test: "Psychometrischer Test",
  self_reflection: "Selbstreflexion",
  other: "Sonstiges",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type PortalView = "consent" | "welcome" | "documents" | "exercise" | "questionnaire" | "profile";

interface ConsentTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  version: number;
}

interface ConsentData {
  templates: ConsentTemplate[];
  records: { templateId: string; granted: boolean }[];
  allConsented: boolean;
}

interface SidebarCategory {
  id: string;
  label: string;
  icon: string;
  count: number;
  releasedCount: number;
  type: "docs" | "exercise" | "questionnaire";
  exerciseId?: string;
}

export default function CandidatePortal() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [noAssessment, setNoAssessment] = useState(false);

  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [consentLoading, setConsentLoading] = useState(true);
  const [consentGranting, setConsentGranting] = useState(false);
  const [consentChecked, setConsentChecked] = useState<Record<string, boolean>>({});

  const [view, setView] = useState<PortalView>("welcome");
  const [activeCategory, setActiveCategory] = useState<string>("general");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [caseStudyModalExercise, setCaseStudyModalExercise] = useState<string | null>(null);
  const [caseStudyTab, setCaseStudyTab] = useState<"background" | "data" | "questions">("background");

  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, any>>({});
  const [submittingQuestionnaire, setSubmittingQuestionnaire] = useState(false);

  const [consentError, setConsentError] = useState(false);

  const fetchConsent = useCallback(async () => {
    setConsentLoading(true);
    setConsentError(false);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/my-assessment/consent`);
      if (res.ok) {
        const data = await res.json();
        setConsentData(data);
        if (!data.allConsented && data.templates.length > 0) {
          setView("consent");
        }
        setConsentLoading(false);
      } else {
        setConsentError(true);
      }
    } catch {
      setConsentError(true);
    }
  }, [workspaceSlug]);

  const handleGrantConsent = async () => {
    if (!consentData) return;
    const unconsented = consentData.templates.filter(
      t => !consentData.records.some(r => r.templateId === t.id && r.granted)
    );
    const allChecked = unconsented.every(t => consentChecked[t.id]);
    if (!allChecked) return;

    setConsentGranting(true);
    try {
      for (const template of unconsented) {
        await fetch(`/api/w/${workspaceSlug}/my-assessment/consent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId: template.id, granted: true }),
        });
      }
      await fetchConsent();
      setView("welcome");
    } catch {}
    setConsentGranting(false);
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) { router.push(`/w/${workspaceSlug}/login`); return; }
        const data = await res.json();
        if (data.forcePasswordChange) { router.push(`/w/${workspaceSlug}/change-password`); return; }
        if (!data.roles.includes("CANDIDATE") && !data.roles.includes("ADMIN") && !data.roles.includes("MODERATOR")) { router.push(`/w/${workspaceSlug}/admin`); return; }
        setUser(data);
      })
      .catch(() => router.push(`/w/${workspaceSlug}/login`))
      .finally(() => setLoading(false));
  }, [router, workspaceSlug]);

  useEffect(() => {
    if (!user) return;
    setAssessmentLoading(true);
    fetchConsent();
    fetch(`/api/w/${workspaceSlug}/my-assessment`)
      .then(async (res) => {
        if (res.status === 404) { setNoAssessment(true); return; }
        if (!res.ok) return;
        setAssessment(await res.json());
      })
      .catch(() => {})
      .finally(() => setAssessmentLoading(false));
  }, [user, workspaceSlug, fetchConsent]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/w/${workspaceSlug}/login`);
  };

  const handleDownloadPortalDoc = async (docId: string) => {
    setDownloadingId(docId);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/my-assessment/portal-documents/${docId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.downloadUrl) window.open(data.downloadUrl, "_blank");
    } catch {}
    setDownloadingId(null);
  };

  const handleDownloadLegacyDoc = async (docId: string) => {
    setDownloadingId(docId);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/my-assessment/documents/${docId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.downloadUrl) window.open(data.downloadUrl, "_blank");
    } catch {}
    setDownloadingId(null);
  };

  const handleSubmitQuestionnaire = async (saId: string, submit: boolean) => {
    setSubmittingQuestionnaire(true);
    try {
      await fetch(`/api/w/${workspaceSlug}/my-assessment/self-assessments/${saId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responsesJson: questionnaireAnswers,
          status: submit ? "submitted" : "in_progress",
        }),
      });
      const res = await fetch(`/api/w/${workspaceSlug}/my-assessment`);
      if (res.ok) setAssessment(await res.json());
      if (submit) {
        setSelectedQuestionnaire(null);
        setView("welcome");
      }
    } catch {}
    setSubmittingQuestionnaire(false);
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

  if (consentLoading || consentError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          {consentError ? (
            <>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm text-slate-700 font-medium mb-2">Einwilligungsdaten konnten nicht geladen werden</p>
              <p className="text-xs text-slate-500 mb-4">Bitte versuchen Sie es erneut.</p>
              <button
                onClick={() => fetchConsent()}
                className="text-sm bg-brand-navy text-white px-5 py-2 rounded-lg hover:bg-brand-navy/90 transition-colors"
              >
                Erneut versuchen
              </button>
            </>
          ) : (
            <>
              <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Einwilligungen werden geladen…</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const isPreview = user.roles.includes("ADMIN") || user.roles.includes("MODERATOR");

  const portalDocs = assessment.portalDocuments || [];
  const legacyDocs = assessment.documents || [];
  const selfAssessments = assessment.selfAssessments || [];
  const saResponses = assessment.selfAssessmentResponses || [];
  const unlockedPhases = assessment.unlockedPhases || [];

  const preparationUnlocked = isPreview || unlockedPhases.includes("preparation");
  const executionUnlocked = isPreview || unlockedPhases.includes("execution");
  const followupUnlocked = isPreview || unlockedPhases.includes("followup");

  const generalDocs = portalDocs.filter(d => d.category === "general" || (!d.exerciseId && d.category !== "preparation" && d.category !== "info"));
  const prepDocs = portalDocs.filter(d => d.category === "preparation");
  const infoDocs = portalDocs.filter(d => d.category === "info");

  const allExercises = assessment.exercises;

  const releasedQuestionnaires = selfAssessments.filter(sa => sa.releaseStatus === "released");

  const sidebarCategories: SidebarCategory[] = [];

  if (preparationUnlocked && generalDocs.length > 0) {
    sidebarCategories.push({
      id: "general", label: "Allgemeine Dokumente", icon: "folder", type: "docs",
      count: generalDocs.length,
      releasedCount: generalDocs.filter(d => d.releaseStatus === "released").length,
    });
  }

  if (preparationUnlocked && prepDocs.length > 0) {
    sidebarCategories.push({
      id: "preparation", label: "Vorbereitung", icon: "book", type: "docs",
      count: prepDocs.length,
      releasedCount: prepDocs.filter(d => d.releaseStatus === "released").length,
    });
  }

  if (preparationUnlocked && infoDocs.length > 0) {
    sidebarCategories.push({
      id: "info", label: "Informationsmaterial", icon: "info", type: "docs",
      count: infoDocs.length,
      releasedCount: infoDocs.filter(d => d.releaseStatus === "released").length,
    });
  }

  if (executionUnlocked) {
    for (const ex of allExercises) {
      const exPortalDocs = portalDocs.filter(d => d.exerciseId === ex.id);
      const exLegacyDocs = legacyDocs.filter(d => d.exerciseId === ex.id);
      sidebarCategories.push({
        id: `exercise-${ex.id}`, label: ex.name, icon: "exercise", type: "exercise", exerciseId: ex.id,
        count: exPortalDocs.length + exLegacyDocs.length,
        releasedCount: exPortalDocs.filter(d => d.releaseStatus === "released").length + exLegacyDocs.length,
      });
    }
  }

  if (preparationUnlocked && releasedQuestionnaires.length > 0) {
    sidebarCategories.push({
      id: "questionnaires", label: "Fragebögen & Tests", icon: "questionnaire", type: "questionnaire",
      count: releasedQuestionnaires.length,
      releasedCount: releasedQuestionnaires.length,
    });
  }

  if (preparationUnlocked && legacyDocs.filter(d => !d.exerciseId).length > 0 && generalDocs.length === 0) {
    sidebarCategories.unshift({
      id: "legacy-general", label: "Allgemeine Dokumente", icon: "folder", type: "docs",
      count: legacyDocs.filter(d => !d.exerciseId).length,
      releasedCount: legacyDocs.filter(d => !d.exerciseId).length,
    });
  }

  const getDocsForCategory = (catId: string): (PortalDoc | DocumentItem)[] => {
    if (catId === "general") return generalDocs;
    if (catId === "preparation") return prepDocs;
    if (catId === "info") return infoDocs;
    if (catId === "legacy-general") return legacyDocs.filter(d => !d.exerciseId);
    if (catId.startsWith("exercise-")) {
      const exId = catId.replace("exercise-", "");
      return [
        ...portalDocs.filter(d => d.exerciseId === exId),
        ...legacyDocs.filter(d => d.exerciseId === exId),
      ];
    }
    return [];
  };

  const getCategoryLabel = (catId: string): string => {
    const cat = sidebarCategories.find(c => c.id === catId);
    return cat?.label || "Dokumente";
  };

  const getExerciseForCategory = (catId: string): Exercise | null => {
    if (!catId.startsWith("exercise-")) return null;
    const exId = catId.replace("exercise-", "");
    return allExercises.find(e => e.id === exId) || null;
  };

  const exerciseTypeIcons: Record<string, { icon: JSX.Element; color: string; bg: string }> = {
    presentation: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />,
      color: "text-blue-600", bg: "bg-blue-50",
    },
    interview: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />,
      color: "text-indigo-600", bg: "bg-indigo-50",
    },
    interview_guide: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />,
      color: "text-indigo-600", bg: "bg-indigo-50",
    },
    group_discussion: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />,
      color: "text-teal-600", bg: "bg-teal-50",
    },
    case_study: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />,
      color: "text-amber-600", bg: "bg-amber-50",
    },
    role_play: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
      color: "text-pink-600", bg: "bg-pink-50",
    },
    behavior_simulation: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
      color: "text-pink-600", bg: "bg-pink-50",
    },
    fact_finding: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />,
      color: "text-orange-600", bg: "bg-orange-50",
    },
    in_tray: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-17.5 0V6.75A2.25 2.25 0 014.5 4.5h15A2.25 2.25 0 0121.75 6.75v6.75m-17.5 0v6.75A2.25 2.25 0 006.75 22.5h10.5a2.25 2.25 0 002.25-2.25v-6.75" />,
      color: "text-slate-600", bg: "bg-slate-100",
    },
    psychometric: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />,
      color: "text-violet-600", bg: "bg-violet-50",
    },
    psychometric_test: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />,
      color: "text-violet-600", bg: "bg-violet-50",
    },
    self_reflection: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />,
      color: "text-cyan-600", bg: "bg-cyan-50",
    },
    other: {
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />,
      color: "text-slate-600", bg: "bg-slate-100",
    },
  };

  const totalDuration = assessment.exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);
  const todayFormatted = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const completedQuestionnaires = releasedQuestionnaires.filter(sa => {
    const resp = saResponses.find(r => r.selfAssessmentId === sa.id);
    return resp?.status === "submitted";
  }).length;

  const totalPortalDocsReleased = portalDocs.filter(d => d.releaseStatus === "released").length;

  if (view === "consent" && consentData && consentData.templates.length > 0) {
    const unconsented = consentData.templates.filter(
      t => !consentData.records.some(r => r.templateId === t.id && r.granted)
    );
    const allCheckedNow = unconsented.every(t => consentChecked[t.id]);

    return (
      <div className="min-h-screen flex flex-col bg-white" data-testid="candidate-portal-consent">
        <header className="bg-brand-navy text-white shrink-0">
          <div className="px-6 h-14 flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-brand-blue/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <span className="text-sm font-semibold">Datenschutz & Einwilligung</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/70">{user.name}</span>
              <button onClick={handleLogout} className="text-xs text-white/60 hover:text-white transition-colors" data-testid="button-logout-consent">
                Abmelden
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-brand-navy mb-2" data-testid="text-consent-title">
                Einwilligungserklärung
              </h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Bevor Sie auf das Portal zugreifen können, bitten wir Sie, die folgenden Einwilligungserklärungen zu lesen und zu bestätigen.
              </p>
            </div>

            <div className="space-y-4">
              {unconsented.map(template => (
                <div key={template.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid={`consent-template-${template.id}`}>
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-brand-navy">{template.name}</h3>
                      <span className="text-[10px] text-slate-400">Version {template.version}</span>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto pr-2" data-testid={`consent-content-${template.id}`}>
                      {template.content}
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentChecked[template.id] || false}
                        onChange={e => setConsentChecked(prev => ({ ...prev, [template.id]: e.target.checked }))}
                        data-testid={`checkbox-consent-${template.id}`}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/30"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-brand-navy transition-colors">
                        Ich habe die obige Erklärung gelesen und stimme zu.
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleGrantConsent}
                disabled={!allCheckedNow || consentGranting}
                data-testid="button-grant-consent"
                className="inline-flex items-center gap-2 bg-brand-navy text-white text-sm font-medium px-8 py-3 rounded-lg hover:bg-brand-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {consentGranting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Wird gespeichert…
                  </>
                ) : (
                  <>
                    Zustimmen und fortfahren
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </>
                )}
              </button>
              <p className="text-xs text-slate-400 mt-3">
                Sie können Ihre Einwilligung jederzeit widerrufen.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (view === "profile") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50" data-testid="candidate-portal-profile">
        <header className="bg-brand-navy text-white shrink-0">
          <div className="px-6 h-14 flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("welcome")}
                className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors"
                data-testid="button-back-from-profile"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Zurück
              </button>
              <span className="text-white/30">|</span>
              <span className="text-sm font-semibold">Mein Profil</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/70">{user.name}</span>
              <button onClick={handleLogout} className="text-xs text-white/60 hover:text-white transition-colors">Abmelden</button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-brand-navy/10 flex items-center justify-center text-2xl font-bold text-brand-navy">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-navy" data-testid="text-profile-name">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                <p className="text-sm text-slate-900 bg-slate-50 rounded-lg px-4 py-3">{user.name}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">E-Mail</label>
                <p className="text-sm text-slate-900 bg-slate-50 rounded-lg px-4 py-3">{user.email}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Rolle</label>
                <p className="text-sm text-slate-900 bg-slate-50 rounded-lg px-4 py-3">Kandidat*in</p>
              </div>
              {assessment && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assessment</label>
                  <p className="text-sm text-slate-900 bg-slate-50 rounded-lg px-4 py-3">{assessment.name}</p>
                </div>
              )}
            </div>

            {consentData && consentData.records.filter(r => r.granted).length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-brand-navy mb-3">Erteilte Einwilligungen</h3>
                <div className="space-y-2">
                  {consentData.templates.filter(t => consentData.records.some(r => r.templateId === t.id && r.granted)).map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={() => router.push(`/w/${workspaceSlug}/change-password`)}
                data-testid="button-change-password"
                className="text-sm text-brand-blue hover:text-brand-navy font-medium transition-colors"
              >
                Passwort ändern
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (view === "welcome") {
    return (
      <div className="min-h-screen flex flex-col bg-white" data-testid="candidate-portal">
        {isPreview && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium text-amber-700">Vorschau-Modus — So sehen Kandidaten das Portal</span>
            <button onClick={() => router.push(`/w/${workspaceSlug}/admin`)} className="ml-4 text-xs text-amber-600 hover:text-amber-800 underline">Zurück zum Admin</button>
          </div>
        )}
        <header className="bg-brand-navy text-white shrink-0">
          <div className="px-6 h-14 flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-brand-blue/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
              </div>
              <span className="text-sm font-semibold" data-testid="text-portal-title">Kandidat*innen Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView("profile")}
                data-testid="button-profile"
                className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-brand-blue/30 flex items-center justify-center text-[10px] font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {user.name}
              </button>
              <button onClick={handleLogout} data-testid="button-logout" className="text-xs text-white/60 hover:text-white transition-colors">
                Abmelden
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-5xl mx-auto w-full">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-navy mb-3 text-center" data-testid="text-welcome-greeting">
            Willkommen {user.name}
          </h1>
          <p className="text-slate-500 mb-10 text-center max-w-lg" data-testid="text-welcome-description">
            Im Folgenden sehen Sie eine Übersicht über den gesamten Prozess.<br />
            Je nach Art und Umfang werden die einzelnen Schritte nach und nach freigeschaltet.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
            <div className={`bg-white rounded-xl p-6 transition-shadow ${preparationUnlocked ? "border border-slate-200 hover:shadow-md" : "border-2 border-dashed border-slate-200 opacity-75"}`}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-bold text-brand-navy" data-testid="text-phase-before">Vorbereitung</h3>
                {preparationUnlocked ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75" /></svg>
                    Freigeschaltet
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    Gesperrt
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                Erhalten Sie umfassende Einblicke in den Prozess, einschließlich der vorbereitenden Schritte, die Sie eigenständig durchführen können.
              </p>
              {preparationUnlocked && (totalPortalDocsReleased > 0 || releasedQuestionnaires.length > 0) ? (
                <button
                  onClick={() => { setView("documents"); setActiveCategory(sidebarCategories[0]?.id || "general"); }}
                  data-testid="button-phase-before"
                  className="inline-flex items-center gap-2 bg-brand-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-brand-navy/90 transition-colors w-full justify-center"
                >
                  Dokumente ansehen
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ) : !preparationUnlocked ? (
                <span className="text-xs text-slate-400 bg-slate-50 rounded-lg px-4 py-2 inline-block">Noch nicht freigeschaltet</span>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-50 rounded-lg px-4 py-2 inline-block">Bald verfügbar</span>
              )}
            </div>

            <div className={`bg-white rounded-xl p-6 transition-shadow ${executionUnlocked ? "border-2 border-brand-blue/30 shadow-sm" : "border-2 border-dashed border-slate-200 opacity-75"}`}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-bold text-brand-navy" data-testid="text-phase-during">Durchführung</h3>
                {executionUnlocked ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75" /></svg>
                    Freigeschaltet
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    Gesperrt
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                Im Hauptteil des Assessments durchlaufen Sie verschiedene Bausteine. In dieser Phase werden Sie beobachtet und bewertet.
              </p>
              {executionUnlocked && assessment.exercises.length > 0 ? (
                <button
                  onClick={() => {
                    setView("documents");
                    const firstExCat = sidebarCategories.find(c => c.type === "exercise");
                    setActiveCategory(firstExCat?.id || sidebarCategories[0]?.id || "general");
                  }}
                  data-testid="button-phase-during"
                  className="inline-flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-brand-blue/90 transition-colors w-full justify-center"
                >
                  Bausteine ansehen
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ) : !executionUnlocked ? (
                <span className="text-xs text-slate-400 bg-slate-50 rounded-lg px-4 py-2 inline-block">Noch nicht freigeschaltet</span>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-50 rounded-lg px-4 py-2 inline-block">Bald verfügbar</span>
              )}
            </div>

            <div className={`bg-white rounded-xl p-6 transition-shadow ${followupUnlocked ? "border border-slate-200 hover:shadow-md" : "border-2 border-dashed border-slate-200 opacity-75"}`}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-bold text-brand-navy" data-testid="text-phase-after">Nachbereitung</h3>
                {followupUnlocked ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75" /></svg>
                    Freigeschaltet
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    Gesperrt
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                Nach Abschluss des Assessments reflektieren Sie über Ihre Stärken und Entwicklungsbereiche.
              </p>
              {followupUnlocked ? (
                <span className="text-xs text-slate-400 bg-slate-50 rounded-lg px-4 py-2 inline-block">Bald verfügbar</span>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-50 rounded-lg px-4 py-2 inline-block">Noch nicht freigeschaltet</span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 w-full max-w-lg text-center">
            <p className="text-sm text-slate-500 mb-1">{assessment.name}</p>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              {assessment.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                  </svg>
                  {assessment.location}
                </span>
              )}
              <span>{assessment.exercises.length} Übungen</span>
              {totalDuration > 0 && <span>ca. {totalDuration} Min.</span>}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (view === "questionnaire" && selectedQuestionnaire) {
    const sa = selfAssessments.find(s => s.id === selectedQuestionnaire);
    if (!sa) { setView("documents"); return null; }

    const existingResponse = saResponses.find(r => r.selfAssessmentId === sa.id);
    const isSubmitted = existingResponse?.status === "submitted";
    const schema = sa.schemaJson;

    return (
      <div className="min-h-screen flex flex-col bg-slate-50" data-testid="candidate-portal">
        <header className="bg-brand-navy text-white shrink-0">
          <div className="px-6 h-14 flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setView("documents"); setActiveCategory("questionnaires"); setSelectedQuestionnaire(null); }}
                className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors"
                data-testid="button-back-from-questionnaire"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Zurück
              </button>
              <span className="text-white/30">|</span>
              <span className="text-sm font-semibold">Kandidat*innen Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/70">{user.name}</span>
              <button onClick={handleLogout} className="text-xs text-white/60 hover:text-white transition-colors">Abmelden</button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-navy">{sa.title}</h2>
                {sa.description && <p className="text-sm text-slate-500">{sa.description}</p>}
              </div>
            </div>

            {isSubmitted && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-emerald-700 font-medium">Dieser Fragebogen wurde bereits eingereicht. Vielen Dank!</p>
              </div>
            )}

            {schema?.sections?.map((section: any, si: number) => (
              <div key={si} className="mb-8">
                <h3 className="text-base font-semibold text-brand-navy mb-4">{section.title}</h3>
                <div className="space-y-5">
                  {section.items?.map((item: any, ii: number) => {
                    const key = `${si}-${ii}`;
                    const currentVal = questionnaireAnswers[key] ?? existingResponse?.responsesJson?.[key] ?? "";
                    return (
                      <div key={ii}>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{item.label}</label>
                        {item.type === "rating" ? (
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button
                                key={v}
                                onClick={() => !isSubmitted && setQuestionnaireAnswers(prev => ({ ...prev, [key]: v }))}
                                disabled={isSubmitted}
                                data-testid={`rating-${key}-${v}`}
                                className={`w-10 h-10 rounded-lg border-2 text-sm font-semibold transition-colors ${
                                  currentVal === v
                                    ? "border-brand-blue bg-brand-blue text-white"
                                    : "border-slate-200 text-slate-400 hover:border-brand-blue/40"
                                } ${isSubmitted ? "cursor-not-allowed opacity-70" : ""}`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            value={currentVal}
                            onChange={e => !isSubmitted && setQuestionnaireAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                            disabled={isSubmitted}
                            data-testid={`text-${key}`}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none resize-none disabled:bg-slate-50 disabled:text-slate-500"
                            rows={3}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {!isSubmitted && (
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleSubmitQuestionnaire(sa.id, false)}
                  disabled={submittingQuestionnaire}
                  data-testid="button-save-questionnaire"
                  className="text-sm text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors"
                >
                  Zwischenspeichern
                </button>
                <button
                  onClick={() => handleSubmitQuestionnaire(sa.id, true)}
                  disabled={submittingQuestionnaire}
                  data-testid="button-submit-questionnaire"
                  className="text-sm font-medium text-white bg-brand-blue rounded-lg px-6 py-2 hover:bg-brand-blue/90 transition-colors"
                >
                  {submittingQuestionnaire ? "Wird gesendet…" : "Endgültig einreichen"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  const currentDocs = getDocsForCategory(activeCategory);
  const currentCat = sidebarCategories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" data-testid="candidate-portal">
      {isPreview && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-medium text-amber-700">Vorschau-Modus — So sehen Kandidaten das Portal</span>
          <button onClick={() => router.push(`/w/${workspaceSlug}/admin`)} className="ml-4 text-xs text-amber-600 hover:text-amber-800 underline">Zurück zum Admin</button>
        </div>
      )}
      <header className="bg-brand-navy text-white shrink-0">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("welcome")}
              className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors"
              data-testid="button-back-to-welcome"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </button>
            <span className="text-white/30">|</span>
            <span className="text-sm font-semibold">Kandidat*innen Portal</span>
            {activeCategory && (
              <>
                <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                <span className="text-xs text-white/60">{getCategoryLabel(activeCategory)}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("profile")}
              data-testid="button-profile-doc"
              className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-brand-blue/30 flex items-center justify-center text-[10px] font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {user.name}
            </button>
            <button onClick={handleLogout} className="text-xs text-white/60 hover:text-white transition-colors" data-testid="button-logout">
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0" data-testid="assessment-info-banner">
        <div className="flex items-center gap-5 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-navy/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-brand-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <span className="font-semibold text-brand-navy" data-testid="text-banner-name">{assessment.name}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          {assessment.startDate && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span data-testid="text-banner-date">
                {new Date(assessment.startDate).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                {assessment.endDate && assessment.endDate !== assessment.startDate && (
                  <> &ndash; {new Date(assessment.endDate).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}</>
                )}
              </span>
            </div>
          )}
          {assessment.location && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
              </svg>
              <span data-testid="text-banner-location">{assessment.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span data-testid="text-banner-exercises">{assessment.exercises.length} Bausteine</span>
          </div>
          {totalDuration > 0 && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span data-testid="text-banner-duration">ca. {totalDuration} Min. gesamt</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-white border-r border-slate-200 overflow-y-auto shrink-0 hidden md:flex flex-col" data-testid="sidebar-navigation">
          <div className="px-3 py-3 border-b border-slate-100">
            <button
              onClick={() => setView("welcome")}
              data-testid="sidebar-welcome"
              className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-brand-navy/5 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-brand-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <span className="font-medium">Startseite</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {sidebarCategories.filter(c => c.type === "docs").length > 0 && (
              <>
                <div className="px-5 pt-3 pb-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dokumente & Vorbereitung</p>
                </div>
                {sidebarCategories.filter(c => c.type === "docs").map(cat => {
                  const isActive = activeCategory === cat.id;
                  const iconMap: Record<string, JSX.Element> = {
                    folder: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />,
                    book: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
                    info: <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />,
                  };
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      data-testid={`sidebar-item-${cat.id}`}
                      className={`w-full text-left px-3 mx-2 py-2 flex items-center justify-between text-sm transition-all rounded-lg ${
                        isActive
                          ? "bg-brand-blue/8 text-brand-blue font-medium"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                      style={{ width: "calc(100% - 16px)" }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-brand-blue/10" : "bg-slate-100"}`}>
                          <svg className={`w-4 h-4 ${isActive ? "text-brand-blue" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            {iconMap[cat.icon] || iconMap.folder}
                          </svg>
                        </div>
                        <span className="truncate">{cat.label}</span>
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isActive ? "bg-brand-blue/10 text-brand-blue" : "bg-slate-100 text-slate-400"}`}>
                        {cat.releasedCount}/{cat.count}
                      </span>
                    </button>
                  );
                })}
              </>
            )}

            {sidebarCategories.filter(c => c.type === "exercise").length > 0 && (
              <>
                <div className="px-5 pt-5 pb-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bausteine</p>
                </div>
                {sidebarCategories.filter(c => c.type === "exercise").map(cat => {
                  const isActive = activeCategory === cat.id;
                  const exercise = allExercises.find(e => e.id === cat.exerciseId);
                  const typeStyle = exercise ? (exerciseTypeIcons[exercise.type] || exerciseTypeIcons.other) : exerciseTypeIcons.other;
                  const isCaseStudy = exercise?.type === "case_study";
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (isCaseStudy && exercise) {
                          setCaseStudyModalExercise(exercise.id);
                        } else {
                          setActiveCategory(cat.id);
                        }
                      }}
                      data-testid={`sidebar-item-${cat.id}`}
                      className={`w-full text-left px-3 mx-2 py-2 flex items-center justify-between text-sm transition-all rounded-lg ${
                        isActive
                          ? "bg-brand-blue/8 text-brand-blue font-medium"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                      style={{ width: "calc(100% - 16px)" }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-brand-blue/10" : typeStyle.bg}`}>
                          <svg className={`w-3.5 h-3.5 ${isActive ? "text-brand-blue" : typeStyle.color}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            {typeStyle.icon}
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <span className="truncate block leading-tight">{cat.label}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] ${isActive ? "text-brand-blue/60" : "text-slate-400"}`}>
                              {exerciseTypeLabels[exercise?.type || "other"] || exercise?.type}
                            </span>
                            {exercise?.duration && (
                              <>
                                <span className="text-slate-300">&middot;</span>
                                <span className={`text-[10px] ${isActive ? "text-brand-blue/60" : "text-slate-400"}`}>{exercise.duration} Min.</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {cat.count > 0 && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${isActive ? "bg-brand-blue/10 text-brand-blue" : "bg-slate-100 text-slate-400"}`}>
                          {cat.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            )}

            {releasedQuestionnaires.length > 0 && (
              <>
                <div className="px-5 pt-5 pb-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fragebögen & Tests</p>
                </div>
                {releasedQuestionnaires.map(sa => {
                  const resp = saResponses.find(r => r.selfAssessmentId === sa.id);
                  const isSubmitted = resp?.status === "submitted";
                  return (
                    <button
                      key={sa.id}
                      onClick={() => {
                        setSelectedQuestionnaire(sa.id);
                        setView("questionnaire");
                      }}
                      data-testid={`sidebar-questionnaire-${sa.id}`}
                      className="w-full text-left px-3 mx-2 py-2 flex items-center justify-between text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                      style={{ width: "calc(100% - 16px)" }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                          </svg>
                        </div>
                        <span className="truncate">{sa.title}</span>
                      </div>
                      {isSubmitted ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-brand-navy" data-testid="text-category-title">{getCategoryLabel(activeCategory)}</h2>
              {currentCat && currentCat.type === "docs" && (
                <span className="text-xs text-slate-400">
                  {currentCat.releasedCount} von {currentCat.count} freigegeben
                </span>
              )}
              {currentCat && currentCat.type === "exercise" && currentCat.count > 0 && (
                <span className="text-xs text-slate-400">
                  {currentCat.count} {currentCat.count === 1 ? "Dokument" : "Dokumente"}
                </span>
              )}
            </div>

            {(() => {
              const activeExercise = getExerciseForCategory(activeCategory);
              if (activeExercise) {
                const typeStyle = exerciseTypeIcons[activeExercise.type] || exerciseTypeIcons.other;
                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6" data-testid={`exercise-detail-${activeExercise.id}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${typeStyle.bg} flex items-center justify-center shrink-0`}>
                        <svg className={`w-6 h-6 ${typeStyle.color}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          {typeStyle.icon}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.color}`} data-testid={`exercise-type-${activeExercise.id}`}>
                            {exerciseTypeLabels[activeExercise.type] || activeExercise.type}
                          </span>
                          {activeExercise.duration && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500" data-testid={`exercise-duration-${activeExercise.id}`}>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {activeExercise.duration} Min.
                            </span>
                          )}
                        </div>
                        {activeExercise.instructions && (
                          <p className="text-sm text-slate-600 leading-relaxed mt-3 whitespace-pre-wrap" data-testid={`exercise-instructions-${activeExercise.id}`}>
                            {activeExercise.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {activeCategory === "questionnaires" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {releasedQuestionnaires.map(sa => {
                  const resp = saResponses.find(r => r.selfAssessmentId === sa.id);
                  const isSubmitted = resp?.status === "submitted";
                  return (
                    <button
                      key={sa.id}
                      onClick={() => { setSelectedQuestionnaire(sa.id); setView("questionnaire"); }}
                      data-testid={`card-questionnaire-${sa.id}`}
                      className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:shadow-md hover:border-brand-blue/30 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-brand-navy group-hover:text-brand-blue transition-colors">{sa.title}</h3>
                          {sa.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sa.description}</p>}
                          <div className="mt-3">
                            {isSubmitted ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Eingereicht
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-brand-blue">Ausfüllen &rarr;</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentDocs.map((doc: any) => {
                  const isPortalDoc = "releaseStatus" in doc;
                  const isReleased = isPortalDoc ? doc.releaseStatus === "released" : true;
                  const title = isPortalDoc ? doc.title : doc.name;
                  const fileName = isPortalDoc ? doc.fileName : doc.fileName;
                  const fileSize = isPortalDoc ? doc.fileSize : doc.fileSize;
                  const docId = doc.id;

                  return (
                    <div
                      key={docId}
                      data-testid={`card-document-${docId}`}
                      className={`bg-white border rounded-xl overflow-hidden transition-all ${
                        isReleased
                          ? "border-slate-200 hover:shadow-md hover:border-brand-blue/30 cursor-pointer"
                          : "border-slate-200 opacity-70"
                      }`}
                    >
                      <div className={`h-36 flex items-center justify-center ${isReleased ? "bg-slate-50" : "bg-slate-100"}`}>
                        {isReleased ? (
                          <div className="text-center">
                            <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            {fileName && (
                              <p className="text-[10px] text-slate-400">{fileName}</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center">
                            <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                            <p className="text-xs text-slate-400">nicht freigegeben</p>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {isReleased && (
                              <span className="text-[10px] font-semibold text-emerald-600 block mb-1">freigegeben</span>
                            )}
                            <h3 className="text-sm font-medium text-slate-900 truncate">{title}</h3>
                            {fileSize && (
                              <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(fileSize)}</p>
                            )}
                          </div>
                          {isReleased && (
                            <button
                              onClick={() => isPortalDoc ? handleDownloadPortalDoc(docId) : handleDownloadLegacyDoc(docId)}
                              disabled={downloadingId === docId}
                              data-testid={`button-download-${docId}`}
                              className="shrink-0 w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
                            >
                              {downloadingId === docId ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {currentDocs.length === 0 && (
                  <div className="col-span-full py-12 text-center">
                    <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                    <p className="text-sm text-slate-400">
                      {activeCategory.startsWith("exercise-")
                        ? "Für diesen Baustein wurden noch keine Dokumente bereitgestellt."
                        : "In dieser Kategorie sind noch keine Dokumente vorhanden."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {caseStudyModalExercise && (() => {
        const csExercise = allExercises.find(e => e.id === caseStudyModalExercise);
        const csData = assessment.caseStudyData;
        if (!csExercise) return null;

        const typeStyle = exerciseTypeIcons.case_study;
        const background = csData?.dataJson?.background || csData?.dataJson?.scenario || null;
        const dataEntries = csData?.dataJson?.financials || csData?.dataJson?.data || csData?.dataJson?.tables || null;
        const questions = csData?.questionsJson || [];

        const csPortalDocs = portalDocs.filter(d => d.exerciseId === csExercise.id);
        const csLegacyDocs = legacyDocs.filter(d => d.exerciseId === csExercise.id);

        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-stretch justify-center" data-testid="case-study-modal">
            <div className="bg-white w-full max-w-5xl my-4 mx-4 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${typeStyle.bg} flex items-center justify-center`}>
                    <svg className={`w-5 h-5 ${typeStyle.color}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      {typeStyle.icon}
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-brand-navy" data-testid="text-case-study-title">{csExercise.name}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{exerciseTypeLabels.case_study}</span>
                      {csExercise.duration && (
                        <>
                          <span className="text-slate-300">&middot;</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {csExercise.duration} Min.
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setCaseStudyModalExercise(null); setCaseStudyTab("background"); }}
                  data-testid="button-close-case-study"
                  className="w-9 h-9 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-6 border-b border-slate-200 flex gap-0 shrink-0 bg-white">
                {[
                  { id: "background" as const, label: "Hintergrund", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /> },
                  { id: "data" as const, label: "Daten & Material", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125M12 18.375h-7.5" /> },
                  { id: "questions" as const, label: "Aufgaben", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCaseStudyTab(tab.id)}
                    data-testid={`tab-case-study-${tab.id}`}
                    className={`px-4 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                      caseStudyTab === tab.id
                        ? "border-brand-blue text-brand-blue"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      {tab.icon}
                    </svg>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {caseStudyTab === "background" && (
                  <div className="max-w-3xl mx-auto" data-testid="case-study-tab-background">
                    {csExercise.instructions && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-brand-navy mb-2">Aufgabenbeschreibung</h3>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{csExercise.instructions}</p>
                      </div>
                    )}
                    {background ? (
                      <div>
                        <h3 className="text-sm font-semibold text-brand-navy mb-2">Hintergrund & Szenario</h3>
                        {typeof background === "string" ? (
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{background}</p>
                        ) : (
                          <pre className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(background, null, 2)}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                        <p className="text-sm text-slate-400">Hintergrundinformationen werden noch vorbereitet.</p>
                      </div>
                    )}

                    {(csPortalDocs.length > 0 || csLegacyDocs.length > 0) && (
                      <div className="mt-8 pt-6 border-t border-slate-200">
                        <h3 className="text-sm font-semibold text-brand-navy mb-3">Zugehörige Dokumente</h3>
                        <div className="space-y-2">
                          {csPortalDocs.filter(d => d.releaseStatus === "released").map(doc => (
                            <button
                              key={doc.id}
                              onClick={() => handleDownloadPortalDoc(doc.id)}
                              disabled={downloadingId === doc.id}
                              data-testid={`button-cs-doc-${doc.id}`}
                              className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                              <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-slate-700 truncate block">{doc.title}</span>
                                {doc.fileSize && <span className="text-[10px] text-slate-400">{formatFileSize(doc.fileSize)}</span>}
                              </div>
                              <svg className="w-4 h-4 text-brand-blue shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                            </button>
                          ))}
                          {csLegacyDocs.map(doc => (
                            <button
                              key={doc.id}
                              onClick={() => handleDownloadLegacyDoc(doc.id)}
                              disabled={downloadingId === doc.id}
                              data-testid={`button-cs-doc-${doc.id}`}
                              className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                              <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-slate-700 truncate block">{doc.name}</span>
                                <span className="text-[10px] text-slate-400">{formatFileSize(doc.fileSize)}</span>
                              </div>
                              <svg className="w-4 h-4 text-brand-blue shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {caseStudyTab === "data" && (
                  <div className="max-w-4xl mx-auto" data-testid="case-study-tab-data">
                    {dataEntries ? (
                      typeof dataEntries === "string" ? (
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{dataEntries}</p>
                      ) : Array.isArray(dataEntries) ? (
                        <div className="space-y-6">
                          {dataEntries.map((entry: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 rounded-xl p-5">
                              {entry.title && <h4 className="text-sm font-semibold text-brand-navy mb-3">{entry.title}</h4>}
                              {entry.headers && entry.rows ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr>
                                        {entry.headers.map((h: string, hi: number) => (
                                          <th key={hi} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {entry.rows.map((row: any[], ri: number) => (
                                        <tr key={ri} className={ri % 2 === 0 ? "bg-white" : ""}>
                                          {row.map((cell: any, ci: number) => (
                                            <td key={ci} className="px-3 py-2 text-slate-700 border-b border-slate-100">{String(cell)}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <pre className="text-sm text-slate-600 whitespace-pre-wrap">{JSON.stringify(entry, null, 2)}</pre>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <pre className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(dataEntries, null, 2)}
                        </pre>
                      )
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125M12 18.375h-7.5" />
                        </svg>
                        <p className="text-sm text-slate-400">Noch keine Daten für diese Fallstudie hinterlegt.</p>
                      </div>
                    )}
                  </div>
                )}

                {caseStudyTab === "questions" && (
                  <div className="max-w-3xl mx-auto" data-testid="case-study-tab-questions">
                    {Array.isArray(questions) && questions.length > 0 ? (
                      <div className="space-y-4">
                        {questions.map((q: any, qi: number) => (
                          <div key={qi} className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-amber-600">{qi + 1}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-brand-navy">{typeof q === "string" ? q : q.question || q.text || JSON.stringify(q)}</p>
                                {q.hint && <p className="text-xs text-slate-400 mt-2 italic">{q.hint}</p>}
                                {q.points && <span className="text-[10px] text-slate-400 mt-2 inline-block bg-slate-50 px-2 py-0.5 rounded">{q.points} Punkte</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                        <p className="text-sm text-slate-400">Noch keine Aufgabenstellungen hinterlegt.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
