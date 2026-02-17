"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
}

interface PendingFile {
  file: File;
  exerciseType: string;
  targetLevels: string[];
  author: string;
  sourceContext: string;
}

const ACCENT = "hsl(14, 48%, 44%)";

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
      className="h-10 w-10 text-slate-300"
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
    <div className="border border-slate-200 rounded-lg p-4 bg-white" data-testid={`pending-file-${index}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileIcon className="h-5 w-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-800" data-testid={`text-filename-${index}`}>
            {pf.file.name}
          </span>
          <span className="text-xs text-slate-400">
            ({(pf.file.size / 1024).toFixed(0)} KB)
          </span>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="text-slate-400 hover:text-red-500 transition-colors"
          data-testid={`button-remove-file-${index}`}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Übungstyp</label>
          <select
            value={pf.exerciseType}
            onChange={(e) => onUpdate(index, { exerciseType: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
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
          <label className="block text-xs font-medium text-slate-600 mb-1">Autor</label>
          <input
            type="text"
            value={pf.author}
            onChange={(e) => onUpdate(index, { author: e.target.value })}
            placeholder="z.B. Christoph Aldering"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
            data-testid={`input-author-${index}`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Ursprünglich konzipiert für
          </label>
          <input
            type="text"
            value={pf.sourceContext}
            onChange={(e) => onUpdate(index, { sourceContext: e.target.value })}
            placeholder="z.B. REWE Group"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]"
            data-testid={`input-source-context-${index}`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Zielgruppe</label>
          <div className="flex flex-wrap gap-1.5">
            {TARGET_LEVELS.map((level) => (
              <label
                key={level}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer border transition-colors ${
                  pf.targetLevels.includes(level)
                    ? "border-[hsl(14,48%,44%)] bg-[hsl(14,48%,44%)]/10 text-[hsl(14,48%,44%)]"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
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
}: {
  item: ExerciseLibraryItem;
  slug: string;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

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
    if (!confirm("Diesen Baustein wirklich löschen?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/w/${slug}/exercise-library/${item.id}`, { method: "DELETE" });
      onClose();
    } catch {
      setError("Fehler beim Löschen");
    } finally {
      setDeleting(false);
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
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2
            className="text-lg font-bold text-slate-800"
            style={{ fontFamily: "Playfair Display, serif" }}
            data-testid="text-modal-title"
          >
            {item.title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            data-testid="button-close-modal"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-testid="text-modal-error">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Typ</span>
              <p className="text-slate-800 mt-0.5" data-testid="text-modal-type">
                {CATEGORY_LABELS[item.exerciseType] || item.exerciseType}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Erstellt</span>
              <p className="text-slate-800 mt-0.5" data-testid="text-modal-created">
                {new Date(item.createdAt).toLocaleDateString("de-DE")}
              </p>
            </div>
            {author && (
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Autor</span>
                <p className="text-slate-800 mt-0.5" data-testid="text-modal-author">{author}</p>
              </div>
            )}
            {sourceCtx && (
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Ursprünglich konzipiert für
                </span>
                <p className="text-slate-800 mt-0.5" data-testid="text-modal-source">{sourceCtx}</p>
              </div>
            )}
          </div>

          {item.targetLevels.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Zielgruppe</span>
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

          {item.description && (
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Kurze Beschreibung
              </span>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed" data-testid="text-modal-description">
                {item.description}
              </p>
            </div>
          )}

          {item.originalFileName && (
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Originaldatei
              </span>
              <p className="text-sm text-slate-700 mt-0.5" data-testid="text-modal-filename">
                {item.originalFileName}
              </p>
            </div>
          )}

          {item.tags.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tags</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center gap-3 rounded-b-2xl">
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
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
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
                className="px-4 py-2 border border-slate-300 text-slate-400 rounded-lg text-sm cursor-not-allowed"
                disabled
                data-testid="button-digitalize"
              >
                Digitalisieren (bald)
              </button>
              <Link
                href={`/w/${slug}/admin/modules/case-study-dataroom`}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition"
                data-testid="link-case-study-dataroom"
              >
                Fallstudien-Datenraum öffnen
              </Link>
            </>
          )}

          <div className="flex-1" />

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm transition"
            data-testid="button-delete"
          >
            {deleting ? <SpinnerIcon /> : <TrashIcon />}
            Löschen
          </button>
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

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${slug}/exercise-library`);
      if (res.status === 401) return;
      if (res.status === 403) {
        setError("Keine Berechtigung für die Baustein-Bibliothek.");
        return;
      }
      if (!res.ok) throw new Error();
      setAllItems(await res.json());
    } catch {
      setError("Fehler beim Laden der Bausteine.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const categoryCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    for (const cat of EXERCISE_CATEGORIES) {
      counts[cat.key] = allItems.filter((i) => i.exerciseType === cat.key).length;
    }
    return counts;
  }, [allItems]);

  const filteredItems = activeCategory
    ? allItems.filter((i) => i.exerciseType === activeCategory)
    : allItems;

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

  const handleUploadAll = useCallback(async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");
    setUploadProgress({ current: 0, total: pendingFiles.length });

    let successCount = 0;
    let lastError = "";

    for (let i = 0; i < pendingFiles.length; i++) {
      const pf = pendingFiles[i];
      setUploadProgress({ current: i + 1, total: pendingFiles.length });

      const title = generateTitle(
        pf.exerciseType,
        pf.sourceContext,
        pf.targetLevels,
        pf.author
      );

      const metadataJson = JSON.stringify({
        author: pf.author,
        sourceContext: pf.sourceContext,
      });

      const formData = new FormData();
      formData.append("file", pf.file);
      formData.append("title", title);
      formData.append("exerciseType", pf.exerciseType);
      formData.append("targetLevels", pf.targetLevels.join(","));
      formData.append("description", "");
      formData.append("sourceProjectId", "");
      formData.append("tags", "");
      formData.append("languagesAvailable", "DE");
      formData.append("metadataJson", metadataJson);

      try {
        const res = await fetch(`/api/w/${slug}/exercise-library/upload`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          lastError = data.error || `Upload von "${pf.file.name}" fehlgeschlagen.`;
        } else {
          successCount++;
        }
      } catch {
        lastError = `Upload von "${pf.file.name}" fehlgeschlagen.`;
      }
    }

    if (successCount === pendingFiles.length) {
      setUploadSuccess(`${successCount} Datei(en) erfolgreich hochgeladen.`);
      setPendingFiles([]);
    } else if (successCount > 0) {
      setUploadSuccess(`${successCount} von ${pendingFiles.length} Datei(en) hochgeladen.`);
      setUploadError(lastError);
      setPendingFiles([]);
    } else {
      setUploadError(lastError || "Upload fehlgeschlagen.");
    }

    setUploading(false);
    fetchItems();
  }, [pendingFiles, slug, fetchItems]);

  const handleModalClose = useCallback(() => {
    setSelectedItem(null);
    fetchItems();
  }, [fetchItems]);

  const counts = categoryCounts();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header
        className="sticky top-0 z-40 text-white"
        style={{ backgroundColor: ACCENT }}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="link-module-overview"
            >
              Modul-Übersicht
            </Link>
            <Link
              href={`/w/${slug}/admin`}
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="link-back-dashboard"
            >
              Dashboard
            </Link>
            <h1
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: "Playfair Display, serif" }}
              data-testid="text-page-title"
            >
              Baustein-Bibliothek
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-6">
        {error && (
          <div
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between"
            data-testid="text-error"
          >
            {error}
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600 ml-4"
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
                : "border-slate-300 hover:border-[hsl(14,48%,44%)]/50 bg-white"
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
                Bausteine hochladen
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen.
                Unterstützt: Word (.docx), Excel (.xlsx), PowerPoint (.pptx), PDF (.pdf)
              </p>
            </div>
          </div>

          {uploadError && (
            <div
              className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              data-testid="text-upload-error"
            >
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div
              className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm"
              data-testid="text-upload-success"
            >
              {uploadSuccess}
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="mt-4 space-y-3" data-testid="pending-files-list">
              <h3
                className="text-sm font-bold text-slate-700"
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

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleUploadAll}
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-medium text-sm shadow-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: ACCENT }}
                  data-testid="button-upload-all"
                >
                  {uploading ? (
                    <>
                      <SpinnerIcon />
                      Hochladen ({uploadProgress.current}/{uploadProgress.total})...
                    </>
                  ) : (
                    "Analysieren & Speichern"
                  )}
                </button>
                {!uploading && (
                  <button
                    onClick={() => {
                      setPendingFiles([]);
                      setUploadError("");
                    }}
                    className="px-4 py-2.5 text-slate-500 hover:text-slate-700 text-sm transition"
                    data-testid="button-clear-files"
                  >
                    Alle entfernen
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <SpinnerIcon className="h-6 w-6 text-slate-400" />
          </div>
        ) : (
          <div className="flex gap-6" data-testid="section-library">
            <aside className="w-72 shrink-0" data-testid="category-sidebar">
              <h3
                className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide"
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
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  style={activeCategory === null ? { backgroundColor: ACCENT } : undefined}
                  data-testid="button-category-all"
                >
                  <span>Alle Bausteine</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      activeCategory === null
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
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
                        : "text-slate-700 hover:bg-slate-50"
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
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {counts[cat.key] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <div className="flex-1 min-w-0" data-testid="document-list">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-sm font-bold text-slate-700 uppercase tracking-wide"
                  style={{ fontFamily: "Playfair Display, serif" }}
                  data-testid="text-category-title"
                >
                  {activeCategory
                    ? CATEGORY_LABELS[activeCategory]
                    : "Alle Bausteine"}
                  {" "}
                  <span className="text-slate-400 font-normal">
                    ({filteredItems.length})
                  </span>
                </h3>
              </div>

              {filteredItems.length === 0 ? (
                <div
                  className="text-center py-16 border border-dashed border-slate-200 rounded-xl"
                  data-testid="text-empty-state"
                >
                  <FileIcon className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">
                    {activeCategory
                      ? "Keine Bausteine in dieser Kategorie vorhanden."
                      : "Noch keine Bausteine vorhanden. Laden Sie Dateien hoch, um zu starten."}
                  </p>
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
                        className="border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md hover:border-slate-300 transition cursor-pointer"
                        data-testid={`card-item-${item.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4
                            className="text-sm font-semibold text-slate-800"
                            data-testid={`text-item-title-${item.id}`}
                          >
                            {item.title}
                          </h4>
                          <span className="text-xs text-slate-400 shrink-0 ml-2">
                            {new Date(item.createdAt).toLocaleDateString("de-DE")}
                          </span>
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

                        <div className="text-xs text-slate-500 space-y-0.5">
                          {author && (
                            <p data-testid={`text-item-author-${item.id}`}>
                              <span className="font-medium text-slate-600">Autor:</span> {author}
                            </p>
                          )}
                          {sourceCtx && (
                            <p data-testid={`text-item-source-${item.id}`}>
                              <span className="font-medium text-slate-600">
                                Ursprünglich konzipiert für:
                              </span>{" "}
                              {sourceCtx}
                            </p>
                          )}
                          {item.description && (
                            <p
                              className="line-clamp-2 text-slate-500"
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
      </main>

      <footer className="border-t border-slate-100 py-4 text-center">
        <p className="text-xs text-slate-400" data-testid="text-footer">
          © Christoph Aldering · Private initiative / concept
        </p>
      </footer>

      {selectedItem && (
        <DetailModal item={selectedItem} slug={slug} onClose={handleModalClose} />
      )}
    </div>
  );
}
