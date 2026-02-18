"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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
  clientName: string | null;
  projectName: string | null;
  status: string;
  createdAt: string;
  autoDeleteAt: string | null;
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.workspaceSlug as string;
  const assessmentId = searchParams.get("assessmentId");

  const [inputText, setInputText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  const [adopting, setAdopting] = useState(false);
  const [adoptSuccess, setAdoptSuccess] = useState<{ competenciesApplied: number; assessmentName: string } | null>(null);

  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [researchUrls, setResearchUrls] = useState<string[]>([]);

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

  const ACCEPTED_TYPES = ".docx,.doc,.pdf,.xlsx,.xls,.pptx,.ppt,.txt";

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => {
      const ext = f.name.toLowerCase().split(".").pop() || "";
      return ["docx", "doc", "pdf", "xlsx", "xls", "pptx", "ppt", "txt"].includes(ext);
    });
    setUploadedFiles((prev) => [...prev, ...arr]);
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const handleAnalyze = async () => {
    const hasText = inputText.trim().length >= 20;
    const hasFiles = uploadedFiles.length > 0;
    if (!hasText && !hasFiles) {
      setError("Bitte geben Sie einen Text ein oder laden Sie Dateien hoch.");
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      let res: Response;
      if (hasFiles) {
        const formData = new FormData();
        formData.append("text", inputText);
        if (clientName.trim()) formData.append("clientName", clientName.trim());
        if (projectName.trim()) formData.append("projectName", projectName.trim());
        uploadedFiles.forEach((f) => formData.append("files", f));
        res = await fetch(`/api/w/${slug}/requirements-analysis/extract`, {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch(`/api/w/${slug}/requirements-analysis/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: inputText,
            ...(clientName.trim() && { clientName: clientName.trim() }),
            ...(projectName.trim() && { projectName: projectName.trim() }),
          }),
        });
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analyse fehlgeschlagen");
      }
      const data = await res.json();
      setExtraction(data.extraction);
      setCurrentAnalysisId(data.analysisId);
      setLastSaved(new Date().toLocaleTimeString("de-DE"));
      setUploadedFiles([]);
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
      setClientName(analysis.clientName || "");
      setProjectName(analysis.projectName || "");
      setCurrentAnalysisId(analysis.id);
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
    setClientName("");
    setProjectName("");
    setUploadedFiles([]);
    setResearchUrls([]);
    setLastSaved(null);
    setEditingField(null);
  };

  const handleDeleteAnalysis = async (id: string) => {
    if (!confirm("Diese Analyse wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/w/${slug}/requirements-analysis/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (currentAnalysisId === id) startNew();
        fetchSaved();
      }
    } catch {}
  };

  const handleDownloadDocx = async () => {
    if (!extraction) return;
    const sections: string[] = [];

    sections.push("ANFORDERUNGSANALYSE — ERGEBNISSE\n");
    if (clientName) sections.push(`Kunde: ${clientName}`);
    if (projectName) sections.push(`Projekt: ${projectName}`);
    sections.push(`Datum: ${extraction.analysisDate || "–"}`);
    sections.push(`Form: ${extraction.analysisForm || "–"}`);
    sections.push(`Teilnehmende: ${extraction.participants.join(", ") || "–"}`);
    sections.push("");

    sections.push("UNTERNEHMEN & ROLLE");
    sections.push(`Unternehmen: ${extraction.company || "–"}`);
    sections.push(`Ziel-Funktion: ${extraction.targetRole || "–"}`);
    sections.push(`Besetzung ab: ${extraction.startDate || "–"}`);
    sections.push("");

    sections.push("ASSESSMENT");
    sections.push(`Durchführungstermin: ${extraction.assessmentDate || "–"}`);
    sections.push(`Art: ${extraction.assessmentType || "–"}`);
    sections.push(`Dauer: ${extraction.assessmentDuration || "–"}`);
    sections.push("");

    sections.push("DURCHFÜHRENDE");
    const lc = extraction.leadConsultant;
    sections.push(`Berater: ${lc.firstName} ${lc.lastName}, ${lc.role} — ${lc.email}`);
    if (extraction.secondConsultant) {
      const sc = extraction.secondConsultant;
      sections.push(`Zweit-Berater: ${sc.firstName} ${sc.lastName}, ${sc.role} — ${sc.email}`);
    }
    extraction.additionalObservers.forEach((obs, i) => {
      sections.push(`Beobachter ${i+1}: ${obs.firstName} ${obs.lastName}, ${obs.role} — ${obs.email}`);
    });
    sections.push("");

    sections.push("KANDIDATEN");
    extraction.candidates.forEach((c, i) => {
      sections.push(`${i+1}. ${c.firstName} ${c.lastName} — ${c.currentRole} bei ${c.currentCompany} — ${c.email}`);
    });
    sections.push("");

    sections.push("KOMPETENZEN");
    extraction.competencies.filter(c => c.selected).forEach(c => {
      sections.push(`• ${c.name}: ${c.description}`);
    });
    sections.push("");

    sections.push("ASSESSMENT-BAUSTEINE");
    extraction.assessmentModules.filter(m => m.selected).forEach(m => {
      sections.push(`• ${m.name} (${MODULE_TYPE_LABELS[m.type] || m.type}): ${m.description}`);
    });
    sections.push("");

    sections.push("SPEZIFISCHE FRAGESTELLUNGEN");
    extraction.specificQuestions.forEach(q => sections.push(`• ${q}`));
    sections.push("");

    sections.push("STELLENSPEZIFISCHE ERFOLGSMERKMALE");
    extraction.successCriteria.forEach(c => sections.push(`★ ${c}`));

    const text = sections.join("\n");
    const blob = new Blob([text], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Anforderungsanalyse_${clientName || "Export"}_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdoptForProject = async () => {
    if (!assessmentId || !currentAnalysisId) return;
    setAdopting(true);
    setAdoptSuccess(null);
    try {
      const res = await fetch(`/api/w/${slug}/assessments/${assessmentId}/apply-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: currentAnalysisId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Übernehmen");
        return;
      }
      const data = await res.json();
      setAdoptSuccess({
        competenciesApplied: data.competenciesApplied || 0,
        assessmentName: data.assessment?.name || "",
      });
    } catch {
      setError("Netzwerkfehler beim Übernehmen");
    } finally {
      setAdopting(false);
    }
  };

  const handleUpdateAutoDelete = async (id: string, date: string | null) => {
    try {
      await fetch(`/api/w/${slug}/requirements-analysis/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoDeleteAt: date }),
      });
      fetchSaved();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 text-white" style={{ backgroundColor: ACCENT }}>
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
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
          </div>
        </div>
      </header>

      {assessmentId && (
        <div className="border-b" style={{ backgroundColor: `${ACCENT}08`, borderColor: `${ACCENT}15` }}>
          <div className="max-w-[1600px] mx-auto px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ color: ACCENT }}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.193-9.193a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
              <span className="font-medium" style={{ color: ACCENT }}>Kontext: Assessment-Projekt</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">Wählen oder erstellen Sie eine Analyse, dann übernehmen Sie die Ergebnisse für Ihr Projekt</span>
            </div>
            <button
              onClick={() => router.push(`/w/${slug}/admin/assessments/${assessmentId}`)}
              className="text-xs text-slate-500 hover:text-slate-700 transition"
              data-testid="link-back-assessment-top"
            >
              ← Zurück
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        <aside className="w-[280px] shrink-0 border-r border-slate-200 bg-slate-50/50 p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 56px)", position: "sticky", top: "56px" }}>
          <button
            onClick={startNew}
            className="w-full mb-4 px-4 py-2.5 text-white rounded-lg font-medium text-sm shadow-sm hover:opacity-90 transition flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT }}
            data-testid="button-new-analysis-sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Neue Anforderungsanalyse
          </button>

          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Gespeicherte Analysen</h3>

          {loadingList ? (
            <p className="text-xs text-slate-400 p-2">Laden...</p>
          ) : savedAnalyses.length === 0 ? (
            <p className="text-xs text-slate-400 p-2">Noch keine Analysen</p>
          ) : (
            <div className="space-y-1">
              {savedAnalyses.map((a) => {
                const isActive = currentAnalysisId === a.id;
                return (
                  <div key={a.id} className="group relative">
                    <button
                      onClick={() => loadSaved(a)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors pr-8 ${
                        isActive ? "text-white font-medium" : "text-slate-700 hover:bg-white"
                      }`}
                      style={isActive ? { backgroundColor: ACCENT } : undefined}
                      data-testid={`button-load-analysis-${a.id}`}
                    >
                      <p className="font-medium truncate text-xs">{a.title}</p>
                      <p className={`text-[10px] mt-0.5 truncate ${isActive ? "text-white/70" : "text-slate-400"}`}>
                        {a.clientName && `${a.clientName} · `}
                        {new Date(a.createdAt).toLocaleDateString("de-DE")}
                      </p>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAnalysis(a.id); }}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                        isActive ? "text-white/60 hover:text-white hover:bg-white/20" : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                      }`}
                      title="Analyse löschen"
                      data-testid={`button-delete-analysis-${a.id}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between" data-testid="text-error">
              {error}
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          <section className="mb-6" data-testid="section-input">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Playfair Display, serif" }}>
                Input — Anforderungsanalyse
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Kunde</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
                  placeholder="z.B. DER Touristik, Siemens AG..."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  data-testid="input-client-name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Projekt</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
                  placeholder="z.B. CEO-Nachfolge, Vorstandsbesetzung..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  data-testid="input-project-name"
                />
              </div>
            </div>

            <div
              className={`relative border-2 border-dashed rounded-xl p-5 mb-3 transition-colors text-center cursor-pointer ${
                dragActive ? "border-[hsl(14,48%,44%)] bg-orange-50" : "border-slate-300 hover:border-slate-400 bg-slate-50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-testid="dropzone-files"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                data-testid="input-file-upload"
              />
              <svg className="w-8 h-8 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm text-slate-600 font-medium">Stellenbeschreibungen, Unternehmensinfos etc. hierher ziehen</p>
              <p className="text-xs text-slate-400 mt-1">Word, Excel, PowerPoint, PDF, TXT — mehrere Dateien möglich. Klicken Sie hier, um Dateien auszuwählen.</p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mb-3 space-y-1.5" data-testid="section-uploaded-files">
                {uploadedFiles.map((f, i) => {
                  const ext = f.name.split(".").pop()?.toLowerCase() || "";
                  const iconColor =
                    ["docx", "doc"].includes(ext) ? "text-blue-600" :
                    ["xlsx", "xls"].includes(ext) ? "text-green-600" :
                    ["pptx", "ppt"].includes(ext) ? "text-orange-600" :
                    ext === "pdf" ? "text-red-600" : "text-slate-500";
                  return (
                    <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2" data-testid={`file-item-${i}`}>
                      <svg className={`w-4 h-4 shrink-0 ${iconColor}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="text-sm text-slate-700 flex-1 truncate">{f.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">{ext}</span>
                      <span className="text-[10px] text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="text-slate-400 hover:text-red-500 transition"
                        data-testid={`button-remove-file-${i}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="text-xs text-slate-400">und / oder</span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>

            <p className="text-xs font-medium text-slate-600 mb-1.5">Transkript / Freitext eingeben</p>
            <textarea
              className="w-full h-40 border border-slate-300 rounded-xl p-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)] resize-y"
              placeholder="Fügen Sie hier die Ergebnisse, den Mitschrieb oder das Transkript einer Anforderungsanalyse ein..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              data-testid="textarea-input"
            />

            <div className="mt-4">
              <p className="text-xs font-medium text-slate-600 mb-1.5">Internet-Adressen für KI-Research (optional)</p>
              <div className="space-y-2">
                {researchUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const updated = [...researchUrls];
                        updated[i] = e.target.value;
                        setResearchUrls(updated);
                      }}
                      placeholder="https://..."
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
                      data-testid={`input-research-url-${i}`}
                    />
                    <button
                      onClick={() => setResearchUrls(researchUrls.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-red-500 transition p-1"
                      data-testid={`button-remove-url-${i}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setResearchUrls([...researchUrls, ""])}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400 transition flex items-center gap-1"
                  data-testid="button-add-url"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  URL hinzufügen
                </button>
                <p className="text-[10px] text-slate-400">z.B. Unternehmenswebsites, Stellenanzeigen, LinkedIn-Profile — werden von der KI für vertiefenden Research genutzt</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-400">
                {uploadedFiles.length > 0 && <span className="text-slate-600 font-medium">{uploadedFiles.length} Datei(en) + </span>}
                {inputText.length} Zeichen
              </span>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || (inputText.trim().length < 20 && uploadedFiles.length === 0)}
                className="px-6 py-2.5 text-white rounded-lg font-medium text-sm shadow-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: ACCENT }}
                data-testid="button-analyze"
              >
                {analyzing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    {uploadedFiles.length > 0 ? "Dateien werden verarbeitet..." : "Wird analysiert..."}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                    Analyse starten
                  </>
                )}
              </button>
            </div>
          </section>

          {extraction && (
            <>
            {(clientName || projectName) && (
              <div className="mb-4 flex items-center gap-3 text-sm" data-testid="section-project-info">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" /></svg>
                {clientName && <span className="font-medium text-slate-700">{clientName}</span>}
                {clientName && projectName && <span className="text-slate-300">|</span>}
                {projectName && <span className="text-slate-600">{projectName}</span>}
              </div>
            )}
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

                {adoptSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3" data-testid="section-adopt-success">
                    <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-800">Erfolgreich übernommen</p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Daten wurden in das Assessment &laquo;{adoptSuccess.assessmentName}&raquo; übernommen.
                        {adoptSuccess.competenciesApplied > 0 && ` ${adoptSuccess.competenciesApplied} Kompetenz${adoptSuccess.competenciesApplied !== 1 ? "en" : ""} angelegt.`}
                      </p>
                      <button
                        onClick={() => router.push(`/w/${slug}/admin/assessments/${assessmentId}`)}
                        className="mt-2 text-xs font-medium px-3 py-1 rounded-lg text-white transition hover:opacity-90"
                        style={{ backgroundColor: ACCENT }}
                        data-testid="link-back-to-assessment"
                      >
                        Zurück zum Assessment →
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                  <div>
                    {assessmentId && (
                      <button
                        onClick={() => router.push(`/w/${slug}/admin/assessments/${assessmentId}`)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                        data-testid="link-back-assessment"
                      >
                        ← Zurück zum Assessment
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDownloadDocx}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                      data-testid="button-download-docx"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      Herunterladen
                    </button>
                    {assessmentId && currentAnalysisId && !adoptSuccess && (
                      <button
                        onClick={handleAdoptForProject}
                        disabled={adopting}
                        className="px-5 py-2 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                        style={{ backgroundColor: ACCENT }}
                        data-testid="button-adopt-for-project"
                      >
                        {adopting ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            Wird übernommen...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Für Projekt übernehmen
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
        </main>
      </div>

      <footer className="border-t border-slate-200 py-4 mt-8">
        <p className="text-center text-xs text-slate-400">&copy; Christoph Aldering &middot; Private initiative / concept</p>
      </footer>
    </div>
  );
}
