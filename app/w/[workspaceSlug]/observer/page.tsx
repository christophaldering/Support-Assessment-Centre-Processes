"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

interface Candidate {
  id: string;
  name: string;
  email: string;
}

interface Exercise {
  id: string;
  name: string;
  type: string;
  sortOrder: number;
}

interface CompetencyMapping {
  id: string;
  exerciseId: string;
  competencyNodeId: string;
  weight: number;
  exercise: { id: string; name: string };
  competencyNode: { id: string; name: string; description: string | null; sortOrder: number };
}

interface ScaleDefinition {
  id: string;
  name: string;
  type: string;
  minValue: number | null;
  maxValue: number | null;
  points: { value: number; label: string }[];
}

interface ServerRating {
  id: string;
  assessmentId: string;
  exerciseId: string;
  competencyNodeId: string;
  candidateId: string;
  observerId: string;
  rating: number | null;
  evidenceNotes: string | null;
  evidenceStructured: { tags?: string[] } | null;
  scaleId: string | null;
  version: number;
  syncedAt: string | null;
  clientTimestamp: string | null;
}

interface LocalRating {
  exerciseId: string;
  competencyNodeId: string;
  candidateId: string;
  rating: number | null;
  evidenceNotes: string;
  evidenceStructured: { tags: string[] };
  clientTimestamp: string;
  version: number;
  synced: boolean;
  conflict?: boolean;
}

interface ConflictItem {
  exerciseId: string;
  competencyNodeId: string;
  candidateId: string;
  localRating: number | null;
  localNotes: string;
  serverRating: number | null;
  serverNotes: string | null;
  serverVersion: number;
  serverTimestamp: string | null;
}

type SyncStatus = "synced" | "pending" | "conflict" | "error" | "syncing";
type ViewStep = "assessments" | "candidates" | "matrix";

const ACCENT = "hsl(14, 48%, 44%)";
const ACCENT_LIGHT = "hsl(14, 48%, 95%)";
const ACCENT_BORDER = "hsl(14, 48%, 85%)";

function ratingKey(exerciseId: string, competencyNodeId: string): string {
  return `${exerciseId}__${competencyNodeId}`;
}

function localStorageKey(assessmentId: string, observerId: string): string {
  return `edp_ratings_${assessmentId}_${observerId}`;
}

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

function SyncIndicator({ status }: { status: SyncStatus }) {
  const config = {
    synced: { color: "bg-green-500", label: "Synchronisiert" },
    pending: { color: "bg-yellow-500", label: "Ausstehend" },
    conflict: { color: "bg-red-500", label: "Konflikt" },
    error: { color: "bg-red-500", label: "Fehler" },
    syncing: { color: "bg-blue-500 animate-pulse", label: "Synchronisiere…" },
  };
  const c = config[status];
  return (
    <div className="flex items-center gap-2" data-testid="status-sync">
      <div className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
      <span className="text-xs text-slate-500">{c.label}</span>
    </div>
  );
}

export default function ObserverPortal() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewStep, setViewStep] = useState<ViewStep>("assessments");

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [competencyNodes, setCompetencyNodes] = useState<{ id: string; name: string; description: string | null; sortOrder: number }[]>([]);
  const [mappingSet, setMappingSet] = useState<Set<string>>(new Set());
  const [scales, setScales] = useState<ScaleDefinition[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  const [localRatings, setLocalRatings] = useState<Record<string, LocalRating>>({});
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [expandedCell, setExpandedCell] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        if (res.ok) {
          const data = await res.json();
          setAssessments(data);
        }
      })
      .catch(() => {})
      .finally(() => setAssessmentsLoading(false));
  }, [user, workspaceSlug]);

  const selectAssessment = useCallback(async (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setViewStep("candidates");
    setCandidatesLoading(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${assessment.id}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch {}
    setCandidatesLoading(false);
  }, [workspaceSlug]);

  const loadRatingsFromLocalStorage = useCallback((assessmentId: string, observerId: string, candidateId: string) => {
    try {
      const stored = localStorage.getItem(localStorageKey(assessmentId, observerId));
      if (stored) {
        const all: Record<string, LocalRating> = JSON.parse(stored);
        const filtered: Record<string, LocalRating> = {};
        for (const [key, val] of Object.entries(all)) {
          if (val.candidateId === candidateId) {
            filtered[key] = val;
          }
        }
        return filtered;
      }
    } catch {}
    return {};
  }, []);

  const saveRatingsToLocalStorage = useCallback((assessmentId: string, observerId: string, ratings: Record<string, LocalRating>) => {
    try {
      const existing = localStorage.getItem(localStorageKey(assessmentId, observerId));
      let all: Record<string, LocalRating> = {};
      if (existing) {
        all = JSON.parse(existing);
      }
      for (const [key, val] of Object.entries(ratings)) {
        all[key] = val;
      }
      localStorage.setItem(localStorageKey(assessmentId, observerId), JSON.stringify(all));
    } catch {}
  }, []);

  const selectCandidate = useCallback(async (candidate: Candidate) => {
    if (!selectedAssessment || !user) return;
    setSelectedCandidate(candidate);
    setViewStep("matrix");
    setMatrixLoading(true);

    try {
      const [exercisesRes, mappingsRes, scalesRes, ratingsRes] = await Promise.all([
        fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessment.id}/exercises`),
        fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessment.id}/exercise-competency-mappings`),
        fetch(`/api/w/${workspaceSlug}/scales`),
        fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessment.id}/ratings?observerId=${user.id}&candidateId=${candidate.id}`),
      ]);

      if (exercisesRes.ok) {
        const data: Exercise[] = await exercisesRes.json();
        setExercises(data.sort((a, b) => a.sortOrder - b.sortOrder));
      }

      if (mappingsRes.ok) {
        const data: CompetencyMapping[] = await mappingsRes.json();
        const nodeMap = new Map<string, { id: string; name: string; description: string | null; sortOrder: number }>();
        const mSet = new Set<string>();
        for (const m of data) {
          nodeMap.set(m.competencyNode.id, m.competencyNode);
          mSet.add(ratingKey(m.exerciseId, m.competencyNodeId));
        }
        setCompetencyNodes(
          Array.from(nodeMap.values()).sort((a, b) => a.sortOrder - b.sortOrder)
        );
        setMappingSet(mSet);
      }

      if (scalesRes.ok) {
        const data: ScaleDefinition[] = await scalesRes.json();
        setScales(data);
      }

      const storedRatings = loadRatingsFromLocalStorage(selectedAssessment.id, user.id, candidate.id);

      if (ratingsRes.ok) {
        const serverRatings: ServerRating[] = await ratingsRes.json();
        const merged: Record<string, LocalRating> = { ...storedRatings };

        for (const sr of serverRatings) {
          const key = ratingKey(sr.exerciseId, sr.competencyNodeId);
          const local = merged[key];
          if (!local || local.synced || new Date(local.clientTimestamp) <= new Date(sr.clientTimestamp || sr.syncedAt || "")) {
            merged[key] = {
              exerciseId: sr.exerciseId,
              competencyNodeId: sr.competencyNodeId,
              candidateId: sr.candidateId,
              rating: sr.rating,
              evidenceNotes: sr.evidenceNotes || "",
              evidenceStructured: { tags: (sr.evidenceStructured as { tags?: string[] })?.tags || [] },
              clientTimestamp: sr.clientTimestamp || sr.syncedAt || new Date().toISOString(),
              version: sr.version,
              synced: true,
            };
          }
        }

        setLocalRatings(merged);
        saveRatingsToLocalStorage(selectedAssessment.id, user.id, merged);

        const hasPending = Object.values(merged).some((r) => !r.synced);
        setSyncStatus(hasPending ? "pending" : "synced");
      } else {
        setLocalRatings(storedRatings);
        if (Object.keys(storedRatings).length > 0) {
          setSyncStatus("pending");
        }
      }
    } catch {}
    setMatrixLoading(false);
  }, [selectedAssessment, user, workspaceSlug, loadRatingsFromLocalStorage, saveRatingsToLocalStorage]);

  const updateRating = useCallback((exerciseId: string, competencyNodeId: string, field: "rating" | "evidenceNotes", value: number | null | string) => {
    if (!selectedCandidate || !selectedAssessment || !user) return;
    const key = ratingKey(exerciseId, competencyNodeId);
    setLocalRatings((prev) => {
      const existing = prev[key] || {
        exerciseId,
        competencyNodeId,
        candidateId: selectedCandidate.id,
        rating: null,
        evidenceNotes: "",
        evidenceStructured: { tags: [] },
        clientTimestamp: new Date().toISOString(),
        version: 0,
        synced: false,
      };
      const updated = {
        ...existing,
        [field]: value,
        clientTimestamp: new Date().toISOString(),
        synced: false,
      };
      const newRatings = { ...prev, [key]: updated };
      saveRatingsToLocalStorage(selectedAssessment.id, user.id, newRatings);
      return newRatings;
    });
    setSyncStatus("pending");
  }, [selectedCandidate, selectedAssessment, user, saveRatingsToLocalStorage]);

  const addTag = useCallback((exerciseId: string, competencyNodeId: string, tag: string) => {
    if (!selectedCandidate || !selectedAssessment || !user || !tag.trim()) return;
    const key = ratingKey(exerciseId, competencyNodeId);
    setLocalRatings((prev) => {
      const existing = prev[key] || {
        exerciseId,
        competencyNodeId,
        candidateId: selectedCandidate.id,
        rating: null,
        evidenceNotes: "",
        evidenceStructured: { tags: [] },
        clientTimestamp: new Date().toISOString(),
        version: 0,
        synced: false,
      };
      const tags = [...(existing.evidenceStructured?.tags || [])];
      if (!tags.includes(tag.trim())) {
        tags.push(tag.trim());
      }
      const updated = {
        ...existing,
        evidenceStructured: { tags },
        clientTimestamp: new Date().toISOString(),
        synced: false,
      };
      const newRatings = { ...prev, [key]: updated };
      saveRatingsToLocalStorage(selectedAssessment.id, user.id, newRatings);
      return newRatings;
    });
    setSyncStatus("pending");
  }, [selectedCandidate, selectedAssessment, user, saveRatingsToLocalStorage]);

  const removeTag = useCallback((exerciseId: string, competencyNodeId: string, tag: string) => {
    if (!selectedCandidate || !selectedAssessment || !user) return;
    const key = ratingKey(exerciseId, competencyNodeId);
    setLocalRatings((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      const tags = (existing.evidenceStructured?.tags || []).filter((t) => t !== tag);
      const updated = {
        ...existing,
        evidenceStructured: { tags },
        clientTimestamp: new Date().toISOString(),
        synced: false,
      };
      const newRatings = { ...prev, [key]: updated };
      saveRatingsToLocalStorage(selectedAssessment.id, user.id, newRatings);
      return newRatings;
    });
    setSyncStatus("pending");
  }, [selectedCandidate, selectedAssessment, user, saveRatingsToLocalStorage]);

  const syncRatings = useCallback(async () => {
    if (!selectedAssessment || !user || !selectedCandidate) return;
    const pending = Object.values(localRatings).filter((r) => !r.synced && r.candidateId === selectedCandidate.id);
    if (pending.length === 0) {
      setSyncStatus("synced");
      return;
    }

    setSyncStatus("syncing");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessment.id}/ratings/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratings: pending.map((r) => ({
            exerciseId: r.exerciseId,
            competencyNodeId: r.competencyNodeId,
            candidateId: r.candidateId,
            rating: r.rating,
            evidenceNotes: r.evidenceNotes || null,
            evidenceStructured: r.evidenceStructured,
            clientTimestamp: r.clientTimestamp,
            version: r.version,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const syncedKeys = new Set<string>();

        if (data.synced) {
          for (const sr of data.synced as ServerRating[]) {
            syncedKeys.add(ratingKey(sr.exerciseId, sr.competencyNodeId));
          }
        }

        setLocalRatings((prev) => {
          const updated = { ...prev };
          for (const [key, val] of Object.entries(updated)) {
            if (syncedKeys.has(key)) {
              updated[key] = { ...val, synced: true };
            }
          }
          saveRatingsToLocalStorage(selectedAssessment.id, user.id, updated);
          return updated;
        });

        if (data.conflicts && data.conflicts.length > 0) {
          const conflictItems: ConflictItem[] = data.conflicts.map((c: Record<string, unknown>) => ({
            exerciseId: c.exerciseId as string,
            competencyNodeId: c.competencyNodeId as string,
            candidateId: c.candidateId as string,
            localRating: pending.find((p) => p.exerciseId === c.exerciseId && p.competencyNodeId === c.competencyNodeId)?.rating ?? null,
            localNotes: pending.find((p) => p.exerciseId === c.exerciseId && p.competencyNodeId === c.competencyNodeId)?.evidenceNotes || "",
            serverRating: (c.rating as number) ?? null,
            serverNotes: (c.evidenceNotes as string) ?? null,
            serverVersion: (c.serverVersion as number) ?? 0,
            serverTimestamp: (c.serverTimestamp as string) ?? null,
          }));
          setConflicts(conflictItems);
          setShowConflictDialog(true);
          setSyncStatus("conflict");
        } else {
          setSyncStatus("synced");
        }
      } else {
        setSyncStatus("error");
      }
    } catch {
      setSyncStatus("error");
    }
  }, [selectedAssessment, user, selectedCandidate, localRatings, workspaceSlug, saveRatingsToLocalStorage]);

  const resolveConflict = useCallback((conflict: ConflictItem, choice: "local" | "server") => {
    if (!selectedAssessment || !user) return;
    const key = ratingKey(conflict.exerciseId, conflict.competencyNodeId);
    if (choice === "server") {
      setLocalRatings((prev) => {
        const updated = {
          ...prev,
          [key]: {
            exerciseId: conflict.exerciseId,
            competencyNodeId: conflict.competencyNodeId,
            candidateId: conflict.candidateId,
            rating: conflict.serverRating,
            evidenceNotes: conflict.serverNotes || "",
            evidenceStructured: { tags: [] },
            clientTimestamp: conflict.serverTimestamp || new Date().toISOString(),
            version: conflict.serverVersion,
            synced: true,
          },
        };
        saveRatingsToLocalStorage(selectedAssessment.id, user.id, updated);
        return updated;
      });
    } else {
      setLocalRatings((prev) => {
        const existing = prev[key];
        if (!existing) return prev;
        const updated = {
          ...prev,
          [key]: {
            ...existing,
            version: conflict.serverVersion + 1,
            synced: false,
          },
        };
        saveRatingsToLocalStorage(selectedAssessment.id, user.id, updated);
        return updated;
      });
    }
    setConflicts((prev) => prev.filter((c) => !(c.exerciseId === conflict.exerciseId && c.competencyNodeId === conflict.competencyNodeId)));
  }, [selectedAssessment, user, saveRatingsToLocalStorage]);

  useEffect(() => {
    if (conflicts.length === 0 && showConflictDialog) {
      setShowConflictDialog(false);
      const hasPending = Object.values(localRatings).some((r) => !r.synced);
      setSyncStatus(hasPending ? "pending" : "synced");
    }
  }, [conflicts, showConflictDialog, localRatings]);

  useEffect(() => {
    if (viewStep !== "matrix" || !selectedAssessment || !user || !selectedCandidate) return;

    syncTimerRef.current = setInterval(() => {
      syncRatings();
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncRatings();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [viewStep, selectedAssessment, user, selectedCandidate, syncRatings]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/w/${workspaceSlug}/login`);
  };

  const goBackToAssessments = () => {
    setViewStep("assessments");
    setSelectedAssessment(null);
    setCandidates([]);
    setSelectedCandidate(null);
    setExercises([]);
    setCompetencyNodes([]);
    setLocalRatings({});
    setSyncStatus("synced");
  };

  const goBackToCandidates = () => {
    setViewStep("candidates");
    setSelectedCandidate(null);
    setExercises([]);
    setCompetencyNodes([]);
    setLocalRatings({});
    setSyncStatus("synced");
  };

  const activeScale = scales.length > 0 ? scales[0] : null;
  const scaleMin = activeScale?.minValue ?? 1;
  const scaleMax = activeScale?.maxValue ?? 5;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-slate-400" data-testid="text-loading">Laden…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/w/${workspaceSlug}/login`}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              data-testid="link-back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <span className="font-serif text-lg font-bold" style={{ color: ACCENT }}>
              {user.workspaceName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600" data-testid="text-user-name">{user.name}</span>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: ACCENT_LIGHT, color: ACCENT, border: `1px solid ${ACCENT_BORDER}` }}
              data-testid="text-role-badge"
            >
              Beobachter
            </span>
            <button
              onClick={handleLogout}
              data-testid="button-logout"
              className="text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-full px-3 py-1 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {viewStep === "assessments" && (
          <div className="max-w-3xl mx-auto w-full px-6 py-12">
            <div className="mb-8">
              <h1 className="text-2xl font-bold font-serif mb-1" style={{ color: ACCENT }} data-testid="text-title">
                Beobachter-Portal
              </h1>
              <p className="text-sm text-slate-500">Wählen Sie ein Assessment aus, um mit der Bewertung zu beginnen.</p>
            </div>

            {assessmentsLoading && (
              <div className="bg-white border border-slate-200 rounded-xl p-8">
                <p className="text-sm text-slate-400 text-center" data-testid="text-loading-assessments">Assessments werden geladen…</p>
              </div>
            )}

            {!assessmentsLoading && assessments.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-12" data-testid="text-no-assessments">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: ACCENT_LIGHT }}>
                    <svg className="w-8 h-8" style={{ color: ACCENT }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-700 mb-2">Keine Assessments vorhanden</h2>
                  <p className="text-sm text-slate-500">Es sind derzeit keine Assessments für Sie verfügbar.</p>
                </div>
              </div>
            )}

            {!assessmentsLoading && assessments.length > 0 && (
              <div className="space-y-3" data-testid="list-assessments">
                {assessments.map((assessment) => (
                  <button
                    key={assessment.id}
                    onClick={() => selectAssessment(assessment)}
                    className="w-full text-left bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-sm transition-all group"
                    data-testid={`button-select-assessment-${assessment.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-lg font-semibold text-slate-800 group-hover:text-slate-900">
                        {assessment.name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusColor(assessment.status)}`}>
                          {statusLabel(assessment.status)}
                        </span>
                        <svg className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                    {assessment.description && (
                      <p className="text-sm text-slate-500 mb-3">{assessment.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                      {assessment.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                          </svg>
                          {assessment.location}
                        </span>
                      )}
                      {assessment.startDate && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          {formatDate(assessment.startDate)}
                          {assessment.endDate && ` – ${formatDate(assessment.endDate)}`}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {viewStep === "candidates" && selectedAssessment && (
          <div className="max-w-3xl mx-auto w-full px-6 py-12">
            <div className="mb-8">
              <button
                onClick={goBackToAssessments}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-4"
                data-testid="button-back-assessments"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Zurück zu Assessments
              </button>
              <h1 className="text-2xl font-bold font-serif mb-1" style={{ color: ACCENT }} data-testid="text-assessment-title">
                {selectedAssessment.name}
              </h1>
              <p className="text-sm text-slate-500">Wählen Sie einen Kandidaten aus, um die Bewertung zu starten.</p>
            </div>

            {candidatesLoading && (
              <div className="bg-white border border-slate-200 rounded-xl p-8">
                <p className="text-sm text-slate-400 text-center" data-testid="text-loading-candidates">Kandidaten werden geladen…</p>
              </div>
            )}

            {!candidatesLoading && candidates.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-12" data-testid="text-no-candidates">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: ACCENT_LIGHT }}>
                    <svg className="w-8 h-8" style={{ color: ACCENT }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-700 mb-2">Keine Kandidaten zugewiesen</h2>
                  <p className="text-sm text-slate-500">Diesem Assessment wurden noch keine Kandidaten zugewiesen.</p>
                </div>
              </div>
            )}

            {!candidatesLoading && candidates.length > 0 && (
              <div className="space-y-3" data-testid="list-candidates">
                {candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => selectCandidate(candidate)}
                    className="w-full text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all group"
                    data-testid={`button-select-candidate-${candidate.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: ACCENT }}>
                          {candidate.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{candidate.name}</p>
                          <p className="text-xs text-slate-400">{candidate.email}</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {viewStep === "matrix" && selectedAssessment && selectedCandidate && (
          <div className="max-w-7xl mx-auto w-full px-6 py-8">
            <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
              <div>
                <button
                  onClick={goBackToCandidates}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-3"
                  data-testid="button-back-candidates"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Zurück zu Kandidaten
                </button>
                <h1 className="text-xl font-bold font-serif mb-1" style={{ color: ACCENT }} data-testid="text-matrix-title">
                  Bewertungsmatrix
                </h1>
                <p className="text-sm text-slate-500">
                  <span className="font-medium text-slate-700">{selectedCandidate.name}</span>
                  {" · "}
                  {selectedAssessment.name}
                  {activeScale && (
                    <span className="ml-2 text-slate-400">
                      (Skala: {activeScale.name}, {scaleMin}–{scaleMax})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <SyncIndicator status={syncStatus} />
                <button
                  onClick={syncRatings}
                  disabled={syncStatus === "syncing"}
                  className="text-xs font-medium px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: ACCENT }}
                  data-testid="button-sync"
                >
                  {syncStatus === "syncing" ? "Synchronisiere…" : "Synchronisieren"}
                </button>
              </div>
            </div>

            {matrixLoading && (
              <div className="bg-white border border-slate-200 rounded-xl p-12">
                <p className="text-sm text-slate-400 text-center" data-testid="text-loading-matrix">Bewertungsmatrix wird geladen…</p>
              </div>
            )}

            {!matrixLoading && exercises.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-12" data-testid="text-no-exercises">
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-slate-700 mb-2">Keine Übungen vorhanden</h2>
                  <p className="text-sm text-slate-500">Für dieses Assessment wurden noch keine Übungen konfiguriert.</p>
                </div>
              </div>
            )}

            {!matrixLoading && exercises.length > 0 && competencyNodes.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-12" data-testid="text-no-competencies">
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-slate-700 mb-2">Keine Kompetenzen zugeordnet</h2>
                  <p className="text-sm text-slate-500">Den Übungen wurden noch keine Kompetenzen zugeordnet.</p>
                </div>
              </div>
            )}

            {!matrixLoading && exercises.length > 0 && competencyNodes.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="container-matrix">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 sticky left-0 z-10 min-w-[200px]">
                          Kompetenz
                        </th>
                        {exercises.map((ex) => (
                          <th
                            key={ex.id}
                            className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 min-w-[180px]"
                            data-testid={`header-exercise-${ex.id}`}
                          >
                            {ex.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {competencyNodes.map((node, rowIdx) => (
                        <tr key={node.id} className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                          <td className="px-4 py-3 border-b border-slate-100 sticky left-0 z-10" style={{ backgroundColor: rowIdx % 2 === 0 ? "white" : "rgb(248 250 252 / 0.5)" }}>
                            <div className="font-medium text-sm text-slate-800" data-testid={`text-competency-${node.id}`}>
                              {node.name}
                            </div>
                            {node.description && (
                              <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{node.description}</div>
                            )}
                          </td>
                          {exercises.map((ex) => {
                            const key = ratingKey(ex.id, node.id);
                            const hasMappng = mappingSet.has(key);
                            const rating = localRatings[key];
                            const isExpanded = expandedCell === key;

                            if (!hasMappng) {
                              return (
                                <td key={ex.id} className="px-3 py-3 border-b border-slate-100 text-center">
                                  <div className="text-slate-200 text-xs">—</div>
                                </td>
                              );
                            }

                            return (
                              <td key={ex.id} className="px-3 py-3 border-b border-slate-100 align-top" data-testid={`cell-rating-${ex.id}-${node.id}`}>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      min={scaleMin}
                                      max={scaleMax}
                                      step={0.5}
                                      value={rating?.rating ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value === "" ? null : parseFloat(e.target.value);
                                        updateRating(ex.id, node.id, "rating", val);
                                      }}
                                      placeholder={`${scaleMin}-${scaleMax}`}
                                      className="w-16 text-center text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-opacity-30 transition-colors"
                                      style={{ focusRingColor: ACCENT } as React.CSSProperties}
                                      data-testid={`input-rating-${ex.id}-${node.id}`}
                                    />
                                    {rating?.synced && (
                                      <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Synchronisiert" data-testid={`indicator-synced-${ex.id}-${node.id}`} />
                                    )}
                                    {rating && !rating.synced && (
                                      <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" title="Ausstehend" data-testid={`indicator-pending-${ex.id}-${node.id}`} />
                                    )}
                                    <button
                                      onClick={() => setExpandedCell(isExpanded ? null : key)}
                                      className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
                                      data-testid={`button-expand-cell-${ex.id}-${node.id}`}
                                      title="Evidenz anzeigen"
                                    >
                                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                      </svg>
                                    </button>
                                  </div>

                                  {isExpanded && (
                                    <div className="space-y-2 animate-fadeIn">
                                      <textarea
                                        value={rating?.evidenceNotes ?? ""}
                                        onChange={(e) => updateRating(ex.id, node.id, "evidenceNotes", e.target.value)}
                                        placeholder="Evidenznotizen…"
                                        rows={3}
                                        className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-opacity-30 transition-colors"
                                        data-testid={`textarea-evidence-${ex.id}-${node.id}`}
                                      />
                                      <div className="flex flex-wrap gap-1">
                                        {(rating?.evidenceStructured?.tags || []).map((tag) => (
                                          <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                            style={{ backgroundColor: ACCENT_LIGHT, color: ACCENT }}
                                            data-testid={`tag-${ex.id}-${node.id}-${tag}`}
                                          >
                                            {tag}
                                            <button
                                              onClick={() => removeTag(ex.id, node.id, tag)}
                                              className="hover:opacity-70"
                                              data-testid={`button-remove-tag-${ex.id}-${node.id}-${tag}`}
                                            >
                                              ×
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                      <div className="flex gap-1">
                                        <input
                                          type="text"
                                          value={expandedCell === key ? tagInput : ""}
                                          onChange={(e) => setTagInput(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && tagInput.trim()) {
                                              e.preventDefault();
                                              addTag(ex.id, node.id, tagInput);
                                              setTagInput("");
                                            }
                                          }}
                                          placeholder="Beobachtung hinzufügen…"
                                          className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-opacity-30"
                                          data-testid={`input-tag-${ex.id}-${node.id}`}
                                        />
                                        <button
                                          onClick={() => {
                                            if (tagInput.trim()) {
                                              addTag(ex.id, node.id, tagInput);
                                              setTagInput("");
                                            }
                                          }}
                                          className="text-xs px-2 py-1 rounded-lg text-white"
                                          style={{ backgroundColor: ACCENT }}
                                          data-testid={`button-add-tag-${ex.id}-${node.id}`}
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!matrixLoading && (
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    Synchronisiert
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    Ausstehend
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    Konflikt
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Automatische Synchronisierung alle 30 Sekunden
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {showConflictDialog && conflicts.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="dialog-conflicts">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold font-serif" style={{ color: ACCENT }}>Konflikte lösen</h2>
              <p className="text-sm text-slate-500 mt-1">
                Einige Bewertungen wurden in der Zwischenzeit auf dem Server geändert. Bitte wählen Sie, welche Version beibehalten werden soll.
              </p>
            </div>
            <div className="p-6 space-y-4">
              {conflicts.map((conflict, idx) => {
                const exName = exercises.find((e) => e.id === conflict.exerciseId)?.name || conflict.exerciseId;
                const nodeName = competencyNodes.find((n) => n.id === conflict.competencyNodeId)?.name || conflict.competencyNodeId;
                return (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4" data-testid={`conflict-item-${idx}`}>
                    <p className="text-sm font-medium text-slate-700 mb-3">
                      {exName} × {nodeName}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-600 mb-1">Ihre Bewertung</p>
                        <p className="text-lg font-bold text-blue-800">{conflict.localRating ?? "–"}</p>
                        {conflict.localNotes && <p className="text-xs text-blue-600 mt-1 line-clamp-2">{conflict.localNotes}</p>}
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-amber-600 mb-1">Server-Version</p>
                        <p className="text-lg font-bold text-amber-800">{conflict.serverRating ?? "–"}</p>
                        {conflict.serverNotes && <p className="text-xs text-amber-600 mt-1 line-clamp-2">{conflict.serverNotes}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolveConflict(conflict, "local")}
                        className="flex-1 text-xs font-medium py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                        data-testid={`button-keep-local-${idx}`}
                      >
                        Meine behalten
                      </button>
                      <button
                        onClick={() => resolveConflict(conflict, "server")}
                        className="flex-1 text-xs font-medium py-2 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                        data-testid={`button-keep-server-${idx}`}
                      >
                        Server übernehmen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <footer className="border-t py-6 border-slate-200 bg-white">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
