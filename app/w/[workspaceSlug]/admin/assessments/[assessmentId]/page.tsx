"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CollaborationPanel from "./CollaborationPanel";

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
}

interface ExerciseRecord {
  id: string;
  name: string;
  type: string;
  instructions: string | null;
  duration: number | null;
  sortOrder: number;
  status: string;
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

const ALL_ROLES = ["ADMIN", "MODERATOR", "OBSERVER", "PROJECT_ASSISTANT", "HR_CLIENT", "CANDIDATE"] as const;
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  OBSERVER: "Beobachter",
  PROJECT_ASSISTANT: "Projektassistent",
  HR_CLIENT: "HR-Auftraggeber",
  CANDIDATE: "Kandidat",
};

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  interview_guide: "Interview-Leitfaden",
  case_study: "Fallstudie",
  fact_finding: "Fact-Finding-Simulation",
  presentation: "Präsentation",
  behavior_simulation: "Verhaltenssimulation",
  psychometric_test: "Psychometrischer Test",
  other: "Sonstiges",
};

const EXERCISE_TYPES = Object.keys(EXERCISE_TYPE_LABELS);

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

const STEPS = [
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

  const [activeStep, setActiveStep] = useState(0);

  interface MtmmMapping {
    exerciseId: string;
    competencyNodeId: string;
    weight: number;
    exercise: { id: string; name: string };
    competencyNode: { id: string; name: string; description: string | null; sortOrder: number };
  }
  const [mtmmMappings, setMtmmMappings] = useState<MtmmMapping[]>([]);
  const [mtmmLoading, setMtmmLoading] = useState(false);

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
      setActiveStep(data.processStep || 0);
    } catch {
      setError("Fehler beim Laden des Assessments.");
    } finally {
      setLoading(false);
    }
  }, [apiBase, workspaceSlug, router]);

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
        body: JSON.stringify({ spec, language: "DE" }),
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
    fetchCandidates();
    fetchAvailableUsers();
    fetchObservationSheets();
    fetchMtmmMappings();
  }, [fetchAssessment, fetchExercises, fetchDocuments, fetchCandidates, fetchAvailableUsers, fetchObservationSheets, fetchMtmmMappings]);

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
    try {
      await fetch(`${apiBase}/exercises/${exId}`, { method: "DELETE" });
      fetchExercises();
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
    const exerciseId = window.prompt("Für welche Übung? (leer lassen für allgemein)");
    const matchedExercise = exerciseId ? exercises.find(e => e.name.toLowerCase().includes(exerciseId.toLowerCase()) || e.id === exerciseId) : null;

    let mtmmContext = "";
    if (matchedExercise) {
      const mappedComps = getMtmmForExercise(matchedExercise.id);
      if (mappedComps.length > 0) {
        mtmmContext = `\n\nMTMM-Zuordnung für "${matchedExercise.name}":\n` +
          mappedComps.map(m => `- ${m.competencyNode.name} (Gewicht: ${m.weight})`).join("\n");
      }
    }

    const prompt = window.prompt("Beschreiben Sie den gewünschten Beobachtungsbogen:" + (mtmmContext ? `\n\nHinweis: MTMM-Kompetenzen werden automatisch einbezogen.` : ""));
    if (!prompt) return;
    try {
      await fetch(`${apiBase}/observation-sheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: matchedExercise ? `KI-Bogen: ${matchedExercise.name}` : "KI-Beobachtungsbogen",
          description: prompt + mtmmContext,
          exerciseId: matchedExercise?.id || null,
          type: "ai",
          aiGenerated: true,
        }),
      });
      fetchObservationSheets();
    } catch {}
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
      const res = await fetch(`/api/w/${workspaceSlug}/exercise-library/${item.id}/generate-variant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "DE" }),
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

  const handleStepChange = async (step: number) => {
    setActiveStep(step);
    const newProcessStep = Math.max(assessment?.processStep || 0, step);
    try {
      await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processStep: newProcessStep }),
      });
    } catch {}
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
      <div className="min-h-screen flex flex-col bg-slate-50">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-400">Laden…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-red-500" data-testid="text-error">{error}</p>
        </div>
      </div>
    );
  }

  const serverStep = assessment?.processStep || 0;

  const uniqueCompetencies = [...new Map(mtmmMappings.map(m => [m.competencyNode.id, m.competencyNode])).values()];
  const uniqueMtmmExercises = [...new Map(mtmmMappings.map(m => [m.exercise.id, m.exercise])).values()];

  const hasExercises = exercises.length > 0;
  const hasMtmm = mtmmMappings.length > 0;
  const hasSheets = observationSheets.length > 0;
  const hasDates = !!(assessment?.startDate && assessment?.endDate);
  const hasDescription = !!assessment?.description;
  const hasCandidates = candidates.length > 0;
  const hasDocuments = documents.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-navy text-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/w/${workspaceSlug}/admin`}
              className="font-serif text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              {workspaceSlug}
            </Link>
            <span className="text-white/40">/</span>
            <Link
              href={`/w/${workspaceSlug}/admin/assessments`}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Assessments
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-sm text-white/70">{assessment?.name}</span>
          </div>
          <Link
            href={`/w/${workspaceSlug}/admin/assessments`}
            className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
            data-testid="link-back"
          >
            Zurück
          </Link>
        </div>
      </header>

      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < serverStep;
              const isActive = idx === activeStep;
              const isClickable = true;
              return (
                <div key={idx} className="flex items-center flex-1 last:flex-initial">
                  <button
                    onClick={() => isClickable && handleStepChange(idx)}
                    className="flex flex-col items-center gap-1.5 group"
                    data-testid={`stepper-step-${idx}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isCompleted
                        ? "bg-emerald-500 text-white shadow-sm"
                        : isActive
                        ? "bg-brand-blue text-white shadow-md ring-4 ring-brand-blue/20"
                        : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                    }`}>
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={`text-xs font-medium transition-colors hidden sm:block ${
                      isActive ? "text-brand-blue" : isCompleted ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {step.label}
                    </span>
                    <span className={`text-xs font-medium transition-colors sm:hidden ${
                      isActive ? "text-brand-blue" : isCompleted ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {step.short}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                      idx < serverStep ? "bg-emerald-400" : idx < activeStep ? "bg-brand-blue/30" : "bg-slate-200"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-8">

        {activeStep === 0 && (
          <>
            <div className="bg-gradient-to-br from-brand-navy/5 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-brand-navy mb-2">Schritt 1: Anforderungsanalyse</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Definieren Sie die Grunddaten des Assessments und führen Sie eine Anforderungsanalyse durch.
                Legen Sie fest, welche Kompetenzen bewertet werden sollen und welche Rahmenbedingungen gelten.
              </p>
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

            <Link
              href={`/w/${workspaceSlug}/admin/requirements`}
              className="block bg-white border-2 border-dashed border-brand-blue/30 hover:border-brand-blue/60 rounded-xl p-6 transition-colors group"
              data-testid="link-requirements-analysis"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-brand-navy group-hover:text-brand-blue transition-colors">Anforderungsanalyse öffnen</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Definieren Sie Kompetenzen und Anforderungen für dieses Assessment</p>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-blue transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </Link>

            {assessment?.sourceAnalysisId && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm text-emerald-700">
                  <span className="font-medium">Verknüpfte Analyse:</span>{" "}
                  <span className="font-mono text-xs">{assessment.sourceAnalysisId}</span>
                </p>
              </div>
            )}
          </>
        )}

        {activeStep === 1 && (
          <>
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
              <Link
                href={`/w/${workspaceSlug}/admin/observation-sheets`}
                className="inline-flex items-center gap-2 rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue hover:text-white transition-colors"
                data-testid="link-observation-sheets"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Beobachtungsbögen-Builder
              </Link>
              <Link
                href={`/w/${workspaceSlug}/admin/competencies`}
                className="inline-flex items-center gap-2 rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue hover:text-white transition-colors"
                data-testid="link-competencies"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
                </svg>
                MTMM bearbeiten
              </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-brand-navy">Übungen</h2>
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
                      {libraryItems.map((item) => (
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
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showCreateExercise && (
                <div className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50">
                  <form onSubmit={handleCreateExercise} className="space-y-3" data-testid="form-create-exercise">
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

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm" data-testid="table-exercises">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Typ</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Dauer</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Reihenfolge</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((ex) => (
                      <tr key={ex.id} className="border-b border-slate-100 hover:bg-slate-50/50" data-testid={`row-exercise-${ex.id}`}>
                        {editingExId === ex.id ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={editExName}
                                onChange={(e) => setEditExName(e.target.value)}
                                data-testid="input-edit-exercise-name"
                                className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={editExType}
                                onChange={(e) => setEditExType(e.target.value)}
                                data-testid="select-edit-exercise-type"
                                className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                              >
                                {EXERCISE_TYPES.map((t) => (
                                  <option key={t} value={t}>{EXERCISE_TYPE_LABELS[t]}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={editExDuration}
                                onChange={(e) => setEditExDuration(e.target.value)}
                                data-testid="input-edit-exercise-duration"
                                className="w-20 rounded border border-slate-200 px-2 py-1 text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={editExSortOrder}
                                onChange={(e) => setEditExSortOrder(e.target.value)}
                                data-testid="input-edit-exercise-sort-order"
                                className="w-20 rounded border border-slate-200 px-2 py-1 text-sm"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleUpdateExercise(ex.id)}
                                  data-testid="button-save-exercise"
                                  className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium"
                                >
                                  Speichern
                                </button>
                                <button
                                  onClick={() => setEditingExId(null)}
                                  className="text-xs text-slate-400 hover:text-slate-600"
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-900">{ex.name}</td>
                            <td className="px-4 py-3 text-slate-500">{EXERCISE_TYPE_LABELS[ex.type] || ex.type}</td>
                            <td className="px-4 py-3 text-slate-500">{ex.duration ? `${ex.duration} Min.` : "–"}</td>
                            <td className="px-4 py-3 text-slate-500">{ex.sortOrder}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingExId(ex.id);
                                    setEditExName(ex.name);
                                    setEditExType(ex.type);
                                    setEditExInstructions(ex.instructions ?? "");
                                    setEditExDuration(ex.duration?.toString() ?? "");
                                    setEditExSortOrder(ex.sortOrder.toString());
                                  }}
                                  data-testid={`button-edit-exercise-${ex.id}`}
                                  className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium"
                                >
                                  Bearbeiten
                                </button>
                                <button
                                  onClick={() => handleDeleteExercise(ex.id)}
                                  data-testid={`button-delete-exercise-${ex.id}`}
                                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                                >
                                  Löschen
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {exercises.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          Keine Übungen vorhanden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div id="observation-sheets" className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-brand-navy">Beobachtungsbögen</h2>
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
                        {sheet.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">{sheet.description}</p>
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

            <div id="mtmm-matrix" className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-brand-navy">MTMM-Matrix</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Multi-Trait-Multi-Method — Zuordnung Übungen × Kompetenzen</p>
                </div>
                <div className="flex gap-2">
                  {mtmmMappings.length > 0 && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium" data-testid="text-mtmm-count">
                      {mtmmMappings.length} Zuordnung{mtmmMappings.length !== 1 ? "en" : ""}
                    </span>
                  )}
                  <Link
                    href={`/w/${workspaceSlug}/admin/competencies`}
                    data-testid="link-edit-mtmm"
                    className="rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue hover:text-white transition-colors"
                  >
                    MTMM bearbeiten
                  </Link>
                </div>
              </div>

              {mtmmLoading ? (
                <p className="text-sm text-slate-400 text-center py-4">Laden...</p>
              ) : mtmmMappings.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg" data-testid="mtmm-empty-state">
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
                  </svg>
                  <p className="text-sm text-slate-500 mb-2">Noch keine MTMM-Zuordnung definiert</p>
                  <p className="text-xs text-slate-400 mb-4">Definieren Sie, welche Übungen welche Kompetenzen messen sollen.</p>
                  <Link
                    href={`/w/${workspaceSlug}/admin/competencies`}
                    className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:underline font-medium"
                  >
                    Zur MTMM-Matrix
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              ) : (() => {
                const uniqueExercises = [...new Map(mtmmMappings.map(m => [m.exercise.id, m.exercise])).values()];
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
                        {uniqueExercises.map(ex => (
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
          </>
        )}

        {activeStep === 2 && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-brand-navy mb-6">Validierung & Übersicht</h2>

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
                      <div key={item.label} className="flex items-center gap-2">
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
          </>
        )}

        {activeStep === 3 && (
          <>
            <div id="participants" className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-brand-navy">Teilnehmer</h2>
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

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-brand-navy">Dokumente</h2>
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  data-testid="button-upload-document"
                  className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark transition-colors"
                >
                  {showUpload ? "Abbrechen" : "Dokument hochladen"}
                </button>
              </div>

              {showUpload && (
                <div className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50">
                  <form onSubmit={handleUploadDocument} className="space-y-3" data-testid="form-upload-document">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                        <input
                          type="text"
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          required
                          data-testid="input-document-name"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Datei *</label>
                        <input
                          type="file"
                          onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                          required
                          data-testid="input-document-file"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded file:border-0 file:bg-brand-blue/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-brand-blue"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Übung (optional)</label>
                      <select
                        value={docExerciseId}
                        onChange={(e) => setDocExerciseId(e.target.value)}
                        data-testid="select-document-exercise"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                      >
                        <option value="">Keine Übung</option>
                        {exercises.map((ex) => (
                          <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Sichtbar für</label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_ROLES.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleVisibleTo(role)}
                            data-testid={`button-visible-${role.toLowerCase()}`}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                              docVisibleTo.includes(role)
                                ? "bg-brand-blue text-white border-brand-blue"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {ROLE_LABELS[role]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="watermark"
                        checked={docWatermark}
                        onChange={(e) => setDocWatermark(e.target.checked)}
                        data-testid="checkbox-watermark"
                        className="rounded border-slate-300"
                      />
                      <label htmlFor="watermark" className="text-sm text-slate-700">Wasserzeichen</label>
                    </div>
                    {uploadError && <p className="text-sm text-red-500" data-testid="text-upload-error">{uploadError}</p>}
                    <button
                      type="submit"
                      disabled={uploading || !docName.trim() || !docFile}
                      data-testid="button-submit-document"
                      className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
                    >
                      {uploading ? "Wird hochgeladen…" : "Hochladen"}
                    </button>
                  </form>
                </div>
              )}

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm" data-testid="table-documents">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Dateiname</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Typ</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Größe</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Sichtbar für</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Hochgeladen von</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50/50" data-testid={`row-document-${doc.id}`}>
                        <td className="px-4 py-3 font-medium text-slate-900">{doc.name}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{doc.fileName}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{doc.mimeType}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{formatFileSize(doc.fileSize)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {doc.visibleTo.map((r) => (
                              <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {ROLE_LABELS[r] || r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{doc.uploadedBy?.name ?? "–"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleDownloadDocument(doc.id)}
                              data-testid={`button-download-${doc.id}`}
                              className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium"
                            >
                              Herunterladen
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              data-testid={`button-delete-document-${doc.id}`}
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Löschen
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {documents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          Keine Dokumente vorhanden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeStep === 4 && (
          <>
            {(!hasExercises || !hasDates || !hasDescription) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
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
              <h2 className="text-lg font-semibold text-brand-navy mb-4">Assessment-Status</h2>
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
                <Link
                  href={`/w/${workspaceSlug}/assessment`}
                  className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3 hover:border-brand-blue/40 hover:bg-blue-50/20 transition-colors"
                  data-testid="link-candidate-portal"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">Kandidatenportal</p>
                    <p className="text-xs text-slate-500">Zugang für Kandidaten zum Assessment</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
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

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          {activeStep > 0 ? (
            <button
              onClick={() => handleStepChange(activeStep - 1)}
              data-testid="button-step-back"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium px-5 py-2.5 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Zurück
            </button>
          ) : (
            <div />
          )}
          {activeStep < STEPS.length - 1 && (
            <button
              onClick={() => handleStepChange(activeStep + 1)}
              data-testid="button-step-next"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-blue text-white text-sm font-medium px-5 py-2.5 hover:bg-brand-blue-dark transition-colors"
            >
              Weiter
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          )}
        </div>
      </main>

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

      <footer className="border-t py-6 border-slate-200">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
