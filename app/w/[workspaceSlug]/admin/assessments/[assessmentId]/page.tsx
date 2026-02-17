"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface AssessmentRecord {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
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
  status: string;
  aiGenerated: boolean;
  createdAt: string;
}

interface LibraryItem {
  id: string;
  name: string;
  type: string;
  difficultyLevel: string | null;
  tags: string[];
  status: string;
  description: string | null;
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
  presentation: "Präsentation",
  interview: "Interview",
  group_discussion: "Gruppendiskussion",
  case_study: "Fallstudie",
  role_play: "Rollenspiel",
  in_tray: "Postkorb",
  psychometric: "Psychometrisch",
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

  const fetchLibraryItems = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/exercise-library`);
      if (res.ok) setLibraryItems(await res.json());
    } catch {}
    finally { setLibraryLoading(false); }
  }, [workspaceSlug]);

  useEffect(() => {
    fetchAssessment();
    fetchExercises();
    fetchDocuments();
    fetchCandidates();
    fetchAvailableUsers();
    fetchObservationSheets();
  }, [fetchAssessment, fetchExercises, fetchDocuments, fetchCandidates, fetchAvailableUsers, fetchObservationSheets]);

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

  const handleCreateAISheet = async () => {
    const prompt = window.prompt("Beschreiben Sie den gewünschten Beobachtungsbogen:");
    if (!prompt) return;
    try {
      await fetch(`${apiBase}/observation-sheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "KI-Beobachtungsbogen",
          description: prompt,
          type: "ai",
          aiGenerated: true,
        }),
      });
      fetchObservationSheets();
    } catch {}
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
          name: item.name,
          type: item.type,
          instructions: item.description || null,
          duration: null,
          sortOrder: 0,
        }),
      });
      fetchExercises();
    } catch {}
  };

  const handleAIVariantImport = async (item: LibraryItem) => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/exercise-library/${item.id}/generate-variant`);
      if (res.ok) {
        const variant = await res.json();
        await fetch(`${apiBase}/exercises`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: variant.name || item.name + " (KI-Variante)",
            type: variant.type || item.type,
            instructions: variant.description || variant.instructions || item.description || null,
            duration: variant.duration || null,
            sortOrder: 0,
          }),
        });
        fetchExercises();
      }
    } catch {}
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

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Assessment Info */}
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
              <Link
                href={`/w/${workspaceSlug}/admin/intelligence?assessmentId=${assessmentId}`}
                className="ml-auto rounded-lg border border-brand-blue text-brand-blue text-sm font-medium px-4 py-2 hover:bg-brand-blue hover:text-white transition-colors"
                data-testid="link-intelligence"
              >
                Advanced Intelligence
              </Link>
            </div>
          </div>
        </div>

        {/* Exercises */}
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
              <h3 className="text-sm font-semibold text-brand-navy mb-3">Übungsbibliothek</h3>
              {libraryLoading ? (
                <p className="text-sm text-slate-400">Laden…</p>
              ) : libraryItems.length === 0 ? (
                <p className="text-sm text-slate-400">Keine Einträge in der Bibliothek.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {libraryItems.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-lg p-3 bg-white" data-testid={`library-item-${item.id}`}>
                      <p className="font-medium text-sm text-slate-900 mb-1">{item.name}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          {EXERCISE_TYPE_LABELS[item.type] || item.type}
                        </span>
                        {item.difficultyLevel && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                            {item.difficultyLevel}
                          </span>
                        )}
                        {item.tags?.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{item.description}</p>
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
                <button
                  type="submit"
                  disabled={exCreating || !exName.trim()}
                  data-testid="button-submit-exercise"
                  className="rounded-lg bg-brand-blue text-white text-sm font-medium px-6 py-2 hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
                >
                  {exCreating ? "Wird erstellt…" : "Übung erstellen"}
                </button>
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

        {/* Documents */}
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

        {/* Participants */}
        <div id="participants" className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-navy">Teilnehmer</h2>
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

        {/* Observation Sheets */}
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
                className="border border-slate-200 rounded-lg px-4 py-3"
                data-testid={`row-sheet-${sheet.id}`}
              >
                <div className="flex items-start justify-between">
                  <div>
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
                      <p className="text-xs text-brand-blue mb-1">
                        Übung: {exercises.find((ex) => ex.id === sheet.exerciseId)?.name || sheet.exerciseId}
                      </p>
                    )}
                    {sheet.description && (
                      <p className="text-xs text-slate-500">{sheet.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(sheet.createdAt)}</span>
                </div>
              </div>
            ))}
            {observationSheets.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Keine Beobachtungsbögen vorhanden.</p>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t py-6 border-slate-200">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
