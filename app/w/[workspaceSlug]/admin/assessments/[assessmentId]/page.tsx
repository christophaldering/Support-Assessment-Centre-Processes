"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CollaborationPanel from "./CollaborationPanel";
import PortalManagementSection from "./PortalManagementSection";
import {
  AssessmentRecord, ExerciseRecord, ExerciseDocument, DocumentRecord,
  PortalDocRecord, CandidateRecord, ObservationSheetRecord, LibraryItem,
  MtmmMapping, LinkedAnalysis,
} from "./sections/types";
import {
  formatDate, formatFileSize, toDateInputValue,
  STATUS_BADGES, ALL_ROLES, ROLE_LABELS,
  EXERCISE_TYPE_LABELS, EXERCISE_TYPES, TYPE_MAP_DE_TO_KEY,
} from "./sections/utils";
import ParticipantsSection from "./sections/ParticipantsSection";
import PortalSection from "./sections/PortalSection";
import ValidationSection from "./sections/ValidationSection";
import ActivationSection from "./sections/ActivationSection";
import OverviewSection from "./sections/OverviewSection";
import RequirementsSection from "./sections/RequirementsSection";
import TargetPositionSection from "./sections/TargetPositionSection";
import ExercisesSection from "./sections/ExercisesSection";
import ObservationSheetsSection from "./sections/ObservationSheetsSection";
import MtmmSection from "./sections/MtmmSection";
import DocumentsSection from "./sections/DocumentsSection";

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
          <p className="text-sm text-[var(--eds-text-disabled)]">Laden…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 px-6 lg:px-10 space-y-6">
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-error">{error}</p>
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
          className={`fixed md:sticky top-16 left-0 z-30 md:z-10 h-[calc(100vh-4rem)] w-64 bg-white border-r border-[var(--eds-border)] overflow-y-auto transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
          data-testid="sidebar-navigation"
        >
          <nav className="py-4">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="px-4 mb-1.5 text-[10px] font-bold tracking-widest text-[var(--eds-text-disabled)] uppercase" data-testid={`nav-group-${group.label.toLowerCase()}`}>
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
                          ? "text-brand-blue bg-[var(--eds-status-blue-bg)]/60 font-medium border-l-[3px] border-brand-blue"
                          : "text-[var(--eds-text-secondary)] hover:bg-[var(--eds-bg-sunken)] hover:text-[var(--eds-text-primary)] border-l-[3px] border-transparent"
                      }`}
                    >
                      <span className={isActive ? "text-brand-blue" : "text-[var(--eds-text-disabled)]"}>{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${isComplete ? "bg-emerald-400" : "bg-[var(--eds-border)]"}`}
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
            <OverviewSection
              exercises={exercises}
              observationSheets={observationSheets}
              candidates={candidates}
              documents={documents}
              editName={editName}
              editLocation={editLocation}
              editClientName={editClientName}
              editDescription={editDescription}
              editStartDate={editStartDate}
              editEndDate={editEndDate}
              editStatus={editStatus}
              saving={saving}
              saveMsg={saveMsg}
              setEditName={setEditName}
              setEditLocation={setEditLocation}
              setEditClientName={setEditClientName}
              setEditDescription={setEditDescription}
              setEditStartDate={setEditStartDate}
              setEditEndDate={setEditEndDate}
              setEditStatus={setEditStatus}
              handleSaveAssessment={handleSaveAssessment}
            />
          )}

          {activeSection === "requirements" && (
            <RequirementsSection
              workspaceSlug={workspaceSlug}
              assessment={assessment}
              linkedAnalysis={linkedAnalysis}
              linkedAnalysisLoading={linkedAnalysisLoading}
            />
          )}
          {activeSection === "target_position" && (
            <TargetPositionSection
              editTargetPosition={editTargetPosition}
              saving={saving}
              saveMsg={saveMsg}
              analysisTargetRole={analysisTargetRole}
              setEditTargetPosition={setEditTargetPosition}
              handleSaveAssessment={handleSaveAssessment}
            />
          )}

          {activeSection === "exercises" && (
            <ExercisesSection
              linkedAnalysis={linkedAnalysis}
              exercises={exercises}
              apiBase={apiBase}
              fetchExercises={fetchExercises}
              fetchLibraryItems={fetchLibraryItems}
              TYPE_MAP_DE_TO_KEY={TYPE_MAP_DE_TO_KEY}
              EXERCISE_TYPE_LABELS={EXERCISE_TYPE_LABELS}
              EXERCISE_TYPES={EXERCISE_TYPES}
              workspaceSlug={workspaceSlug}
              showLibrary={showLibrary}
              setShowLibrary={setShowLibrary}
              handleToggleLibrary={handleToggleLibrary}
              libraryItems={libraryItems}
              libraryLoading={libraryLoading}
              specForLibrarySearch={specForLibrarySearch}
              setSpecForLibrarySearch={setSpecForLibrarySearch}
              showCreateExercise={showCreateExercise}
              setShowCreateExercise={setShowCreateExercise}
              handleSeedVarexia={handleSeedVarexia}
              seedingVarexia={seedingVarexia}
              varexiaSeeded={varexiaSeeded}
              basisExercise={basisExercise}
              setBasisExercise={setBasisExercise}
              basisChanges={basisChanges}
              setBasisChanges={setBasisChanges}
              showBasisPicker={showBasisPicker}
              setShowBasisPicker={setShowBasisPicker}
              activeModuleSpec={activeModuleSpec}
              setActiveModuleSpec={setActiveModuleSpec}
              exName={exName}
              setExName={setExName}
              exType={exType}
              setExType={setExType}
              exInstructions={exInstructions}
              setExInstructions={setExInstructions}
              exDuration={exDuration}
              setExDuration={setExDuration}
              exSortOrder={exSortOrder}
              setExSortOrder={setExSortOrder}
              exError={exError}
              aiError={aiError}
              aiGenerating={aiGenerating}
              aiProgress={aiProgress}
              aiProgressLabel={aiProgressLabel}
              exCreating={exCreating}
              handleCreateExercise={handleCreateExercise}
              handleAIGenerateExercise={handleAIGenerateExercise}
              handleImportFromLibrary={handleImportFromLibrary}
              handleAIVariantImport={handleAIVariantImport}
              editingExId={editingExId}
              setEditingExId={setEditingExId}
              editExName={editExName}
              setEditExName={setEditExName}
              editExType={editExType}
              setEditExType={setEditExType}
              editExInstructions={editExInstructions}
              setEditExInstructions={setEditExInstructions}
              editExDuration={editExDuration}
              setEditExDuration={setEditExDuration}
              editExSortOrder={editExSortOrder}
              setEditExSortOrder={setEditExSortOrder}
              handleUpdateExercise={handleUpdateExercise}
              handleDeleteExercise={handleDeleteExercise}
              exerciseDocUpload={exerciseDocUpload}
              setExerciseDocUpload={setExerciseDocUpload}
              exerciseDocName={exerciseDocName}
              setExerciseDocName={setExerciseDocName}
              exerciseDocFile={exerciseDocFile}
              setExerciseDocFile={setExerciseDocFile}
              exerciseDocError={exerciseDocError}
              setExerciseDocError={setExerciseDocError}
              exerciseDocUploading={exerciseDocUploading}
              handleUploadExerciseDoc={handleUploadExerciseDoc}
              handleDeleteExerciseDoc={handleDeleteExerciseDoc}
              handleViewDocument={handleViewDocument}
              handleDownloadDocument={handleDownloadDocument}
            />
          )}

          {activeSection === "observation_sheets" && (
            <ObservationSheetsSection
              exercises={exercises}
              observationSheets={observationSheets}
              showAiSheetDialog={showAiSheetDialog}
              setShowAiSheetDialog={setShowAiSheetDialog}
              handleCreateAISheet={handleCreateAISheet}
              aiSheetExerciseId={aiSheetExerciseId}
              setAiSheetExerciseId={setAiSheetExerciseId}
              getMtmmForExercise={getMtmmForExercise}
              aiSheetType={aiSheetType}
              setAiSheetType={setAiSheetType}
              aiSheetInstructions={aiSheetInstructions}
              setAiSheetInstructions={setAiSheetInstructions}
              aiSheetError={aiSheetError}
              aiSheetGenerating={aiSheetGenerating}
              handleSubmitAISheet={handleSubmitAISheet}
              showCreateSheet={showCreateSheet}
              setShowCreateSheet={setShowCreateSheet}
              sheetName={sheetName}
              setSheetName={setSheetName}
              sheetDesc={sheetDesc}
              setSheetDesc={setSheetDesc}
              sheetExerciseId={sheetExerciseId}
              setSheetExerciseId={setSheetExerciseId}
              sheetType={sheetType}
              setSheetType={setSheetType}
              sheetCreating={sheetCreating}
              sheetError={sheetError}
              handleCreateObservationSheet={handleCreateObservationSheet}
              formatDate={formatDate}
              handleDownloadSheetPdf={handleDownloadSheetPdf}
              setSelectedSheet={setSelectedSheet}
            />
          )}

          {activeSection === "mtmm" && (
            <MtmmSection
              hasExercises={hasExercises}
              assessment={assessment}
              exercises={exercises}
              setActiveSection={setActiveSection}
              mtmmCompetencyModel={mtmmCompetencyModel}
              mtmmMappings={mtmmMappings}
              mtmmLoading={mtmmLoading}
              showInlineMtmm={showInlineMtmm}
              setShowInlineMtmm={setShowInlineMtmm}
              initInlineMtmmGrid={initInlineMtmmGrid}
              mtmmAiRationale={mtmmAiRationale}
              setMtmmAiRationale={setMtmmAiRationale}
              mtmmAiSummary={mtmmAiSummary}
              setMtmmAiSummary={setMtmmAiSummary}
              mtmmAiLoading={mtmmAiLoading}
              handleMtmmAiSuggest={handleMtmmAiSuggest}
              mtmmSaveMsg={mtmmSaveMsg}
              mtmmSaving={mtmmSaving}
              handleSaveInlineMtmm={handleSaveInlineMtmm}
              mtmmInlineGrid={mtmmInlineGrid}
              setMtmmInlineGrid={setMtmmInlineGrid}
            />
          )}

          {activeSection === "validation" && (
            <ValidationSection
              assessment={assessment}
              exercises={exercises}
              mtmmMappings={mtmmMappings}
              observationSheets={observationSheets}
              documents={documents}
              hasExercises={hasExercises}
              hasMtmm={hasMtmm}
              hasSheets={hasSheets}
              hasDates={hasDates}
              hasDescription={hasDescription}
              uniqueMtmmExercises={uniqueMtmmExercises}
              uniqueCompetencies={uniqueCompetencies}
              setActiveSection={setActiveSection}
            />
          )}


          {activeSection === "participants" && (
            <ParticipantsSection
              workspaceSlug={workspaceSlug}
              candidates={candidates}
              filteredAvailableUsers={filteredAvailableUsers}
              showAssignDropdown={showAssignDropdown}
              setShowAssignDropdown={setShowAssignDropdown}
              handleAssignCandidate={handleAssignCandidate}
              handleRemoveCandidate={handleRemoveCandidate}
            />
          )}

          {activeSection === "documents" && (
            <DocumentsSection
              documents={documents}
              portalDocs={portalDocs}
              exercises={exercises}
              EXERCISE_TYPE_LABELS={EXERCISE_TYPE_LABELS}
              docUploadSection={docUploadSection}
              setDocUploadSection={setDocUploadSection}
              docName={docName}
              setDocName={setDocName}
              docFile={docFile}
              setDocFile={setDocFile}
              uploadError={uploadError}
              setUploadError={setUploadError}
              uploading={uploading}
              handleUploadPortalDoc={handleUploadPortalDoc}
              handleViewDocument={handleViewDocument}
              handleDownloadDocument={handleDownloadDocument}
              handleTogglePortalDocRelease={handleTogglePortalDocRelease}
              handleDeletePortalDoc={handleDeletePortalDoc}
              handleDeleteDocument={handleDeleteDocument}
              formatFileSize={formatFileSize}
            />
          )}

          {activeSection === "portal" && (
            <PortalSection
              workspaceSlug={workspaceSlug}
              assessmentId={assessmentId}
              exercises={exercises}
            />
          )}

          {activeSection === "activation" && (
            <ActivationSection
              assessment={assessment}
              exercises={exercises}
              candidates={candidates}
              documents={documents}
              observationSheets={observationSheets}
              editStatus={editStatus}
              saving={saving}
              hasExercises={hasExercises}
              hasDates={hasDates}
              hasDescription={hasDescription}
              hasMtmm={hasMtmm}
              hasSheets={hasSheets}
              workspaceSlug={workspaceSlug}
              assessmentId={assessmentId}
              setEditStatus={setEditStatus}
              handleActivateAssessment={handleActivateAssessment}
              setActiveSection={setActiveSection}
            />
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
            <div className="sticky top-0 bg-white border-b border-[var(--eds-border)] px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-brand-navy">{selectedSheet.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedSheet.type === "ai" ? "bg-purple-50 text-purple-600" :
                    selectedSheet.type === "template" ? "bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)]" :
                    "bg-[var(--eds-bg-sunken)] text-[var(--eds-text-secondary)]"
                  }`}>
                    {selectedSheet.type === "ai" ? "KI" : selectedSheet.type === "template" ? "Vorlage" : "Manuell"}
                  </span>
                  {selectedSheet.aiGenerated && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">KI-generiert</span>
                  )}
                  <span className="text-xs text-[var(--eds-text-disabled)]">{formatDate(selectedSheet.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadSheetPdf(selectedSheet)}
                  data-testid="button-modal-download-pdf"
                  className="flex items-center gap-1.5 rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-[var(--eds-status-blue)] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  PDF
                </button>
                <button
                  onClick={() => setSelectedSheet(null)}
                  data-testid="button-close-sheet-detail"
                  className="p-2 rounded-lg text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)] hover:bg-[var(--eds-bg-sunken)] transition-colors"
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
                  <h3 className="text-xs font-semibold text-[var(--eds-text-tertiary)] uppercase tracking-wide mb-2">Übung</h3>
                  <p className="text-sm text-brand-blue font-medium">
                    {exercises.find((ex) => ex.id === selectedSheet.exerciseId)?.name || selectedSheet.exerciseId}
                  </p>
                  {getMtmmForExercise(selectedSheet.exerciseId).length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-[var(--eds-text-tertiary)] mb-1.5">MTMM-Kompetenzen:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {getMtmmForExercise(selectedSheet.exerciseId).map(m => (
                          <span key={m.competencyNodeId} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            m.weight >= 1.5 ? "bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)]" :
                            m.weight >= 1.0 ? "bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)]" :
                            "bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)]"
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
                  <h3 className="text-xs font-semibold text-[var(--eds-text-tertiary)] uppercase tracking-wide mb-2">Beschreibung</h3>
                  <p className="text-sm text-[var(--eds-text-primary)] whitespace-pre-wrap leading-relaxed">{selectedSheet.description}</p>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-[var(--eds-text-tertiary)] uppercase tracking-wide mb-2">Inhalt</h3>
                {selectedSheet.content ? (
                  <div className="bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)] rounded-lg p-4">
                    <pre className="text-sm text-[var(--eds-text-primary)] whitespace-pre-wrap font-sans leading-relaxed" data-testid="text-sheet-content">
                      {renderContentPreview(selectedSheet.content)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--eds-text-disabled)] italic">Kein strukturierter Inhalt vorhanden. Der Bogen wurde als Metadaten-Eintrag erstellt.</p>
                )}
              </div>

              <div className="border-t border-[var(--eds-border)] pt-4">
                <div className="grid grid-cols-2 gap-3 text-xs text-[var(--eds-text-tertiary)]">
                  <div>
                    <span className="font-medium">ID:</span> <span className="font-mono text-[var(--eds-text-disabled)]">{selectedSheet.id.slice(0, 8)}…</span>
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--eds-border)]">
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
                  className="w-8 h-8 rounded-full hover:bg-[var(--eds-bg-sunken)] flex items-center justify-center transition-colors"
                  data-testid="button-close-pdf-viewer"
                >
                  <svg className="w-5 h-5 text-[var(--eds-text-disabled)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
