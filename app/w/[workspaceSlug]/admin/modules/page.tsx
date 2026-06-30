"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ModuleIcon } from "@/components/shared/ModuleIcon";

interface AssessmentSummary {
  id: string;
  name: string;
  status: string;
}

interface AssessmentModuleData {
  name: string;
  type: string;
  description: string;
  adaptationNotes: string;
  generationPrompt: string;
  selected: boolean;
}

interface SavedAnalysis {
  id: string;
  title: string;
  clientName: string | null;
  projectName: string | null;
  status: string;
  proposal: any;
}

interface LibraryItem {
  id: string;
  title: string;
  description: string | null;
  exerciseType: string;
  targetLevels: string[];
  tags: string[];
  clientName: string | null;
}

interface Exercise {
  id: string;
  name: string;
  type: string;
  instructions: string | null;
  duration: number | null;
  status: string;
  libraryItemId: string | null;
  sortOrder: number;
}

type ViewMode = "hub" | "library" | "detail";

const exerciseTypes = [
  { value: "interview", label: "Interview-Leitfaden" },
  { value: "case_study", label: "Fallstudie" },
  { value: "fact_finding", label: "Fact-Finding-Simulation" },
  { value: "presentation", label: "Präsentation" },
  { value: "role_play", label: "Verhaltenssimulation / Rollenspiel" },
  { value: "group_discussion", label: "Gruppendiskussion" },
  { value: "inbox", label: "Postkorb-Übung" },
  { value: "psychometric", label: "Psychometrischer Test" },
  { value: "other", label: "Sonstiges" },
];

const targetLevels = [
  "SE-Level / Vorstand",
  "Director / Bereichsleitung",
  "Manager",
  "Expert",
];

const typeLabel = (t: string) => exerciseTypes.find((e) => e.value === t)?.label || t;

const typeIconEl = (t: string) => {
  const typeMap: Record<string, "interview" | "presentation" | "roleplay" | "fact_finding" | "case_study" | "other"> = {
    interview:        "interview",
    case_study:       "case_study",
    fact_finding:     "fact_finding",
    presentation:     "presentation",
    role_play:        "roleplay",
    group_discussion: "other",
    inbox:            "other",
    psychometric:     "other",
    other:            "other",
  };
  return <ModuleIcon type={typeMap[t] ?? "other"} size="sm" />;
};

const inputClass = "w-full rounded-lg border border-[var(--eds-border)] px-3 py-2.5 text-sm text-[var(--eds-text-primary)] bg-[var(--eds-bg-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--eds-terracotta)]/20 focus:border-[var(--eds-terracotta)] transition-colors";

export default function ModulesHubPage() {
  return (
    <Suspense fallback={<div className="py-8 px-6 lg:px-10 flex items-center justify-center text-[var(--eds-text-disabled)]">Laden...</div>}>
      <ModulesHubContent />
    </Suspense>
  );
}

function ModulesHubContent() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const base = `/w/${workspaceSlug}/admin`;

  const [view, setView] = useState<ViewMode>("hub");
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);
  const [requirementModules, setRequirementModules] = useState<AssessmentModuleData[]>([]);

  const [selectedLibraryItem, setSelectedLibraryItem] = useState<LibraryItem | null>(null);
  const [libraryAdaptForm, setLibraryAdaptForm] = useState({
    name: "",
    description: "",
    instructions: "",
    duration: 45,
    targetLevel: "Manager",
    adaptationNotes: "",
  });

  const [confirmDeleteLibItem, setConfirmDeleteLibItem] = useState<LibraryItem | null>(null);
  const [deletingLibItem, setDeletingLibItem] = useState(false);

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [analysisRes, libraryRes, assessmentRes] = await Promise.all([
        fetch(`/api/w/${workspaceSlug}/requirements-analysis`),
        fetch(`/api/w/${workspaceSlug}/exercise-library`),
        fetch(`/api/w/${workspaceSlug}/assessments`),
      ]);

      if (analysisRes.ok) {
        const data = await analysisRes.json();
        setAnalyses(Array.isArray(data) ? data.filter((a: any) => a.status === "completed" && a.proposal) : []);
      }
      if (libraryRes.ok) {
        setLibraryItems(await libraryRes.json());
      }
      if (assessmentRes.ok) {
        const data = await assessmentRes.json();
        const list: AssessmentSummary[] = Array.isArray(data) ? data : (data.assessments ?? []);
        setAssessments(list);
      }
    } catch {
      setError("Fehler beim Laden der Daten.");
    } finally {
      setLoading(false);
    }
  }

  const loadExercises = useCallback(async (assessmentId: string) => {
    if (!assessmentId) {
      setExercises([]);
      return;
    }
    setLoadingExercises(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${assessmentId}/exercises`);
      if (res.ok) {
        setExercises(await res.json());
      } else {
        setExercises([]);
      }
    } catch {
      setExercises([]);
    } finally {
      setLoadingExercises(false);
    }
  }, [workspaceSlug]);

  function handleAssessmentChange(id: string) {
    setSelectedAssessmentId(id);
    loadExercises(id);
  }

  function loadRequirementModules(analysis: SavedAnalysis) {
    setSelectedAnalysis(analysis);
    try {
      const proposal = analysis.proposal;
      const modules: AssessmentModuleData[] = proposal?.assessmentModules || [];
      setRequirementModules(modules);
    } catch {
      setRequirementModules([]);
    }
  }

  async function adoptRequirementModule(mod: AssessmentModuleData) {
    if (!selectedAssessmentId) {
      setError("Wählen Sie zuerst ein Assessment, um Bausteine zu übernehmen.");
      setTimeout(() => setError(""), 4000);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const typeMap: Record<string, string> = {
        "Interview-Leitfaden": "interview",
        "Fallstudie": "case_study",
        "Fact-Finding-Simulation": "fact_finding",
        "Präsentation": "presentation",
        "Verhaltenssimulation": "role_play",
        "Rollenspiel": "role_play",
        "Gruppendiskussion": "group_discussion",
        "Postkorb-Übung": "inbox",
        "Psychometrischer Test": "psychometric",
      };
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mod.name,
          type: typeMap[mod.type] || "other",
          instructions: mod.adaptationNotes || null,
          duration: 45,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Übernehmen fehlgeschlagen");
      }
      await loadExercises(selectedAssessmentId);
      setSuccess(`"${mod.name}" ins Assessment übernommen.`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Fehler beim Übernehmen.");
    } finally {
      setSaving(false);
    }
  }

  async function adoptLibraryItem() {
    if (!selectedLibraryItem) return;
    if (!selectedAssessmentId) {
      setError("Wählen Sie zuerst ein Assessment, um Bausteine zu übernehmen.");
      setTimeout(() => setError(""), 4000);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: libraryAdaptForm.name || selectedLibraryItem.title,
          type: selectedLibraryItem.exerciseType || "other",
          instructions: libraryAdaptForm.instructions || null,
          duration: libraryAdaptForm.duration,
          libraryItemId: selectedLibraryItem.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Übernehmen fehlgeschlagen");
      }
      await loadExercises(selectedAssessmentId);
      setSelectedLibraryItem(null);
      setSuccess(`"${libraryAdaptForm.name || selectedLibraryItem.title}" aus Bibliothek übernommen.`);
      setView("hub");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Fehler beim Übernehmen.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLibraryItem(item: LibraryItem) {
    setDeletingLibItem(true);
    setError("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/exercise-library/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Löschen fehlgeschlagen");
      }
      setLibraryItems((prev) => prev.filter((i) => i.id !== item.id));
      setConfirmDeleteLibItem(null);
      setSuccess(`"${item.title}" wurde gelöscht.`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Fehler beim Löschen.");
    } finally {
      setDeletingLibItem(false);
    }
  }

  async function saveEditedExercise() {
    if (!selectedExercise || !selectedAssessmentId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/exercises/${selectedExercise.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: selectedExercise.name,
            type: selectedExercise.type,
            instructions: selectedExercise.instructions,
            duration: selectedExercise.duration,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Speichern fehlgeschlagen");
      }
      await loadExercises(selectedAssessmentId);
      setSelectedExercise(null);
      setView("hub");
      setSuccess("Baustein aktualisiert.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  const sourceBadge = (src: string) => {
    const map: Record<string, { color: string; bg: string; label: string }> = {
      library:     { color: "#7c3aed", bg: "#f5f3ff", label: "Bibliothek" },
      requirement: { color: "#0d9488", bg: "#f0fdfa", label: "Anforderung" },
    };
    const d = map[src] || { color: "#64748b", bg: "#f1f5f9", label: src };
    return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: d.bg, color: d.color }}>{d.label}</span>;
  };

  if (loading) {
    return (
      <div className="py-8 px-6 lg:px-10 flex items-center justify-center">
        <p className="text-sm text-[var(--eds-text-disabled)]">Laden...</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 lg:px-10 space-y-6">
        {error && (
          <div className="bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] text-[var(--eds-status-red)] text-sm px-4 py-3 rounded-xl flex items-center justify-between" data-testid="text-error">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] ml-3" data-testid="button-dismiss-error">✕</button>
          </div>
        )}
        {success && (
          <div className="bg-[var(--eds-status-green-bg)] border border-[var(--eds-status-green-bg)] text-[var(--eds-status-green)] text-sm px-4 py-3 rounded-xl" data-testid="text-success">
            {success}
          </div>
        )}

        {view === "hub" && (
          <>
            <PageHeader
              title="Modul-Designer"
              description="Assessment-Bausteine aus der Bibliothek übernehmen und ins Assessment einfügen."
            />

            <div className="grid sm:grid-cols-1 gap-4 max-w-sm">
              <button
                onClick={() => setView("library")}
                className="rounded-xl p-5 text-left transition hover:shadow-md"
                style={{ background: "var(--eds-bg-surface)", border: "1px solid var(--eds-border)" }}
                data-testid="button-create-library"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "var(--eds-lagune-light)", color: "var(--eds-lagune)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--eds-text-primary)" }}>Aus Bibliothek übernehmen</h3>
                <p className="text-xs mt-1" style={{ color: "var(--eds-text-secondary)" }}>Bestehende Übung aus der Bibliothek ins Assessment übernehmen</p>
                {libraryItems.length > 0 && (
                  <span className="inline-block mt-2 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full" style={{ background: "var(--eds-lagune-light)", color: "var(--eds-lagune)" }}>
                    {libraryItems.length} verfügbar
                  </span>
                )}
              </button>
            </div>

            <div className="bg-white border border-[var(--eds-border)] rounded-xl" data-testid="section-assessment-selector">
              <div className="px-6 py-5">
                <label className="text-sm font-semibold text-brand-navy block mb-2">Assessment auswählen</label>
                <p className="text-xs text-[var(--eds-text-tertiary)] mb-3">Wählen Sie ein Assessment, um dessen Bausteine zu sehen und neue zu übernehmen.</p>
                {assessments.length === 0 ? (
                  <p className="text-xs text-[var(--eds-text-disabled)]">Keine Assessments vorhanden.</p>
                ) : (
                  <select
                    className={inputClass + " max-w-md"}
                    value={selectedAssessmentId}
                    onChange={(e) => handleAssessmentChange(e.target.value)}
                    data-testid="select-assessment"
                  >
                    <option value="">— Assessment wählen —</option>
                    {assessments.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {analyses.length > 0 && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl" data-testid="section-requirement-suggestions">
                <div className="px-6 py-5 border-b border-[var(--eds-border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-brand-navy">Vorschläge aus der Anforderungsanalyse</h3>
                      <p className="text-xs text-[var(--eds-text-tertiary)] mt-0.5">Empfohlene Bausteine direkt übernehmen oder in der Bibliothek per KI ausarbeiten</p>
                    </div>
                    {analyses.length > 1 && !selectedAnalysis && (
                      <span className="text-[10px] text-[var(--eds-text-disabled)]">{analyses.length} Analysen</span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {!selectedAnalysis ? (
                    <div className="space-y-2">
                      {analyses.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => loadRequirementModules(a)}
                          className="w-full text-left bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)] rounded-lg p-3 hover:border-brand-blue transition"
                          data-testid={`button-analysis-${a.id}`}
                        >
                          <p className="text-sm font-medium text-[var(--eds-text-primary)]">{a.title}</p>
                          <p className="text-xs text-[var(--eds-text-tertiary)]">
                            {a.clientName || ""}
                            {a.projectName ? ` · ${a.projectName}` : ""}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-medium text-brand-navy">{selectedAnalysis.title}</span>
                        <button onClick={() => { setSelectedAnalysis(null); setRequirementModules([]); }} className="text-[10px] text-brand-blue hover:underline">andere wählen</button>
                      </div>
                      {requirementModules.length === 0 ? (
                        <p className="text-xs text-[var(--eds-text-disabled)]">Keine Baustein-Empfehlungen in dieser Analyse.</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {requirementModules.map((mod, idx) => {
                            const alreadyAdopted = exercises.some((e) => e.name.toLowerCase() === mod.name.toLowerCase());
                            return (
                              <div key={idx} className={`bg-[var(--eds-bg-sunken)] border rounded-lg p-3 ${alreadyAdopted ? "border-[var(--eds-status-green-bg)] opacity-60" : "border-[var(--eds-border)]"}`} data-testid={`card-req-module-${idx}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--eds-text-primary)]">{mod.name}</p>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium">{mod.type}</span>
                                    <p className="text-xs text-[var(--eds-text-tertiary)] mt-1 line-clamp-2">{mod.description}</p>
                                  </div>
                                  {alreadyAdopted ? (
                                    <span className="text-[10px] text-[var(--eds-status-green)] font-medium shrink-0">✓ Übernommen</span>
                                  ) : (
                                    <div className="flex flex-col gap-1 shrink-0">
                                      <button
                                        onClick={() => adoptRequirementModule(mod)}
                                        disabled={saving}
                                        className="text-[10px] font-medium text-brand-navy bg-[var(--eds-bg-sunken)] hover:bg-[var(--eds-border)] border border-[var(--eds-border)] rounded px-2 py-1 transition disabled:opacity-50"
                                        data-testid={`button-adopt-req-${idx}`}
                                      >
                                        Übernehmen
                                      </button>
                                      <Link
                                        href={`${base}/exercise-library?createFrom=requirement&reqId=${selectedAnalysis.id}&modIdx=${idx}`}
                                        className="text-[10px] font-medium text-[var(--eds-status-amber)] bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] rounded px-2 py-1 transition text-center"
                                        data-testid={`button-ai-req-${idx}`}
                                      >
                                        KI ausarbeiten
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white border border-[var(--eds-border)] rounded-xl" data-testid="section-blueprints">
              <div className="px-6 py-5 border-b border-[var(--eds-border)] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-brand-navy" data-testid="text-blueprints-title">Übernommene Bausteine</h3>
                  {selectedAssessmentId && (
                    <p className="text-xs text-[var(--eds-text-tertiary)] mt-0.5">
                      {loadingExercises ? "Laden..." : `${exercises.length} Baustein${exercises.length !== 1 ? "e" : ""}`}
                    </p>
                  )}
                </div>
                <Link
                  href={`${base}/case-studio`}
                  className="text-[11px] font-medium text-brand-blue hover:underline"
                  data-testid="link-case-studio"
                >
                  Case-Studio →
                </Link>
              </div>

              {!selectedAssessmentId ? (
                <div className="p-8">
                  <EmptyState
                    icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
                    title="Kein Assessment ausgewählt"
                    description="Wählen Sie ein Assessment, um dessen Bausteine zu sehen."
                  />
                </div>
              ) : loadingExercises ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[var(--eds-text-disabled)]">Laden...</p>
                </div>
              ) : exercises.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
                    title="Noch keine Bausteine übernommen"
                    description="Wählen Sie Bausteine aus der Bibliothek und übernehmen Sie diese ins Assessment."
                  />
                </div>
              ) : (
                <div className="divide-y divide-[var(--eds-border)]">
                  {exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="px-6 py-4 flex items-center gap-4 hover:bg-[var(--eds-bg-sunken)]/80 transition-colors group"
                      data-testid={`card-exercise-${ex.id}`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-[var(--eds-bg-sunken)] flex items-center justify-center text-lg shrink-0">
                        {typeIconEl(ex.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-semibold text-[var(--eds-text-primary)] truncate">{ex.name}</h4>
                          {ex.libraryItemId && sourceBadge("library")}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[var(--eds-text-disabled)]">
                          <span>{typeLabel(ex.type)}</span>
                          {ex.duration && <span>{ex.duration} Min.</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { setSelectedExercise({ ...ex }); setView("detail"); }}
                          className="text-xs font-medium text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-edit-${ex.id}`}
                        >
                          Bearbeiten
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {view === "library" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-brand-navy" data-testid="text-library-title">Aus Bibliothek übernehmen</h2>
              <p className="text-sm text-[var(--eds-text-secondary)] mt-1">Wählen Sie eine bestehende Übung und übernehmen Sie sie als Assessment-Baustein.</p>
            </div>

            {!selectedAssessmentId && (
              <div className="mb-4 p-4 bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] rounded-xl">
                <p className="text-sm text-[var(--eds-status-amber)] font-medium">Bitte wählen Sie zuerst ein Assessment auf der Übersichtsseite aus.</p>
                <button onClick={() => setView("hub")} className="text-xs text-brand-blue hover:underline mt-1">← Zurück zur Übersicht</button>
              </div>
            )}

            {!selectedLibraryItem ? (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl">
                {libraryItems.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-sm text-[var(--eds-text-disabled)]">Keine Einträge in der Bibliothek vorhanden.</p>
                    <Link href={`${base}/exercise-library`} className="text-xs text-brand-blue hover:underline mt-2 inline-block">Zur Baustein-Bibliothek →</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--eds-border)]">
                    {libraryItems.map((item) => {
                      const alreadyAdopted = exercises.some((e) => e.libraryItemId === item.id);
                      return (
                        <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-[var(--eds-bg-sunken)]/80 transition-colors group" data-testid={`card-lib-item-${item.id}`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-[var(--eds-bg-sunken)] flex items-center justify-center text-lg shrink-0">
                              {typeIconEl(item.exerciseType)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-[var(--eds-text-primary)]">{item.title}</h3>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>{typeLabel(item.exerciseType)}</span>
                                {item.targetLevels?.slice(0, 2).map((l) => (
                                  <span key={l} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)] font-medium">{l}</span>
                                ))}
                                {item.clientName && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)]">{item.clientName}</span>}
                              </div>
                              {item.description && <p className="text-xs text-[var(--eds-text-tertiary)] mt-1 line-clamp-1">{item.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {alreadyAdopted ? (
                              <span className="text-[10px] text-[var(--eds-status-green)] font-medium">✓ Bereits übernommen</span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedLibraryItem(item);
                                  setLibraryAdaptForm({
                                    name: item.title,
                                    description: item.description || "",
                                    instructions: "",
                                    duration: 45,
                                    targetLevel: item.targetLevels?.[0] || "Manager",
                                    adaptationNotes: "",
                                  });
                                }}
                                className="text-xs font-medium text-brand-blue hover:underline"
                                data-testid={`button-select-lib-${item.id}`}
                              >
                                Auswählen →
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmDeleteLibItem(item)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity hover:bg-[var(--eds-status-red-bg)] hover:!opacity-100 text-[var(--eds-status-red)]"
                              data-testid={`button-delete-lib-${item.id}`}
                              title="Aus Bibliothek löschen"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--eds-border)]">
                  <div className="w-9 h-9 rounded-lg bg-[var(--eds-bg-sunken)] flex items-center justify-center text-lg shrink-0">
                    {typeIconEl(selectedLibraryItem.exerciseType)}
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--eds-text-disabled)]">Basierend auf</p>
                    <p className="text-sm font-semibold text-[var(--eds-text-primary)]">{selectedLibraryItem.title}</p>
                  </div>
                  <button onClick={() => setSelectedLibraryItem(null)} className="ml-auto text-xs text-brand-blue hover:underline">Andere wählen</button>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Baustein-Name</label>
                  <input
                    className={inputClass}
                    value={libraryAdaptForm.name}
                    onChange={(e) => setLibraryAdaptForm((f) => ({ ...f, name: e.target.value }))}
                    data-testid="input-lib-name"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Ziel-Level</label>
                    <select
                      className={inputClass}
                      value={libraryAdaptForm.targetLevel}
                      onChange={(e) => setLibraryAdaptForm((f) => ({ ...f, targetLevel: e.target.value }))}
                      data-testid="select-lib-level"
                    >
                      {targetLevels.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Dauer (Minuten)</label>
                    <input
                      type="number"
                      className={inputClass + " !w-32"}
                      value={libraryAdaptForm.duration}
                      onChange={(e) => setLibraryAdaptForm((f) => ({ ...f, duration: parseInt(e.target.value) || 0 }))}
                      data-testid="input-lib-duration"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Durchführungsanweisungen</label>
                  <textarea
                    className={inputClass + " min-h-[80px] resize-y"}
                    rows={4}
                    value={libraryAdaptForm.instructions}
                    onChange={(e) => setLibraryAdaptForm((f) => ({ ...f, instructions: e.target.value }))}
                    placeholder="Anweisungen für diesen spezifischen Baustein..."
                    data-testid="input-lib-instructions"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Anpassungshinweise (nur für dieses Assessment)</label>
                  <textarea
                    className={inputClass + " min-h-[50px] resize-y"}
                    rows={2}
                    value={libraryAdaptForm.adaptationNotes}
                    onChange={(e) => setLibraryAdaptForm((f) => ({ ...f, adaptationNotes: e.target.value }))}
                    placeholder="Hinweise zur Anpassung an dieses Assessment..."
                    data-testid="input-lib-adaptation"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setSelectedLibraryItem(null)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--eds-border)] text-[var(--eds-text-secondary)] transition-colors hover:bg-[var(--eds-bg-sunken)]"
                    data-testid="button-cancel-library"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={adoptLibraryItem}
                    disabled={saving || !selectedAssessmentId}
                    className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-brand-navy transition-colors hover:opacity-90 disabled:opacity-50"
                    data-testid="button-save-library"
                  >
                    {saving ? "Übernehmen..." : "Als Baustein übernehmen"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-start mt-4">
              <button
                onClick={() => { setSelectedLibraryItem(null); setView("hub"); }}
                className="text-sm text-[var(--eds-text-secondary)] hover:text-[var(--eds-text-primary)] transition-colors"
                data-testid="button-back-library"
              >
                ← Zurück zur Übersicht
              </button>
            </div>
          </div>
        )}

        {view === "detail" && selectedExercise && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-brand-navy" data-testid="text-detail-title">Baustein bearbeiten</h2>
              <div className="flex gap-2 mt-2">
                {selectedExercise.libraryItemId && sourceBadge("library")}
              </div>
            </div>

            <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Name</label>
                <input
                  className={inputClass}
                  value={selectedExercise.name}
                  onChange={(e) => setSelectedExercise({ ...selectedExercise, name: e.target.value })}
                  data-testid="input-edit-name"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Typ</label>
                  <select
                    className={inputClass}
                    value={selectedExercise.type}
                    onChange={(e) => setSelectedExercise({ ...selectedExercise, type: e.target.value })}
                    data-testid="select-edit-type"
                  >
                    {exerciseTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Dauer (Minuten)</label>
                  <input
                    type="number"
                    className={inputClass + " !w-32"}
                    value={selectedExercise.duration ?? ""}
                    onChange={(e) => setSelectedExercise({ ...selectedExercise, duration: parseInt(e.target.value) || null })}
                    data-testid="input-edit-duration"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--eds-text-primary)] block mb-1">Durchführungsanweisungen</label>
                <textarea
                  className={inputClass + " min-h-[120px] resize-y"}
                  rows={6}
                  value={selectedExercise.instructions ?? ""}
                  onChange={(e) => setSelectedExercise({ ...selectedExercise, instructions: e.target.value })}
                  data-testid="input-edit-instructions"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setSelectedExercise(null); setView("hub"); }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--eds-border)] text-[var(--eds-text-secondary)] transition-colors hover:bg-[var(--eds-bg-sunken)]"
                  data-testid="button-cancel-edit"
                >
                  Abbrechen
                </button>
                <button
                  onClick={saveEditedExercise}
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-brand-navy transition-colors hover:opacity-90 disabled:opacity-50"
                  data-testid="button-save-edit"
                >
                  {saving ? "Speichern..." : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteLibItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" data-testid="modal-confirm-delete-lib">
            <div className="bg-white rounded-2xl shadow-xl border border-[var(--eds-border)] p-6 max-w-sm w-full mx-4">
              <h3 className="text-base font-semibold text-[var(--eds-text-primary)] mb-2" data-testid="text-confirm-delete-title">Wirklich löschen?</h3>
              <p className="text-sm text-[var(--eds-text-secondary)] mb-5">
                Der Bibliothekseintrag{" "}
                <span className="font-medium text-[var(--eds-text-primary)]">"{confirmDeleteLibItem.title}"</span>{" "}
                wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDeleteLibItem(null)}
                  disabled={deletingLibItem}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--eds-border)] text-[var(--eds-text-secondary)] hover:bg-[var(--eds-bg-sunken)] transition-colors disabled:opacity-50"
                  data-testid="button-cancel-delete-lib"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => deleteLibraryItem(confirmDeleteLibItem)}
                  disabled={deletingLibItem}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[var(--eds-status-red)] hover:bg-[var(--eds-terracotta-dk)] transition-colors disabled:opacity-50"
                  data-testid="button-confirm-delete-lib"
                >
                  {deletingLibItem ? "Löschen..." : "Löschen"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
