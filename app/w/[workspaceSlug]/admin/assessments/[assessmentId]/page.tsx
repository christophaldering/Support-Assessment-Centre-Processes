"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CollaborationPanel from "./CollaborationPanel";
import PortalManagementSection from "./PortalManagementSection";

interface AssessmentRecord {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  processStep?: number;
  clientName?: string | null;
  autoDeleteDays?: number | null;
  sourceAnalysisId?: string | null;
  targetPosition?: string | null;
  workflowConfig?: Record<string, any> | null;
}

interface ExerciseRecord {
  id: string;
  name: string;
  type: string;
  instructions: string | null;
  duration: number | null;
  sortOrder: number;
  status: string;
  documents: ExerciseDocument[];
}

interface ExerciseDocument {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  objectPath: string;
  exerciseId: string | null;
}

interface DocumentRecord {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  visibleTo: string[];
  watermark: boolean;
  exerciseId: string | null;
  uploadedBy: { id: string; name: string } | null;
}

interface PortalDocRecord {
  id: string;
  assessmentId: string;
  exerciseId: string | null;
  category: string;
  title: string;
  description: string | null;
  objectPath: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  releaseStatus: string;
  releasedAt: string | null;
  sortOrder: number;
  createdAt: string;
}

interface CandidateRecord {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

interface ObservationSheetRecord {
  id: string;
  name: string;
  description: string | null;
  exerciseId: string | null;
  type: string;
  content: any;
  status: string;
  aiGenerated: boolean;
  createdBy: string | null;
  createdAt: string;
}

interface LibraryItem {
  id: string;
  title: string;
  exerciseType: string;
  tags: string[];
  targetLevels: string[];
  languagesAvailable: string[];
  qualityStatus: string;
  metadataJson: any;
  clientName?: string | null;
  projectName?: string | null;
  _count?: { variants: number };
}

const ALL_ROLES = ["MASTER_ADMIN", "WORKSPACE_ADMIN", "MODERATOR", "OBSERVER", "PROJECT_OFFICE", "CLIENT", "CANDIDATE"] as const;
const ROLE_LABELS: Record<string, string> = {
  MASTER_ADMIN: "Master-Administrator",
  WORKSPACE_ADMIN: "Workspace-Administrator",
  ADMIN: "Workspace-Administrator",
  MODERATOR: "Moderator",
  OBSERVER: "Beobachter",
  PROJECT_OFFICE: "Projektoffice",
  PROJECT_ASSISTANT: "Projektoffice",
  CLIENT: "Auftraggeber",
  HR_CLIENT: "Auftraggeber",
  CANDIDATE: "Kandidat",
};

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  presentation: "Präsentation",
  interview: "Interview",
  interview_guide: "Interview-Leitfaden",
  case_study: "Fallstudie",
  role_play: "Rollenspiel",
  behavior_simulation: "Verhaltenssimulation",
  group_discussion: "Gruppendiskussion",
  fact_finding: "Fact-Finding-Simulation",
  in_tray: "Postkorb",
  psychometric: "Psychometrischer Test",
  psychometric_test: "Psychometrischer Test",
  other: "Sonstiges",
};

const EXERCISE_TYPES = Object.keys(EXERCISE_TYPE_LABELS);

const TYPE_MAP_DE_TO_KEY: Record<string, string> = {
  "Fallstudie": "case_study", "Präsentation": "presentation", "Interview": "interview_guide",
  "Interview-Leitfaden": "interview_guide", "Fact-Finding": "fact_finding", "Fact-Finding-Simulation": "fact_finding",
  "Verhaltenssimulation": "behavior_simulation", "Rollenspiel": "behavior_simulation",
  "Psychometrischer Test": "psychometric_test", "Gruppenübung": "other", "Gruppendiskussion": "other",
  "interview": "interview_guide", "case_study": "case_study", "presentation": "presentation",
  "fact_finding": "fact_finding", "behavior_simulation": "behavior_simulation",
  "role_play": "behavior_simulation", "psychometric_test": "psychometric_test",
};

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-slate-50", text: "text-slate-600", label: "Entwurf" },
  active: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Aktiv" },
  completed: { bg: "bg-blue-50", text: "text-blue-600", label: "Abgeschlossen" },
  archived: { bg: "bg-red-50", text: "text-red-500", label: "Archiviert" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("de-DE");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

type SectionKey = "overview" | "requirements" | "target_position" | "exercises" | "observation_sheets" | "mtmm" | "participants" | "documents" | "portal" | "workflow" | "validation" | "activation";

interface NavGroup {
  label: string;
  items: { key: SectionKey; label: string; icon: React.ReactNode }[];
}

const PROCESS_STEPS = [
  { label: "Anforderungsanalyse", short: "Analyse" },
  { label: "Zusammenstellung", short: "Aufbau" },
  { label: "Validierung", short: "Prüfung" },
  { label: "Teilnehmer & Rollen", short: "Teilnehmer" },
  { label: "Freischaltung", short: "Aktivierung" },
];

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const assessmentId = params.assessmentId as string;

  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editStatus, setEditStatus] = useState("draft");
  const [editClientName, setEditClientName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [exName, setExName] = useState("");
  const [exType, setExType] = useState("presentation");
  const [exInstructions, setExInstructions] = useState("");
  const [exDuration, setExDuration] = useState("");
  const [exSortOrder, setExSortOrder] = useState("");
  const [exCreating, setExCreating] = useState(false);
  const [exError, setExError] = useState("");

  const [editingExId, setEditingExId] = useState<string | null>(null);
  const [editExName, setEditExName] = useState("");
  const [editExType, setEditExType] = useState("");
  const [editExInstructions, setEditExInstructions] = useState("");
  const [editExDuration, setEditExDuration] = useState("");
  const [editExSortOrder, setEditExSortOrder] = useState("");

  const [showUpload, setShowUpload] = useState(false);
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docExerciseId, setDocExerciseId] = useState("");
  const [docVisibleTo, setDocVisibleTo] = useState<string[]>([]);
  const [docWatermark, setDocWatermark] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [docUploadSection, setDocUploadSection] = useState<string | null>(null);
  const [exerciseDocUpload, setExerciseDocUpload] = useState<string | null>(null);
  const [exerciseDocName, setExerciseDocName] = useState("");
  const [exerciseDocFile, setExerciseDocFile] = useState<File | null>(null);
  const [exerciseDocUploading, setExerciseDocUploading] = useState(false);
  const [exerciseDocError, setExerciseDocError] = useState("");
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [pdfViewerTitle, setPdfViewerTitle] = useState("");
  const [portalDocs, setPortalDocs] = useState<PortalDocRecord[]>([]);

  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [availableUsers, setAvailableUsers] = useState<CandidateRecord[]>([]);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  const [observationSheets, setObservationSheets] = useState<ObservationSheetRecord[]>([]);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [sheetName, setSheetName] = useState("");
  const [sheetDesc, setSheetDesc] = useState("");
  const [sheetExerciseId, setSheetExerciseId] = useState("");
  const [sheetType, setSheetType] = useState("manual");
  const [sheetCreating, setSheetCreating] = useState(false);
  const [sheetError, setSheetError] = useState("");

  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const [specForLibrarySearch, setSpecForLibrarySearch] = useState<{name: string; type: string; description: string; adaptationNotes: string; generationPrompt: string} | null>(null);
  const [activeModuleSpec, setActiveModuleSpec] = useState<{name: string; type: string; description: string; adaptationNotes: string; generationPrompt: string} | null>(null);

  const [basisExercise, setBasisExercise] = useState<LibraryItem | null>(null);
  const [showBasisPicker, setShowBasisPicker] = useState(false);
  const [basisChanges, setBasisChanges] = useState("");

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiProgressLabel, setAiProgressLabel] = useState("");
  const [aiError, setAiError] = useState("");

  const [seedingVarexia, setSeedingVarexia] = useState(false);
  const [varexiaSeeded, setVarexiaSeeded] = useState(false);

  const [showCollab, setShowCollab] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<ObservationSheetRecord | null>(null);

  const [showAiSheetDialog, setShowAiSheetDialog] = useState(false);
  const [aiSheetExerciseId, setAiSheetExerciseId] = useState("");
  const [aiSheetInstructions, setAiSheetInstructions] = useState("");
  const [aiSheetType, setAiSheetType] = useState("verhaltensanker-bogen");
  const [aiSheetGenerating, setAiSheetGenerating] = useState(false);
  const [aiSheetError, setAiSheetError] = useState("");

  interface LinkedAnalysis {
    id: string;
    title: string;
    clientName: string | null;
    projectName: string | null;
    status: string;
    proposal: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
  }
  const [linkedAnalysis, setLinkedAnalysis] = useState<LinkedAnalysis | null>(null);
  const [linkedAnalysisLoading, setLinkedAnalysisLoading] = useState(false);

  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [editTargetPosition, setEditTargetPosition] = useState("");
  const [workflowConfig, setWorkflowConfig] = useState<Record<string, any>>({
    autoConsolidation: false,
    competencyAveraging: false,
    noteSharing: false,
    observerRotation: false,
  });
  const [observerRoleType, setObserverRoleType] = useState("silent");

  interface MtmmMapping {
    exerciseId: string;
    competencyNodeId: string;
    weight: number;
    exercise: { id: string; name: string };
    competencyNode: { id: string; name: string; description: string | null; sortOrder: number };
  }
  const [mtmmMappings, setMtmmMappings] = useState<MtmmMapping[]>([]);
  const [mtmmLoading, setMtmmLoading] = useState(false);
  const [mtmmCompetencyModel, setMtmmCompetencyModel] = useState<{id: string; name: string; nodes: {id: string; name: string; description: string | null; sortOrder: number; nodeType: string}[]} | null>(null);
  const [mtmmInlineGrid, setMtmmInlineGrid] = useState<Record<string, Record<string, {mapped: boolean; weight: number}>>>({});
  const [mtmmSaving, setMtmmSaving] = useState(false);
  const [mtmmSaveMsg, setMtmmSaveMsg] = useState("");
  const [mtmmAiLoading, setMtmmAiLoading] = useState(false);
  const [mtmmAiRationale, setMtmmAiRationale] = useState<{exerciseId: string; nodeId: string; weight: number; rationale: string}[]>([]);
  const [mtmmAiSummary, setMtmmAiSummary] = useState("");
  const [showInlineMtmm, setShowInlineMtmm] = useState(false);

  const apiBase = `/api/w/${workspaceSlug}/assessments/${assessmentId}`;

  const fetchAssessment = useCallback(async () => {
    try {
      const res = await fetch(apiBase);
      if (res.status === 401) {
        router.push(`/w/${workspaceSlug}/login`);
        return;
      }
      if (res.status === 403) {
        setError("Keine Berechtigung.");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssessment(data);
      setEditName(data.name);
      setEditDescription(data.description ?? "");
      setEditLocation(data.location ?? "");
      setEditStartDate(toDateInputValue(data.startDate));
      setEditEndDate(toDateInputValue(data.endDate));
      setEditStatus(data.status);
      setEditClientName(data.clientName ?? "");
      setEditTargetPosition(data.targetPosition ?? "");
      if (data.workflowConfig) {
        setWorkflowConfig(data.workflowConfig);
        if (data.workflowConfig.observerRoleType) {
          setObserverRoleType(data.workflowConfig.observerRoleType);
        }
      }
    } catch {
      setError("Fehler beim Laden des Assessments.");
    } finally {
      setLoading(false);
    }
  }, [apiBase, workspaceSlug, router]);

  const analysisTargetRole = linkedAnalysis?.proposal?.targetRole && typeof linkedAnalysis.proposal.targetRole === "string" ? linkedAnalysis.proposal.targetRole.trim() : null;

  const fetchExercises = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/exercises`);
      if (res.ok) {
        setExercises(await res.json());
      }
    } catch {}
  }, [apiBase]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/documents`);
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch {}
  }, [apiBase]);

  const fetchPortalDocs = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/portal-documents`);
      if (res.ok) setPortalDocs(await res.json());
    } catch {}
  }, [apiBase]);

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/candidates`);
      if (res.ok) setCandidates(await res.json());
    } catch {}
  }, [apiBase]);

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/users`);
      if (res.ok) setAvailableUsers(await res.json());
    } catch {}
  }, [workspaceSlug]);

  const fetchObservationSheets = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/observation-sheets`);
      if (res.ok) setObservationSheets(await res.json());
    } catch {}
  }, [apiBase]);

  const fetchMtmmMappings = useCallback(async () => {
    setMtmmLoading(true);
    try {
      const res = await fetch(`${apiBase}/exercise-competency-mappings?active=true`);
      if (res.ok) setMtmmMappings(await res.json());
    } catch {}
    finally { setMtmmLoading(false); }
  }, [apiBase]);

  const fetchLibraryItems = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/exercise-library`);
      if (res.ok) {
        const data = await res.json();
        setLibraryItems(data);
        if (data.some((item: LibraryItem) => item.title?.toLowerCase().includes("varexia"))) {
          setVarexiaSeeded(true);
        }
      }
    } catch {}
    finally { setLibraryLoading(false); }
  }, [workspaceSlug]);

  const fetchMtmmModel = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models`);
      if (res.ok) {
        const models = await res.json();
        if (models.length > 0) {
          const analysisDerived = models.find((m: any) => m.sourceType === "analysis_derived");
          setMtmmCompetencyModel(analysisDerived || models[0]);
        }
      }
    } catch {}
  }, [workspaceSlug]);

  const initInlineMtmmGrid = useCallback(() => {
    if (!mtmmCompetencyModel || exercises.length === 0) return;
    const competencyNodes = mtmmCompetencyModel.nodes.filter(n => n.nodeType === "competency" || n.nodeType === "domain");
    const grid: Record<string, Record<string, {mapped: boolean; weight: number}>> = {};
    for (const ex of exercises) {
      grid[ex.id] = {};
      for (const node of competencyNodes) {
        const existing = mtmmMappings.find(m => m.exerciseId === ex.id && m.competencyNodeId === node.id);
        grid[ex.id][node.id] = { mapped: !!existing, weight: existing?.weight ?? 1.0 };
      }
    }
    setMtmmInlineGrid(grid);
  }, [mtmmCompetencyModel, exercises, mtmmMappings]);

  useEffect(() => {
    if (showInlineMtmm) initInlineMtmmGrid();
  }, [showInlineMtmm, initInlineMtmmGrid]);

  const handleSaveInlineMtmm = async () => {
    if (!mtmmCompetencyModel) return;
    setMtmmSaving(true);
    setMtmmSaveMsg("");
    try {
      const mappingsToSave: {exerciseId: string; competencyNodeId: string; weight: number}[] = [];
      for (const [exId, nodes] of Object.entries(mtmmInlineGrid)) {
        for (const [nodeId, val] of Object.entries(nodes)) {
          if (val.mapped) {
            mappingsToSave.push({ exerciseId: exId, competencyNodeId: nodeId, weight: val.weight });
          }
        }
      }
      const res = await fetch(`${apiBase}/exercise-competency-mappings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: mappingsToSave }),
      });
      if (res.ok) {
        setMtmmSaveMsg("Zuordnungen gespeichert!");
        fetchMtmmMappings();
        setTimeout(() => setMtmmSaveMsg(""), 3000);
      } else {
        const d = await res.json();
        setMtmmSaveMsg(d.error || "Fehler beim Speichern");
      }
    } catch { setMtmmSaveMsg("Fehler beim Speichern"); }
    finally { setMtmmSaving(false); }
  };

  const handleMtmmAiSuggest = async () => {
    if (!mtmmCompetencyModel || exercises.length === 0) return;
    const competencyNodes = mtmmCompetencyModel.nodes.filter(n => n.nodeType === "competency" || n.nodeType === "domain");
    const hasPriorMappings = mtmmMappings.length > 0 || Object.values(mtmmInlineGrid).some(nodes => Object.values(nodes).some(v => v.mapped));
    if (hasPriorMappings) {
      const confirmed = window.confirm("Bestehende Zuordnungen werden durch den KI-Vorschlag ersetzt. Sie können die Vorschläge vor dem Speichern noch anpassen. Fortfahren?");
      if (!confirmed) return;
    }
    setMtmmAiLoading(true);
    setMtmmAiRationale([]);
    setMtmmAiSummary("");
    try {
      const dominantNodeType = competencyNodes.length > 0
        ? competencyNodes.reduce((acc, n) => { acc[n.nodeType] = (acc[n.nodeType] || 0) + 1; return acc; }, {} as Record<string, number>)
        : {};
      const detectedLevel = Object.entries(dominantNodeType).sort((a, b) => b[1] - a[1])[0]?.[0] || "competency";
      const res = await fetch(`${apiBase}/mtmm-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: detectedLevel,
          exercises: exercises.map(e => ({ id: e.id, name: e.name, type: e.type })),
          nodes: competencyNodes.map(n => ({ id: n.id, name: n.name, nodeType: n.nodeType })),
        }),
      });
      if (res.ok) {
        const suggestions: {exerciseId: string; nodeId: string; weight: number; rationale?: string}[] = await res.json();
        setMtmmAiRationale(suggestions.map(s => ({ ...s, rationale: s.rationale || "" })));
        const grid: Record<string, Record<string, {mapped: boolean; weight: number}>> = {};
        for (const ex of exercises) {
          grid[ex.id] = {};
          for (const node of competencyNodes) {
            const match = suggestions.find(s => s.exerciseId === ex.id && s.nodeId === node.id);
            grid[ex.id][node.id] = { mapped: !!match, weight: match?.weight ?? 1.0 };
          }
        }
        setMtmmInlineGrid(grid);
        setShowInlineMtmm(true);
        const nonDefault = suggestions.filter(s => s.weight !== 1.0);
        let summary = `KI-Vorschlag: ${suggestions.length} Zuordnung${suggestions.length !== 1 ? "en" : ""} generiert.`;
        if (nonDefault.length > 0) {
          summary += ` ${nonDefault.length} davon mit abweichender Gewichtung (≠ 1.0).`;
        }
        summary += " Dies ist ein Entwurf — prüfen und anpassen Sie die Zuordnungen, bevor Sie speichern.";
        setMtmmAiSummary(summary);
      } else {
        const d = await res.json();
        setMtmmAiSummary(d.error || "KI-Vorschlag fehlgeschlagen");
      }
    } catch {
      setMtmmAiSummary("KI-Vorschlag fehlgeschlagen");
    } finally {
      setMtmmAiLoading(false);
    }
  };

  const fetchLinkedAnalysis = useCallback(async () => {
    setLinkedAnalysisLoading(true);
    try {
      const res = await fetch(`${apiBase}/linked-analysis`);
      if (res.ok) {
        const data = await res.json();
        if (data.linked && data.analysis) {
          setLinkedAnalysis(data.analysis);
        }
      }
    } catch {}
    finally { setLinkedAnalysisLoading(false); }
  }, [apiBase]);

  const handleSeedVarexia = async () => {
    setSeedingVarexia(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/exercise-library/seed-varexia`, {
        method: "POST",
      });
      if (res.ok) {
        setVarexiaSeeded(true);
        fetchLibraryItems();
      }
    } catch {}
    finally { setSeedingVarexia(false); }
  };

  const simulateProgress = (setter: (v: number) => void, labelSetter: (v: string) => void) => {
    const steps = [
      { pct: 10, label: "Spezifikation analysieren…" },
      { pct: 25, label: "Übungskonzept entwickeln…" },
      { pct: 45, label: "Szenario generieren…" },
      { pct: 60, label: "Bewertungskriterien erstellen…" },
      { pct: 75, label: "Materialien zusammenstellen…" },
      { pct: 90, label: "Qualitätsprüfung…" },
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setter(steps[i].pct);
        labelSetter(steps[i].label);
        i++;
      }
    }, 2000);
    return interval;
  };

  const handleAIGenerateExercise = async () => {
    if (!exName.trim()) {
      setAiError("Bitte geben Sie einen Namen für die Übung ein.");
      return;
    }
    setAiGenerating(true);
    setAiProgress(0);
    setAiProgressLabel("Vorbereitung…");
    setAiError("");

    const progressInterval = simulateProgress(setAiProgress, setAiProgressLabel);

    try {
      const spec: any = {
        name: exName,
        type: exType,
        duration: exDuration ? parseInt(exDuration) : 30,
        targetLevel: "C-Level",
        competencyMappings: [],
        description: exInstructions || "",
      };

      if (basisExercise) {
        spec.context = `Basierend auf bestehender Übung: "${basisExercise.title}" (Typ: ${basisExercise.exerciseType}). ${basisChanges ? `Gewünschte Änderungen: ${basisChanges}` : ""} ${basisExercise.metadataJson?.description ? `Originalbeschreibung: ${basisExercise.metadataJson.description}` : ""}`;
      }

      const res = await fetch(`/api/w/${workspaceSlug}/automation/generate-exercise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spec,
          language: "DE",
          ...(activeModuleSpec ? {
            moduleContext: activeModuleSpec.generationPrompt,
            adaptationNotes: activeModuleSpec.adaptationNotes,
          } : {}),
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        setAiError(data.error || "Fehler bei der KI-Generierung.");
        setAiProgress(0);
        setAiProgressLabel("");
        return;
      }

      setAiProgress(95);
      setAiProgressLabel("Übung wird erstellt…");

      const data = await res.json();
      const generated = data.generatedContent || {};

      await fetch(`${apiBase}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: generated.title || exName,
          type: generated.exerciseType || exType,
          instructions: generated.scenario || generated.instructions?.forCandidates || exInstructions || null,
          duration: generated.timing?.total || (exDuration ? parseInt(exDuration) : null),
          sortOrder: exSortOrder ? parseInt(exSortOrder) : 0,
        }),
      });

      setAiProgress(100);
      setAiProgressLabel("Fertig!");

      setTimeout(() => {
        setShowCreateExercise(false);
        setExName("");
        setExType("presentation");
        setExInstructions("");
        setExDuration("");
        setExSortOrder("");
        setBasisExercise(null);
        setBasisChanges("");
        setActiveModuleSpec(null);
        setAiProgress(0);
        setAiProgressLabel("");
        setAiGenerating(false);
        fetchExercises();
      }, 1000);
    } catch {
      clearInterval(progressInterval);
      setAiError("Etwas ist schiefgelaufen bei der KI-Generierung.");
      setAiProgress(0);
      setAiProgressLabel("");
      setAiGenerating(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
    fetchExercises();
    fetchDocuments();
    fetchPortalDocs();
    fetchCandidates();
    fetchAvailableUsers();
    fetchObservationSheets();
    fetchMtmmMappings();
    fetchLinkedAnalysis();
    fetchMtmmModel();
  }, [fetchAssessment, fetchExercises, fetchDocuments, fetchPortalDocs, fetchCandidates, fetchAvailableUsers, fetchObservationSheets, fetchMtmmMappings, fetchLinkedAnalysis, fetchMtmmModel]);

  const handleSaveAssessment = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null,
          location: editLocation || null,
          startDate: editStartDate || null,
          endDate: editEndDate || null,
          status: editStatus,
          clientName: editClientName || null,
          targetPosition: editTargetPosition || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
        setSaveMsg("Gespeichert.");
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        const data = await res.json();
        setSaveMsg(data.error || "Fehler beim Speichern.");
      }
    } catch {
      setSaveMsg("Etwas ist schiefgelaufen.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkflowConfig = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const config = { ...workflowConfig, observerRoleType };
      const res = await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowConfig: config }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
        setSaveMsg("Workflow-Konfiguration gespeichert.");
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        const data = await res.json();
        setSaveMsg(data.error || "Fehler beim Speichern.");
      }
    } catch {
      setSaveMsg("Etwas ist schiefgelaufen.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setExError("");
    setExCreating(true);
    try {
      const res = await fetch(`${apiBase}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: exName,
          type: exType,
          instructions: exInstructions || null,
          duration: exDuration ? parseInt(exDuration) : null,
          sortOrder: exSortOrder ? parseInt(exSortOrder) : 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setExError(data.error || "Fehler beim Erstellen.");
        return;
      }
      setShowCreateExercise(false);
      setExName("");
      setExType("presentation");
      setExInstructions("");
      setExDuration("");
      setExSortOrder("");
      fetchExercises();
    } catch {
      setExError("Etwas ist schiefgelaufen.");
    } finally {
      setExCreating(false);
    }
  };

  const handleUpdateExercise = async (exId: string) => {
    try {
      await fetch(`${apiBase}/exercises/${exId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editExName,
          type: editExType,
          instructions: editExInstructions || null,
          duration: editExDuration ? parseInt(editExDuration) : null,
          sortOrder: editExSortOrder ? parseInt(editExSortOrder) : 0,
        }),
      });
      setEditingExId(null);
      fetchExercises();
    } catch {}
  };

  const handleDeleteExercise = async (exId: string) => {
    const confirmed = window.confirm("Möchten Sie diesen Baustein wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.");
    if (!confirmed) return;
    try {
      const res = await fetch(`${apiBase}/exercises/${exId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error || `Fehler ${res.status}`;
        alert(`Baustein konnte nicht gelöscht werden: ${msg}`);
        return;
      }
      fetchExercises();
    } catch {
      alert("Baustein konnte nicht gelöscht werden. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.");
    }
  };

  const handleUploadExerciseDoc = async (exerciseId: string) => {
    if (!exerciseDocFile) return;
    setExerciseDocUploading(true);
    setExerciseDocError("");
    try {
      const metaRes = await fetch(`${apiBase}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: exerciseDocName || exerciseDocFile.name,
          fileName: exerciseDocFile.name,
          fileSize: exerciseDocFile.size,
          mimeType: exerciseDocFile.type || "application/octet-stream",
          exerciseId,
          visibleTo: [],
          watermark: false,
        }),
      });
      if (!metaRes.ok) {
        const data = await metaRes.json();
        setExerciseDocError(data.error || "Fehler beim Hochladen.");
        return;
      }
      const { uploadURL } = await metaRes.json();
      await fetch(uploadURL, { method: "PUT", body: exerciseDocFile });
      setExerciseDocUpload(null);
      setExerciseDocName("");
      setExerciseDocFile(null);
      fetchExercises();
      fetchDocuments();
    } catch {
      setExerciseDocError("Etwas ist schiefgelaufen.");
    } finally {
      setExerciseDocUploading(false);
    }
  };

  const handleViewDocument = async (docId: string, fileName: string) => {
    try {
      const res = await fetch(`${apiBase}/documents/${docId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.downloadUrl) {
          setPdfViewerUrl(data.downloadUrl);
          setPdfViewerTitle(fileName);
        }
      }
    } catch {}
  };

  const handleDeleteExerciseDoc = async (docId: string) => {
    try {
      await fetch(`${apiBase}/documents/${docId}`, { method: "DELETE" });
      fetchExercises();
      fetchDocuments();
    } catch {}
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;
    setUploadError("");
    setUploading(true);
    try {
      const metaRes = await fetch(`${apiBase}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: docName,
          fileName: docFile.name,
          fileSize: docFile.size,
          mimeType: docFile.type || "application/octet-stream",
          exerciseId: docExerciseId || null,
          visibleTo: docVisibleTo,
          watermark: docWatermark,
        }),
      });
      if (!metaRes.ok) {
        const data = await metaRes.json();
        setUploadError(data.error || "Fehler beim Hochladen.");
        return;
      }
      const { uploadURL } = await metaRes.json();
      await fetch(uploadURL, {
        method: "PUT",
        body: docFile,
      });
      setShowUpload(false);
      setDocName("");
      setDocFile(null);
      setDocExerciseId("");
      setDocVisibleTo([]);
      setDocWatermark(false);
      fetchDocuments();
    } catch {
      setUploadError("Etwas ist schiefgelaufen.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (docId: string) => {
    try {
      const res = await fetch(`${apiBase}/documents/${docId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
        }
      }
    } catch {}
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await fetch(`${apiBase}/documents/${docId}`, { method: "DELETE" });
      fetchDocuments();
    } catch {}
  };

  const handleUploadPortalDoc = async (exerciseId: string | null, category: string) => {
    if (!docName || !docFile) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("title", docName);
      formData.append("category", category);
      formData.append("releaseStatus", "locked");
      if (exerciseId) formData.append("exerciseId", exerciseId);
      formData.append("file", docFile);

      const res = await fetch(`${apiBase}/portal-documents`, { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setUploadError(data.error || "Fehler beim Hochladen.");
        return;
      }
      setDocUploadSection(null);
      setDocName("");
      setDocFile(null);
      fetchPortalDocs();
      fetchDocuments();
    } catch {
      setUploadError("Etwas ist schiefgelaufen.");
    } finally {
      setUploading(false);
    }
  };

  const handleTogglePortalDocRelease = async (doc: PortalDocRecord) => {
    const newStatus = doc.releaseStatus === "released" ? "locked" : "released";
    await fetch(`${apiBase}/portal-documents/${doc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ releaseStatus: newStatus }),
    });
    fetchPortalDocs();
  };

  const handleDeletePortalDoc = async (docId: string) => {
    await fetch(`${apiBase}/portal-documents/${docId}`, { method: "DELETE" });
    fetchPortalDocs();
  };

  const toggleVisibleTo = (role: string) => {
    if (docVisibleTo.includes(role)) {
      setDocVisibleTo(docVisibleTo.filter((r) => r !== role));
    } else {
      setDocVisibleTo([...docVisibleTo, role]);
    }
  };

  const handleAssignCandidate = async (userId: string) => {
    try {
      await fetch(`${apiBase}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      fetchCandidates();
      fetchAvailableUsers();
      setShowAssignDropdown(false);
    } catch {}
  };

  const handleRemoveCandidate = async (userId: string) => {
    try {
      await fetch(`${apiBase}/candidates`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      fetchCandidates();
      fetchAvailableUsers();
    } catch {}
  };

  const handleCreateObservationSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSheetError("");
    setSheetCreating(true);
    try {
      const res = await fetch(`${apiBase}/observation-sheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sheetName,
          description: sheetDesc || null,
          exerciseId: sheetExerciseId || null,
          type: sheetType,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSheetError(data.error || "Fehler beim Erstellen.");
        return;
      }
      setShowCreateSheet(false);
      setSheetName("");
      setSheetDesc("");
      setSheetExerciseId("");
      setSheetType("manual");
      fetchObservationSheets();
    } catch {
      setSheetError("Etwas ist schiefgelaufen.");
    } finally {
      setSheetCreating(false);
    }
  };

  const getMtmmForExercise = (exerciseId: string) => {
    return mtmmMappings
      .filter(m => m.exerciseId === exerciseId)
      .sort((a, b) => b.weight - a.weight);
  };

  const handleCreateAISheet = async () => {
    setAiSheetExerciseId("");
    setAiSheetInstructions("");
    setAiSheetType("verhaltensanker-bogen");
    setAiSheetError("");
    setShowAiSheetDialog(true);
  };

  const handleSubmitAISheet = async () => {
    setAiSheetGenerating(true);
    setAiSheetError("");
    const matchedExercise = aiSheetExerciseId ? exercises.find(e => e.id === aiSheetExerciseId) : null;
    try {
      const res = await fetch(`${apiBase}/observation-sheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: matchedExercise ? `KI-Bogen: ${matchedExercise.name}` : "KI-Beobachtungsbogen",
          exerciseId: matchedExercise?.id || null,
          aiGenerated: true,
          sheetType: aiSheetType,
          additionalInstructions: aiSheetInstructions.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setAiSheetError(data.error || "Generierung fehlgeschlagen.");
        return;
      }
      setShowAiSheetDialog(false);
      fetchObservationSheets();
    } catch {
      setAiSheetError("Netzwerkfehler bei der Generierung.");
    } finally {
      setAiSheetGenerating(false);
    }
  };

  const handleDownloadSheetPdf = async (sheet: ObservationSheetRecord) => {
    try {
      const res = await fetch(`${apiBase}/observation-sheets/${sheet.id}/pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Beobachtungsbogen_${sheet.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("PDF-Download fehlgeschlagen.");
    }
  };

  const renderContentPreview = (content: any): string => {
    if (!content) return "Kein Inhalt vorhanden.";
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.map((item, i) => {
        if (typeof item === "string") return `${i + 1}. ${item}`;
        if (item && typeof item === "object") {
          const title = item.title || item.name || item.label || "";
          const desc = item.description || item.text || item.value || "";
          return `${title}${desc ? `: ${desc}` : ""}`;
        }
        return JSON.stringify(item);
      }).join("\n");
    }
    if (typeof content === "object") {
      return Object.entries(content).map(([key, val]) => {
        if (typeof val === "string" || typeof val === "number") return `${key}: ${val}`;
        if (Array.isArray(val)) return `${key}: ${val.join(", ")}`;
        return `${key}: ${JSON.stringify(val)}`;
      }).join("\n");
    }
    return JSON.stringify(content, null, 2);
  };

  const handleToggleLibrary = () => {
    if (!showLibrary) {
      fetchLibraryItems();
    }
    setShowLibrary(!showLibrary);
  };

  const handleImportFromLibrary = async (item: LibraryItem) => {
    try {
      await fetch(`${apiBase}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.title,
          type: item.exerciseType,
          instructions: item.metadataJson?.description || item.metadataJson?.instructions || null,
          duration: item.metadataJson?.duration || null,
          sortOrder: 0,
        }),
      });
      fetchExercises();
    } catch {}
  };

  const handleAIVariantImport = async (item: LibraryItem) => {
    setAiGenerating(true);
    setAiProgress(0);
    setAiProgressLabel("Variante wird generiert…");
    const progressInterval = simulateProgress(setAiProgress, setAiProgressLabel);
    try {
      const variantBody: any = { language: "DE" };
      if (specForLibrarySearch) {
        variantBody.adaptationNotes = specForLibrarySearch.adaptationNotes;
        variantBody.moduleContext = specForLibrarySearch.generationPrompt;
      }
      const res = await fetch(`/api/w/${workspaceSlug}/exercise-library/${item.id}/generate-variant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variantBody),
      });
      clearInterval(progressInterval);
      if (res.ok) {
        const data = await res.json();
        const content = data.variant?.contentJson || {};
        setAiProgress(90);
        setAiProgressLabel("Übung wird erstellt…");
        await fetch(`${apiBase}/exercises`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: content.title || data.item?.title || item.title + " (KI-Variante)",
            type: content.exerciseType || data.item?.exerciseType || item.exerciseType,
            instructions: content.scenario || content.instructions?.forCandidates || null,
            duration: content.timing?.total || null,
            sortOrder: 0,
          }),
        });
        setAiProgress(100);
        setAiProgressLabel("Fertig!");
        setTimeout(() => {
          setAiProgress(0);
          setAiProgressLabel("");
          setAiGenerating(false);
          fetchExercises();
        }, 1000);
      } else {
        setAiProgress(0);
        setAiProgressLabel("");
        setAiGenerating(false);
      }
    } catch {
      clearInterval(progressInterval);
      setAiProgress(0);
      setAiProgressLabel("");
      setAiGenerating(false);
    }
  };

  const handleActivateAssessment = async () => {
    setSaving(true);
    try {
      const res = await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active", processStep: 4 }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
        setEditStatus("active");
      }
    } catch {}
    finally { setSaving(false); }
  };

  const filteredAvailableUsers = availableUsers.filter(
    (u) => !candidates.some((c) => c.id === u.id)
  );

  if (loading) {
    return (
      <div className="py-8 px-6 lg:px-10 space-y-6">
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-slate-400">Laden…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 px-6 lg:px-10 space-y-6">
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-red-500" data-testid="text-error">{error}</p>
        </div>
      </div>
    );
  }

  const uniqueCompetencies = [...new Map(mtmmMappings.map(m => [m.competencyNode.id, m.competencyNode])).values()];
  const uniqueMtmmExercises = [...new Map(mtmmMappings.map(m => [m.exercise.id, m.exercise])).values()];

  const hasExercises = exercises.length > 0;
  const hasMtmm = mtmmMappings.length > 0;
  const hasSheets = observationSheets.length > 0;
  const hasDates = !!(assessment?.startDate && assessment?.endDate);
  const hasDescription = !!assessment?.description;
  const hasCandidates = candidates.length > 0;
  const hasDocuments = documents.length > 0;
  const hasTargetPosition = !!assessment?.targetPosition;

  const sectionComplete: Record<SectionKey, boolean> = {
    overview: !!(assessment?.name && hasDescription),
    requirements: !!assessment?.sourceAnalysisId,
    target_position: hasTargetPosition,
    exercises: hasExercises,
    observation_sheets: hasSheets,
    mtmm: hasMtmm,
    participants: hasCandidates,
    documents: hasDocuments,
    portal: false,
    workflow: !!(workflowConfig && Object.values(workflowConfig).some(v => v === true)),
    validation: hasExercises && hasMtmm && hasSheets && hasDates && hasDescription,
    activation: assessment?.status === "active",
  };

  const navGroups: NavGroup[] = [
    {
      label: "PLANUNG",
      items: [
        {
          key: "overview",
          label: "Übersicht",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
            </svg>
          ),
        },
        {
          key: "requirements",
          label: "Anforderungsanalyse",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          ),
        },
        {
          key: "target_position",
          label: "Zielposition",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "ZUSAMMENSTELLUNG",
      items: [
        {
          key: "exercises",
          label: "Übungen",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
            </svg>
          ),
        },
        {
          key: "mtmm",
          label: "MTMM-Matrix",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
            </svg>
          ),
        },
        {
          key: "observation_sheets",
          label: "Beobachtungsbögen",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "DURCHFÜHRUNG",
      items: [
        {
          key: "participants",
          label: "Teilnehmer & Rollen",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          ),
        },
        {
          key: "documents",
          label: "Dokumente",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          ),
        },
        {
          key: "portal",
          label: "Kandidatenportal",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "ABSCHLUSS",
      items: [
        {
          key: "validation",
          label: "Validierung",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          key: "activation",
          label: "Freischaltung",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <div className="py-8 px-6 lg:px-10 space-y-6">
      <div className="flex flex-1">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
            data-testid="sidebar-overlay"
          />
        )}

        <aside
          className={`fixed md:sticky top-16 left-0 z-30 md:z-10 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 overflow-y-auto transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
          data-testid="sidebar-navigation"
        >
          <nav className="py-4">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="px-4 mb-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase" data-testid={`nav-group-${group.label.toLowerCase()}`}>
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const isActive = activeSection === item.key;
                  const isComplete = sectionComplete[item.key];
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setActiveSection(item.key);
                        setSidebarOpen(false);
                      }}
                      data-testid={`nav-item-${item.key}`}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative ${
                        isActive
                          ? "text-brand-blue bg-blue-50/60 font-medium border-l-[3px] border-brand-blue"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-[3px] border-transparent"
                      }`}
                    >
                      <span className={isActive ? "text-brand-blue" : "text-slate-400"}>{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${isComplete ? "bg-emerald-400" : "bg-slate-200"}`}
                        data-testid={`indicator-${item.key}`}
                      />
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 md:ml-0 py-8 px-6 lg:px-10 space-y-8 min-w-0">

          {activeSection === "overview" && (
            <>
              <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-brand-navy mb-2" data-testid="heading-overview">Übersicht</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Verwalten Sie die Grunddaten des Assessments. Hier finden Sie eine Zusammenfassung aller relevanten Informationen.
                </p>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center" data-testid="stat-exercises">
                  <p className="text-2xl font-bold text-brand-navy">{exercises.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Übungen</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center" data-testid="stat-sheets">
                  <p className="text-2xl font-bold text-purple-700">{observationSheets.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Beobachtungsbögen</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center" data-testid="stat-candidates">
                  <p className="text-2xl font-bold text-emerald-700">{candidates.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Teilnehmer</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center" data-testid="stat-documents">
                  <p className="text-2xl font-bold text-blue-700">{documents.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Dokumente</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-brand-navy mb-4">Assessment-Details</h2>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        data-testid="input-edit-name"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Standort</label>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        data-testid="input-edit-location"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Kunde</label>
                      <input
                        type="text"
                        value={editClientName}
                        onChange={(e) => setEditClientName(e.target.value)}
                        placeholder="z.B. REWE Group (optional)"
                        data-testid="input-edit-client-name"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      data-testid="input-edit-description"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Startdatum</label>
                      <input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        data-testid="input-edit-start-date"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Enddatum</label>
                      <input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        data-testid="input-edit-end-date"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        data-testid="select-edit-status"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                      >
                        <option value="draft">Entwurf</option>
                        <option value="active">Aktiv</option>
                        <option value="completed">Abgeschlossen</option>
                        <option value="archived">Archiviert</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveAssessment}
                      disabled={saving || !editName.trim()}
                      data-testid="button-save-assessment"
                      className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
                    >
                      {saving ? "Wird gespeichert…" : "Speichern"}
                    </button>
                    {saveMsg && <span className="text-sm text-slate-500" data-testid="text-save-msg">{saveMsg}</span>}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === "requirements" && (
            <>
              <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-brand-navy mb-2" data-testid="heading-requirements">Anforderungsanalyse</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {linkedAnalysis ? "Ergebnisse der durchgeführten Anforderungsanalyse." : "Definieren Sie Kompetenzen und Anforderungen für dieses Assessment."}
                    </p>
                  </div>
                  <Link
                    href={`/w/${workspaceSlug}/admin/requirements?assessmentId=${assessment?.id || ""}${assessment?.sourceAnalysisId ? `&analysisId=${assessment.sourceAnalysisId}` : ""}`}
                    className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-brand-blue text-brand-blue text-xs font-medium px-3 py-1.5 hover:bg-brand-blue hover:text-white transition-colors"
                    data-testid="link-requirements-analysis"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                    {linkedAnalysis ? "Analyse bearbeiten" : "Analyse öffnen"}
                  </Link>
                </div>
              </div>

              {linkedAnalysisLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
                </div>
              )}

              {!linkedAnalysisLoading && !linkedAnalysis && (
                <Link
                  href={`/w/${workspaceSlug}/admin/requirements?assessmentId=${assessment?.id || ""}`}
                  className="block bg-white border-2 border-dashed border-brand-blue/30 hover:border-brand-blue/60 rounded-xl p-8 transition-colors group text-center"
                  data-testid="link-start-analysis"
                >
                  <div className="w-14 h-14 rounded-xl bg-brand-blue/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-brand-navy group-hover:text-brand-blue transition-colors">Anforderungsanalyse starten</h3>
                  <p className="text-xs text-slate-500 mt-1">Erstellen Sie eine Analyse und übernehmen Sie die Ergebnisse für dieses Assessment</p>
                </Link>
              )}

              {!linkedAnalysisLoading && linkedAnalysis && linkedAnalysis.proposal && (() => {
                const p = linkedAnalysis.proposal;
                const competencies = Array.isArray(p.competencies) ? p.competencies.filter((c: any) => c && c.selected !== false) : [];
                const exercises = Array.isArray(p.exercises) ? p.exercises : [];
                const observers = Array.isArray(p.observers) ? p.observers : [];
                const timeline = Array.isArray(p.timeline) ? p.timeline : [];
                const participants = Array.isArray(p.participants) ? p.participants : [];
                const additionalObservers = Array.isArray(p.additionalObservers) ? p.additionalObservers : [];
                const candidates = Array.isArray(p.candidates) ? p.candidates : [];
                const specificQuestions = Array.isArray(p.specificQuestions) ? p.specificQuestions.filter(Boolean) : [];
                const successCriteria = Array.isArray(p.successCriteria) ? p.successCriteria.filter(Boolean) : [];
                const assessmentModules = Array.isArray(p.assessmentModules) ? p.assessmentModules.filter((m: any) => m && m.selected !== false) : [];
                const formatPerson = (person: any) => person ? [person.firstName, person.lastName].filter(Boolean).join(" ") || null : null;
                const formatPersonDetail = (person: any) => {
                  if (!person) return null;
                  const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
                  const parts = [name, person.role].filter(Boolean);
                  return parts.length > 0 ? parts : null;
                };
                return (
                  <div className="space-y-4" data-testid="section-linked-analysis-results">
                    <div className="grid md:grid-cols-3 gap-4">
                      {p.company && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4" data-testid="text-analysis-company">
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">Unternehmen</p>
                          <p className="text-sm font-semibold text-brand-navy">{p.company}</p>
                        </div>
                      )}
                      {p.targetRole && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4" data-testid="text-analysis-role">
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">Zielposition</p>
                          <p className="text-sm font-semibold text-brand-navy">{p.targetRole}</p>
                        </div>
                      )}
                      {p.assessmentDate && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4" data-testid="text-analysis-date">
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">Assessment-Datum</p>
                          <p className="text-sm font-semibold text-brand-navy">{p.assessmentDate}</p>
                        </div>
                      )}
                    </div>

                    {(p.analysisDate || p.analysisForm || p.assessmentType || p.assessmentDuration || p.startDate) && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="section-analysis-metadata">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Analyse-Details</p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {p.analysisDate && (
                            <div className="bg-slate-50 rounded-lg p-3" data-testid="text-analysis-date-meta">
                              <p className="text-[10px] font-medium text-slate-400 uppercase mb-0.5">Analysedatum</p>
                              <p className="text-sm text-brand-navy font-medium">{p.analysisDate}</p>
                            </div>
                          )}
                          {p.analysisForm && (
                            <div className="bg-slate-50 rounded-lg p-3" data-testid="text-analysis-form">
                              <p className="text-[10px] font-medium text-slate-400 uppercase mb-0.5">Analyseformat</p>
                              <p className="text-sm text-brand-navy font-medium">{p.analysisForm}</p>
                            </div>
                          )}
                          {p.assessmentType && (
                            <div className="bg-slate-50 rounded-lg p-3" data-testid="text-assessment-type">
                              <p className="text-[10px] font-medium text-slate-400 uppercase mb-0.5">Assessment-Typ</p>
                              <p className="text-sm text-brand-navy font-medium">{p.assessmentType}</p>
                            </div>
                          )}
                          {p.assessmentDuration && (
                            <div className="bg-slate-50 rounded-lg p-3" data-testid="text-assessment-duration">
                              <p className="text-[10px] font-medium text-slate-400 uppercase mb-0.5">Dauer</p>
                              <p className="text-sm text-brand-navy font-medium">{p.assessmentDuration}</p>
                            </div>
                          )}
                          {p.startDate && (
                            <div className="bg-slate-50 rounded-lg p-3" data-testid="text-start-date">
                              <p className="text-[10px] font-medium text-slate-400 uppercase mb-0.5">Startdatum</p>
                              <p className="text-sm text-brand-navy font-medium">{p.startDate}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {participants.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="section-analysis-participants">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Teilnehmer der Analyse ({participants.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {participants.map((part: any, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5" data-testid={`text-participant-${i}`}>
                              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                              {typeof part === "string" ? part : (part.name || JSON.stringify(part))}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(p.leadConsultant || p.secondConsultant || additionalObservers.length > 0) && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="section-analysis-consultants">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Berater & Beobachter</p>
                        <div className="space-y-2">
                          {p.leadConsultant && formatPerson(p.leadConsultant) && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100" data-testid="card-lead-consultant">
                              <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-brand-navy">{formatPerson(p.leadConsultant)}</p>
                                <p className="text-xs text-slate-500">{p.leadConsultant.role || "Lead-Berater"}</p>
                              </div>
                              <span className="text-[10px] font-medium text-brand-blue bg-brand-blue/10 rounded-full px-2 py-0.5">Lead</span>
                            </div>
                          )}
                          {p.secondConsultant && formatPerson(p.secondConsultant) && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100" data-testid="card-second-consultant">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-brand-navy">{formatPerson(p.secondConsultant)}</p>
                                <p className="text-xs text-slate-500">{p.secondConsultant.role || "Zweitberater"}</p>
                              </div>
                            </div>
                          )}
                          {additionalObservers.map((obs: any, i: number) => {
                            const detail = formatPersonDetail(obs);
                            if (!detail) return null;
                            return (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100" data-testid={`card-observer-${i}`}>
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-700">{formatPerson(obs) || obs.role || "Beobachter"}</p>
                                  {obs.role && formatPerson(obs) && <p className="text-xs text-slate-500">{obs.role}</p>}
                                </div>
                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">Beobachter</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {candidates.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="section-analysis-candidates">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Kandidaten ({candidates.length})</p>
                        <div className="space-y-2">
                          {candidates.map((cand: any, i: number) => {
                            const name = [cand.firstName, cand.lastName].filter(Boolean).join(" ");
                            return (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100" data-testid={`card-candidate-${i}`}>
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-emerald-600">{(cand.firstName?.[0] || "").toUpperCase()}{(cand.lastName?.[0] || "").toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-brand-navy">{name || "Kandidat"}</p>
                                  {(cand.currentRole || cand.currentCompany) && (
                                    <p className="text-xs text-slate-500">{[cand.currentRole, cand.currentCompany].filter(Boolean).join(" · ")}</p>
                                  )}
                                </div>
                                {cand.email && <span className="text-xs text-slate-400">{cand.email}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {p.context && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="text-analysis-context">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Kontext & Ausgangslage</p>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{p.context}</p>
                      </div>
                    )}

                    {competencies.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="section-analysis-competencies">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Kompetenzen ({competencies.length})</p>
                        <div className="space-y-2.5">
                          {competencies.map((c: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                              <div className="w-7 h-7 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-brand-blue">{i + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-brand-navy">{c.name}</p>
                                {c.description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{c.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {successCriteria.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="section-analysis-success-criteria">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Erfolgskriterien ({successCriteria.length})</p>
                        <div className="space-y-1.5">
                          {successCriteria.map((criterion: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100" data-testid={`text-criterion-${i}`}>
                              <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span className="text-sm text-slate-700">{criterion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {specificQuestions.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="section-analysis-questions">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Spezifische Fragestellungen ({specificQuestions.length})</p>
                        <div className="space-y-1.5">
                          {specificQuestions.map((q: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100" data-testid={`text-question-${i}`}>
                              <svg className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                              <span className="text-sm text-slate-700">{q}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {assessmentModules.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="section-analysis-modules">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Assessment-Module ({assessmentModules.length})</p>
                        <div className="space-y-2">
                          {assessmentModules.map((mod: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100" data-testid={`card-module-${i}`}>
                              <div className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                                  <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-brand-navy">{mod.name}</p>
                                  {mod.type && <span className="inline-block text-[10px] font-medium text-purple-600 bg-purple-50 rounded px-1.5 py-0.5 mt-1">{mod.type}</span>}
                                  {mod.description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mod.description}</p>}
                                  {mod.adaptationNotes && (
                                    <p className="text-xs text-amber-600 mt-1"><span className="font-medium">Anpassung:</span> {mod.adaptationNotes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {exercises.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="section-analysis-exercises">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Empfohlene Übungen ({exercises.length})</p>
                        <div className="space-y-2">
                          {exercises.map((ex: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                              <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800">{ex.name || ex.title || ex}</p>
                                {ex.type && <span className="inline-block text-[10px] font-medium text-brand-blue bg-brand-blue/10 rounded px-1.5 py-0.5 mt-1">{ex.type}</span>}
                                {ex.description && <p className="text-xs text-slate-500 mt-1">{ex.description}</p>}
                              </div>
                              {ex.duration && <span className="text-xs text-slate-400 shrink-0">{ex.duration} Min.</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {observers.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="section-analysis-observers">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Beobachter-Empfehlungen</p>
                        <div className="space-y-1.5">
                          {observers.map((obs: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-slate-700 p-2 rounded-lg bg-slate-50">
                              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                              <span>{typeof obs === "string" ? obs : (obs.role || obs.name || JSON.stringify(obs))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {timeline.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="section-analysis-timeline">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Zeitplan-Empfehlung</p>
                        <div className="space-y-2">
                          {timeline.map((t: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-slate-50">
                              <span className="w-16 shrink-0 text-xs font-medium text-brand-navy">{t.time || t.start || ""}</span>
                              <span className="text-slate-700">{t.activity || t.label || t.description || (typeof t === "string" ? t : "")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {p.summary && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5" data-testid="text-analysis-summary">
                        <p className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-2">Zusammenfassung & Empfehlung</p>
                        <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">{p.summary}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                      <span>KI-generierte Analyse — &laquo;{linkedAnalysis.title}&raquo; · {new Date(linkedAnalysis.createdAt).toLocaleDateString("de-DE")}</span>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {activeSection === "target_position" && (
            <>
              <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-brand-navy mb-2" data-testid="heading-target-position">Zielposition</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Definieren Sie die Zielposition für dieses Assessment. Dies hilft bei der Zuordnung passender Übungen und Kompetenzen.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-brand-navy mb-4">Zielposition definieren</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Position / Rolle</label>
                    <input
                      type="text"
                      value={editTargetPosition}
                      onChange={(e) => setEditTargetPosition(e.target.value)}
                      placeholder="z.B. CEO, CFO, Bereichsleitung, Head of Sales"
                      data-testid="input-target-position"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">
                      Geben Sie die Zielposition ein, für die das Assessment durchgeführt wird. Diese Information wird für die KI-gestützte Übungsgenerierung und Kompetenzempfehlungen verwendet.
                    </p>
                  </div>
                  {analysisTargetRole && analysisTargetRole !== editTargetPosition && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-amber-800">
                          Aus Anforderungsanalyse: <span className="font-semibold">{analysisTargetRole}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditTargetPosition(analysisTargetRole)}
                        data-testid="button-adopt-target-from-analysis"
                        className="rounded-lg border border-amber-300 bg-white text-amber-800 text-xs font-medium px-3 py-1.5 hover:bg-amber-100 transition-colors flex-shrink-0"
                      >
                        Übernehmen
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveAssessment}
                      disabled={saving}
                      data-testid="button-save-target-position"
                      className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
                    >
                      {saving ? "Wird gespeichert…" : "Speichern"}
                    </button>
                    {saveMsg && <span className="text-sm text-slate-500" data-testid="text-save-msg-target">{saveMsg}</span>}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === "exercises" && (
            <>
              {linkedAnalysis?.proposal && (() => {
                const recExercises = Array.isArray(linkedAnalysis.proposal.exercises) ? linkedAnalysis.proposal.exercises : [];
                const recModules = Array.isArray(linkedAnalysis.proposal.assessmentModules)
                  ? linkedAnalysis.proposal.assessmentModules.filter((m: any) => m && m.selected !== false)
                  : [];
                const allRecs = [
                  ...recExercises.map((ex: any) => ({
                    name: ex.name || ex.title || (typeof ex === "string" ? ex : ""),
                    type: ex.type || "",
                    duration: ex.duration || null,
                    description: ex.description || "",
                    source: "exercise" as const,
                  })),
                  ...recModules.map((mod: any) => ({
                    name: mod.name || "",
                    type: mod.type || "",
                    duration: null,
                    description: mod.description || "",
                    adaptationNotes: mod.adaptationNotes || "",
                    generationPrompt: mod.generationPrompt || "",
                    source: "module" as const,
                  })),
                ].filter(r => r.name);
                const adoptedNames = exercises.map(e => e.name.toLowerCase());
                const unadopted = allRecs.filter(r => !adoptedNames.includes(r.name.toLowerCase()));
                if (unadopted.length === 0) return null;
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4" data-testid="section-exercise-recommendations">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                      <h3 className="text-sm font-semibold text-amber-800">Empfehlungen aus der Anforderungsanalyse ({unadopted.length})</h3>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-amber-700">Die KI hat folgende Übungen vorgeschlagen. Klicken Sie auf &quot;Übernehmen&quot;, um eine Übung in dieses Assessment aufzunehmen.</p>
                      <button
                        onClick={async () => {
                          for (const rec of unadopted) {
                            const mappedType = TYPE_MAP_DE_TO_KEY[rec.type] || rec.type?.toLowerCase().replace(/[\s-]+/g, "_") || "presentation";
                            await fetch(`${apiBase}/exercises`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name: rec.name, type: mappedType, instructions: rec.description || null, duration: rec.duration ? parseInt(String(rec.duration)) : null, sortOrder: exercises.length }),
                            });
                          }
                          fetchExercises();
                        }}
                        className="shrink-0 ml-3 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg px-3 py-1.5 transition-colors"
                        data-testid="button-adopt-all-recommendations"
                      >
                        Alle übernehmen
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {unadopted.map((rec, i) => (
                        <div key={i} className="bg-white border border-amber-200 rounded-lg p-4 flex flex-col" data-testid={`card-recommendation-${i}`}>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-navy mb-1">{rec.name}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {rec.type && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">{rec.type}</span>
                              )}
                              {rec.duration && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{rec.duration} Min.</span>
                              )}
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                                {rec.source === "module" ? "Modul" : "Übung"}
                              </span>
                            </div>
                            {rec.description && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{rec.description}</p>}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <button
                              onClick={async () => {
                                try {
                                  const mappedType = TYPE_MAP_DE_TO_KEY[rec.type] || rec.type?.toLowerCase().replace(/[\s-]+/g, "_") || "presentation";
                                  await fetch(`${apiBase}/exercises`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      name: rec.name,
                                      type: mappedType,
                                      instructions: rec.description || null,
                                      duration: rec.duration ? parseInt(String(rec.duration)) : null,
                                      sortOrder: exercises.length + i,
                                    }),
                                  });
                                  fetchExercises();
                                } catch {}
                              }}
                              className="flex-1 min-w-0 text-[11px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg px-2 py-1.5 transition-colors"
                              data-testid={`button-adopt-recommendation-${i}`}
                            >
                              Direkt übernehmen
                            </button>
                            <button
                              onClick={() => {
                                const spec = {
                                  name: rec.name,
                                  type: rec.type,
                                  description: rec.description || "",
                                  adaptationNotes: (rec as any).adaptationNotes || "",
                                  generationPrompt: (rec as any).generationPrompt || "",
                                };
                                setSpecForLibrarySearch(spec);
                                if (!showLibrary) {
                                  fetchLibraryItems();
                                  setShowLibrary(true);
                                }
                              }}
                              className="flex-1 min-w-0 text-[11px] font-semibold text-brand-blue bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-2 py-1.5 transition-colors"
                              data-testid={`button-library-search-recommendation-${i}`}
                            >
                              Bibliothek durchsuchen
                            </button>
                            <button
                              onClick={() => {
                                const mappedType = TYPE_MAP_DE_TO_KEY[rec.type] || rec.type?.toLowerCase().replace(/[\s-]+/g, "_") || "presentation";
                                setExName(rec.name);
                                setExType(mappedType);
                                setExInstructions(rec.description || "");
                                setActiveModuleSpec({
                                  name: rec.name,
                                  type: rec.type,
                                  description: rec.description || "",
                                  adaptationNotes: (rec as any).adaptationNotes || "",
                                  generationPrompt: (rec as any).generationPrompt || "",
                                });
                                setShowCreateExercise(true);
                              }}
                              className="flex-1 min-w-0 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-2 py-1.5 transition-colors"
                              data-testid={`button-create-from-recommendation-${i}`}
                            >
                              Neu erstellen / KI
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-wrap gap-3 mb-2">
                <Link
                  href={`/w/${workspaceSlug}/admin/exercise-library`}
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue hover:text-white transition-colors"
                  data-testid="link-exercise-library"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
                  </svg>
                  Übungsbibliothek
                </Link>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-brand-navy" data-testid="heading-exercises">Übungen</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleToggleLibrary}
                      data-testid="button-import-library"
                      className="rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue hover:text-white transition-colors"
                    >
                      {showLibrary ? "Bibliothek schließen" : "Aus Bibliothek importieren"}
                    </button>
                    <button
                      onClick={() => setShowCreateExercise(!showCreateExercise)}
                      data-testid="button-create-exercise"
                      className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark transition-colors"
                    >
                      {showCreateExercise ? "Abbrechen" : "Neue Übung"}
                    </button>
                  </div>
                </div>

                {showLibrary && (
                  <div className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50">
                    {specForLibrarySearch && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3" data-testid="banner-spec-library-search">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-purple-700">Suche für Modulspezifikation: {specForLibrarySearch.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-700 font-medium">
                              Typ: {EXERCISE_TYPE_LABELS[TYPE_MAP_DE_TO_KEY[specForLibrarySearch.type] || specForLibrarySearch.type] || specForLibrarySearch.type}
                            </span>
                            <button type="button" onClick={() => setSpecForLibrarySearch(null)} className="text-xs text-slate-400 hover:text-slate-600" data-testid="button-clear-spec-search">×</button>
                          </div>
                        </div>
                        {specForLibrarySearch.description && <p className="text-xs text-purple-600 mb-1">{specForLibrarySearch.description}</p>}
                        {specForLibrarySearch.adaptationNotes && (
                          <p className="text-[10px] text-purple-500"><span className="font-semibold uppercase">Anpassungshinweise:</span> {specForLibrarySearch.adaptationNotes}</p>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-brand-navy">Übungsbibliothek</h3>
                      <button
                        onClick={handleSeedVarexia}
                        disabled={seedingVarexia || varexiaSeeded}
                        data-testid="button-seed-varexia"
                        className="text-xs font-medium px-3 py-1.5 rounded-full border border-purple-400 text-purple-600 hover:bg-purple-500 hover:text-white disabled:opacity-50 transition-colors"
                      >
                        {varexiaSeeded ? "✓ Varexia SE geladen" : seedingVarexia ? "Wird geladen…" : "Varexia SE laden"}
                      </button>
                    </div>
                    {libraryLoading ? (
                      <p className="text-sm text-slate-400">Laden…</p>
                    ) : libraryItems.length === 0 ? (
                      <p className="text-sm text-slate-400">Keine Einträge in der Bibliothek. Laden Sie die Varexia-Fallstudie oder erstellen Sie Übungen in der Bibliothek.</p>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(() => {
                          let filtered = libraryItems;
                          if (specForLibrarySearch?.type) {
                            const specKey = TYPE_MAP_DE_TO_KEY[specForLibrarySearch.type] || specForLibrarySearch.type?.toLowerCase().replace(/[\s-]+/g, "_") || "";
                            filtered = libraryItems.filter(item => {
                              const itemKey = TYPE_MAP_DE_TO_KEY[item.exerciseType] || item.exerciseType?.toLowerCase().replace(/[\s-]+/g, "_") || "";
                              return itemKey === specKey;
                            });
                          }
                          if (filtered.length === 0 && specForLibrarySearch?.type) {
                            return (
                              <div className="col-span-full text-center py-6">
                                <p className="text-sm text-slate-500 mb-2">Keine Übungen vom Typ „{EXERCISE_TYPE_LABELS[TYPE_MAP_DE_TO_KEY[specForLibrarySearch.type] || specForLibrarySearch.type] || specForLibrarySearch.type}" in der Bibliothek gefunden.</p>
                                <button
                                  type="button"
                                  onClick={() => setSpecForLibrarySearch(null)}
                                  className="text-xs font-medium text-brand-blue hover:underline"
                                  data-testid="button-show-all-library"
                                >
                                  Alle Übungen anzeigen
                                </button>
                              </div>
                            );
                          }
                          return filtered.map((item) => (
                          <div key={item.id} className="border border-slate-200 rounded-lg p-3 bg-white" data-testid={`library-item-${item.id}`}>
                            <p className="font-medium text-sm text-slate-900 mb-1">{item.title}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                                {EXERCISE_TYPE_LABELS[item.exerciseType] || item.exerciseType}
                              </span>
                              {item.targetLevels?.map((level) => (
                                <span key={level} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                                  {level}
                                </span>
                              ))}
                              {item.tags?.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                  {tag}
                                </span>
                              ))}
                              {(item.tags?.length || 0) > 3 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                                  +{item.tags.length - 3}
                                </span>
                              )}
                            </div>
                            {(item.clientName || item.projectName) && (
                              <p className="text-xs text-slate-400 mb-1">
                                {item.clientName && <><span className="font-medium">Kunde:</span> {item.clientName}</>}
                                {item.clientName && item.projectName && " · "}
                                {item.projectName && <><span className="font-medium">Projekt:</span> {item.projectName}</>}
                              </p>
                            )}
                            {item.metadataJson?.description && (
                              <p className="text-xs text-slate-500 mb-2 line-clamp-2">{typeof item.metadataJson.description === "string" ? item.metadataJson.description : ""}</p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleImportFromLibrary(item)}
                                data-testid={`button-import-${item.id}`}
                                className="text-xs font-medium text-brand-blue hover:text-brand-blue-dark"
                              >
                                Importieren
                              </button>
                              <button
                                onClick={() => handleAIVariantImport(item)}
                                data-testid={`button-ai-variant-${item.id}`}
                                className="text-xs font-medium text-purple-600 hover:text-purple-800"
                              >
                                KI-Anpassung
                              </button>
                              <button
                                onClick={() => {
                                  setBasisExercise(item);
                                  setShowBasisPicker(false);
                                  setShowLibrary(false);
                                  setShowCreateExercise(true);
                                  setExName(item.title + " (angepasst)");
                                  setExType(item.exerciseType);
                                  setExInstructions(item.metadataJson?.instructions || item.metadataJson?.description || "");
                                }}
                                data-testid={`button-basis-${item.id}`}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-800"
                              >
                                Als Basis
                              </button>
                            </div>
                          </div>
                        ));})()}
                      </div>
                    )}
                  </div>
                )}

                {showCreateExercise && (
                  <div className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50">
                    <form onSubmit={handleCreateExercise} className="space-y-3" data-testid="form-create-exercise">
                      {activeModuleSpec && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2" data-testid="banner-active-module-spec">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-purple-700">Kontext aus Anforderungsanalyse</span>
                            <button type="button" onClick={() => setActiveModuleSpec(null)} className="text-xs text-slate-400 hover:text-slate-600" data-testid="button-clear-module-spec">×</button>
                          </div>
                          {activeModuleSpec.adaptationNotes && (
                            <div className="mb-2">
                              <p className="text-[10px] font-semibold text-purple-500 uppercase">Anpassungshinweise</p>
                              <p className="text-xs text-purple-700">{activeModuleSpec.adaptationNotes}</p>
                            </div>
                          )}
                          {activeModuleSpec.generationPrompt && (
                            <div>
                              <p className="text-[10px] font-semibold text-purple-500 uppercase">Prompt / Erstellungsanweisung</p>
                              <pre className="text-xs text-purple-700 whitespace-pre-wrap font-mono">{activeModuleSpec.generationPrompt}</pre>
                            </div>
                          )}
                        </div>
                      )}
                      {basisExercise && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-emerald-700">Basierend auf:</span>
                            <button
                              type="button"
                              onClick={() => { setBasisExercise(null); setBasisChanges(""); }}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Basis entfernen
                            </button>
                          </div>
                          <p className="text-sm font-medium text-emerald-900">{basisExercise.title}</p>
                          <p className="text-xs text-emerald-600">{EXERCISE_TYPE_LABELS[basisExercise.exerciseType] || basisExercise.exerciseType}</p>
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-emerald-700 mb-1">Gewünschte Änderungen / Kontext-Verknüpfung</label>
                            <textarea
                              value={basisChanges}
                              onChange={(e) => setBasisChanges(e.target.value)}
                              rows={2}
                              placeholder="z.B. Mitarbeitergespräch im Kontext der Fallstudie Varexia SE einbetten…"
                              data-testid="input-basis-changes"
                              className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
                            />
                          </div>
                        </div>
                      )}
                      {!basisExercise && (
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (!showLibrary) fetchLibraryItems();
                              setShowBasisPicker(!showBasisPicker);
                            }}
                            data-testid="button-select-basis"
                            className="text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-400 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            Bestehende Übung als Basis verwenden
                          </button>
                        </div>
                      )}
                      {showBasisPicker && !basisExercise && (
                        <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50/50 max-h-48 overflow-y-auto">
                          {libraryLoading ? (
                            <p className="text-xs text-slate-400">Laden…</p>
                          ) : libraryItems.length === 0 ? (
                            <p className="text-xs text-slate-400">Keine Übungen in der Bibliothek.</p>
                          ) : (
                            <div className="space-y-1">
                              {libraryItems.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setBasisExercise(item);
                                    setShowBasisPicker(false);
                                    setExName(item.title + " (angepasst)");
                                    setExType(item.exerciseType);
                                    setExInstructions(item.metadataJson?.instructions || item.metadataJson?.description || "");
                                  }}
                                  className="w-full text-left px-3 py-2 rounded hover:bg-emerald-100 transition-colors"
                                  data-testid={`button-pick-basis-${item.id}`}
                                >
                                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                                  <p className="text-xs text-slate-500">
                                    {EXERCISE_TYPE_LABELS[item.exerciseType] || item.exerciseType}
                                    {item.clientName && <span className="text-slate-400"> · {item.clientName}</span>}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                          <input
                            type="text"
                            value={exName}
                            onChange={(e) => setExName(e.target.value)}
                            required
                            data-testid="input-exercise-name"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
                          <select
                            value={exType}
                            onChange={(e) => setExType(e.target.value)}
                            data-testid="select-exercise-type"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                          >
                            {EXERCISE_TYPES.map((t) => (
                              <option key={t} value={t}>{EXERCISE_TYPE_LABELS[t]}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Anweisungen</label>
                        <textarea
                          value={exInstructions}
                          onChange={(e) => setExInstructions(e.target.value)}
                          rows={2}
                          data-testid="input-exercise-instructions"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Dauer (Minuten)</label>
                          <input
                            type="number"
                            value={exDuration}
                            onChange={(e) => setExDuration(e.target.value)}
                            min="0"
                            data-testid="input-exercise-duration"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Reihenfolge</label>
                          <input
                            type="number"
                            value={exSortOrder}
                            onChange={(e) => setExSortOrder(e.target.value)}
                            min="0"
                            data-testid="input-exercise-sort-order"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                          />
                        </div>
                      </div>
                      {exError && <p className="text-sm text-red-500" data-testid="text-exercise-error">{exError}</p>}
                      {aiError && <p className="text-sm text-red-500" data-testid="text-ai-error">{aiError}</p>}

                      {aiGenerating && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4" data-testid="ai-progress">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-700">KI-Generierung</span>
                            <span className="text-sm font-bold text-purple-700">{aiProgress}%</span>
                          </div>
                          <div className="w-full bg-purple-200 rounded-full h-2.5 mb-2">
                            <div
                              className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${aiProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-purple-600">{aiProgressLabel}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={exCreating || aiGenerating || !exName.trim()}
                          data-testid="button-submit-exercise"
                          className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
                        >
                          {exCreating ? "Wird erstellt…" : "Übung erstellen"}
                        </button>
                        <button
                          type="button"
                          onClick={handleAIGenerateExercise}
                          disabled={aiGenerating || exCreating || !exName.trim()}
                          data-testid="button-ai-generate-exercise"
                          className="rounded-lg bg-purple-600 text-white text-sm font-medium px-6 py-2 hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                          {aiGenerating ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                              Generiert…
                            </>
                          ) : "KI-Generierung"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-4" data-testid="table-exercises">
                  {exercises.map((ex) => (
                    <div key={ex.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid={`row-exercise-${ex.id}`}>
                      <div className="px-5 py-3 flex items-center gap-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{ex.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span>{EXERCISE_TYPE_LABELS[ex.type] || ex.type}</span>
                            {ex.duration && <span>· {ex.duration} Min.</span>}
                            <span>· Reihenfolge: {ex.sortOrder}</span>
                            <span>· {ex.documents.length} Dok.</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (editingExId === ex.id) {
                                setEditingExId(null);
                              } else {
                                setEditingExId(ex.id);
                                setEditExName(ex.name);
                                setEditExType(ex.type);
                                setEditExInstructions(ex.instructions ?? "");
                                setEditExDuration(ex.duration?.toString() ?? "");
                                setEditExSortOrder(ex.sortOrder.toString());
                              }
                            }}
                            data-testid={`button-edit-exercise-${ex.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:text-brand-navy transition-colors px-2 py-1 rounded hover:bg-brand-blue/5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => {
                              setExerciseDocUpload(exerciseDocUpload === ex.id ? null : ex.id);
                              setExerciseDocName("");
                              setExerciseDocFile(null);
                              setExerciseDocError("");
                            }}
                            data-testid={`button-upload-doc-${ex.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors px-2 py-1 rounded hover:bg-emerald-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            Dokument
                          </button>
                          <button
                            onClick={() => handleDeleteExercise(ex.id)}
                            data-testid={`button-delete-exercise-${ex.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Löschen
                          </button>
                        </div>
                      </div>

                      <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dokumente ({ex.documents.length})</p>
                          <button
                            onClick={() => {
                              setExerciseDocUpload(exerciseDocUpload === ex.id ? null : ex.id);
                              setExerciseDocName("");
                              setExerciseDocFile(null);
                              setExerciseDocError("");
                            }}
                            data-testid={`button-add-doc-inline-${ex.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors px-2 py-1 rounded hover:bg-emerald-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Dokument hinzufuegen
                          </button>
                        </div>
                        {ex.documents.length > 0 ? (
                          <div className="space-y-1.5">
                            {ex.documents.map(doc => {
                              const isPdf = doc.mimeType === "application/pdf" || doc.fileName?.toLowerCase().endsWith(".pdf");
                              return (
                                <div key={doc.id} className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-slate-100 hover:border-slate-200 transition-colors" data-testid={`exercise-doc-${doc.id}`}>
                                  <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${isPdf ? "bg-red-50" : "bg-slate-100"}`}>
                                    {isPdf ? (
                                      <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v7h6v9H6z"/></svg>
                                    ) : (
                                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-700 truncate">{doc.name || doc.fileName}</p>
                                    <p className="text-xs text-slate-400">{doc.fileName} · {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : ""}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {isPdf && (
                                      <button
                                        onClick={() => handleViewDocument(doc.id, doc.fileName || doc.name)}
                                        data-testid={`button-view-doc-${doc.id}`}
                                        className="text-xs text-brand-blue hover:text-brand-navy font-medium px-2 py-1 rounded hover:bg-brand-blue/5 transition-colors"
                                      >
                                        Anzeigen
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDownloadDocument(doc.id)}
                                      data-testid={`button-download-doc-${doc.id}`}
                                      className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                                    >
                                      Download
                                    </button>
                                    <button
                                      onClick={() => handleDeleteExerciseDoc(doc.id)}
                                      data-testid={`button-delete-doc-${doc.id}`}
                                      className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                    >
                                      Entfernen
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-4 border border-dashed border-slate-200 rounded-lg bg-white/50">
                            <button
                              onClick={() => {
                                setExerciseDocUpload(ex.id);
                                setExerciseDocName("");
                                setExerciseDocFile(null);
                                setExerciseDocError("");
                              }}
                              data-testid={`button-upload-empty-${ex.id}`}
                              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                              </svg>
                              Klicken Sie hier, um ein Dokument hochzuladen
                            </button>
                          </div>
                        )}
                      </div>

                      {exerciseDocUpload === ex.id && (
                        <div className="px-5 py-3 bg-emerald-50/50 border-t border-emerald-100">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                              <input
                                value={exerciseDocName}
                                onChange={e => setExerciseDocName(e.target.value)}
                                placeholder="Optional – Dateiname wird verwendet"
                                data-testid={`input-exercise-doc-name-${ex.id}`}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Datei *</label>
                              <input
                                type="file"
                                onChange={e => setExerciseDocFile(e.target.files?.[0] || null)}
                                data-testid={`input-exercise-doc-file-${ex.id}`}
                                className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
                              />
                            </div>
                          </div>
                          {exerciseDocError && <p className="text-sm text-red-500 mb-2">{exerciseDocError}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUploadExerciseDoc(ex.id)}
                              disabled={!exerciseDocFile || exerciseDocUploading}
                              data-testid={`button-submit-exercise-doc-${ex.id}`}
                              className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              {exerciseDocUploading ? "Wird hochgeladen…" : "Hochladen"}
                            </button>
                            <button
                              onClick={() => { setExerciseDocUpload(null); setExerciseDocName(""); setExerciseDocFile(null); setExerciseDocError(""); }}
                              className="text-sm text-slate-500 hover:text-slate-700"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      )}

                      {editingExId === ex.id && (
                        <div className="bg-slate-50 border-t border-blue-100 px-6 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
                              <input
                                type="text"
                                value={editExName}
                                onChange={(e) => setEditExName(e.target.value)}
                                data-testid="input-edit-exercise-name"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Typ</label>
                              <select
                                value={editExType}
                                onChange={(e) => setEditExType(e.target.value)}
                                data-testid="select-edit-exercise-type"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                              >
                                {EXERCISE_TYPES.map((t) => (
                                  <option key={t} value={t}>{EXERCISE_TYPE_LABELS[t]}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Dauer (Min.)</label>
                              <input
                                type="number"
                                value={editExDuration}
                                onChange={(e) => setEditExDuration(e.target.value)}
                                data-testid="input-edit-exercise-duration"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Reihenfolge</label>
                              <input
                                type="number"
                                value={editExSortOrder}
                                onChange={(e) => setEditExSortOrder(e.target.value)}
                                data-testid="input-edit-exercise-sort-order"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                              />
                            </div>
                          </div>
                          <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Anweisungen</label>
                            <textarea
                              value={editExInstructions}
                              onChange={(e) => setEditExInstructions(e.target.value)}
                              rows={3}
                              data-testid="textarea-edit-exercise-instructions"
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateExercise(ex.id)}
                              data-testid="button-save-exercise"
                              className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark transition-colors"
                            >
                              Speichern
                            </button>
                            <button
                              onClick={() => setEditingExId(null)}
                              data-testid={`button-close-exercise-${ex.id}`}
                              className="text-sm text-slate-500 hover:text-slate-700"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeSection === "observation_sheets" && (
            <div id="observation-sheets" className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-brand-navy" data-testid="heading-observation-sheets">Beobachtungsbögen</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateAISheet}
                    data-testid="button-create-ai-sheet"
                    className="rounded-lg border border-purple-500 text-purple-600 text-sm font-medium px-4 py-2 hover:bg-purple-500 hover:text-white transition-colors"
                  >
                    KI-Bogen generieren
                  </button>
                  <button
                    onClick={() => setShowCreateSheet(!showCreateSheet)}
                    data-testid="button-create-sheet"
                    className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark transition-colors"
                  >
                    {showCreateSheet ? "Abbrechen" : "Neuen Bogen erstellen"}
                  </button>
                </div>
              </div>

              {showAiSheetDialog && (
                <div className="border border-purple-200 bg-purple-50/50 rounded-xl p-5 mb-4" data-testid="section-ai-sheet-dialog">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <h3 className="text-sm font-bold text-purple-800">KI-Beobachtungsbogen generieren</h3>
                  </div>
                  <p className="text-xs text-purple-600 mb-4">Die KI erstellt einen professionellen Beobachtungsbogen auf Basis Ihrer Anforderungen, MTMM-Zuordnungen und Kompetenzen.</p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Übung</label>
                      <select
                        value={aiSheetExerciseId}
                        onChange={(e) => setAiSheetExerciseId(e.target.value)}
                        data-testid="select-ai-sheet-exercise"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                      >
                        <option value="">Allgemein (alle Kompetenzen)</option>
                        {exercises.map((ex) => {
                          const mappingCount = getMtmmForExercise(ex.id).length;
                          return (
                            <option key={ex.id} value={ex.id}>
                              {ex.name} ({ex.type}){mappingCount > 0 ? ` — ${mappingCount} Kompetenzen zugeordnet` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {aiSheetExerciseId && getMtmmForExercise(aiSheetExerciseId).length > 0 && (
                      <div className="bg-white border border-purple-200 rounded-lg p-3" data-testid="ai-sheet-mtmm-preview">
                        <p className="text-xs font-medium text-purple-700 mb-2">MTMM-Kompetenzen (werden automatisch einbezogen):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {getMtmmForExercise(aiSheetExerciseId).map(m => (
                            <span key={m.competencyNodeId} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              m.weight >= 1.5 ? "bg-emerald-100 text-emerald-700" :
                              m.weight >= 1.0 ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>
                              {m.competencyNode.name} ({m.weight.toFixed(1)})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Bogentyp</label>
                      <select
                        value={aiSheetType}
                        onChange={(e) => setAiSheetType(e.target.value)}
                        data-testid="select-ai-sheet-type"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                      >
                        <option value="verhaltensanker-bogen">Verhaltensanker-Bogen</option>
                        <option value="kompetenzmatrix">Kompetenzmatrix</option>
                        <option value="freitext-bogen">Freitext-Bogen</option>
                        <option value="kombinierter-bogen">Kombinierter Bogen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Zusätzliche Hinweise (optional)</label>
                      <textarea
                        value={aiSheetInstructions}
                        onChange={(e) => setAiSheetInstructions(e.target.value)}
                        rows={2}
                        placeholder="z.B. Besonderer Fokus auf Kommunikationsverhalten, Bewertungsskala 1-4 statt 1-5..."
                        data-testid="textarea-ai-sheet-instructions"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                      />
                    </div>

                    {aiSheetError && <p className="text-sm text-red-600" data-testid="text-ai-sheet-error">{aiSheetError}</p>}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSubmitAISheet}
                        disabled={aiSheetGenerating}
                        data-testid="button-submit-ai-sheet"
                        className="rounded-lg bg-purple-600 text-white text-sm font-medium px-5 py-2 hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        {aiSheetGenerating ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            KI generiert...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                            Bogen generieren
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowAiSheetDialog(false)}
                        disabled={aiSheetGenerating}
                        className="text-xs text-slate-500 hover:text-slate-700 transition"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showCreateSheet && (
                <div className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50">
                  <form onSubmit={handleCreateObservationSheet} className="space-y-3" data-testid="form-create-sheet">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={sheetName}
                        onChange={(e) => setSheetName(e.target.value)}
                        required
                        data-testid="input-sheet-name"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                      <textarea
                        value={sheetDesc}
                        onChange={(e) => setSheetDesc(e.target.value)}
                        rows={2}
                        data-testid="input-sheet-description"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Übung (optional)</label>
                        <select
                          value={sheetExerciseId}
                          onChange={(e) => setSheetExerciseId(e.target.value)}
                          data-testid="select-sheet-exercise"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                        >
                          <option value="">Keine Übung</option>
                          {exercises.map((ex) => (
                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
                        <select
                          value={sheetType}
                          onChange={(e) => setSheetType(e.target.value)}
                          data-testid="select-sheet-type"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                        >
                          <option value="manual">Manuell</option>
                          <option value="template">Vorlage</option>
                        </select>
                      </div>
                    </div>
                    {sheetExerciseId && getMtmmForExercise(sheetExerciseId).length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" data-testid="mtmm-competency-hints">
                        <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                          MTMM-Kompetenzen für diese Übung:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {getMtmmForExercise(sheetExerciseId).map(m => (
                            <span key={m.competencyNodeId} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              m.weight >= 1.5 ? "bg-emerald-100 text-emerald-700" :
                              m.weight >= 1.0 ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>
                              {m.competencyNode.name} ({m.weight.toFixed(1)})
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-blue-500 mt-1.5">Diese Kompetenzen sollten im Beobachtungsbogen berücksichtigt werden.</p>
                      </div>
                    )}
                    {sheetError && <p className="text-sm text-red-500" data-testid="text-sheet-error">{sheetError}</p>}
                    <button
                      type="submit"
                      disabled={sheetCreating || !sheetName.trim()}
                      data-testid="button-submit-sheet"
                      className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
                    >
                      {sheetCreating ? "Wird erstellt…" : "Bogen erstellen"}
                    </button>
                  </form>
                </div>
              )}

              <div className="space-y-2">
                {observationSheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    className="border border-slate-200 rounded-lg px-4 py-3 hover:border-brand-blue/40 hover:bg-blue-50/20 transition-colors cursor-pointer"
                    data-testid={`row-sheet-${sheet.id}`}
                    onClick={() => setSelectedSheet(sheet)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-slate-900">{sheet.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            sheet.type === "ai" ? "bg-purple-50 text-purple-600" :
                            sheet.type === "template" ? "bg-blue-50 text-blue-600" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {sheet.type === "ai" ? "KI" : sheet.type === "template" ? "Vorlage" : "Manuell"}
                          </span>
                          {sheet.aiGenerated && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">KI-generiert</span>
                          )}
                        </div>
                        {sheet.exerciseId && (
                          <div className="mb-1">
                            <p className="text-xs text-brand-blue">
                              Übung: {exercises.find((ex) => ex.id === sheet.exerciseId)?.name || sheet.exerciseId}
                            </p>
                            {getMtmmForExercise(sheet.exerciseId).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {getMtmmForExercise(sheet.exerciseId).map(m => (
                                  <span key={m.competencyNodeId} className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                    m.weight >= 1.5 ? "bg-emerald-50 text-emerald-600" :
                                    m.weight >= 1.0 ? "bg-blue-50 text-blue-600" :
                                    "bg-amber-50 text-amber-600"
                                  }`}>
                                    {m.competencyNode.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {sheet.content?.competencies && Array.isArray(sheet.content.competencies) && sheet.content.competencies.length > 0 && !sheet.exerciseId && (
                          <div className="flex flex-wrap gap-1 mt-1 mb-1">
                            {sheet.content.competencies.map((c: string, ci: number) => (
                              <span key={ci} className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">{c}</span>
                            ))}
                          </div>
                        )}
                        {sheet.content?.exerciseName && (
                          <p className="text-xs text-slate-500">{sheet.content.exerciseName}</p>
                        )}
                        {sheet.description && !sheet.content?.sections && (
                          <p className="text-xs text-slate-500 line-clamp-2">{sheet.description}</p>
                        )}
                        {sheet.content?.sections && (
                          <p className="text-xs text-slate-400">{sheet.content.sections.length} Abschnitte · {sheet.content.sections.reduce((acc: number, s: any) => acc + (s.items?.length || 0), 0)} Kriterien</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadSheetPdf(sheet); }}
                          data-testid={`button-download-sheet-${sheet.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-blue-50 transition-colors"
                          title="Als PDF herunterladen"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </button>
                        <span className="text-xs text-slate-400">{formatDate(sheet.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {observationSheets.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">Keine Beobachtungsbögen vorhanden.</p>
                )}
              </div>
            </div>
          )}

          {activeSection === "mtmm" && (
            <div id="mtmm-matrix" className="space-y-4">
              {(!hasExercises || !assessment?.sourceAnalysisId) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5" data-testid="mtmm-prereq-hints">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-amber-800 mb-2">Voraussetzungen für die MTMM-Matrix</h3>
                      <p className="text-xs text-amber-700 mb-3">
                        Für eine vollständige Zuordnung benötigen Sie ein Kompetenzmodell (aus der Anforderungsanalyse) und definierte Übungen.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {assessment?.sourceAnalysisId ? (
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          ) : (
                            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                          )}
                          <span className="text-xs text-amber-800">Anforderungsanalyse / Kompetenzmodell</span>
                          {!assessment?.sourceAnalysisId && (
                            <button onClick={() => setActiveSection("requirements")} className="text-xs text-brand-blue hover:underline font-medium ml-auto" data-testid="link-prereq-requirements">
                              Zur Anforderungsanalyse →
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {hasExercises ? (
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          ) : (
                            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                          )}
                          <span className="text-xs text-amber-800">Übungen definiert ({exercises.length})</span>
                          {!hasExercises && (
                            <button onClick={() => setActiveSection("exercises")} className="text-xs text-brand-blue hover:underline font-medium ml-auto" data-testid="link-prereq-exercises">
                              Zu den Übungen →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-brand-navy" data-testid="heading-mtmm">MTMM-Matrix</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Multi-Trait-Multi-Method — Zuordnung Übungen × Kompetenzen</p>
                  {mtmmCompetencyModel && (
                    <p className="text-xs text-slate-400 mt-1">
                      Kompetenzmodell: <span className="font-medium text-slate-600">{mtmmCompetencyModel.name}</span>
                      <span className="text-slate-300 mx-1">·</span>
                      {mtmmCompetencyModel.nodes.filter(n => n.nodeType === "competency" || n.nodeType === "domain").length} Kompetenzen × {exercises.length} Übungen
                    </p>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  {mtmmMappings.length > 0 && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium" data-testid="text-mtmm-count">
                      {mtmmMappings.length} Zuordnung{mtmmMappings.length !== 1 ? "en" : ""}
                    </span>
                  )}
                  {mtmmCompetencyModel && exercises.length > 0 && (
                    <>
                      <button
                        onClick={() => {
                          if (!showInlineMtmm) initInlineMtmmGrid();
                          setShowInlineMtmm(!showInlineMtmm);
                          setMtmmAiRationale([]);
                          setMtmmAiSummary("");
                        }}
                        data-testid="button-toggle-inline-mtmm"
                        className="rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue/5 transition-colors"
                      >
                        {showInlineMtmm ? "Zuordnung schließen" : "Manuelle Zuordnung"}
                      </button>
                      <button
                        onClick={handleMtmmAiSuggest}
                        disabled={mtmmAiLoading}
                        data-testid="button-mtmm-ai-suggest"
                        className="rounded-lg bg-purple-600 text-white text-sm font-medium px-4 py-2 hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        {mtmmAiLoading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                            KI analysiert…
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                            KI-Vorschlag
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4" data-testid="mtmm-weight-legend">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">Gewichtungen erklärt</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Die Zahl in jeder Zelle gibt die <span className="font-semibold">Gewichtung</span> an, mit der eine Übung eine Kompetenz misst.
                      <span className="font-semibold"> 1.0 = Standard</span> (Normalgewichtung).
                      Werte <span className="font-semibold">&gt; 1.0</span> bedeuten, dass die Übung diese Kompetenz besonders gut erfasst.
                      Werte <span className="font-semibold">&lt; 1.0</span> stehen für eine sekundäre/ergänzende Messung.
                      Standardmäßig sind alle Gewichtungen auf 1.0 gesetzt.
                    </p>
                  </div>
                </div>
              </div>

              {showInlineMtmm && mtmmCompetencyModel && exercises.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-brand-navy">
                        {mtmmAiRationale.length > 0 ? "KI-Vorschlag — Zuordnung prüfen & anpassen" : "Manuelle Zuordnung"}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Setzen Sie Häkchen, um Kompetenzen Übungen zuzuordnen. Gewichtung 1.0 = Standard.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {mtmmSaveMsg && <span className="text-xs text-emerald-600 font-medium">{mtmmSaveMsg}</span>}
                      <button
                        onClick={handleSaveInlineMtmm}
                        disabled={mtmmSaving}
                        data-testid="button-save-inline-mtmm"
                        className="rounded-lg bg-brand-blue text-white text-xs font-medium px-4 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
                      >
                        {mtmmSaving ? "Speichert…" : "Zuordnungen speichern"}
                      </button>
                      <button
                        onClick={() => { setShowInlineMtmm(false); setMtmmAiRationale([]); setMtmmAiSummary(""); }}
                        data-testid="button-close-inline-mtmm"
                        className="rounded-lg border border-slate-200 text-slate-600 text-xs font-medium px-3 py-2 hover:bg-slate-50 transition-colors"
                      >
                        Schließen
                      </button>
                    </div>
                  </div>

                  {mtmmAiSummary && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4" data-testid="mtmm-ai-summary">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                        <p className="text-xs text-purple-700">{mtmmAiSummary}</p>
                      </div>
                    </div>
                  )}

                  {mtmmAiRationale.length > 0 && (
                    <details className="mb-4 group" data-testid="mtmm-ai-rationale-details">
                      <summary className="cursor-pointer text-xs font-semibold text-purple-700 hover:text-purple-900 select-none flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        KI-Begründungen anzeigen ({mtmmAiRationale.length} Zuordnungen)
                        <span className="text-[10px] text-purple-400 font-normal ml-2">— Originalvorschlag der KI, manuelle Änderungen nicht enthalten</span>
                      </summary>
                      <div className="mt-2 bg-purple-50/50 border border-purple-100 rounded-lg p-4 max-h-64 overflow-y-auto" data-testid="mtmm-ai-rationale-list">
                        <div className="space-y-2">
                          {mtmmAiRationale.map((r, i) => {
                            const exName = exercises.find(e => e.id === r.exerciseId)?.name || r.exerciseId;
                            const nodeName = mtmmCompetencyModel.nodes.find(n => n.id === r.nodeId)?.name || r.nodeId;
                            return (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <div className="flex-shrink-0 mt-0.5">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${
                                    r.weight >= 1.5 ? "bg-emerald-100 text-emerald-700" :
                                    r.weight >= 1.0 ? "bg-blue-100 text-blue-700" :
                                    "bg-amber-50 text-amber-600 border border-amber-200"
                                  }`}>{r.weight.toFixed(1)}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-700">{exName}</span>
                                  <span className="text-slate-400 mx-1">→</span>
                                  <span className="font-medium text-slate-600">{nodeName}</span>
                                  {r.rationale && <p className="text-slate-500 mt-0.5">{r.rationale}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </details>
                  )}
                  <div className="overflow-x-auto" data-testid="mtmm-inline-grid">
                    <table className="text-xs border-collapse w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-medium text-slate-600 bg-slate-50 sticky left-0 z-10 min-w-[150px]">Übung</th>
                          {mtmmCompetencyModel.nodes
                            .filter(n => n.nodeType === "competency" || n.nodeType === "domain")
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map(node => (
                              <th key={node.id} className="text-center py-2 px-1 font-medium text-slate-600 bg-slate-50 min-w-[80px]" title={node.description || node.name}>
                                <span className="text-[10px] leading-tight block whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">{node.name}</span>
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {exercises.map(ex => (
                          <tr key={ex.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-medium text-slate-800 sticky left-0 bg-white z-10 text-xs">{ex.name}</td>
                            {mtmmCompetencyModel.nodes
                              .filter(n => n.nodeType === "competency" || n.nodeType === "domain")
                              .sort((a, b) => a.sortOrder - b.sortOrder)
                              .map(node => {
                                const cell = mtmmInlineGrid[ex.id]?.[node.id];
                                return (
                                  <td key={node.id} className="text-center py-1 px-1">
                                    <div className="flex flex-col items-center gap-0.5">
                                      <input
                                        type="checkbox"
                                        checked={cell?.mapped || false}
                                        onChange={() => {
                                          setMtmmInlineGrid(prev => ({
                                            ...prev,
                                            [ex.id]: {
                                              ...prev[ex.id],
                                              [node.id]: { ...prev[ex.id]?.[node.id], mapped: !cell?.mapped, weight: cell?.weight ?? 1.0 },
                                            },
                                          }));
                                        }}
                                        className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/30"
                                        data-testid={`mtmm-check-${ex.id}-${node.id}`}
                                      />
                                      {cell?.mapped && (
                                        <input
                                          type="number"
                                          min="0.1"
                                          max="3.0"
                                          step="0.1"
                                          value={cell.weight}
                                          onChange={(e) => {
                                            const w = parseFloat(e.target.value) || 1.0;
                                            setMtmmInlineGrid(prev => ({
                                              ...prev,
                                              [ex.id]: {
                                                ...prev[ex.id],
                                                [node.id]: { ...prev[ex.id]?.[node.id], weight: w },
                                              },
                                            }));
                                          }}
                                          className="w-12 text-center text-[10px] rounded border border-slate-200 px-0.5 py-0.5"
                                          data-testid={`mtmm-weight-${ex.id}-${node.id}`}
                                        />
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

              {mtmmLoading ? (
                <p className="text-sm text-slate-400 text-center py-4">Laden...</p>
              ) : mtmmMappings.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg" data-testid="mtmm-empty-state">
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
                  </svg>
                  <p className="text-sm text-slate-500 mb-2">Noch keine MTMM-Zuordnung definiert</p>
                  <p className="text-xs text-slate-400 mb-4">Nutzen Sie „Manuelle Zuordnung" oder „KI-Vorschlag", um Kompetenzen den Übungen zuzuordnen.</p>
                  {mtmmCompetencyModel && exercises.length > 0 && (
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => { initInlineMtmmGrid(); setShowInlineMtmm(true); }}
                        data-testid="button-empty-manual-mtmm"
                        className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:underline font-medium"
                      >
                        Manuelle Zuordnung starten
                      </button>
                      <span className="text-slate-300">oder</span>
                      <button
                        onClick={handleMtmmAiSuggest}
                        disabled={mtmmAiLoading}
                        data-testid="button-empty-ai-mtmm"
                        className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:underline font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                        KI-Vorschlag generieren
                      </button>
                    </div>
                  )}
                </div>
              ) : (() => {
                const uniqueExercisesTable = [...new Map(mtmmMappings.map(m => [m.exercise.id, m.exercise])).values()];
                const uniqueNodes = [...new Map(mtmmMappings.map(m => [m.competencyNode.id, m.competencyNode])).values()]
                  .sort((a, b) => a.sortOrder - b.sortOrder);
                const mappingLookup = new Map(mtmmMappings.map(m => [`${m.exerciseId}:${m.competencyNodeId}`, m.weight]));

                return (
                  <div className="overflow-x-auto" data-testid="mtmm-overview-table">
                    <table className="text-sm border-collapse w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-medium text-slate-600 bg-slate-50 rounded-tl-lg sticky left-0 z-10 min-w-[160px]">Übung (Methode)</th>
                          {uniqueNodes.map(node => (
                            <th key={node.id} className="text-center py-2 px-2 font-medium text-slate-600 bg-slate-50 min-w-[100px]" title={node.description || node.name}>
                              <span className="text-xs leading-tight block">{node.name}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueExercisesTable.map(ex => (
                          <tr key={ex.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-medium text-slate-800 sticky left-0 bg-white z-10">{ex.name}</td>
                            {uniqueNodes.map(node => {
                              const weight = mappingLookup.get(`${ex.id}:${node.id}`);
                              return (
                                <td key={node.id} className="text-center py-2 px-2">
                                  {weight !== undefined ? (
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${
                                      weight >= 1.5 ? "bg-emerald-100 text-emerald-700" :
                                      weight >= 1.0 ? "bg-blue-100 text-blue-700" :
                                      "bg-amber-50 text-amber-600"
                                    }`}>
                                      {weight.toFixed(1)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-200">–</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 inline-block"></span> ≥ 1.5 Primär</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 inline-block"></span> 1.0–1.4 Standard</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block"></span> &lt; 1.0 Sekundär</span>
                    </div>
                  </div>
                );
              })()}
              </div>
            </div>
          )}

          {activeSection === "validation" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-brand-navy mb-6" data-testid="heading-validation">Validierung & Übersicht</h2>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Assessment-Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name</span>
                      <span className="font-medium text-slate-900">{assessment?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGES[assessment?.status || "draft"]?.bg} ${STATUS_BADGES[assessment?.status || "draft"]?.text}`}>
                        {STATUS_BADGES[assessment?.status || "draft"]?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kunde</span>
                      <span className="text-slate-900">{assessment?.clientName || "–"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Standort</span>
                      <span className="text-slate-900">{assessment?.location || "–"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Zeitraum</span>
                      <span className="text-slate-900">{formatDate(assessment?.startDate || null)} – {formatDate(assessment?.endDate || null)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Vollständigkeitsprüfung</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Übungen vorhanden", ok: hasExercises },
                      { label: "MTMM-Zuordnungen", ok: hasMtmm },
                      { label: "Beobachtungsbögen", ok: hasSheets },
                      { label: "Datum festgelegt", ok: hasDates },
                      { label: "Beschreibung vorhanden", ok: hasDescription },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2" data-testid={`validation-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                        {item.ok ? (
                          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                        )}
                        <span className={`text-sm ${item.ok ? "text-slate-700" : "text-amber-600"}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-brand-navy">{exercises.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Übungen</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{mtmmMappings.length}</p>
                  <p className="text-xs text-slate-500 mt-1">MTMM-Zuordnungen ({uniqueMtmmExercises.length} Übungen × {uniqueCompetencies.length} Kompetenzen)</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-700">{observationSheets.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Beobachtungsbögen</p>
                </div>
              </div>

              {exercises.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Übungen</h3>
                  <div className="flex flex-wrap gap-2">
                    {exercises.map((ex) => (
                      <div key={ex.id} className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <span className="text-sm font-medium text-slate-900">{ex.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          {EXERCISE_TYPE_LABELS[ex.type] || ex.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {observationSheets.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Beobachtungsbögen</h3>
                  <div className="space-y-1">
                    {observationSheets.map((sheet) => (
                      <div key={sheet.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span>{sheet.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          sheet.type === "ai" ? "bg-purple-50 text-purple-600" :
                          sheet.type === "template" ? "bg-blue-50 text-blue-600" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {sheet.type === "ai" ? "KI" : sheet.type === "template" ? "Vorlage" : "Manuell"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {documents.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Dokumente ({documents.length})</h3>
                  <div className="space-y-1">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span>{doc.name}</span>
                        <span className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === "participants" && (
            <div id="participants" className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-brand-navy" data-testid="heading-participants">Teilnehmer</h2>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/w/${workspaceSlug}/admin/users`}
                    className="rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue hover:text-white transition-colors"
                    data-testid="link-manage-users"
                  >
                    Benutzer verwalten
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                      data-testid="button-assign-candidate"
                      className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark transition-colors"
                    >
                      Teilnehmer zuweisen
                    </button>
                    {showAssignDropdown && (
                      <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {filteredAvailableUsers.length === 0 ? (
                          <p className="p-3 text-sm text-slate-400">Keine verfügbaren Benutzer.</p>
                        ) : (
                          filteredAvailableUsers.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleAssignCandidate(user.id)}
                              data-testid={`button-assign-user-${user.id}`}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                            >
                              <p className="text-sm font-medium text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3"
                    data-testid={`row-candidate-${candidate.id}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{candidate.name}</p>
                      <p className="text-xs text-slate-500">{candidate.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveCandidate(candidate.id)}
                      data-testid={`button-remove-candidate-${candidate.id}`}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
                {candidates.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">Keine Teilnehmer zugewiesen.</p>
                )}
              </div>
            </div>
          )}

          {activeSection === "documents" && (() => {
            const generalLegacy = documents.filter(d => !d.exerciseId);
            const generalPortal = portalDocs.filter(d => d.category === "general" && !d.exerciseId);
            const prepPortal = portalDocs.filter(d => d.category === "preparation");
            const infoPortal = portalDocs.filter(d => d.category === "info");

            const exerciseTypeIcons: Record<string, string> = {
              presentation: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5",
              interview: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155",
              interview_guide: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
              group_discussion: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
              case_study: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
              role_play: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
              behavior_simulation: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
              fact_finding: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
              in_tray: "M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-17.5 0V6.108c0-1.135.845-2.098 1.976-2.192a48.424 48.424 0 011.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
              psychometric: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
              psychometric_test: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
              self_reflection: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
              other: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
            };

            const renderUploadForm = (sectionKey: string, exerciseId: string | null, category: string) => {
              if (docUploadSection !== sectionKey) return null;
              return (
                <div className="border border-slate-200 rounded-lg p-4 mt-3 bg-slate-50" data-testid={`upload-form-${sectionKey}`}>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                      <input
                        value={docName}
                        onChange={e => setDocName(e.target.value)}
                        data-testid={`input-doc-name-${sectionKey}`}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none"
                        placeholder="z.B. Aufgabenstellung"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Datei *</label>
                      <input
                        type="file"
                        onChange={e => setDocFile(e.target.files?.[0] || null)}
                        data-testid={`input-doc-file-${sectionKey}`}
                        className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-navy/10 file:text-brand-navy hover:file:bg-brand-navy/20"
                      />
                    </div>
                  </div>
                  {uploadError && <p className="text-sm text-red-500 mb-2">{uploadError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUploadPortalDoc(exerciseId, category)}
                      disabled={!docName.trim() || !docFile || uploading}
                      data-testid={`button-upload-${sectionKey}`}
                      className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
                    >
                      {uploading ? "Wird hochgeladen…" : "Hochladen"}
                    </button>
                    <button
                      onClick={() => { setDocUploadSection(null); setDocName(""); setDocFile(null); setUploadError(""); }}
                      className="text-sm text-slate-500 hover:text-slate-700"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              );
            };

            const renderDocRow = (doc: PortalDocRecord | DocumentRecord, isPortal: boolean) => {
              const title = isPortal ? (doc as PortalDocRecord).title : (doc as DocumentRecord).name;
              const fileName = isPortal ? (doc as PortalDocRecord).fileName : (doc as DocumentRecord).fileName;
              const fileSize = isPortal ? (doc as PortalDocRecord).fileSize : (doc as DocumentRecord).fileSize;
              const mimeType = isPortal ? (doc as PortalDocRecord).mimeType : (doc as DocumentRecord).mimeType;
              const releaseStatus = isPortal ? (doc as PortalDocRecord).releaseStatus : null;
              const isPdf = mimeType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf");

              return (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors" data-testid={`doc-item-${doc.id}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? "bg-red-50" : "bg-slate-100"}`}>
                    {isPdf ? (
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v7h6v9H6z"/></svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{title}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {fileName && <span>{fileName}</span>}
                      {fileSize != null && fileSize > 0 && <span>· {formatFileSize(fileSize)}</span>}
                      {isPdf && <span className="text-red-400 font-medium">PDF</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isPdf && !isPortal && (
                      <button
                        onClick={() => handleViewDocument(doc.id, fileName || title || "Dokument")}
                        data-testid={`button-view-${doc.id}`}
                        className="text-xs text-brand-blue hover:text-brand-navy font-medium px-2 py-1 rounded hover:bg-brand-blue/5 transition-colors"
                      >
                        Anzeigen
                      </button>
                    )}
                    {isPortal && (
                      <button
                        onClick={() => handleTogglePortalDocRelease(doc as PortalDocRecord)}
                        data-testid={`toggle-release-${doc.id}`}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                          releaseStatus === "released"
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {releaseStatus === "released" ? (
                          <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>Freigegeben</>
                        ) : (
                          <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>Gesperrt</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => isPortal ? handleDownloadDocument(doc.id) : handleDownloadDocument(doc.id)}
                      data-testid={`button-download-${doc.id}`}
                      className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => isPortal ? handleDeletePortalDoc(doc.id) : handleDeleteDocument(doc.id)}
                      data-testid={`button-delete-${doc.id}`}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-6" data-testid="section-documents">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-brand-navy" data-testid="heading-documents">Dokumente & Bausteine</h2>
                    <p className="text-sm text-slate-500">Alle Dokumente gruppiert nach Baustein. Portal-Dokumente können für Kandidaten freigegeben werden.</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 bg-gradient-to-r from-brand-navy/5 to-brand-blue/5 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-brand-navy">Allgemeine Dokumente</h3>
                      <span className="text-xs text-slate-400 ml-1">{generalLegacy.length + generalPortal.length}</span>
                    </div>
                    <button
                      onClick={() => { setDocUploadSection(docUploadSection === "general" ? null : "general"); setDocName(""); setDocFile(null); setUploadError(""); }}
                      data-testid="button-add-general-doc"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:text-brand-navy transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      Hinzufügen
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {generalPortal.map(d => renderDocRow(d, true))}
                    {generalLegacy.map(d => renderDocRow(d, false))}
                    {generalLegacy.length === 0 && generalPortal.length === 0 && (
                      <p className="px-5 py-6 text-sm text-slate-400 text-center">Keine allgemeinen Dokumente vorhanden</p>
                    )}
                  </div>
                  {renderUploadForm("general", null, "general")}
                </div>

                {exercises.map(ex => {
                  const exPortalDocs = portalDocs.filter(d => d.exerciseId === ex.id);
                  const exLegacyDocs = documents.filter(d => d.exerciseId === ex.id);
                  const total = exPortalDocs.length + exLegacyDocs.length;
                  const released = exPortalDocs.filter(d => d.releaseStatus === "released").length;
                  const sectionKey = `exercise-${ex.id}`;

                  return (
                    <div key={ex.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid={`doc-section-${ex.id}`}>
                      <div className="px-5 py-3 bg-gradient-to-r from-brand-navy/5 to-brand-blue/5 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d={exerciseTypeIcons[ex.type] || exerciseTypeIcons.other} />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-brand-navy">{ex.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span>{EXERCISE_TYPE_LABELS[ex.type] || ex.type}</span>
                              {ex.duration && <span>· {ex.duration} Min.</span>}
                              <span>· {total} Dok.</span>
                              {released > 0 && <span className="text-emerald-500">· {released} freigegeben</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => { setDocUploadSection(docUploadSection === sectionKey ? null : sectionKey); setDocName(""); setDocFile(null); setUploadError(""); }}
                          data-testid={`button-add-doc-${ex.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:text-brand-navy transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          Hinzufügen
                        </button>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {exPortalDocs.map(d => renderDocRow(d, true))}
                        {exLegacyDocs.map(d => renderDocRow(d, false))}
                        {total === 0 && (
                          <p className="px-5 py-6 text-sm text-slate-400 text-center">Keine Dokumente für diesen Baustein</p>
                        )}
                      </div>
                      {renderUploadForm(sectionKey, ex.id, "exercise")}
                    </div>
                  );
                })}

                {prepPortal.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 bg-gradient-to-r from-brand-navy/5 to-brand-blue/5 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-brand-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                        <h3 className="text-sm font-semibold text-brand-navy">Vorbereitungsdokumente</h3>
                        <span className="text-xs text-slate-400 ml-1">{prepPortal.length}</span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {prepPortal.map(d => renderDocRow(d, true))}
                    </div>
                  </div>
                )}

                {infoPortal.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 bg-gradient-to-r from-brand-navy/5 to-brand-blue/5 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-brand-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        <h3 className="text-sm font-semibold text-brand-navy">Informationsmaterial</h3>
                        <span className="text-xs text-slate-400 ml-1">{infoPortal.length}</span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {infoPortal.map(d => renderDocRow(d, true))}
                    </div>
                  </div>
                )}

                {exercises.length === 0 && generalLegacy.length === 0 && generalPortal.length === 0 && (
                  <div className="bg-white border border-slate-200 border-dashed rounded-xl py-12 text-center">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p className="text-sm text-slate-500">Erstellen Sie zunächst Übungen unter "Bausteine", um hier Dokumente zuzuordnen.</p>
                  </div>
                )}
              </div>
            );
          })()}

          {activeSection === "portal" && (
            <PortalManagementSection
              workspaceSlug={workspaceSlug}
              assessmentId={assessmentId}
              exercises={exercises}
            />
          )}

          {activeSection === "activation" && (
            <>
              {(!hasExercises || !hasDates || !hasDescription) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4" data-testid="activation-warnings">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-amber-800">Fehlende Elemente</h3>
                      <ul className="text-sm text-amber-700 mt-1 space-y-0.5">
                        {!hasExercises && <li>• Keine Übungen definiert</li>}
                        {!hasDates && <li>• Kein Datum festgelegt</li>}
                        {!hasDescription && <li>• Keine Beschreibung vorhanden</li>}
                        {!hasMtmm && <li>• Keine MTMM-Zuordnungen</li>}
                        {!hasSheets && <li>• Keine Beobachtungsbögen</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-brand-navy mb-4" data-testid="heading-activation">Assessment-Status</h2>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Aktueller Status</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGES[assessment?.status || "draft"]?.bg} ${STATUS_BADGES[assessment?.status || "draft"]?.text}`}>
                        {STATUS_BADGES[assessment?.status || "draft"]?.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Übungen</span>
                      <span className="font-medium text-slate-900">{exercises.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Teilnehmer</span>
                      <span className="font-medium text-slate-900">{candidates.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Dokumente</span>
                      <span className="font-medium text-slate-900">{documents.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Beobachtungsbögen</span>
                      <span className="font-medium text-slate-900">{observationSheets.length}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status ändern</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        data-testid="select-activation-status"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                      >
                        <option value="draft">Entwurf</option>
                        <option value="active">Aktiv</option>
                        <option value="completed">Abgeschlossen</option>
                        <option value="archived">Archiviert</option>
                      </select>
                    </div>
                    <button
                      onClick={handleActivateAssessment}
                      disabled={saving || assessment?.status === "active"}
                      data-testid="button-activate-assessment"
                      className="w-full rounded-lg bg-emerald-600 text-white text-sm font-semibold px-6 py-3 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {assessment?.status === "active" ? "Assessment ist aktiv" : saving ? "Wird aktiviert…" : "Assessment freischalten"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-brand-navy mb-4">Portal-Links</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => { setActiveSection("portal"); }}
                    className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3 hover:border-brand-blue/40 hover:bg-blue-50/20 transition-colors text-left"
                    data-testid="link-candidate-portal-manage"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">Portal verwalten</p>
                      <p className="text-xs text-slate-500">Dokumente und Fragebögen für Kandidaten konfigurieren</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93s.844.083 1.168-.142l.748-.56a1.125 1.125 0 011.588.135l.773.773a1.125 1.125 0 01.135 1.588l-.56.748c-.225.324-.258.77-.142 1.168s.506.71.93.78l.894.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.384-.93.78s-.084.844.141 1.168l.56.748a1.125 1.125 0 01-.134 1.588l-.773.773a1.125 1.125 0 01-1.588.135l-.748-.56c-.324-.225-.77-.258-1.168-.142s-.71.506-.78.93l-.15.894c-.09.542-.56.94-1.109.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93s-.844-.083-1.168.142l-.748.56a1.125 1.125 0 01-1.588-.135l-.773-.773a1.125 1.125 0 01-.135-1.588l.56-.748c.225-.324.258-.77.142-1.168s-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78s.083-.844-.142-1.168l-.56-.748a1.125 1.125 0 01.135-1.588l.773-.773a1.125 1.125 0 011.588-.135l.748.56c.324.225.77.258 1.168.142s.71-.506.78-.93l.15-.894z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <Link
                    href={`/w/${workspaceSlug}/assessment`}
                    target="_blank"
                    className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3 hover:border-brand-blue/40 hover:bg-blue-50/20 transition-colors"
                    data-testid="link-candidate-portal"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">Kandidatenportal-Vorschau</p>
                      <p className="text-xs text-slate-500">Portal in neuem Tab öffnen (Kandidaten-Ansicht)</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </Link>
                  <Link
                    href={`/w/${workspaceSlug}/admin/consent`}
                    className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3 hover:border-brand-blue/40 hover:bg-blue-50/20 transition-colors"
                    data-testid="link-consent-management"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">Einwilligungen (DSGVO)</p>
                      <p className="text-xs text-slate-500">Einwilligungsvorlagen verwalten und Einwilligungsstatus einsehen</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </Link>
                  <div className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3 opacity-60">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Beobachterportal</p>
                      <p className="text-xs text-slate-500">Zugang für Beobachter zur Bewertung</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 font-medium">Bald verfügbar</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/w/${workspaceSlug}/admin/intelligence?assessmentId=${assessmentId}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue hover:text-white transition-colors"
                  data-testid="link-intelligence"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  Advanced Intelligence
                </Link>
              </div>
            </>
          )}

        </main>
      </div>

      <button
        onClick={() => setShowCollab(true)}
        data-testid="button-open-collaboration"
        className="fixed bottom-8 right-8 z-30 flex items-center gap-2 rounded-full shadow-lg px-5 py-3 text-white text-sm font-medium transition-all hover:scale-105"
        style={{ backgroundColor: "hsl(14, 48%, 44%)" }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
        Zusammenarbeit
      </button>

      {selectedSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedSheet(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()} data-testid="modal-sheet-detail">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-brand-navy">{selectedSheet.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedSheet.type === "ai" ? "bg-purple-50 text-purple-600" :
                    selectedSheet.type === "template" ? "bg-blue-50 text-blue-600" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {selectedSheet.type === "ai" ? "KI" : selectedSheet.type === "template" ? "Vorlage" : "Manuell"}
                  </span>
                  {selectedSheet.aiGenerated && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">KI-generiert</span>
                  )}
                  <span className="text-xs text-slate-400">{formatDate(selectedSheet.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadSheetPdf(selectedSheet)}
                  data-testid="button-modal-download-pdf"
                  className="flex items-center gap-1.5 rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  PDF
                </button>
                <button
                  onClick={() => setSelectedSheet(null)}
                  data-testid="button-close-sheet-detail"
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {selectedSheet.exerciseId && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Übung</h3>
                  <p className="text-sm text-brand-blue font-medium">
                    {exercises.find((ex) => ex.id === selectedSheet.exerciseId)?.name || selectedSheet.exerciseId}
                  </p>
                  {getMtmmForExercise(selectedSheet.exerciseId).length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-500 mb-1.5">MTMM-Kompetenzen:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {getMtmmForExercise(selectedSheet.exerciseId).map(m => (
                          <span key={m.competencyNodeId} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            m.weight >= 1.5 ? "bg-emerald-100 text-emerald-700" :
                            m.weight >= 1.0 ? "bg-blue-100 text-blue-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {m.competencyNode.name} ({m.weight.toFixed(1)})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedSheet.description && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Beschreibung</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedSheet.description}</p>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Inhalt</h3>
                {selectedSheet.content ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed" data-testid="text-sheet-content">
                      {renderContentPreview(selectedSheet.content)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Kein strukturierter Inhalt vorhanden. Der Bogen wurde als Metadaten-Eintrag erstellt.</p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div>
                    <span className="font-medium">ID:</span> <span className="font-mono text-slate-400">{selectedSheet.id.slice(0, 8)}…</span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedSheet.status}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CollaborationPanel
        workspaceSlug={workspaceSlug}
        assessmentId={assessmentId}
        isOpen={showCollab}
        onClose={() => setShowCollab(false)}
      />

      {pdfViewerUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setPdfViewerUrl(null); setPdfViewerTitle(""); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-brand-navy">{pdfViewerTitle}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={pdfViewerUrl}
                  download
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:text-brand-navy transition-colors"
                  data-testid="button-download-pdf-viewer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  Download
                </a>
                <button
                  onClick={() => { setPdfViewerUrl(null); setPdfViewerTitle(""); }}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                  data-testid="button-close-pdf-viewer"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe src={pdfViewerUrl} className="w-full h-full border-0" title={pdfViewerTitle} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
