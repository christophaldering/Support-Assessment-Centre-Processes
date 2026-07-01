"use client";

import { DocumentOriginBadge } from "@/components/shared/DocumentOriginBadge";
import { resolveOriginForExerciseLibraryItem } from "@/lib/document-origin";
import { PageShell } from "@/components/shared/PageShell";
import { Toolbar } from "@/components/shared/Toolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/shared/Card";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/app/components/RichTextEditor"), { ssr: false });

interface ExerciseLibraryItem {
  id: string;
  title: string;
  description?: string;
  exerciseType: string;
  tags: string[];
  targetLevels: string[];
  languagesAvailable: string[];
  qualityStatus: string;
  metadataJson: any;
  sourceContext?: string;
  originalFileName?: string;
  originalFileKey?: string;
  createdAt: string;
  _count?: { variants: number };
  clientId?: string;
  clientName?: string;
  projectName?: string;
  downloadAllowed?: boolean;
  archived?: boolean;
  scope?: string;
  scenarioId?: string;
}

interface PendingFile {
  file: File;
  exerciseType: string;
  targetLevels: string[];
  author: string;
  sourceContext: string;
  clientName: string;
  projectName: string;
}

interface AnalysisResult {
  fileIndex: number;
  fileName: string;
  generatedTitle: string;
  suggestedTags: string[];
  exerciseType: string;
  targetLevels: string[];
  author: string;
  sourceContext: string;
  description: string;
  file: File;
  clientName: string;
  projectName: string;
}

const ACCENT = "var(--eds-terracotta)";

const SCOPE_OPTIONS: { key: string; label: string; filterLabel: string }[] = [
  { key: "general", label: "Allgemein", filterLabel: "Allgemein" },
  { key: "client", label: "Kundenspezifisch", filterLabel: "Kunde" },
  { key: "project", label: "Projektspezifisch", filterLabel: "Projekt" },
  { key: "candidate", label: "Kandidatenspezifisch", filterLabel: "Kandidat" },
];

const SCOPE_LABELS: Record<string, string> = Object.fromEntries(
  SCOPE_OPTIONS.map((s) => [s.key, s.label])
);

const SCOPE_COLORS: Record<string, { background: string; color: string; border: string }> = {
  general:   { background: "var(--eds-bg-sunken)",        color: "var(--eds-text-secondary)",  border: "1px solid var(--eds-border)" },
  client:    { background: "var(--eds-status-blue-bg)",   color: "var(--eds-status-blue)",      border: "1px solid var(--eds-border-strong)" },
// no-eds-token: --eds-type-roleplay-bg nicht in tokens.css definiert — CSS-Fallback-Wert
  project:   { background: "var(--eds-type-roleplay-bg, #F5F3FF)",                     color: "var(--eds-type-roleplay)",                     border: "1px solid var(--eds-type-roleplay)" },
  candidate: { background: "var(--eds-status-amber-bg)",  color: "var(--eds-status-amber)",     border: "1px solid var(--eds-status-amber-bg)" },
};

const EXERCISE_CATEGORIES: { key: string; label: string }[] = [
  { key: "interview_guide", label: "Interview-Leitfäden" },
  { key: "case_study", label: "Fallstudien / Case Studies" },
  { key: "fact_finding", label: "Fact-Finding-Übungen" },
  { key: "presentation", label: "Präsentationen" },
  { key: "leadership_simulation", label: "Führungssimulationen" },
  { key: "peer_conversation", label: "Kollegengespräche" },
  { key: "group_exercise", label: "Gruppenübungen" },
  { key: "psychometric_test", label: "Psychometrische Verfahren" },
  { key: "other", label: "Sonstiges" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  EXERCISE_CATEGORIES.map((c) => [c.key, c.label])
);

const TARGET_LEVELS = [
  "C-Level / Vorstand",
  "HAL / Bereichsleiter",
  "Abteilungsleiter",
  "Gruppenleiter",
  "Fachfunktion",
];

const LEVEL_SHORT: Record<string, string> = {
  "C-Level / Vorstand": "Vorstand",
  "HAL / Bereichsleiter": "HAL",
  "Abteilungsleiter": "AbtL",
  "Gruppenleiter": "GrpL",
  "Fachfunktion": "Fach",
};

const ALLOWED_EXTENSIONS = [".docx", ".xlsx", ".pptx", ".pdf"];

function getFileExtension(name: string): string {
  return name.substring(name.lastIndexOf(".")).toLowerCase();
}

function isAllowedFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  return ALLOWED_EXTENSIONS.includes(ext);
}

function generateTitle(
  exerciseType: string,
  sourceContext: string,
  targetLevels: string[],
  author: string
): string {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const typeLabel = CATEGORY_LABELS[exerciseType] || exerciseType;
  const shortType = typeLabel.split(" ")[0].replace(/[^a-zA-ZäöüÄÖÜß-]/g, "");
  const company = sourceContext.trim().split(/\s+/)[0] || "Unbekannt";
  const level =
    targetLevels.length > 0
      ? LEVEL_SHORT[targetLevels[0]] || targetLevels[0].split("/")[0].trim()
      : "Alle";
  const authorShort =
    author
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("") || "NN";
  return `${dateStr}_${shortType}_${company}_${level}_${authorShort}`;
}

function SpinnerIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      className="h-10 w-10 text-[var(--eds-text-disabled)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function FileIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-[var(--eds-status-green)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function PendingFileRow({
  pf,
  index,
  onUpdate,
  onRemove,
}: {
  pf: PendingFile;
  index: number;
  onUpdate: (index: number, updates: Partial<PendingFile>) => void;
  onRemove: (index: number) => void;
}) {
  const toggleLevel = (level: string) => {
    const current = pf.targetLevels;
    const next = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    onUpdate(index, { targetLevels: next });
  };

  return (
    <div className="border border-[var(--eds-border)] rounded-lg p-4 bg-white" data-testid={`pending-file-${index}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileIcon className="h-5 w-5 text-[var(--eds-text-disabled)]" />
          <span className="text-sm font-medium text-[var(--eds-text-primary)]" data-testid={`text-filename-${index}`}>
            {pf.file.name}
          </span>
          <span className="text-xs text-[var(--eds-text-disabled)]">
            ({(pf.file.size / 1024).toFixed(0)} KB)
          </span>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="text-[var(--eds-text-disabled)] hover:text-[var(--eds-status-red)] transition-colors"
          data-testid={`button-remove-file-${index}`}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Übungstyp</label>
          <select
            value={pf.exerciseType}
            onChange={(e) => onUpdate(index, { exerciseType: e.target.value })}
            className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
            data-testid={`select-type-${index}`}
          >
            {EXERCISE_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Autor</label>
          <input
            type="text"
            value={pf.author}
            onChange={(e) => onUpdate(index, { author: e.target.value })}
            placeholder="z.B. Christoph Aldering"
            className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
            data-testid={`input-author-${index}`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">
            Ursprünglich konzipiert für
          </label>
          <input
            type="text"
            value={pf.sourceContext}
            onChange={(e) => onUpdate(index, { sourceContext: e.target.value })}
            placeholder="z.B. REWE Group"
            className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
            data-testid={`input-source-context-${index}`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Kunde</label>
          <input
            type="text"
            value={pf.clientName}
            onChange={(e) => onUpdate(index, { clientName: e.target.value })}
            placeholder="z.B. REWE Group"
            className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
            data-testid={`input-client-${index}`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Projekt</label>
          <input
            type="text"
            value={pf.projectName}
            onChange={(e) => onUpdate(index, { projectName: e.target.value })}
            placeholder="z.B. Führungskräfte-Assessment 2024"
            className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
            data-testid={`input-project-${index}`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Zielgruppe</label>
          <div className="flex flex-wrap gap-1.5">
            {TARGET_LEVELS.map((level) => (
              <label
                key={level}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer border transition-colors ${
                  pf.targetLevels.includes(level)
                    ? "border-[hsl(14,48%,44%)] bg-[hsl(14,48%,44%)]/10 text-[hsl(14,48%,44%)]"
                    : "border-[var(--eds-border)] text-[var(--eds-text-secondary)] hover:border-[var(--eds-border-strong)]"
                }`}
                data-testid={`checkbox-level-${index}-${level.replace(/\s/g, "-")}`}
              >
                <input
                  type="checkbox"
                  checked={pf.targetLevels.includes(level)}
                  onChange={() => toggleLevel(level)}
                  className="sr-only"
                />
                {LEVEL_SHORT[level] || level}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailModal({
  item,
  slug,
  onClose,
  onUpdated,
  onItemUpdated,
}: {
  item: ExerciseLibraryItem;
  slug: string;
  onClose: () => void;
  onUpdated?: () => void;
  onItemUpdated?: (updated: ExerciseLibraryItem) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description || "");
  const [editSourceContext, setEditSourceContext] = useState(item.sourceContext || item.metadataJson?.sourceContext || "");
  const [editDownloadAllowed, setEditDownloadAllowed] = useState(item.downloadAllowed !== false);
  const [editScope, setEditScope] = useState(item.scope || "general");

  useEffect(() => {
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditSourceContext(item.sourceContext || item.metadataJson?.sourceContext || "");
    setEditScope(item.scope || "general");
  }, [item.id, item.title, item.description, item.sourceContext, item.metadataJson, item.scope]);

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    try {
      const res = await fetch(`/api/w/${slug}/exercise-library/${item.id}/download`);
      if (!res.ok) {
        setError("Fehler beim Herunterladen");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.originalFileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError("Fehler beim Herunterladen");
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = () => {
    const url = `/api/w/${slug}/exercise-library/${item.id}/preview`;
    window.open(url, "_blank", "width=900,height=700,scrollbars=yes,resizable=yes");
  };

  const handleDelete = async () => {
    if (!confirm("Diese Übung wirklich löschen?")) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/w/${slug}/exercise-library/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Fehler beim Löschen");
        return;
      }
      onUpdated?.();
      onClose();
    } catch {
      setError("Fehler beim Löschen");
    } finally {
      setDeleting(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    setError("");
    try {
      const res = await fetch(`/api/w/${slug}/exercise-library/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive: true }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Fehler beim Archivieren");
        return;
      }
      onUpdated?.();
      onClose();
    } catch {
      setError("Fehler beim Archivieren");
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async () => {
    setArchiving(true);
    setError("");
    try {
      const res = await fetch(`/api/w/${slug}/exercise-library/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive: false }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Fehler beim Wiederherstellen");
        return;
      }
      onUpdated?.();
      onClose();
    } catch {
      setError("Fehler beim Wiederherstellen");
    } finally {
      setArchiving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/w/${slug}/exercise-library/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          sourceContext: editSourceContext,
          downloadAllowed: editDownloadAllowed,
          scope: editScope,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Fehler beim Speichern");
        return;
      }
      const updatedItem = await res.json();
      onItemUpdated?.(updatedItem);
      setSuccessMsg("Gespeichert");
      setEditing(false);
      onUpdated?.();
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch {
      setError("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const author = item.metadataJson?.author || "";
  const sourceCtx = item.sourceContext || item.metadataJson?.sourceContext || "";
  const isCaseStudy = item.exerciseType === "case_study";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="detail-modal-overlay"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto"
        data-testid={`detail-modal-${item.id}`}
      >
        <div className="sticky top-0 bg-white border-b border-[var(--eds-border)] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          {editing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-lg font-bold text-[var(--eds-text-primary)] bg-transparent border-b-2 border-[var(--eds-border-strong)] focus:border-[var(--eds-border-strong)] focus:outline-none flex-1 mr-4"
              style={{ fontFamily: "Playfair Display, serif" }}
              data-testid="input-edit-title"
            />
          ) : (
            <h2
              className="text-lg font-bold text-[var(--eds-text-primary)]"
              style={{ fontFamily: "Playfair Display, serif" }}
              data-testid="text-modal-title"
            >
              {editTitle || item.title}
            </h2>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--eds-border)] text-[var(--eds-text-secondary)] hover:bg-[var(--eds-bg-sunken)] transition-colors"
                data-testid="button-toggle-edit"
              >
                Bearbeiten
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)] transition-colors"
              data-testid="button-close-modal"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] rounded-lg text-[var(--eds-status-red)] text-sm" data-testid="text-modal-error">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-[var(--eds-status-green-bg)] border border-[var(--eds-status-green-bg)] rounded-lg text-[var(--eds-status-green)] text-sm" data-testid="text-modal-success">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wide">Typ</span>
              <p className="text-[var(--eds-text-primary)] mt-0.5" data-testid="text-modal-type">
                {CATEGORY_LABELS[item.exerciseType] || item.exerciseType}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wide">Erstellt</span>
              <p className="text-[var(--eds-text-primary)] mt-0.5" data-testid="text-modal-created">
                {new Date(item.createdAt).toLocaleDateString("de-DE")}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wide">Bereich</span>
              {editing ? (
                <select
                  value={editScope}
                  onChange={(e) => setEditScope(e.target.value)}
                  className="mt-0.5 w-full text-sm text-[var(--eds-text-primary)] rounded-lg border border-[var(--eds-border)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
                  data-testid="select-edit-scope"
                >
                  {SCOPE_OPTIONS.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-[var(--eds-text-primary)] mt-0.5" data-testid="text-modal-scope">
                  {(() => {
                    const scopeKey = item.scope || "general";
                    const colors = SCOPE_COLORS[scopeKey] || SCOPE_COLORS.general;
                    return (
                      <span className="text-xs font-medium px-2 py-0.5 rounded" style={colors}>
                        {SCOPE_LABELS[scopeKey] || scopeKey}
                      </span>
                    );
                  })()}
                </p>
              )}
            </div>
            {(author || editing) && (
              <div>
                <span className="text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wide">Autor</span>
                <p className="text-[var(--eds-text-primary)] mt-0.5" data-testid="text-modal-author">{author}</p>
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wide">
                Ursprünglich konzipiert für
              </span>
              {editing ? (
                <input
                  type="text"
                  value={editSourceContext}
                  onChange={(e) => setEditSourceContext(e.target.value)}
                  placeholder="z.B. Projekt XY"
                  className="mt-0.5 w-full text-sm text-[var(--eds-text-primary)] bg-transparent border-b border-[var(--eds-border-strong)] focus:border-[var(--eds-border-strong)] focus:outline-none"
                  data-testid="input-edit-source-context"
                />
              ) : (
                <p className="text-[var(--eds-text-primary)] mt-0.5" data-testid="text-modal-source">{sourceCtx || "–"}</p>
              )}
            </div>
            {(item.clientName || item.projectName) && (
              <>
                {item.clientName && (
                  <div>
                    <span className="text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wide">Kunde</span>
                    <p className="text-[var(--eds-text-primary)] mt-0.5" data-testid="text-modal-client">{item.clientName}</p>
                  </div>
                )}
                {item.projectName && (
                  <div>
                    <span className="text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wide">Projekt</span>
                    <p className="text-[var(--eds-text-primary)] mt-0.5" data-testid="text-modal-project">{item.projectName}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {item.targetLevels.length > 0 && (
            <div>
              <span className="text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wide">Zielgruppe</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {item.targetLevels.map((level) => (
                  <span
                    key={level}
                    className="px-2 py-0.5 rounded text-xs font-medium border"
                    style={{
                      borderColor: ACCENT,
                      color: ACCENT,
                      backgroundColor: "hsl(14, 48%, 44%, 0.08)",
                    }}
                    data-testid={`badge-modal-level-${level.replace(/\s/g, "-")}`}
                  >
                    {level}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wide">
              Beschreibung / Instruktion
            </span>
            {editing ? (
              <div className="mt-2" data-testid="editor-description">
                <RichTextEditor
                  content={editDescription}
                  onChange={setEditDescription}
                  placeholder="Übungsbeschreibung, Instruktion, Hinweise..."
                  minHeight="180px"
                />
              </div>
            ) : (
              <div className="text-sm text-[var(--eds-text-primary)] mt-1 leading-relaxed" data-testid="text-modal-description">
                {editDescription ? (
                  <div dangerouslySetInnerHTML={{ __html: editDescription }} />
                ) : (
                  <p className="text-[var(--eds-text-disabled)] italic">Keine Beschreibung vorhanden</p>
                )}
              </div>
            )}
          </div>

          {item.originalFileName && (
            <div>
              <span className="text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wide">
                Originaldatei
              </span>
              <p className="text-sm text-[var(--eds-text-primary)] mt-0.5" data-testid="text-modal-filename">
                {item.originalFileName}
              </p>
            </div>
          )}

          {editing && (
            <div>
              <span className="text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wide">
                Download für Kandidaten erlauben
              </span>
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={editDownloadAllowed}
                  onClick={() => setEditDownloadAllowed(!editDownloadAllowed)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: editDownloadAllowed ? ACCENT : "var(--eds-border-strong)",
                    focusRingColor: ACCENT,
                  }}
                  data-testid="toggle-download-allowed"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editDownloadAllowed ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-[var(--eds-text-primary)]">
                  {editDownloadAllowed ? "Erlaubt" : "Nicht erlaubt"}
                </span>
              </div>
            </div>
          )}

          {item.tags.length > 0 && (
            <div>
              <span className="text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wide">Tags</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-[var(--eds-bg-sunken)] text-[var(--eds-text-secondary)] text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[var(--eds-border)] px-6 py-4 flex items-center gap-3 rounded-b-2xl z-10">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                style={{ backgroundColor: ACCENT }}
                data-testid="button-save-exercise"
              >
                {saving ? <SpinnerIcon /> : null}
                {saving ? "Wird gespeichert..." : "Speichern"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditTitle(item.title);
                  setEditDescription(item.description || "");
                  setEditSourceContext(item.sourceContext || item.metadataJson?.sourceContext || "");
                  setEditScope(item.scope || "general");
                }}
                className="px-4 py-2 border border-[var(--eds-border-strong)] text-[var(--eds-text-secondary)] rounded-lg text-sm hover:bg-[var(--eds-bg-sunken)] transition"
                data-testid="button-cancel-edit"
              >
                Abbrechen
              </button>
            </>
          ) : (
            <>
              {item.originalFileKey && (
                <>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                    style={{ backgroundColor: ACCENT }}
                    data-testid="button-download"
                  >
                    {downloading ? <SpinnerIcon /> : <DownloadIcon />}
                    Herunterladen
                  </button>
                  <button
                    onClick={handlePreview}
                    className="flex items-center gap-2 px-4 py-2 border border-[var(--eds-border-strong)] text-[var(--eds-text-primary)] rounded-lg text-sm font-medium hover:bg-[var(--eds-bg-sunken)] transition"
                    data-testid="button-preview"
                  >
                    <EyeIcon />
                    Vorschau
                  </button>
                </>
              )}

              {isCaseStudy && (
                <>
                  <button
                    className="px-4 py-2 border border-[var(--eds-border-strong)] text-[var(--eds-text-disabled)] rounded-lg text-sm cursor-not-allowed"
                    disabled
                    data-testid="button-digitalize"
                  >
                    Digitalisieren (bald)
                  </button>
                  <Link
                    href={`/w/${slug}/admin/modules/case-study-dataroom`}
                    className="px-4 py-2 border border-[var(--eds-border-strong)] text-[var(--eds-text-primary)] rounded-lg text-sm hover:bg-[var(--eds-bg-sunken)] transition"
                    data-testid="link-case-study-dataroom"
                  >
                    Fallstudien-Datenraum öffnen
                  </Link>
                </>
              )}

              <div className="flex-1" />

              {item.archived ? (
                <button
                  onClick={handleRestore}
                  disabled={archiving}
                  className="flex items-center gap-1.5 px-3 py-2 text-[var(--eds-status-green)] hover:text-[var(--eds-status-green)] hover:bg-[var(--eds-status-green-bg)] rounded-lg text-sm transition"
                  data-testid="button-restore"
                >
                  {archiving ? <SpinnerIcon /> : null}
                  Wiederherstellen
                </button>
              ) : (
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  className="flex items-center gap-1.5 px-3 py-2 text-[var(--eds-status-amber)] hover:text-[var(--eds-status-amber)] hover:bg-[var(--eds-status-amber-bg)] rounded-lg text-sm transition"
                  data-testid="button-archive"
                >
                  {archiving ? <SpinnerIcon /> : null}
                  Archivieren
                </button>
              )}

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] hover:bg-[var(--eds-status-red-bg)] rounded-lg text-sm transition"
                data-testid="button-delete"
              >
                {deleting ? <SpinnerIcon /> : <TrashIcon />}
                Löschen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExerciseLibraryPage() {
  const params = useParams();
  const slug = params.workspaceSlug as string;

  const [allItems, setAllItems] = useState<ExerciseLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ExerciseLibraryItem | null>(null);

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [autoAnalyzeTrigger, setAutoAnalyzeTrigger] = useState(0);

  const [clients, setClients] = useState<{id: string; name: string; _count?: {exerciseLibraryItems: number}}[]>([]);
  const [activeClientFilter, setActiveClientFilter] = useState<string | null>(null);
  const [activeScopeFilter, setActiveScopeFilter] = useState<string | null>(null);
  const [activeSzenarioFilter, setActiveSzenarioFilter] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [requirementsAnalyses, setRequirementsAnalyses] = useState<{id: string; title: string; clientName?: string | null}[]>([]);
  const [selectedRequirementsAnalysisId, setSelectedRequirementsAnalysisId] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      let url = `/api/w/${slug}/exercise-library`;
      const params = new URLSearchParams();
      if (showArchived) {
        params.set("archived", "true");
      }
      if (activeClientFilter === "neutral") {
        params.set("client", "neutral");
      } else if (activeClientFilter) {
        params.set("clientId", activeClientFilter);
      }
      if (activeScopeFilter) {
        params.set("scope", activeScopeFilter);
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
      const res = await fetch(url);
      if (res.status === 401) return;
      if (res.status === 403) {
        setError("Keine Berechtigung für die Übungsbibliothek.");
        return;
      }
      if (!res.ok) throw new Error();
      setAllItems(await res.json());
    } catch {
      setError("Fehler beim Laden der Übungen.");
    } finally {
      setLoading(false);
    }
  }, [slug, activeClientFilter, activeScopeFilter, showArchived]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${slug}/clients`);
      if (res.ok) {
        setClients(await res.json());
      }
    } catch {}
  }, [slug]);

  useEffect(() => {
    fetchItems();
    fetchClients();
  }, [fetchItems, fetchClients]);

  useEffect(() => {
    fetch(`/api/w/${slug}/requirements-analysis`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) =>
        setRequirementsAnalyses(
          Array.isArray(data) ? data.filter((a: any) => a.status === "completed") : []
        )
      )
      .catch(() => {});
  }, [slug]);

  const categoryCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    for (const cat of EXERCISE_CATEGORIES) {
      counts[cat.key] = allItems.filter((i) => i.exerciseType === cat.key).length;
    }
    return counts;
  }, [allItems]);

  const filteredItems = allItems
    .filter((i) => !activeCategory || i.exerciseType === activeCategory)
    .filter((i) => !activeSzenarioFilter || !!i.scenarioId);

  const handleFilesSelected = useCallback((files: FileList | File[]) => {
    const newPending: PendingFile[] = [];
    for (const file of Array.from(files)) {
      if (isAllowedFile(file)) {
        newPending.push({
          file,
          exerciseType: "interview_guide",
          targetLevels: [],
          author: "",
          sourceContext: "",
          clientName: "",
          projectName: "",
        });
      }
    }
    if (newPending.length === 0) {
      setUploadError("Nur Word (.docx), Excel (.xlsx), PowerPoint (.pptx) und PDF (.pdf) Dateien sind erlaubt.");
      return;
    }
    setPendingFiles((prev) => [...prev, ...newPending]);
    setUploadError("");
    setUploadSuccess("");
    setAutoAnalyzeTrigger((t) => t + 1);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFilesSelected(e.dataTransfer.files);
      }
    },
    [handleFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const updatePendingFile = useCallback((index: number, updates: Partial<PendingFile>) => {
    setPendingFiles((prev) =>
      prev.map((pf, i) => (i === index ? { ...pf, ...updates } : pf))
    );
  }, []);

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAnalyzeAll = useCallback(async () => {
    if (pendingFiles.length === 0) return;
    setAnalyzing(true);
    setUploadError("");
    setUploadSuccess("");
    setAnalyzeProgress({ current: 0, total: pendingFiles.length });

    const results: AnalysisResult[] = [];

    for (let i = 0; i < pendingFiles.length; i++) {
      const pf = pendingFiles[i];
      setAnalyzeProgress({ current: i + 1, total: pendingFiles.length });

      const fallbackTitle = generateTitle(
        pf.exerciseType,
        pf.sourceContext,
        pf.targetLevels,
        pf.author
      );

      try {
        const formData = new FormData();
        formData.append("file", pf.file);
        const res = await fetch(`/api/w/${slug}/exercise-library/analyze-content`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          results.push({
            fileIndex: i,
            fileName: pf.file.name,
            generatedTitle: data.suggestedTitle || fallbackTitle,
            suggestedTags: data.tags || [],
            exerciseType: data.exerciseType || pf.exerciseType,
            targetLevels: data.targetLevels?.length > 0 ? data.targetLevels : [...pf.targetLevels],
            author: data.author || pf.author,
            sourceContext: data.sourceContext || pf.sourceContext,
            description: data.description || "",
            file: pf.file,
            clientName: data.clientName || pf.clientName,
            projectName: data.projectName || pf.projectName,
          });
        } else {
          const metaRes = await fetch(`/api/w/${slug}/exercise-library/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: fallbackTitle,
              exerciseType: pf.exerciseType,
              fileName: pf.file.name,
              description: "",
              sourceContext: pf.sourceContext,
              author: pf.author,
            }),
          });
          const metaData = metaRes.ok ? await metaRes.json() : { tags: [], title: fallbackTitle };
          results.push({
            fileIndex: i,
            fileName: pf.file.name,
            generatedTitle: metaData.suggestedTitle || metaData.title || fallbackTitle,
            suggestedTags: metaData.tags || [],
            exerciseType: pf.exerciseType,
            targetLevels: [...pf.targetLevels],
            author: pf.author,
            sourceContext: pf.sourceContext,
            description: "",
            file: pf.file,
            clientName: pf.clientName,
            projectName: pf.projectName,
          });
        }
      } catch {
        results.push({
          fileIndex: i,
          fileName: pf.file.name,
          generatedTitle: fallbackTitle,
          suggestedTags: [],
          exerciseType: pf.exerciseType,
          targetLevels: [...pf.targetLevels],
          author: pf.author,
          sourceContext: pf.sourceContext,
          description: "",
          file: pf.file,
          clientName: pf.clientName,
          projectName: pf.projectName,
        });
      }
    }

    setAnalysisResults(results);
    setAnalyzing(false);
  }, [pendingFiles, slug]);

  useEffect(() => {
    if (autoAnalyzeTrigger > 0 && pendingFiles.length > 0 && !analyzing && analysisResults.length === 0) {
      handleAnalyzeAll();
    }
  }, [autoAnalyzeTrigger]);

  const updateAnalysisResult = useCallback((index: number, updates: Partial<AnalysisResult>) => {
    setAnalysisResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r))
    );
  }, []);

  const removeTagFromResult = useCallback((resultIndex: number, tagIndex: number) => {
    setAnalysisResults((prev) =>
      prev.map((r, i) =>
        i === resultIndex
          ? { ...r, suggestedTags: r.suggestedTags.filter((_, ti) => ti !== tagIndex) }
          : r
      )
    );
  }, []);

  const addTagToResult = useCallback((resultIndex: number, tag: string) => {
    if (!tag.trim()) return;
    setAnalysisResults((prev) =>
      prev.map((r, i) =>
        i === resultIndex
          ? { ...r, suggestedTags: [...r.suggestedTags, tag.trim()] }
          : r
      )
    );
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (analysisResults.length === 0) return;
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");
    setUploadProgress({ current: 0, total: analysisResults.length });

    let successCount = 0;
    let lastError = "";

    for (let i = 0; i < analysisResults.length; i++) {
      const ar = analysisResults[i];
      setUploadProgress({ current: i + 1, total: analysisResults.length });

      const metadataJson = JSON.stringify({
        author: ar.author,
        sourceContext: ar.sourceContext,
      });

      const formData = new FormData();
      formData.append("file", ar.file);
      formData.append("title", ar.generatedTitle);
      formData.append("exerciseType", ar.exerciseType);
      formData.append("targetLevels", ar.targetLevels.join(","));
      formData.append("description", ar.description || "");
      formData.append("sourceProjectId", "");
      formData.append("tags", ar.suggestedTags.join(","));
      formData.append("clientName", ar.clientName || "");
      formData.append("projectName", ar.projectName || "");
      formData.append("languagesAvailable", "DE");
      formData.append("metadataJson", metadataJson);

      try {
        const res = await fetch(`/api/w/${slug}/exercise-library/upload`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          lastError = data.error || `Upload von "${ar.fileName}" fehlgeschlagen.`;
        } else {
          successCount++;
        }
      } catch {
        lastError = `Upload von "${ar.fileName}" fehlgeschlagen.`;
      }
    }

    if (successCount === analysisResults.length) {
      setUploadSuccess(`${successCount} Datei(en) erfolgreich gespeichert.`);
      setPendingFiles([]);
      setAnalysisResults([]);
    } else if (successCount > 0) {
      setUploadSuccess(`${successCount} von ${analysisResults.length} Datei(en) gespeichert.`);
      setUploadError(lastError);
      setPendingFiles([]);
      setAnalysisResults([]);
    } else {
      setUploadError(lastError || "Speichern fehlgeschlagen.");
    }

    setUploading(false);
    fetchItems();
  }, [analysisResults, slug, fetchItems]);

  const handleModalClose = useCallback(() => {
    setSelectedItem(null);
    fetchItems();
  }, [fetchItems]);

  const counts = categoryCounts();

  return (
    <PageShell
      breadcrumb={[{ label: "Übungsentwicklung" }, { label: "Baustein-Bibliothek" }]}
      title="Übungsbibliothek"
      description="Verwalten Sie wiederverwendbare Übungen für Assessment-Center"
      maxWidth="wide"
      primaryAction={
        <Link
          href={`/w/${slug}/admin/case-studio`}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: "var(--eds-lagune)" }}
          data-testid="button-new-case-study"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Neue Fallstudie erstellen
        </Link>
      }
      toolbar={
        <Toolbar
          filters={
            <>
              <span className="text-xs font-medium text-[var(--eds-text-tertiary)] mr-1">Bereich:</span>
              <button
                onClick={() => { setActiveScopeFilter(null); setActiveSzenarioFilter(false); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeScopeFilter === null && !activeSzenarioFilter
                    ? "text-white"
                    : "text-[var(--eds-text-secondary)] bg-[var(--eds-bg-sunken)] hover:bg-[var(--eds-border)]"
                }`}
                style={activeScopeFilter === null && !activeSzenarioFilter ? { backgroundColor: ACCENT } : undefined}
                data-testid="button-scope-all"
              >
                Alle
              </button>
              {SCOPE_OPTIONS.map((scope) => {
                const colors = SCOPE_COLORS[scope.key];
                return (
                  <button
                    key={scope.key}
                    onClick={() => { setActiveScopeFilter(scope.key); setActiveSzenarioFilter(false); }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={activeScopeFilter === scope.key && !activeSzenarioFilter
                      ? { background: ACCENT, color: "var(--eds-text-inverse)" }
                      : colors}
                    data-testid={`button-scope-${scope.key}`}
                  >
                    {scope.filterLabel}
                  </button>
                );
              })}
              <button
                onClick={() => { setActiveSzenarioFilter((v) => !v); setActiveScopeFilter(null); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={activeSzenarioFilter
                  ? { background: "var(--eds-lagune)", color: "var(--eds-bg-surface)" }
                  : { backgroundColor: "var(--eds-lagune-light)", color: "var(--eds-lagune)", border: "1px solid var(--eds-lagune-md)" }}
                data-testid="button-scope-szenario"
              >
                Szenario-Baustein
              </button>
            </>
          }
        />
      }
    >
        {error && (
          <div
            className="mb-4 p-3 bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] rounded-lg text-[var(--eds-status-red)] text-sm flex items-center justify-between"
            data-testid="text-error"
          >
            {error}
            <button
              onClick={() => setError("")}
              className="text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] ml-4"
              data-testid="button-dismiss-error"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        <section className="mb-8" data-testid="section-upload">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragOver
                ? "border-[hsl(14,48%,44%)] bg-[hsl(14,48%,44%)]/5"
                : "border-[var(--eds-border-strong)] hover:border-[hsl(14,48%,44%)]/50 bg-white"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            data-testid="upload-dropzone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.xlsx,.pptx,.pdf"
              multiple
              className="hidden"
              data-testid="input-upload-file"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesSelected(e.target.files);
                }
                e.target.value = "";
              }}
            />
            <div className="flex flex-col items-center gap-2">
              <UploadIcon />
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: "Playfair Display, serif", color: ACCENT }}
                data-testid="text-upload-label"
              >
                Übungen hochladen
              </h3>
              <p className="text-xs text-[var(--eds-text-tertiary)] max-w-md">
                Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen.
                Unterstützt: Word (.docx), Excel (.xlsx), PowerPoint (.pptx), PDF (.pdf)
              </p>
            </div>
          </div>

          {uploadError && (
            <div
              className="mt-3 p-3 bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] rounded-lg text-[var(--eds-status-red)] text-sm"
              data-testid="text-upload-error"
            >
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div
              className="mt-3 p-3 bg-[var(--eds-status-green-bg)] border border-[var(--eds-status-green-bg)] rounded-lg text-[var(--eds-status-green)] text-sm"
              data-testid="text-upload-success"
            >
              {uploadSuccess}
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="mt-4 space-y-3" data-testid="pending-files-list">
              <h3
                className="text-sm font-bold text-[var(--eds-text-primary)]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {pendingFiles.length} Datei(en) ausgewählt
              </h3>

              {pendingFiles.map((pf, i) => (
                <PendingFileRow
                  key={`${pf.file.name}-${i}`}
                  pf={pf}
                  index={i}
                  onUpdate={updatePendingFile}
                  onRemove={removePendingFile}
                />
              ))}

              {analysisResults.length === 0 && requirementsAnalyses.length > 0 && (
                <div className="mt-3 p-3 bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)] rounded-lg" data-testid="section-req-analysis-context">
                  <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">
                    Anforderungsanalyse als KI-Kontext (optional)
                  </label>
                  <select
                    value={selectedRequirementsAnalysisId}
                    onChange={(e) => setSelectedRequirementsAnalysisId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--eds-terracotta)]/20 focus:border-[var(--eds-terracotta)]"
                    data-testid="select-req-analysis"
                  >
                    <option value="">— Keine Analyse verwenden —</option>
                    {requirementsAnalyses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}{a.clientName ? ` · ${a.clientName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {analysisResults.length === 0 && (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleAnalyzeAll}
                    disabled={analyzing}
                    className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-medium text-sm shadow-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: ACCENT }}
                    data-testid="button-analyze-all"
                  >
                    {analyzing ? (
                      <>
                        <SpinnerIcon />
                        Analysiere ({analyzeProgress.current}/{analyzeProgress.total})...
                      </>
                    ) : (
                      "KI-Inhaltsanalyse starten"
                    )}
                  </button>
                  {!analyzing && (
                    <button
                      onClick={() => {
                        setPendingFiles([]);
                        setUploadError("");
                      }}
                      className="px-4 py-2.5 text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)] text-sm transition"
                      data-testid="button-clear-files"
                    >
                      Alle entfernen
                    </button>
                  )}
                </div>
              )}

              {analysisResults.length > 0 && (
                <div className="mt-4 space-y-4" data-testid="analysis-results">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckIcon />
                    <h4
                      className="text-sm font-bold text-[var(--eds-status-green)]"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      Analyse abgeschlossen — bitte prüfen und bestätigen
                    </h4>
                  </div>

                  {analysisResults.map((ar, idx) => (
                    <div
                      key={`analysis-${idx}`}
                      className="border border-[var(--eds-status-green-bg)] bg-[var(--eds-status-green-bg)]/30 rounded-lg p-4"
                      data-testid={`analysis-result-${idx}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-5 w-5 text-[var(--eds-text-disabled)]" />
                          <span className="text-sm font-medium text-[var(--eds-text-primary)]">
                            {ar.fileName}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">
                            Generierter Titel
                          </label>
                          <input
                            type="text"
                            value={ar.generatedTitle}
                            onChange={(e) => updateAnalysisResult(idx, { generatedTitle: e.target.value })}
                            className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
                            data-testid={`input-title-${idx}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">
                            Übungstyp
                          </label>
                          <select
                            value={ar.exerciseType}
                            onChange={(e) => updateAnalysisResult(idx, { exerciseType: e.target.value })}
                            className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
                            data-testid={`select-type-result-${idx}`}
                          >
                            {EXERCISE_CATEGORIES.map((c) => (
                              <option key={c.key} value={c.key}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Autor</label>
                          <input
                            type="text"
                            value={ar.author}
                            onChange={(e) => updateAnalysisResult(idx, { author: e.target.value })}
                            placeholder="z.B. Christoph Aldering"
                            className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
                            data-testid={`input-author-result-${idx}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Ursprünglich konzipiert für</label>
                          <input
                            type="text"
                            value={ar.sourceContext}
                            onChange={(e) => updateAnalysisResult(idx, { sourceContext: e.target.value })}
                            placeholder="z.B. REWE Group"
                            className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
                            data-testid={`input-source-result-${idx}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Kunde</label>
                          <input
                            type="text"
                            value={ar.clientName}
                            onChange={(e) => updateAnalysisResult(idx, { clientName: e.target.value })}
                            placeholder="z.B. REWE Group"
                            className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
                            data-testid={`input-client-result-${idx}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Projekt</label>
                          <input
                            type="text"
                            value={ar.projectName}
                            onChange={(e) => updateAnalysisResult(idx, { projectName: e.target.value })}
                            placeholder="z.B. Führungskräfte-Assessment 2024"
                            className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
                            data-testid={`input-project-result-${idx}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">Zielgruppe</label>
                          <div className="flex flex-wrap gap-1.5">
                            {TARGET_LEVELS.map((level) => (
                              <label
                                key={level}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer border transition-colors ${
                                  ar.targetLevels.includes(level)
                                    ? "border-[hsl(14,48%,44%)] bg-[hsl(14,48%,44%)]/10 text-[hsl(14,48%,44%)]"
                                    : "border-[var(--eds-border)] text-[var(--eds-text-secondary)] hover:border-[var(--eds-border-strong)]"
                                }`}
                                data-testid={`checkbox-level-result-${idx}-${level.replace(/\s/g, "-")}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={ar.targetLevels.includes(level)}
                                  onChange={() => {
                                    const next = ar.targetLevels.includes(level)
                                      ? ar.targetLevels.filter((l) => l !== level)
                                      : [...ar.targetLevels, level];
                                    updateAnalysisResult(idx, { targetLevels: next });
                                  }}
                                  className="sr-only"
                                />
                                {LEVEL_SHORT[level] || level}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {ar.description && (
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">
                            KI-Kurzbeschreibung
                            <span className="ml-1 text-xs text-[var(--eds-status-green)] font-normal">(wird mit Übung gespeichert)</span>
                          </label>
                          <textarea
                            value={ar.description}
                            onChange={(e) => updateAnalysisResult(idx, { description: e.target.value })}
                            rows={3}
                            className="w-full rounded-lg border border-[var(--eds-status-green-bg)] bg-[var(--eds-status-green-bg)]/50 px-3 py-2 text-sm text-[var(--eds-text-primary)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
                            data-testid={`textarea-description-${idx}`}
                          />
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="block text-xs font-medium text-[var(--eds-text-secondary)] mb-1">
                          KI-generierte Tags
                          <span className="ml-1 text-xs text-[var(--eds-text-disabled)] font-normal">(klicken zum Entfernen)</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {ar.suggestedTags.length > 0 ? (
                            ar.suggestedTags.map((tag, ti) => (
                              <span
                                key={`${tag}-${ti}`}
                                onClick={() => removeTagFromResult(idx, ti)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[hsl(14,48%,44%)]/10 text-[hsl(14,48%,44%)] border border-[hsl(14,48%,44%)]/20 cursor-pointer hover:bg-[var(--eds-status-red-bg)] hover:text-[var(--eds-status-red)] hover:border-[var(--eds-status-red-bg)] transition-colors"
                                data-testid={`tag-${idx}-${ti}`}
                              >
                                {tag}
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[var(--eds-text-disabled)] italic">Keine Tags generiert</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Neuen Tag hinzufügen…"
                            className="flex-1 rounded-lg border border-[var(--eds-border)] px-3 py-1.5 text-xs text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addTagToResult(idx, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                            data-testid={`input-add-tag-${idx}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSaveAll}
                      disabled={uploading}
                      className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-medium text-sm shadow-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: ACCENT }}
                      data-testid="button-save-all"
                    >
                      {uploading ? (
                        <>
                          <SpinnerIcon />
                          Speichere ({uploadProgress.current}/{uploadProgress.total})...
                        </>
                      ) : (
                        "Speichern"
                      )}
                    </button>
                    {!uploading && (
                      <button
                        onClick={() => {
                          setAnalysisResults([]);
                          setUploadError("");
                        }}
                        className="px-4 py-2.5 text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)] text-sm transition"
                        data-testid="button-discard-analysis"
                      >
                        Verwerfen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>


        {loading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="h-6 w-6 text-[var(--eds-text-disabled)]" />
          </div>
        ) : (
          <div className="flex gap-6" data-testid="section-library">
            <aside className="w-72 shrink-0" data-testid="category-sidebar">
              <h3
                className="text-sm font-bold text-[var(--eds-text-primary)] mb-3 uppercase tracking-wide"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Kategorien
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    activeCategory === null
                      ? "text-white font-medium"
                      : "text-[var(--eds-text-primary)] hover:bg-[var(--eds-bg-sunken)]"
                  }`}
                  style={activeCategory === null ? { backgroundColor: ACCENT } : undefined}
                  data-testid="button-category-all"
                >
                  <span>Alle Übungen</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      activeCategory === null
                        ? "bg-white/20 text-white"
                        : "bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)]"
                    }`}
                  >
                    {allItems.length}
                  </span>
                </button>

                {EXERCISE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      activeCategory === cat.key
                        ? "text-white font-medium"
                        : "text-[var(--eds-text-primary)] hover:bg-[var(--eds-bg-sunken)]"
                    }`}
                    style={
                      activeCategory === cat.key ? { backgroundColor: ACCENT } : undefined
                    }
                    data-testid={`button-category-${cat.key}`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        activeCategory === cat.key
                          ? "bg-white/20 text-white"
                          : "bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)]"
                      }`}
                    >
                      {counts[cat.key] || 0}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-bold text-[var(--eds-text-primary)] mb-3 uppercase tracking-wide" style={{ fontFamily: "Playfair Display, serif" }}>
                  Kunden
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveClientFilter(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      activeClientFilter === null ? "text-white font-medium" : "text-[var(--eds-text-primary)] hover:bg-[var(--eds-bg-sunken)]"
                    }`}
                    style={activeClientFilter === null ? { backgroundColor: ACCENT } : undefined}
                    data-testid="button-client-all"
                  >
                    <span>Alle Kunden</span>
                  </button>
                  <button
                    onClick={() => setActiveClientFilter("neutral")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      activeClientFilter === "neutral" ? "text-white font-medium" : "text-[var(--eds-text-primary)] hover:bg-[var(--eds-bg-sunken)]"
                    }`}
                    style={activeClientFilter === "neutral" ? { backgroundColor: ACCENT } : undefined}
                    data-testid="button-client-neutral"
                  >
                    <span>Allgemein / Neutral</span>
                  </button>
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => setActiveClientFilter(client.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        activeClientFilter === client.id ? "text-white font-medium" : "text-[var(--eds-text-primary)] hover:bg-[var(--eds-bg-sunken)]"
                      }`}
                      style={activeClientFilter === client.id ? { backgroundColor: ACCENT } : undefined}
                      data-testid={`button-client-${client.id}`}
                    >
                      <span>{client.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        activeClientFilter === client.id ? "bg-white/20 text-white" : "bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)]"
                      }`}>
                        {client._count?.exerciseLibraryItems || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    showArchived ? "text-white font-medium" : "text-[var(--eds-text-primary)] hover:bg-[var(--eds-bg-sunken)]"
                  }`}
                  style={showArchived ? { backgroundColor: ACCENT } : undefined}
                  data-testid="button-show-archived"
                >
                  <span>Archiv</span>
                </button>
              </div>
            </aside>

            <div className="flex-1 min-w-0" data-testid="document-list">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-sm font-bold text-[var(--eds-text-primary)] uppercase tracking-wide"
                  style={{ fontFamily: "Playfair Display, serif" }}
                  data-testid="text-category-title"
                >
                  {showArchived
                    ? "Archiv"
                    : activeCategory
                      ? CATEGORY_LABELS[activeCategory]
                      : "Alle Übungen"}
                  {" "}
                  <span className="text-[var(--eds-text-disabled)] font-normal">
                    ({filteredItems.length})
                  </span>
                </h3>
              </div>

              {filteredItems.length === 0 ? (
                <div
                  data-testid="text-empty-state"
                >
                  <EmptyState
                    icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
                    title={showArchived ? "Keine archivierten Übungen" : activeCategory ? "Keine Übungen in dieser Kategorie" : "Noch keine Übungen vorhanden"}
                    description={showArchived ? "Keine archivierten Übungen vorhanden." : activeCategory ? "Keine Übungen in dieser Kategorie vorhanden." : "Laden Sie Dateien hoch, um zu starten."}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((item) => {
                    const author = item.metadataJson?.author || "";
                    const sourceCtx =
                      item.sourceContext || item.metadataJson?.sourceContext || "";

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`border rounded-xl p-4 hover:shadow-md transition cursor-pointer ${
                          item.archived
                            ? "border-[var(--eds-status-amber-bg)] bg-[var(--eds-status-amber-bg)]/30 opacity-70"
                            : "border-[var(--eds-border)] bg-white hover:border-[var(--eds-border-strong)]"
                        }`}
                        data-testid={`card-item-${item.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4
                            className={`text-sm font-semibold ${item.archived ? "text-[var(--eds-text-tertiary)] line-through" : "text-[var(--eds-text-primary)]"}`}
                            data-testid={`text-item-title-${item.id}`}
                          >
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {(() => {
                              const scopeKey = item.scope || "general";
                              const colors = SCOPE_COLORS[scopeKey] || SCOPE_COLORS.general;
                              return (
                                <span
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                  style={colors}
                                  data-testid={`badge-scope-${item.id}`}
                                >
                                  {SCOPE_LABELS[scopeKey] || scopeKey}
                                </span>
                              );
                            })()}
                            {item.scenarioId && (
                              <Link
                                href={`/w/${slug}/admin/case-studio/${item.scenarioId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] font-medium text-[var(--eds-lagune)] bg-[var(--eds-lagune)]/10 border border-[var(--eds-lagune)]/20 px-1.5 py-0.5 rounded hover:bg-[var(--eds-lagune)]/20 transition-colors"
                                data-testid={`badge-scenario-${item.id}`}
                              >
                                Szenario-Baustein
                              </Link>
                            )}
                            {item.archived && (
                              <span className="text-[10px] font-medium text-[var(--eds-status-amber)] bg-[var(--eds-status-amber-bg)] px-1.5 py-0.5 rounded" data-testid={`badge-archived-${item.id}`}>
                                Archiviert
                              </span>
                            )}
                            <span className="text-xs text-[var(--eds-text-disabled)]">
                              {new Date(item.createdAt).toLocaleDateString("de-DE")}
                            </span>
                          </div>
                        </div>

                        {item.targetLevels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.targetLevels.map((level) => (
                              <span
                                key={level}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium border"
                                style={{
                                  borderColor: ACCENT,
                                  color: ACCENT,
                                  backgroundColor: "hsl(14, 48%, 44%, 0.06)",
                                }}
                                data-testid={`badge-level-${item.id}-${level.replace(/\s/g, "-")}`}
                              >
                                {LEVEL_SHORT[level] || level}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-[var(--eds-text-tertiary)] space-y-0.5">
                          {author && (
                            <p data-testid={`text-item-author-${item.id}`}>
                              <span className="font-medium text-[var(--eds-text-secondary)]">Autor:</span> {author}
                            </p>
                          )}
                          {sourceCtx && (
                            <p data-testid={`text-item-source-${item.id}`}>
                              <span className="font-medium text-[var(--eds-text-secondary)]">
                                Ursprünglich konzipiert für:
                              </span>{" "}
                              {sourceCtx}
                            </p>
                          )}
                          {(item.clientName || item.projectName) && (
                            <p data-testid={`text-item-client-${item.id}`}>
                              {item.clientName && <><span className="text-[var(--eds-text-disabled)]">Kunde:</span> {item.clientName}</>}
                              {item.clientName && item.projectName && " · "}
                              {item.projectName && <><span className="text-[var(--eds-text-disabled)]">Projekt:</span> {item.projectName}</>}
                            </p>
                          )}
                          {item.description && (
                            <p
                              className="line-clamp-2 text-[var(--eds-text-tertiary)]"
                              data-testid={`text-item-desc-${item.id}`}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      {selectedItem && (
        <DetailModal item={selectedItem} slug={slug} onClose={handleModalClose} onUpdated={fetchItems} onItemUpdated={setSelectedItem} />
      )}
    </PageShell>
  );
}
