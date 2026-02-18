"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

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

interface CaseStudySummary {
  id: string;
  title: string;
  companyName: string;
  type: string;
  status: string;
}

interface ModuleBlueprint {
  id: string;
  name: string;
  type: string;
  description: string;
  instructions: string;
  duration: number;
  targetLevel: string;
  scenarioContext: string;
  adaptationNotes: string;
  sourceType: "manual" | "library" | "ai" | "requirement";
  sourceId?: string;
  aiGenerated: boolean;
  status: "draft" | "ready" | "active";
}

type ViewMode = "hub" | "manual" | "library" | "ai" | "detail";

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

const typeIcon = (t: string) => {
  const map: Record<string, string> = {
    interview: "🎙️",
    case_study: "📋",
    fact_finding: "🔍",
    presentation: "📊",
    role_play: "🎭",
    group_discussion: "💬",
    inbox: "📬",
    psychometric: "📝",
    other: "⚙️",
  };
  return map[t] || "📄";
};

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors";

export default function ModulesHubPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceSlug = params.workspaceSlug as string;
  const base = `/w/${workspaceSlug}/admin`;

  const [view, setView] = useState<ViewMode>("hub");
  const [blueprints, setBlueprints] = useState<ModuleBlueprint[]>([]);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);
  const [requirementModules, setRequirementModules] = useState<AssessmentModuleData[]>([]);

  const [editBlueprint, setEditBlueprint] = useState<ModuleBlueprint | null>(null);

  const [manualForm, setManualForm] = useState({
    name: "",
    type: "interview",
    description: "",
    instructions: "",
    duration: 45,
    targetLevel: "Manager",
    scenarioContext: "",
  });

  const [aiForm, setAiForm] = useState({
    type: "interview",
    targetLevel: "Manager",
    context: "",
    duration: 45,
    embedInScenario: false,
    scenarioCaseStudyId: "",
    requirementModuleIndex: -1,
  });

  const [selectedLibraryItem, setSelectedLibraryItem] = useState<LibraryItem | null>(null);
  const [libraryAdaptForm, setLibraryAdaptForm] = useState({
    name: "",
    description: "",
    instructions: "",
    duration: 45,
    targetLevel: "Manager",
    scenarioContext: "",
  });

  const savedBlueprints = useCallback(() => {
    try {
      const key = `baustein_blueprints_${workspaceSlug}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [workspaceSlug]);

  const persistBlueprints = useCallback(
    (bps: ModuleBlueprint[]) => {
      const key = `baustein_blueprints_${workspaceSlug}`;
      localStorage.setItem(key, JSON.stringify(bps));
      setBlueprints(bps);
    },
    [workspaceSlug]
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [analysisRes, libraryRes, caseStudyRes] = await Promise.all([
        fetch(`/api/w/${workspaceSlug}/requirements-analysis`),
        fetch(`/api/w/${workspaceSlug}/exercise-library`),
        fetch(`/api/w/${workspaceSlug}/case-studies`),
      ]);

      if (analysisRes.ok) {
        const data = await analysisRes.json();
        setAnalyses(Array.isArray(data) ? data.filter((a: any) => a.status === "completed" && a.proposal) : []);
      }
      if (libraryRes.ok) {
        setLibraryItems(await libraryRes.json());
      }
      if (caseStudyRes.ok) {
        const cs = await caseStudyRes.json();
        setCaseStudies(Array.isArray(cs) ? cs : []);
      }

      setBlueprints(savedBlueprints());
    } catch {
      setError("Fehler beim Laden der Daten.");
    } finally {
      setLoading(false);
    }
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

  function adoptRequirementModule(mod: AssessmentModuleData) {
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
    const bp: ModuleBlueprint = {
      id: `bp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: mod.name,
      type: typeMap[mod.type] || "other",
      description: mod.description,
      instructions: "",
      duration: 45,
      targetLevel: "Manager",
      scenarioContext: "",
      adaptationNotes: mod.adaptationNotes || "",
      sourceType: "requirement",
      sourceId: selectedAnalysis?.id,
      aiGenerated: false,
      status: "draft",
    };
    const updated = [...blueprints, bp];
    persistBlueprints(updated);
    setSuccess(`"${mod.name}" als Baustein übernommen.`);
    setTimeout(() => setSuccess(""), 3000);
  }

  function saveManualBlueprint() {
    if (!manualForm.name.trim()) {
      setError("Bitte geben Sie einen Namen ein.");
      return;
    }
    const bp: ModuleBlueprint = {
      id: `bp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: manualForm.name,
      type: manualForm.type,
      description: manualForm.description,
      instructions: manualForm.instructions,
      duration: manualForm.duration,
      targetLevel: manualForm.targetLevel,
      scenarioContext: manualForm.scenarioContext,
      adaptationNotes: "",
      sourceType: "manual",
      aiGenerated: false,
      status: "draft",
    };
    persistBlueprints([...blueprints, bp]);
    setManualForm({ name: "", type: "interview", description: "", instructions: "", duration: 45, targetLevel: "Manager", scenarioContext: "" });
    setSuccess("Baustein manuell erstellt.");
    setView("hub");
    setTimeout(() => setSuccess(""), 3000);
  }

  function adoptLibraryItem() {
    if (!selectedLibraryItem) return;
    const bp: ModuleBlueprint = {
      id: `bp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: libraryAdaptForm.name || selectedLibraryItem.title,
      type: selectedLibraryItem.exerciseType || "other",
      description: libraryAdaptForm.description || selectedLibraryItem.description || "",
      instructions: libraryAdaptForm.instructions,
      duration: libraryAdaptForm.duration,
      targetLevel: libraryAdaptForm.targetLevel,
      scenarioContext: libraryAdaptForm.scenarioContext,
      adaptationNotes: "",
      sourceType: "library",
      sourceId: selectedLibraryItem.id,
      aiGenerated: false,
      status: "draft",
    };
    persistBlueprints([...blueprints, bp]);
    setSelectedLibraryItem(null);
    setSuccess(`"${bp.name}" aus Bibliothek übernommen.`);
    setView("hub");
    setTimeout(() => setSuccess(""), 3000);
  }

  async function generateWithAI() {
    setGenerating(true);
    setError("");
    try {
      let scenarioInfo = "";
      if (aiForm.embedInScenario && aiForm.scenarioCaseStudyId) {
        const cs = caseStudies.find((c) => c.id === aiForm.scenarioCaseStudyId);
        if (cs) scenarioInfo = `Eingebettet in das Overarching-Szenario der Fallstudie "${cs.title}" (Firma: ${cs.companyName}). Alle Rollen, Kontexte und Dokumente sollen in diesem Szenario spielen.`;
      }

      let reqContext = "";
      if (aiForm.requirementModuleIndex >= 0 && requirementModules[aiForm.requirementModuleIndex]) {
        const rm = requirementModules[aiForm.requirementModuleIndex];
        reqContext = `Basierend auf der Anforderungsanalyse-Empfehlung: "${rm.name}" (${rm.type}). Beschreibung: ${rm.description}. Anpassungshinweise: ${rm.adaptationNotes}. Generierungsprompt: ${rm.generationPrompt}.`;
      }

      const prompt = `Erstelle einen vollständigen Assessment-Baustein mit folgendem Profil:
Typ: ${typeLabel(aiForm.type)}
Ziel-Level: ${aiForm.targetLevel}
Dauer: ${aiForm.duration} Minuten
Kontext: ${aiForm.context || "Allgemein"}
${reqContext ? `\nAnforderungsanalyse-Kontext:\n${reqContext}` : ""}
${scenarioInfo ? `\nOverarching-Szenario:\n${scenarioInfo}` : ""}

Antworte in folgendem JSON-Format:
{
  "name": "Titel des Bausteins",
  "description": "Kurzbeschreibung (2-3 Sätze)",
  "instructions": "Detaillierte Durchführungsanweisungen für den Moderator/Beobachter",
  "duration": ${aiForm.duration},
  "scenarioContext": "Wie der Baustein ins Gesamtszenario passt (falls zutreffend)"
}`;

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_module",
          workspaceSlug,
          prompt,
          systemPrompt:
            "Du bist ein Experte für Executive Assessment Center Design. Erstelle professionelle, praxistaugliche Assessment-Bausteine auf Deutsch. Antworte ausschließlich in gültigem JSON.",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "KI-Generierung fehlgeschlagen");
      }
      const data = await res.json();
      const parsed = data.result || {};

      const bp: ModuleBlueprint = {
        id: `bp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: parsed.name || `KI-Baustein ${aiForm.type}`,
        type: aiForm.type,
        description: parsed.description || "",
        instructions: parsed.instructions || "",
        duration: parsed.duration || aiForm.duration,
        targetLevel: aiForm.targetLevel,
        scenarioContext: parsed.scenarioContext || scenarioInfo || "",
        adaptationNotes: reqContext || "",
        sourceType: "ai",
        sourceId: aiForm.requirementModuleIndex >= 0 ? selectedAnalysis?.id : undefined,
        aiGenerated: true,
        status: "draft",
      };

      persistBlueprints([...blueprints, bp]);
      setSuccess(`KI-Baustein "${bp.name}" erstellt.`);
      setView("hub");
    } catch (err: any) {
      setError(err.message || "KI-Generierung fehlgeschlagen.");
    } finally {
      setGenerating(false);
      setTimeout(() => setSuccess(""), 4000);
    }
  }

  function deleteBlueprint(id: string) {
    persistBlueprints(blueprints.filter((b) => b.id !== id));
  }

  function updateBlueprintStatus(id: string, status: "draft" | "ready" | "active") {
    persistBlueprints(blueprints.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  function saveEditedBlueprint() {
    if (!editBlueprint) return;
    persistBlueprints(blueprints.map((b) => (b.id === editBlueprint.id ? editBlueprint : b)));
    setEditBlueprint(null);
    setSuccess("Baustein aktualisiert.");
    setTimeout(() => setSuccess(""), 3000);
  }

  const statusBadge = (s: string) => {
    const map: Record<string, { color: string; bg: string; label: string }> = {
      draft: { color: "#64748b", bg: "#f1f5f9", label: "Entwurf" },
      ready: { color: "#16a34a", bg: "#f0fdf4", label: "Bereit" },
      active: { color: "#2563eb", bg: "#eff6ff", label: "Aktiv" },
    };
    const d = map[s] || map.draft;
    return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: d.bg, color: d.color }}>{d.label}</span>;
  };

  const sourceBadge = (s: string) => {
    const map: Record<string, { color: string; bg: string; label: string }> = {
      manual: { color: "#64748b", bg: "#f1f5f9", label: "Manuell" },
      library: { color: "#7c3aed", bg: "#f5f3ff", label: "Bibliothek" },
      ai: { color: "#d97706", bg: "#fffbeb", label: "KI-generiert" },
      requirement: { color: "#0d9488", bg: "#f0fdfa", label: "Anforderung" },
    };
    const d = map[s] || map.manual;
    return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: d.bg, color: d.color }}>{d.label}</span>;
  };

  const viewLabels: Record<string, string> = {
    manual: "Manuell erstellen",
    library: "Aus Bibliothek",
    ai: "KI-Generierung",
    detail: "Baustein bearbeiten",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-brand-navy text-white">
          <div className="max-w-full mx-auto px-6 h-16 flex items-center">
            <div className="flex items-center gap-4">
              <Link href={base} className="font-serif text-lg font-bold tracking-tight hover:opacity-80 transition-opacity" data-testid="link-dashboard">Dashboard</Link>
              <span className="text-white/40">/</span>
              <span className="text-sm text-white/70">Baustein-Builder</span>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex justify-center">
          <p className="text-sm text-slate-400">Laden...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-navy text-white">
        <div className="max-w-full mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={base} className="font-serif text-lg font-bold tracking-tight hover:opacity-80 transition-opacity" data-testid="link-dashboard">
              Dashboard
            </Link>
            <span className="text-white/40">/</span>
            {view === "hub" ? (
              <span className="text-sm text-white/70">Baustein-Builder</span>
            ) : (
              <>
                <button onClick={() => { setView("hub"); setEditBlueprint(null); }} className="text-sm text-white/70 hover:text-white transition-colors" data-testid="link-builder-hub">
                  Baustein-Builder
                </button>
                <span className="text-white/40">/</span>
                <span className="text-sm text-white/70">{viewLabels[view] || view}</span>
              </>
            )}
          </div>
          {view !== "hub" && (
            <button
              onClick={() => { setView("hub"); setEditBlueprint(null); }}
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="button-back-hub"
            >
              ← Zurück
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between" data-testid="text-error">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 ml-3" data-testid="button-dismiss-error">✕</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl" data-testid="text-success">
            {success}
          </div>
        )}

        {view === "hub" && (
          <>
            <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-brand-navy mb-2" data-testid="text-page-title">
                Baustein-Builder
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Assessment-Bausteine erstellen, aus der Bibliothek übernehmen oder per KI generieren.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <button
                onClick={() => setView("manual")}
                className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-blue-300 hover:shadow-sm transition group"
                data-testid="button-create-manual"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-lg mb-3 group-hover:bg-blue-100 transition">✏️</div>
                <h3 className="text-sm font-semibold text-brand-navy">Manuell erstellen</h3>
                <p className="text-xs text-slate-500 mt-1">Baustein von Grund auf erstellen mit Typ, Beschreibung und Anweisungen</p>
              </button>

              <button
                onClick={() => setView("library")}
                className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-purple-300 hover:shadow-sm transition group"
                data-testid="button-create-library"
              >
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-lg mb-3 group-hover:bg-purple-100 transition">📚</div>
                <h3 className="text-sm font-semibold text-brand-navy">Aus Bibliothek</h3>
                <p className="text-xs text-slate-500 mt-1">Bestehende Übung übernehmen, anpassen und als Baustein verwenden</p>
                {libraryItems.length > 0 && (
                  <span className="inline-block mt-2 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">
                    {libraryItems.length} verfügbar
                  </span>
                )}
              </button>

              <button
                onClick={() => setView("ai")}
                className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-amber-300 hover:shadow-sm transition group"
                data-testid="button-create-ai"
              >
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-lg mb-3 group-hover:bg-amber-100 transition">🤖</div>
                <h3 className="text-sm font-semibold text-brand-navy">KI-gestützt generieren</h3>
                <p className="text-xs text-slate-500 mt-1">KI erstellt den Baustein — optional basierend auf Anforderungsanalyse und Szenario</p>
                {analyses.length > 0 && (
                  <span className="inline-block mt-2 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
                    {analyses.length} Analyse{analyses.length !== 1 ? "n" : ""} verfügbar
                  </span>
                )}
              </button>
            </div>

            {analyses.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl" data-testid="section-requirement-suggestions">
                <div className="px-6 py-5 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-brand-navy">Vorschläge aus der Anforderungsanalyse</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Empfohlene Bausteine direkt übernehmen oder per KI ausarbeiten</p>
                    </div>
                    {analyses.length > 1 && !selectedAnalysis && (
                      <span className="text-[10px] text-slate-400">{analyses.length} Analysen</span>
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
                          className="w-full text-left bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-brand-blue transition"
                          data-testid={`button-analysis-${a.id}`}
                        >
                          <p className="text-sm font-medium text-slate-800">{a.title}</p>
                          <p className="text-xs text-slate-500">
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
                        <p className="text-xs text-slate-400">Keine Baustein-Empfehlungen in dieser Analyse.</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {requirementModules.map((mod, idx) => {
                            const alreadyAdopted = blueprints.some((b) => b.name.toLowerCase() === mod.name.toLowerCase());
                            return (
                              <div key={idx} className={`bg-slate-50 border rounded-lg p-3 ${alreadyAdopted ? "border-green-200 opacity-60" : "border-slate-200"}`} data-testid={`card-req-module-${idx}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800">{mod.name}</p>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium">{mod.type}</span>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{mod.description}</p>
                                  </div>
                                  {alreadyAdopted ? (
                                    <span className="text-[10px] text-green-600 font-medium shrink-0">✓ Übernommen</span>
                                  ) : (
                                    <div className="flex flex-col gap-1 shrink-0">
                                      <button
                                        onClick={() => adoptRequirementModule(mod)}
                                        className="text-[10px] font-medium text-brand-navy bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-2 py-1 transition"
                                        data-testid={`button-adopt-req-${idx}`}
                                      >
                                        Übernehmen
                                      </button>
                                      <button
                                        onClick={() => {
                                          setAiForm((f) => ({
                                            ...f,
                                            type: Object.entries({ "Interview-Leitfaden": "interview", "Fallstudie": "case_study", "Fact-Finding-Simulation": "fact_finding", "Präsentation": "presentation", "Verhaltenssimulation": "role_play", "Rollenspiel": "role_play" }).find(([k]) => k === mod.type)?.[1] || "other",
                                            context: mod.description,
                                            requirementModuleIndex: idx,
                                          }));
                                          setView("ai");
                                        }}
                                        className="text-[10px] font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded px-2 py-1 transition"
                                        data-testid={`button-ai-req-${idx}`}
                                      >
                                        KI ausarbeiten
                                      </button>
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

            <div className="bg-white border border-slate-200 rounded-xl" data-testid="section-blueprints">
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-brand-navy" data-testid="text-blueprints-title">Erstellte Bausteine</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{blueprints.length} Baustein{blueprints.length !== 1 ? "e" : ""}</p>
                </div>
                <Link
                  href={`${base}/modules/case-study-builder`}
                  className="text-[11px] font-medium text-brand-blue hover:underline"
                  data-testid="link-case-study-builder"
                >
                  Fallstudien-Builder →
                </Link>
              </div>

              {blueprints.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-slate-400">Noch keine Bausteine erstellt.</p>
                  <p className="text-xs text-slate-400 mt-1">Nutzen Sie die Optionen oben, um Ihren ersten Baustein zu erstellen.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {blueprints.map((bp) => (
                    <div
                      key={bp.id}
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/80 transition-colors group"
                      data-testid={`card-blueprint-${bp.id}`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-lg shrink-0">
                        {typeIcon(bp.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-semibold text-slate-800 truncate">{bp.name}</h4>
                          {statusBadge(bp.status)}
                          {sourceBadge(bp.sourceType)}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>{typeLabel(bp.type)}</span>
                          <span>{bp.duration} Min.</span>
                          <span>{bp.targetLevel}</span>
                        </div>
                        {bp.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{bp.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { setEditBlueprint({ ...bp }); setView("detail"); }}
                          className="text-xs font-medium text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-edit-${bp.id}`}
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => deleteBlueprint(bp.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity hover:bg-red-50 text-red-500"
                          data-testid={`button-delete-${bp.id}`}
                          title="Löschen"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {view === "manual" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-brand-navy" data-testid="text-manual-title">Baustein manuell erstellen</h2>
              <p className="text-sm text-slate-600 mt-1">Definieren Sie alle Details für einen neuen Assessment-Baustein.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Name *</label>
                <input
                  className={inputClass}
                  value={manualForm.name}
                  onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="z.B. Strategische Präsentation"
                  data-testid="input-manual-name"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Typ</label>
                  <select
                    className={inputClass}
                    value={manualForm.type}
                    onChange={(e) => setManualForm((f) => ({ ...f, type: e.target.value }))}
                    data-testid="select-manual-type"
                  >
                    {exerciseTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Ziel-Level</label>
                  <select
                    className={inputClass}
                    value={manualForm.targetLevel}
                    onChange={(e) => setManualForm((f) => ({ ...f, targetLevel: e.target.value }))}
                    data-testid="select-manual-level"
                  >
                    {targetLevels.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Dauer (Minuten)</label>
                <input
                  type="number"
                  className={inputClass + " !w-32"}
                  value={manualForm.duration}
                  onChange={(e) => setManualForm((f) => ({ ...f, duration: parseInt(e.target.value) || 0 }))}
                  data-testid="input-manual-duration"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Beschreibung</label>
                <textarea
                  className={inputClass + " min-h-[70px] resize-y"}
                  rows={3}
                  value={manualForm.description}
                  onChange={(e) => setManualForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Was wird in diesem Baustein gemacht?"
                  data-testid="input-manual-description"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Durchführungsanweisungen</label>
                <textarea
                  className={inputClass + " min-h-[100px] resize-y"}
                  rows={5}
                  value={manualForm.instructions}
                  onChange={(e) => setManualForm((f) => ({ ...f, instructions: e.target.value }))}
                  placeholder="Detaillierte Anweisungen für Moderator/Beobachter..."
                  data-testid="input-manual-instructions"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Szenario-Kontext (optional)</label>
                <textarea
                  className={inputClass + " min-h-[50px] resize-y"}
                  rows={2}
                  value={manualForm.scenarioContext}
                  onChange={(e) => setManualForm((f) => ({ ...f, scenarioContext: e.target.value }))}
                  placeholder="In welches übergeordnete Szenario ist der Baustein eingebettet?"
                  data-testid="input-manual-scenario"
                />
              </div>

              {manualForm.type === "case_study" && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 mb-2">Für umfangreiche Fallstudien mit Datenraum nutzen Sie den spezialisierten Fallstudien-Builder:</p>
                  <Link
                    href={`${base}/modules/case-study-builder`}
                    className="text-xs font-medium text-brand-blue hover:underline"
                    data-testid="link-case-study-builder-redirect"
                  >
                    Zum Fallstudien-Builder →
                  </Link>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setView("hub")}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
                  data-testid="button-cancel-manual"
                >
                  Abbrechen
                </button>
                <button
                  onClick={saveManualBlueprint}
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-brand-navy transition-colors hover:opacity-90"
                  data-testid="button-save-manual"
                >
                  Baustein erstellen
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "library" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-brand-navy" data-testid="text-library-title">Aus Bibliothek übernehmen</h2>
              <p className="text-sm text-slate-600 mt-1">Wählen Sie eine bestehende Übung und passen Sie sie als Assessment-Baustein an.</p>
            </div>

            {!selectedLibraryItem ? (
              <div className="bg-white border border-slate-200 rounded-xl">
                {libraryItems.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-sm text-slate-400">Keine Einträge in der Bibliothek vorhanden.</p>
                    <Link href={`${base}/exercise-library`} className="text-xs text-brand-blue hover:underline mt-2 inline-block">Zur Baustein-Bibliothek →</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {libraryItems.map((item) => {
                      const alreadyAdopted = blueprints.some((b) => b.sourceId === item.id && b.sourceType === "library");
                      return (
                        <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors" data-testid={`card-lib-item-${item.id}`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-lg shrink-0">
                              {typeIcon(item.exerciseType)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-slate-800">{item.title}</h3>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>{typeLabel(item.exerciseType)}</span>
                                {item.targetLevels?.slice(0, 2).map((l) => (
                                  <span key={l} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">{l}</span>
                                ))}
                                {item.clientName && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{item.clientName}</span>}
                              </div>
                              {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>}
                            </div>
                          </div>
                          {alreadyAdopted ? (
                            <span className="text-[10px] text-green-600 font-medium shrink-0 ml-2">✓ Bereits übernommen</span>
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
                                  scenarioContext: "",
                                });
                              }}
                              className="shrink-0 ml-2 text-xs font-medium text-brand-blue hover:underline"
                              data-testid={`button-select-lib-${item.id}`}
                            >
                              Auswählen →
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-lg shrink-0">
                    {typeIcon(selectedLibraryItem.exerciseType)}
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Basierend auf</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedLibraryItem.title}</p>
                  </div>
                  <button onClick={() => setSelectedLibraryItem(null)} className="ml-auto text-xs text-brand-blue hover:underline">Andere wählen</button>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Baustein-Name</label>
                  <input
                    className={inputClass}
                    value={libraryAdaptForm.name}
                    onChange={(e) => setLibraryAdaptForm((f) => ({ ...f, name: e.target.value }))}
                    data-testid="input-lib-name"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Ziel-Level</label>
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
                    <label className="text-sm font-medium text-slate-700 block mb-1">Dauer (Minuten)</label>
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
                  <label className="text-sm font-medium text-slate-700 block mb-1">Beschreibung</label>
                  <textarea
                    className={inputClass + " min-h-[70px] resize-y"}
                    rows={3}
                    value={libraryAdaptForm.description}
                    onChange={(e) => setLibraryAdaptForm((f) => ({ ...f, description: e.target.value }))}
                    data-testid="input-lib-description"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Durchführungsanweisungen</label>
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
                  <label className="text-sm font-medium text-slate-700 block mb-1">Szenario-Kontext (optional)</label>
                  <textarea
                    className={inputClass + " min-h-[50px] resize-y"}
                    rows={2}
                    value={libraryAdaptForm.scenarioContext}
                    onChange={(e) => setLibraryAdaptForm((f) => ({ ...f, scenarioContext: e.target.value }))}
                    placeholder="In welches übergeordnete Szenario ist der Baustein eingebettet?"
                    data-testid="input-lib-scenario"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setSelectedLibraryItem(null)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
                    data-testid="button-cancel-library"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={adoptLibraryItem}
                    className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-brand-navy transition-colors hover:opacity-90"
                    data-testid="button-save-library"
                  >
                    Als Baustein übernehmen
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === "ai" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-brand-navy" data-testid="text-ai-title">KI-gestützte Generierung</h2>
              <p className="text-sm text-slate-600 mt-1">Die KI erstellt einen vollständigen Baustein basierend auf Ihren Vorgaben.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              {requirementModules.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <label className="text-sm font-medium text-slate-700 block mb-1">Anforderungsanalyse-Empfehlung als Grundlage</label>
                  <select
                    className={inputClass}
                    value={aiForm.requirementModuleIndex}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      setAiForm((f) => ({ ...f, requirementModuleIndex: idx }));
                      if (idx >= 0 && requirementModules[idx]) {
                        const rm = requirementModules[idx];
                        const typeMap: Record<string, string> = { "Interview-Leitfaden": "interview", "Fallstudie": "case_study", "Fact-Finding-Simulation": "fact_finding", "Präsentation": "presentation", "Verhaltenssimulation": "role_play", "Rollenspiel": "role_play" };
                        setAiForm((f) => ({
                          ...f,
                          type: typeMap[rm.type] || "other",
                          context: rm.description,
                          requirementModuleIndex: idx,
                        }));
                      }
                    }}
                    data-testid="select-ai-requirement"
                  >
                    <option value={-1}>— Keine Empfehlung verwenden —</option>
                    {requirementModules.map((rm, i) => (
                      <option key={i} value={i}>{rm.name} ({rm.type})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Baustein-Typ</label>
                  <select
                    className={inputClass}
                    value={aiForm.type}
                    onChange={(e) => setAiForm((f) => ({ ...f, type: e.target.value }))}
                    data-testid="select-ai-type"
                  >
                    {exerciseTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Ziel-Level</label>
                  <select
                    className={inputClass}
                    value={aiForm.targetLevel}
                    onChange={(e) => setAiForm((f) => ({ ...f, targetLevel: e.target.value }))}
                    data-testid="select-ai-level"
                  >
                    {targetLevels.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Dauer (Minuten)</label>
                <input
                  type="number"
                  className={inputClass + " !w-32"}
                  value={aiForm.duration}
                  onChange={(e) => setAiForm((f) => ({ ...f, duration: parseInt(e.target.value) || 0 }))}
                  data-testid="input-ai-duration"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Kontext / Anforderungen</label>
                <textarea
                  className={inputClass + " min-h-[70px] resize-y"}
                  rows={3}
                  value={aiForm.context}
                  onChange={(e) => setAiForm((f) => ({ ...f, context: e.target.value }))}
                  placeholder="Was soll der Baustein testen? Welche Kompetenzen stehen im Fokus?"
                  data-testid="input-ai-context"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-slate-700">Overarching-Szenario</h3>
                <p className="text-xs text-slate-500">Optional: Baustein in ein übergeordnetes Fallstudien-Szenario einbetten, sodass alle Übungen in der gleichen Firma / Situation spielen.</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiForm.embedInScenario}
                    onChange={(e) => setAiForm((f) => ({ ...f, embedInScenario: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-brand-navy focus:ring-blue-500/20"
                    data-testid="checkbox-embed-scenario"
                  />
                  <span className="text-sm text-slate-700">In bestehendes Szenario einbetten</span>
                </label>

                {aiForm.embedInScenario && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Fallstudie als Szenario-Rahmen</label>
                    {caseStudies.length === 0 ? (
                      <div className="text-xs text-slate-400">
                        Keine Fallstudien vorhanden.{" "}
                        <Link href={`${base}/modules/case-study-builder`} className="text-brand-blue hover:underline">
                          Fallstudie erstellen →
                        </Link>
                      </div>
                    ) : (
                      <select
                        className={inputClass}
                        value={aiForm.scenarioCaseStudyId}
                        onChange={(e) => setAiForm((f) => ({ ...f, scenarioCaseStudyId: e.target.value }))}
                        data-testid="select-ai-scenario"
                      >
                        <option value="">— Fallstudie wählen —</option>
                        {caseStudies.map((cs) => (
                          <option key={cs.id} value={cs.id}>{cs.title} ({cs.companyName})</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setView("hub")}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
                  data-testid="button-cancel-ai"
                >
                  Abbrechen
                </button>
                <button
                  onClick={generateWithAI}
                  disabled={generating}
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-brand-navy transition-colors hover:opacity-90 disabled:opacity-50"
                  data-testid="button-generate-ai"
                >
                  {generating ? "Generiere..." : "Baustein generieren"}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "detail" && editBlueprint && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-brand-navy" data-testid="text-detail-title">Baustein bearbeiten</h2>
              <div className="flex gap-2 mt-2">
                {statusBadge(editBlueprint.status)}
                {sourceBadge(editBlueprint.sourceType)}
                {editBlueprint.aiGenerated && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: "#fffbeb", color: "#d97706" }}>KI-generiert</span>}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Name</label>
                <input
                  className={inputClass}
                  value={editBlueprint.name}
                  onChange={(e) => setEditBlueprint({ ...editBlueprint, name: e.target.value })}
                  data-testid="input-edit-name"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Typ</label>
                  <select
                    className={inputClass}
                    value={editBlueprint.type}
                    onChange={(e) => setEditBlueprint({ ...editBlueprint, type: e.target.value })}
                    data-testid="select-edit-type"
                  >
                    {exerciseTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Ziel-Level</label>
                  <select
                    className={inputClass}
                    value={editBlueprint.targetLevel}
                    onChange={(e) => setEditBlueprint({ ...editBlueprint, targetLevel: e.target.value })}
                    data-testid="select-edit-level"
                  >
                    {targetLevels.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Status</label>
                  <select
                    className={inputClass}
                    value={editBlueprint.status}
                    onChange={(e) => setEditBlueprint({ ...editBlueprint, status: e.target.value as any })}
                    data-testid="select-edit-status"
                  >
                    <option value="draft">Entwurf</option>
                    <option value="ready">Bereit</option>
                    <option value="active">Aktiv</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Dauer (Minuten)</label>
                <input
                  type="number"
                  className={inputClass + " !w-32"}
                  value={editBlueprint.duration}
                  onChange={(e) => setEditBlueprint({ ...editBlueprint, duration: parseInt(e.target.value) || 0 })}
                  data-testid="input-edit-duration"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Beschreibung</label>
                <textarea
                  className={inputClass + " min-h-[70px] resize-y"}
                  rows={3}
                  value={editBlueprint.description}
                  onChange={(e) => setEditBlueprint({ ...editBlueprint, description: e.target.value })}
                  data-testid="input-edit-description"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Durchführungsanweisungen</label>
                <textarea
                  className={inputClass + " min-h-[120px] resize-y"}
                  rows={6}
                  value={editBlueprint.instructions}
                  onChange={(e) => setEditBlueprint({ ...editBlueprint, instructions: e.target.value })}
                  data-testid="input-edit-instructions"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Szenario-Kontext</label>
                <textarea
                  className={inputClass + " min-h-[50px] resize-y"}
                  rows={2}
                  value={editBlueprint.scenarioContext}
                  onChange={(e) => setEditBlueprint({ ...editBlueprint, scenarioContext: e.target.value })}
                  data-testid="input-edit-scenario"
                />
              </div>

              {editBlueprint.adaptationNotes && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Anpassungshinweise</label>
                  <textarea
                    className={inputClass + " min-h-[50px] resize-y bg-slate-50"}
                    rows={2}
                    value={editBlueprint.adaptationNotes}
                    onChange={(e) => setEditBlueprint({ ...editBlueprint, adaptationNotes: e.target.value })}
                    data-testid="input-edit-notes"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setEditBlueprint(null); setView("hub"); }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
                  data-testid="button-cancel-edit"
                >
                  Abbrechen
                </button>
                <button
                  onClick={saveEditedBlueprint}
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-brand-navy transition-colors hover:opacity-90"
                  data-testid="button-save-edit"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-5 bg-white">
        <p className="text-center text-[11px] text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
