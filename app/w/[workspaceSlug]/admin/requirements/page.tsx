"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Person {
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  email: string;
}

interface CandidateData {
  firstName: string;
  lastName: string;
  currentRole: string;
  currentCompany: string;
  phone: string;
  email: string;
}

interface CompetencyItem {
  name: string;
  description: string;
  selected: boolean;
}

interface AssessmentModuleData {
  name: string;
  type: string;
  description: string;
  adaptationNotes: string;
  generationPrompt: string;
  selected: boolean;
}

interface Extraction {
  analysisDate: string;
  analysisForm: string;
  participants: string[];
  company: string;
  targetRole: string;
  startDate: string;
  assessmentDate: string;
  assessmentType: string;
  assessmentDuration: string;
  leadConsultant: Person;
  secondConsultant: Person | null;
  additionalObservers: Person[];
  candidates: CandidateData[];
  specificQuestions: string[];
  successCriteria: string[];
  competencies: CompetencyItem[];
  assessmentModules: AssessmentModuleData[];
}

interface SavedAnalysis {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  proposal: Extraction | null;
  transcript: string | null;
}

const ACCENT = "hsl(14, 48%, 44%)";

const MODULE_TYPE_LABELS: Record<string, string> = {
  presentation: "Präsentation", interview: "Interview-Leitfaden", case_study: "Fallstudie",
  role_play: "Verhaltenssimulation", group_discussion: "Gruppendiskussion", in_tray: "Postkorb",
  fact_finding: "Fact-Finding", psychometric: "Psychometrischer Test", other: "Sonstiges",
};

function EditableField({
  label, value, path, onSave, editingField, setEditingField,
}: {
  label: string; value: string; path: string;
  onSave: (path: string, value: string) => void;
  editingField: string | null;
  setEditingField: (field: string | null) => void;
}) {
  const isEditing = editingField === path;
  const [tempVal, setTempVal] = useState(value);

  useEffect(() => { setTempVal(value); }, [value]);

  return (
    <div className="flex items-start gap-2 group">
      <span className="text-xs text-slate-500 w-40 shrink-0 pt-0.5">{label}:</span>
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            className="flex-1 text-sm border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={tempVal}
            onChange={(e) => setTempVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSave(path, tempVal); if (e.key === "Escape") setEditingField(null); }}
            autoFocus
            data-testid={`input-edit-${path}`}
          />
          <button onClick={() => onSave(path, tempVal)} className="text-green-600 hover:text-green-700 text-xs" data-testid={`button-save-${path}`}>OK</button>
          <button onClick={() => setEditingField(null)} className="text-slate-400 hover:text-slate-600 text-xs">X</button>
        </div>
      ) : (
        <span
          className="flex-1 text-sm text-slate-800 cursor-pointer hover:bg-slate-50 rounded px-1 -mx-1 group-hover:bg-slate-50"
          onClick={() => { setEditingField(path); setTempVal(value); }}
          data-testid={`text-${path}`}
        >
          {value || <span className="text-slate-300 italic">nicht angegeben</span>}
        </span>
      )}
    </div>
  );
}

function PersonBlock({
  label, person, pathPrefix, onSave, editingField, setEditingField,
}: {
  label: string; person: Person; pathPrefix: string;
  onSave: (path: string, value: string) => void;
  editingField: string | null;
  setEditingField: (field: string | null) => void;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 space-y-1">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">{label}</p>
      <EditableField label="Vorname" value={person.firstName} path={`${pathPrefix}.firstName`} onSave={onSave} editingField={editingField} setEditingField={setEditingField} />
      <EditableField label="Nachname" value={person.lastName} path={`${pathPrefix}.lastName`} onSave={onSave} editingField={editingField} setEditingField={setEditingField} />
      <EditableField label="Funktion" value={person.role} path={`${pathPrefix}.role`} onSave={onSave} editingField={editingField} setEditingField={setEditingField} />
      <EditableField label="Telefon" value={person.phone} path={`${pathPrefix}.phone`} onSave={onSave} editingField={editingField} setEditingField={setEditingField} />
      <EditableField label="E-Mail" value={person.email} path={`${pathPrefix}.email`} onSave={onSave} editingField={editingField} setEditingField={setEditingField} />
    </div>
  );
}

export default function RequirementsAnalysisPage() {
  const params = useParams();
  const slug = params.workspaceSlug as string;

  const [inputText, setInputText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showList, setShowList] = useState(false);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const [addingCompetency, setAddingCompetency] = useState(false);
  const [newCompName, setNewCompName] = useState("");
  const [newCompDesc, setNewCompDesc] = useState("");

  const [addingModule, setAddingModule] = useState(false);
  const [newModName, setNewModName] = useState("");
  const [newModDesc, setNewModDesc] = useState("");
  const [newModType, setNewModType] = useState("other");
  const [newModPrompt, setNewModPrompt] = useState("");

  const [expandedModule, setExpandedModule] = useState<number | null>(null);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${slug}/requirements-analysis`);
      if (res.ok) {
        const data = await res.json();
        setSavedAnalyses(data);
      }
    } catch {} finally {
      setLoadingList(false);
    }
  }, [slug]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const persistExtraction = useCallback(async (data: Extraction, analysisId: string | null) => {
    if (!analysisId) return;
    setSaving(true);
    try {
      await fetch(`/api/w/${slug}/requirements-analysis/${analysisId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal: data }),
      });
      setLastSaved(new Date().toLocaleTimeString("de-DE"));
    } catch {} finally {
      setSaving(false);
    }
  }, [slug]);

  const debouncedSave = useCallback((data: Extraction) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistExtraction(data, currentAnalysisId);
    }, 1500);
  }, [persistExtraction, currentAnalysisId]);

  const setExtractionAndSave = useCallback((data: Extraction) => {
    setExtraction(data);
    debouncedSave(data);
  }, [debouncedSave]);

  const handleAnalyze = async () => {
    if (!inputText.trim() || inputText.trim().length < 20) {
      setError("Bitte geben Sie einen ausreichend langen Text ein.");
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/w/${slug}/requirements-analysis/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analyse fehlgeschlagen");
      }
      const data = await res.json();
      setExtraction(data.extraction);
      setCurrentAnalysisId(data.analysisId);
      setLastSaved(new Date().toLocaleTimeString("de-DE"));
      fetchSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler bei der Analyse");
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSaved = (analysis: SavedAnalysis) => {
    if (analysis.proposal) {
      setExtraction(analysis.proposal as Extraction);
      setInputText(analysis.transcript || "");
      setCurrentAnalysisId(analysis.id);
      setShowList(false);
      setLastSaved(null);
    }
  };

  const updateField = (path: string, value: string) => {
    if (!extraction) return;
    const copy = JSON.parse(JSON.stringify(extraction)) as Extraction;
    const parts = path.split(".");
    let obj: Record<string, unknown> = copy as unknown as Record<string, unknown>;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]] as Record<string, unknown>;
    }
    obj[parts[parts.length - 1]] = value;
    setExtractionAndSave(copy);
    setEditingField(null);
  };

  const toggleCompetency = (idx: number) => {
    if (!extraction) return;
    const updated = { ...extraction, competencies: extraction.competencies.map((c, i) =>
      i === idx ? { ...c, selected: !c.selected } : c
    )};
    setExtractionAndSave(updated);
  };

  const removeCompetency = (idx: number) => {
    if (!extraction) return;
    setExtractionAndSave({ ...extraction, competencies: extraction.competencies.filter((_, i) => i !== idx) });
  };

  const addCompetency = () => {
    if (!extraction || !newCompName.trim()) return;
    setExtractionAndSave({
      ...extraction,
      competencies: [...extraction.competencies, { name: newCompName.trim(), description: newCompDesc.trim(), selected: true }],
    });
    setNewCompName("");
    setNewCompDesc("");
    setAddingCompetency(false);
  };

  const toggleModule = (idx: number) => {
    if (!extraction) return;
    const updated = { ...extraction, assessmentModules: extraction.assessmentModules.map((m, i) =>
      i === idx ? { ...m, selected: !m.selected } : m
    )};
    setExtractionAndSave(updated);
  };

  const removeModule = (idx: number) => {
    if (!extraction) return;
    setExtractionAndSave({ ...extraction, assessmentModules: extraction.assessmentModules.filter((_, i) => i !== idx) });
    if (expandedModule === idx) setExpandedModule(null);
  };

  const addModule = () => {
    if (!extraction || !newModName.trim()) return;
    setExtractionAndSave({
      ...extraction,
      assessmentModules: [...extraction.assessmentModules, {
        name: newModName.trim(),
        type: newModType,
        description: newModDesc.trim(),
        adaptationNotes: "",
        generationPrompt: newModPrompt.trim(),
        selected: true,
      }],
    });
    setNewModName("");
    setNewModDesc("");
    setNewModType("other");
    setNewModPrompt("");
    setAddingModule(false);
  };

  const removeQuestion = (idx: number) => {
    if (!extraction) return;
    setExtractionAndSave({ ...extraction, specificQuestions: extraction.specificQuestions.filter((_, i) => i !== idx) });
  };

  const removeCriterion = (idx: number) => {
    if (!extraction) return;
    setExtractionAndSave({ ...extraction, successCriteria: extraction.successCriteria.filter((_, i) => i !== idx) });
  };

  const removeCandidate = (idx: number) => {
    if (!extraction) return;
    setExtractionAndSave({ ...extraction, candidates: extraction.candidates.filter((_, i) => i !== idx) });
  };

  const removeObserver = (idx: number) => {
    if (!extraction) return;
    setExtractionAndSave({ ...extraction, additionalObservers: extraction.additionalObservers.filter((_, i) => i !== idx) });
  };

  const startNew = () => {
    setExtraction(null);
    setCurrentAnalysisId(null);
    setInputText("");
    setLastSaved(null);
    setEditingField(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 text-white" style={{ backgroundColor: ACCENT }}>
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors" data-testid="link-module-overview">Modul-Übersicht</a>
            <Link href={`/w/${slug}/admin`} className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors" data-testid="link-back-dashboard">Dashboard</Link>
            <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: "Playfair Display, serif" }} data-testid="text-page-title">
              Anforderungsanalyse
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-xs text-white/60 animate-pulse">Speichern...</span>}
            {!saving && lastSaved && <span className="text-xs text-white/60">Gespeichert {lastSaved}</span>}
            {extraction && (
              <button
                onClick={startNew}
                className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
                data-testid="button-new-analysis"
              >
                + Neue Analyse
              </button>
            )}
            <button
              onClick={() => setShowList(!showList)}
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="button-toggle-list"
            >
              {showList ? "Eingabe" : `Gespeicherte (${savedAnalyses.length})`}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between" data-testid="text-error">
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {showList ? (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4" style={{ fontFamily: "Playfair Display, serif" }}>Gespeicherte Analysen</h2>
            {loadingList ? (
              <div className="text-center py-12 text-slate-400">Laden...</div>
            ) : savedAnalyses.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border border-dashed border-slate-300 rounded-xl">
                <p className="text-lg font-medium">Noch keine Analysen vorhanden</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedAnalyses.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                    onClick={() => loadSaved(a)}
                    data-testid={`card-analysis-${a.id}`}
                  >
                    <div>
                      <h3 className="font-semibold text-slate-800">{a.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(a.createdAt).toLocaleDateString("de-DE")} · {a.status}</p>
                    </div>
                    <span className="text-xs text-slate-400">Laden &rarr;</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <section className="mb-6" data-testid="section-input">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Playfair Display, serif" }}>
                  Input — Anforderungsanalyse
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 text-xs border border-slate-300 text-slate-500 rounded-lg cursor-not-allowed opacity-50"
                    disabled
                    title="Spracheingabe — kommt bald"
                    data-testid="button-voice-input"
                  >
                    <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                    Spracheingabe
                  </button>
                </div>
              </div>
              <textarea
                className="w-full h-48 border border-slate-300 rounded-xl p-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)] resize-y"
                placeholder="Fügen Sie hier die Ergebnisse, den Mitschrieb oder das Transkript einer Anforderungsanalyse ein..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                data-testid="textarea-input"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-400">{inputText.length} Zeichen</span>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || inputText.trim().length < 20}
                  className="px-6 py-2.5 text-white rounded-lg font-medium text-sm shadow-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ backgroundColor: ACCENT }}
                  data-testid="button-analyze"
                >
                  {analyzing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Wird analysiert...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                      Analysieren
                    </>
                  )}
                </button>
              </div>
            </section>

            {extraction && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="section-results">
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                    Output — Extrahierte Daten
                  </h2>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Anforderungsanalyse</h3>
                    <EditableField label="Datum" value={extraction.analysisDate} path="analysisDate" onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                    <EditableField label="Form" value={extraction.analysisForm} path="analysisForm" onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-slate-500 w-40 shrink-0 pt-0.5">Teilnehmende:</span>
                      <span className="text-sm text-slate-800">{extraction.participants.join(", ") || <span className="text-slate-300 italic">nicht angegeben</span>}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Unternehmen & Rolle</h3>
                    <EditableField label="Unternehmen" value={extraction.company} path="company" onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                    <EditableField label="Ziel-Funktion" value={extraction.targetRole} path="targetRole" onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                    <EditableField label="Besetzung ab" value={extraction.startDate} path="startDate" onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Assessment</h3>
                    <EditableField label="Durchführungstermin" value={extraction.assessmentDate} path="assessmentDate" onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                    <EditableField label="Art" value={extraction.assessmentType} path="assessmentType" onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                    <EditableField label="Dauer" value={extraction.assessmentDuration} path="assessmentDuration" onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Durchführende</h3>
                    <PersonBlock label="Berater" person={extraction.leadConsultant} pathPrefix="leadConsultant" onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                    {extraction.secondConsultant && (
                      <PersonBlock label="Zweit-Berater" person={extraction.secondConsultant} pathPrefix="secondConsultant" onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                    )}
                    {extraction.additionalObservers.map((obs, i) => (
                      <div key={i} className="relative">
                        <PersonBlock label={`Beobachter ${i + 1}`} person={obs} pathPrefix={`additionalObservers.${i}`} onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                        <button onClick={() => removeObserver(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs" data-testid={`button-remove-observer-${i}`}>Entfernen</button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Kandidaten</h3>
                    {extraction.candidates.map((cand, i) => (
                      <div key={i} className="relative bg-slate-50 rounded-lg p-3 space-y-1">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Kandidat {i + 1}</p>
                        <EditableField label="Vorname" value={cand.firstName} path={`candidates.${i}.firstName`} onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                        <EditableField label="Nachname" value={cand.lastName} path={`candidates.${i}.lastName`} onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                        <EditableField label="Aktuelle Funktion" value={cand.currentRole} path={`candidates.${i}.currentRole`} onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                        <EditableField label="Unternehmen" value={cand.currentCompany} path={`candidates.${i}.currentCompany`} onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                        <EditableField label="Telefon" value={cand.phone} path={`candidates.${i}.phone`} onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                        <EditableField label="E-Mail" value={cand.email} path={`candidates.${i}.email`} onSave={updateField} editingField={editingField} setEditingField={setEditingField} />
                        <button onClick={() => removeCandidate(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs" data-testid={`button-remove-candidate-${i}`}>Entfernen</button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Spezifische Fragestellungen</h3>
                    <ul className="space-y-2">
                      {extraction.specificQuestions.map((q, i) => (
                        <li key={i} className="flex items-start gap-2 group">
                          <span className="text-xs mt-1 text-slate-400">&bull;</span>
                          <span className="flex-1 text-sm text-slate-700">{q}</span>
                          <button onClick={() => removeQuestion(i)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-xs shrink-0" data-testid={`button-remove-question-${i}`}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Stellenspezifische Erfolgsmerkmale</h3>
                    <ul className="space-y-2">
                      {extraction.successCriteria.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 group">
                          <span className="text-xs mt-1" style={{ color: ACCENT }}>&#9733;</span>
                          <span className="flex-1 text-sm text-slate-700">{c}</span>
                          <button onClick={() => removeCriterion(i)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-xs shrink-0" data-testid={`button-remove-criterion-${i}`}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                    Empfehlungen
                  </h2>

                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-700">Anforderungsprofil / Kompetenzen</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 cursor-not-allowed" title="Verknüpfung mit bestehendem Kompetenzmodell — kommt bald">
                          Modell verknüpfen (bald)
                        </span>
                        <button
                          onClick={() => setAddingCompetency(true)}
                          className="text-xs font-medium px-2 py-0.5 rounded border border-slate-300 hover:bg-slate-50 transition"
                          data-testid="button-add-competency"
                        >
                          + Hinzufügen
                        </button>
                      </div>
                    </div>

                    {addingCompetency && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 space-y-2">
                        <input
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          placeholder="Kompetenzname"
                          value={newCompName}
                          onChange={(e) => setNewCompName(e.target.value)}
                          data-testid="input-new-competency-name"
                        />
                        <input
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          placeholder="Kurzbeschreibung"
                          value={newCompDesc}
                          onChange={(e) => setNewCompDesc(e.target.value)}
                          data-testid="input-new-competency-desc"
                        />
                        <div className="flex gap-2">
                          <button onClick={addCompetency} className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" data-testid="button-save-competency">Hinzufügen</button>
                          <button onClick={() => setAddingCompetency(false)} className="text-xs px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">Abbrechen</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {extraction.competencies.map((comp, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition ${comp.selected ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200 opacity-60"}`}
                        >
                          <input
                            type="checkbox"
                            checked={comp.selected}
                            onChange={() => toggleCompetency(i)}
                            className="mt-1 w-4 h-4 rounded"
                            data-testid={`checkbox-competency-${i}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{comp.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{comp.description}</p>
                          </div>
                          <button onClick={() => removeCompetency(i)} className="text-red-400 hover:text-red-600 shrink-0" data-testid={`button-remove-competency-${i}`}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-700">Assessment-Bausteine</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 cursor-not-allowed" title="Rückgriff auf Baustein-Bibliothek — kommt bald">
                          Bibliothek nutzen (bald)
                        </span>
                        <button
                          onClick={() => setAddingModule(true)}
                          className="text-xs font-medium px-2 py-0.5 rounded border border-slate-300 hover:bg-slate-50 transition"
                          data-testid="button-add-module"
                        >
                          + Hinzufügen
                        </button>
                      </div>
                    </div>

                    {addingModule && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 space-y-2">
                        <input
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1"
                          placeholder="Modulname"
                          value={newModName}
                          onChange={(e) => setNewModName(e.target.value)}
                          data-testid="input-new-module-name"
                        />
                        <select
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1"
                          value={newModType}
                          onChange={(e) => setNewModType(e.target.value)}
                          data-testid="select-new-module-type"
                        >
                          {Object.entries(MODULE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <textarea
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1 h-16 resize-y"
                          placeholder="Beschreibung"
                          value={newModDesc}
                          onChange={(e) => setNewModDesc(e.target.value)}
                          data-testid="textarea-new-module-desc"
                        />
                        <textarea
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1 h-20 resize-y font-mono text-xs"
                          placeholder="Prompt/Anweisung zur Erstellung dieses Bausteins..."
                          value={newModPrompt}
                          onChange={(e) => setNewModPrompt(e.target.value)}
                          data-testid="textarea-new-module-prompt"
                        />
                        <div className="flex gap-2">
                          <button onClick={addModule} className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" data-testid="button-save-module">Hinzufügen</button>
                          <button onClick={() => setAddingModule(false)} className="text-xs px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">Abbrechen</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {extraction.assessmentModules.map((mod, i) => (
                        <div
                          key={i}
                          className={`rounded-lg border transition ${mod.selected ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200 opacity-60"}`}
                        >
                          <div className="flex items-start gap-3 p-3">
                            <input
                              type="checkbox"
                              checked={mod.selected}
                              onChange={() => toggleModule(i)}
                              className="mt-1 w-4 h-4 rounded"
                              data-testid={`checkbox-module-${i}`}
                            />
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedModule(expandedModule === i ? null : i)}>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-800">{mod.name}</p>
                                <span className="text-[10px] bg-blue-100 text-blue-600 rounded-full px-2 py-0.5">{MODULE_TYPE_LABELS[mod.type] || mod.type}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{mod.description}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                                className="text-slate-400 hover:text-slate-600"
                                data-testid={`button-expand-module-${i}`}
                              >
                                <svg className={`w-4 h-4 transition-transform ${expandedModule === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                              </button>
                              <button onClick={() => removeModule(i)} className="text-red-400 hover:text-red-600" data-testid={`button-remove-module-${i}`}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>

                          {expandedModule === i && (
                            <div className="border-t border-blue-200 p-3 space-y-3">
                              {mod.adaptationNotes && (
                                <div>
                                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Anpassungshinweise</p>
                                  <p className="text-xs text-slate-600">{mod.adaptationNotes}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Prompt / Anweisung zur Erstellung</p>
                                <div className="bg-white border border-slate-200 rounded p-2">
                                  <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">{mod.generationPrompt || "Kein Prompt vorhanden"}</pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                    <span>KI-generierte Empfehlungen — bitte prüfen, anpassen und ergänzen. Diese Vorschläge basieren auf dem eingegebenen Text und ersetzen keine fachliche Einschätzung.</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 py-4 mt-8">
        <p className="text-center text-xs text-slate-400">&copy; Christoph Aldering &middot; Private initiative / concept</p>
      </footer>
    </div>
  );
}
