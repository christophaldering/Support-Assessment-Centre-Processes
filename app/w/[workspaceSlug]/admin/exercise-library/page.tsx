"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ExerciseVariant {
  id: string;
  variantType: string;
  language: string;
  version: number;
  createdAt: string;
}

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
  originalFileName?: string;
  originalFileKey?: string;
  createdAt: string;
  _count?: { variants: number };
  variants?: ExerciseVariant[];
}

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

const TARGET_LEVELS = ["SE-Level / Vorstand", "Director / Bereichsleitung", "Manager", "Expert"];

const LANGUAGES = ["DE", "EN"];

const QUALITY_STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Entwurf", bg: "bg-slate-50", text: "text-slate-600" },
  validated: { label: "Validiert", bg: "bg-emerald-50", text: "text-emerald-600" },
  deprecated: { label: "Veraltet", bg: "bg-red-50", text: "text-red-500" },
};

const ACCENT = "hsl(14, 48%, 44%)";

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]";

const GENERATE_STEPS = [
  "Anforderungen analysieren...",
  "Kompetenzen extrahieren...",
  "Übung strukturieren...",
  "Inhalte generieren...",
  "Qualitätsprüfung...",
];

export default function ExerciseLibraryPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;

  const [items, setItems] = useState<ExerciseLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createType, setCreateType] = useState("case_study");
  const [createTags, setCreateTags] = useState("");
  const [createLevels, setCreateLevels] = useState<string[]>([]);
  const [createLanguages, setCreateLanguages] = useState<string[]>([]);
  const [createMetadata, setCreateMetadata] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<ExerciseLibraryItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [generatingVariantId, setGeneratingVariantId] = useState<string | null>(null);
  const [generatedVariant, setGeneratedVariant] = useState<any>(null);
  const [variantSuccess, setVariantSuccess] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editLevels, setEditLevels] = useState<string[]>([]);
  const [editLanguages, setEditLanguages] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateSpec, setGenerateSpec] = useState({ name: "", type: "case_study", duration: 30, targetLevel: "Manager", competencies: "", description: "", context: "" });
  const [templatePackUrl, setTemplatePackUrl] = useState<string | null>(null);
  const [packGenerating, setPackGenerating] = useState(false);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("case_study");
  const [uploadLevels, setUploadLevels] = useState<string[]>([]);
  const [uploadTags, setUploadTags] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [generateStep, setGenerateStep] = useState(0);
  const [generateBasedOn, setGenerateBasedOn] = useState("");
  const [generateProjectId, setGenerateProjectId] = useState("");

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const generateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchItems = useCallback(async (searchVal?: string) => {
    try {
      const params = new URLSearchParams();
      const s = searchVal !== undefined ? searchVal : search;
      if (s) params.set("search", s);
      if (filterType) params.set("type", filterType);
      if (filterLevel) params.set("level", filterLevel);
      if (filterLanguage) params.set("language", filterLanguage);
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`/api/w/${workspaceSlug}/exercise-library?${params.toString()}`);
      if (res.status === 401) { router.push(`/w/${workspaceSlug}/login`); return; }
      if (res.status === 403) { setError("Keine Berechtigung für die Übungsbibliothek."); return; }
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch { setError("Fehler beim Laden der Übungen."); }
    finally { setLoading(false); }
  }, [workspaceSlug, router, search, filterType, filterLevel, filterLanguage, filterStatus]);

  useEffect(() => { fetchItems(); }, [filterType, filterLevel, filterLanguage, filterStatus]);

  useEffect(() => { fetchItems(); }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchItems(val); }, 300);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const tags = createTags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch(`/api/w/${workspaceSlug}/exercise-library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle,
          exerciseType: createType,
          tags,
          targetLevels: createLevels,
          languagesAvailable: createLanguages,
          metadataJson: createMetadata ? JSON.parse(createMetadata) : null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setCreateError(d.error || "Fehler beim Erstellen."); return; }
      setShowCreate(false);
      setCreateTitle("");
      setCreateType("case_study");
      setCreateTags("");
      setCreateLevels([]);
      setCreateLanguages([]);
      setCreateMetadata("");
      fetchItems();
    } catch { setCreateError("Ungültige Eingabe oder JSON-Format."); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/exercise-library/${id}`, { method: "DELETE" });
      if (expandedId === id) { setExpandedId(null); setExpandedDetail(null); }
      if (editingId === id) setEditingId(null);
      fetchItems();
    } catch {}
  };

  const handleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setExpandedDetail(null); return; }
    setExpandedId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/exercise-library/${id}`);
      if (res.ok) setExpandedDetail(await res.json());
    } catch {}
    finally { setLoadingDetail(false); }
  };

  const startEdit = (item: ExerciseLibraryItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditType(item.exerciseType);
    setEditTags(item.tags.join(", "));
    setEditLevels([...item.targetLevels]);
    setEditLanguages([...item.languagesAvailable]);
    setEditStatus(item.qualityStatus);
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    try {
      const tags = editTags.split(",").map(t => t.trim()).filter(Boolean);
      await fetch(`/api/w/${workspaceSlug}/exercise-library/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          exerciseType: editType,
          tags,
          targetLevels: editLevels,
          languagesAvailable: editLanguages,
          qualityStatus: editStatus,
        }),
      });
      setEditingId(null);
      fetchItems();
    } catch {}
    finally { setSaving(false); }
  };

  const toggleArrayItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const handleGenerateVariant = async (itemId: string) => {
    setGeneratingVariantId(itemId);
    setGeneratedVariant(null);
    setVariantSuccess(null);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/exercise-library/${itemId}/generate-variant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "DE" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler bei der Varianten-Generierung");
        return;
      }
      const data = await res.json();
      setGeneratedVariant(data);
      setVariantSuccess(itemId);
      setExpandedId(itemId);
      handleExpand(itemId);
      fetchItems();
    } catch {
      setError("Fehler bei der Varianten-Generierung");
    } finally {
      setGeneratingVariantId(null);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };

  const handleBatchAdapt = async () => {
    setBatchProcessing(true);
    setBatchResult(null);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/automation/adapt-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: Array.from(selectedItems) }),
      });
      const data = await res.json();
      setBatchResult(data);
      if (res.ok) { setSelectedItems(new Set()); fetchItems(); }
    } catch { setBatchResult({ error: "Fehler bei der Batch-Anpassung" }); }
    finally { setBatchProcessing(false); }
  };

  const handleGenerateExercise = async () => {
    setGenerating(true);
    setGenerateStep(0);
    generateIntervalRef.current = setInterval(() => {
      setGenerateStep(prev => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, 2000);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/automation/generate-exercise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spec: {
            name: generateSpec.name,
            type: generateSpec.type,
            duration: generateSpec.duration,
            targetLevel: generateSpec.targetLevel,
            competencyMappings: generateSpec.competencies.split(",").map(c => c.trim()).filter(Boolean),
            description: generateSpec.description,
            context: generateSpec.context || undefined,
            basedOnId: generateBasedOn || undefined,
            sourceProjectId: generateProjectId || undefined,
          },
          language: "DE",
        }),
      });
      if (res.ok) {
        setShowGenerateForm(false);
        setGenerateSpec({ name: "", type: "case_study", duration: 30, targetLevel: "Manager", competencies: "", description: "", context: "" });
        setGenerateBasedOn("");
        setGenerateProjectId("");
        fetchItems();
      }
    } catch {}
    finally {
      setGenerating(false);
      setGenerateStep(0);
      if (generateIntervalRef.current) { clearInterval(generateIntervalRef.current); generateIntervalRef.current = null; }
    }
  };

  const handleGenerateTemplatePack = async () => {
    setPackGenerating(true);
    setTemplatePackUrl(null);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/automation/template-pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: Array.from(selectedItems) }),
      });
      if (res.ok) {
        const data = await res.json();
        setTemplatePackUrl(data.downloadUrl || data.url || null);
        setSelectedItems(new Set());
      }
    } catch {}
    finally { setPackGenerating(false); }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/pdf",
    ];
    const allowedExtensions = [".docx", ".pptx", ".pdf"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      setUploadError("Nur Word (.docx), PowerPoint (.pptx) und PDF (.pdf) Dateien sind erlaubt.");
      return;
    }
    setUploadFile(file);
    setUploadError("");
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    setUploadTitle(nameWithoutExt);
    setShowUploadForm(true);
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    setUploadError("");
    setUploadProgress(10);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle);
      formData.append("exerciseType", uploadType);
      formData.append("targetLevels", uploadLevels.join(","));
      formData.append("tags", uploadTags);
      formData.append("description", uploadDesc);
      setUploadProgress(40);

      const res = await fetch(`/api/w/${workspaceSlug}/exercise-library/upload`, {
        method: "POST",
        body: formData,
      });
      setUploadProgress(80);

      if (!res.ok) {
        const data = await res.json();
        setUploadError(data.error || "Upload fehlgeschlagen.");
        return;
      }
      setUploadProgress(100);
      setShowUploadForm(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadType("case_study");
      setUploadLevels([]);
      setUploadTags("");
      setUploadDesc("");
      fetchItems();
    } catch {
      setUploadError("Upload fehlgeschlagen. Bitte versuchen Sie es erneut.");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const SpinnerIcon = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
  );

  const FileIcon = () => (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
  );

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
            <span className="text-sm text-white/70">Exercise Toolbox</span>
          </div>
          <Link
            href={`/w/${workspaceSlug}/admin`}
            className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
            data-testid="link-back"
          >
            Zurück
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-serif" style={{ color: ACCENT }}>
            Übungsbibliothek
          </h1>
          <p className="text-sm text-slate-500">Exercise Toolbox — Übungen erstellen, verwalten und filtern</p>
        </div>

        <div
          className="mb-6 border-2 border-dashed border-slate-300 rounded-xl bg-white p-6 text-center transition-colors hover:border-[hsl(14,48%,44%)]/50 cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          data-testid="upload-dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pptx,.pdf"
            className="hidden"
            data-testid="input-upload-file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-col items-center gap-2">
            <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <h3 className="text-sm font-semibold font-serif" style={{ color: ACCENT }} data-testid="text-upload-label">Übung hochladen</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Laden Sie bestehende Übungen hoch (Word, PowerPoint, PDF). Die Originalversion wird gespeichert und kann anschließend an das Corporate Design angepasst werden.
            </p>
            {uploadFile && !showUploadForm && (
              <p className="text-xs font-medium text-slate-700 mt-1" data-testid="text-upload-filename">{uploadFile.name}</p>
            )}
          </div>
        </div>

        {showUploadForm && uploadFile && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6" data-testid="upload-form">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold font-serif" style={{ color: ACCENT }}>Datei-Details</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileIcon />
                <span data-testid="text-upload-selected-file">{uploadFile.name}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Titel *</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                    placeholder="Übungstitel"
                    data-testid="input-upload-title"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Übungstyp *</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    data-testid="select-upload-type"
                    className={inputClass}
                  >
                    {EXERCISE_TYPES.map(t => <option key={t} value={t}>{EXERCISE_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Zielniveaus</label>
                <div className="flex flex-wrap gap-3">
                  {TARGET_LEVELS.map(level => (
                    <label key={level} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={uploadLevels.includes(level)}
                        onChange={() => toggleArrayItem(uploadLevels, level, setUploadLevels)}
                        data-testid={`checkbox-upload-level-${level.toLowerCase().replace(/[\s/]+/g, "-")}`}
                        className="rounded border-slate-300"
                      />
                      {level}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (kommagetrennt)</label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="z.B. Führung, Strategie, Kommunikation"
                  data-testid="input-upload-tags"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                <textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  rows={3}
                  placeholder="Kurzbeschreibung der Übung…"
                  data-testid="textarea-upload-desc"
                  className={inputClass}
                />
              </div>
              {uploadProgress > 0 && (
                <div className="w-full bg-slate-100 rounded-full h-2" data-testid="upload-progress">
                  <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, backgroundColor: ACCENT }} />
                </div>
              )}
              {uploadError && <p className="text-sm text-red-500" data-testid="text-upload-error">{uploadError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadTitle.trim()}
                  data-testid="button-submit-upload"
                  className="rounded-lg text-white text-sm font-medium px-6 py-2 disabled:opacity-50 transition-colors flex items-center gap-2"
                  style={{ backgroundColor: ACCENT }}
                >
                  {uploading && <SpinnerIcon />}
                  {uploading ? "Wird hochgeladen…" : "Hochladen"}
                </button>
                <button
                  onClick={() => { setShowUploadForm(false); setUploadFile(null); setUploadTitle(""); setUploadError(""); }}
                  className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2"
                  data-testid="button-cancel-upload"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Übung suchen…"
            data-testid="input-search"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)] w-full sm:w-64"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            data-testid="select-filter-type"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
          >
            <option value="">Alle Typen</option>
            {EXERCISE_TYPES.map(t => <option key={t} value={t}>{EXERCISE_TYPE_LABELS[t]}</option>)}
          </select>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            data-testid="select-filter-level"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
          >
            <option value="">Alle Level</option>
            {TARGET_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            data-testid="select-filter-language"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
          >
            <option value="">Alle Sprachen</option>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            data-testid="select-filter-status"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
          >
            <option value="">Alle Status</option>
            {Object.entries(QUALITY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button
            onClick={() => setShowGenerateForm(true)}
            data-testid="button-open-generate"
            className="rounded-lg text-white text-sm font-medium px-4 py-2 transition-colors ml-auto"
            style={{ backgroundColor: "#7c3aed" }}
          >
            Neue Übung generieren
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            data-testid="button-create-exercise"
            className="rounded-lg text-white text-sm font-medium px-4 py-2 transition-colors"
            style={{ backgroundColor: ACCENT }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {showCreate ? "Abbrechen" : "+ Neue Übung"}
          </button>
          <button
            onClick={handleSelectAll}
            data-testid="button-select-all"
            className="rounded-lg border border-slate-300 text-slate-600 text-sm font-medium px-3 py-2 hover:bg-slate-100 transition-colors"
          >
            {selectedItems.size === items.length && items.length > 0 ? "Alle abwählen" : "Alle auswählen"}
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mb-4" data-testid="text-error">{error}</p>}

        {showCreate && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold font-serif mb-4" style={{ color: ACCENT }}>Neue Übung erstellen</h2>
            <form onSubmit={handleCreate} className="space-y-4" data-testid="form-create-exercise">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Titel *</label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    required
                    placeholder="Übungstitel"
                    data-testid="input-title"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Übungstyp *</label>
                  <select
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value)}
                    data-testid="select-exercise-type"
                    className={inputClass}
                  >
                    {EXERCISE_TYPES.map(t => <option key={t} value={t}>{EXERCISE_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (kommagetrennt)</label>
                <input
                  type="text"
                  value={createTags}
                  onChange={(e) => setCreateTags(e.target.value)}
                  placeholder="z.B. Führung, Strategie, Kommunikation"
                  data-testid="input-tags"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Zielniveaus</label>
                <div className="flex flex-wrap gap-3">
                  {TARGET_LEVELS.map(level => (
                    <label key={level} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createLevels.includes(level)}
                        onChange={() => toggleArrayItem(createLevels, level, setCreateLevels)}
                        data-testid={`checkbox-level-${level.toLowerCase().replace(/[\s/]+/g, "-")}`}
                        className="rounded border-slate-300"
                      />
                      {level}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sprachen</label>
                <div className="flex gap-4">
                  {LANGUAGES.map(lang => (
                    <label key={lang} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createLanguages.includes(lang)}
                        onChange={() => toggleArrayItem(createLanguages, lang, setCreateLanguages)}
                        data-testid={`checkbox-lang-${lang.toLowerCase()}`}
                        className="rounded border-slate-300"
                      />
                      {lang}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Metadaten (JSON, optional)</label>
                <textarea
                  value={createMetadata}
                  onChange={(e) => setCreateMetadata(e.target.value)}
                  rows={3}
                  placeholder='{"key": "value"}'
                  data-testid="input-metadata"
                  className={inputClass}
                />
              </div>
              {createError && <p className="text-sm text-red-500" data-testid="text-create-error">{createError}</p>}
              <button
                type="submit"
                disabled={creating || !createTitle.trim()}
                data-testid="button-submit-exercise"
                className="rounded-lg text-white text-sm font-medium px-6 py-2 disabled:opacity-50 transition-colors"
                style={{ backgroundColor: ACCENT }}
              >
                {creating ? "Wird erstellt…" : "Übung erstellen"}
              </button>
            </form>
          </div>
        )}

        {showGenerateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold font-serif mb-4" style={{ color: "#7c3aed" }}>Neue Übung generieren</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input type="text" value={generateSpec.name} onChange={e => setGenerateSpec({ ...generateSpec, name: e.target.value })} data-testid="input-gen-name" className={inputClass} placeholder="Übungsname" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Basis-Übung (optional)</label>
                  <select value={generateBasedOn} onChange={e => setGenerateBasedOn(e.target.value)} data-testid="select-gen-based-on" className={inputClass}>
                    <option value="">— Keine Vorlage —</option>
                    {items.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
                    <select value={generateSpec.type} onChange={e => setGenerateSpec({ ...generateSpec, type: e.target.value })} data-testid="select-gen-type" className={inputClass}>
                      {EXERCISE_TYPES.map(t => <option key={t} value={t}>{EXERCISE_TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dauer in Minuten</label>
                    <input type="number" value={generateSpec.duration} onChange={e => setGenerateSpec({ ...generateSpec, duration: parseInt(e.target.value) || 0 })} data-testid="input-gen-duration" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ziel-Ebene</label>
                  <select value={generateSpec.targetLevel} onChange={e => setGenerateSpec({ ...generateSpec, targetLevel: e.target.value })} data-testid="select-gen-level" className={inputClass}>
                    {TARGET_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kompetenzen (kommagetrennt)</label>
                  <input type="text" value={generateSpec.competencies} onChange={e => setGenerateSpec({ ...generateSpec, competencies: e.target.value })} data-testid="input-gen-competencies" className={inputClass} placeholder="z.B. Führung, Strategie" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                  <textarea value={generateSpec.description} onChange={e => setGenerateSpec({ ...generateSpec, description: e.target.value })} data-testid="textarea-gen-description" className={inputClass} rows={3} placeholder="Beschreiben Sie die Übung…" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kontext (optional)</label>
                  <textarea value={generateSpec.context} onChange={e => setGenerateSpec({ ...generateSpec, context: e.target.value })} className={inputClass} rows={2} placeholder="Zusätzlicher Kontext…" />
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Projekt verknüpfen</label>
                  <input type="text" value={generateProjectId} onChange={e => setGenerateProjectId(e.target.value)} data-testid="input-gen-project-id" className={inputClass} placeholder="Projekt-ID / Anforderungsanalyse-Referenz" />
                </div>
              </div>

              {generating && (
                <div className="mt-5 space-y-2" data-testid="generate-progress">
                  {GENERATE_STEPS.map((step, i) => {
                    const stepNum = i + 1;
                    const isComplete = generateStep > stepNum;
                    const isActive = generateStep === stepNum;
                    const isPending = generateStep < stepNum;
                    return (
                      <div key={i} className={`flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg transition-all ${isActive ? "bg-violet-50" : ""}`}>
                        {isComplete && (
                          <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {isActive && (
                          <svg className="animate-spin h-5 w-5 text-violet-600 shrink-0" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        )}
                        {isPending && (
                          <div className="h-5 w-5 rounded-full border-2 border-slate-200 shrink-0" />
                        )}
                        <span className={`${isComplete ? "text-emerald-700" : isActive ? "text-violet-700 font-medium" : "text-slate-400"}`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 mt-5">
                <button onClick={handleGenerateExercise} disabled={generating || !generateSpec.name.trim()} data-testid="button-submit-generate" className="rounded-lg text-white text-sm font-medium px-5 py-2 disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: "#7c3aed" }}>
                  {generating && <SpinnerIcon />}
                  {generating ? "Generiert…" : "Übung generieren"}
                </button>
                <button onClick={() => { setShowGenerateForm(false); setGenerateStep(0); if (generateIntervalRef.current) { clearInterval(generateIntervalRef.current); generateIntervalRef.current = null; } }} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2">Abbrechen</button>
              </div>
            </div>
          </div>
        )}

        {batchResult && (
          <div className="mb-4 p-4 bg-violet-50 border border-violet-200 rounded-lg text-sm" data-testid="batch-result">
            {batchResult.error ? (
              <p className="text-red-600">{batchResult.error}</p>
            ) : (
              <div>
                <p className="font-medium text-violet-800">Batch-Anpassung abgeschlossen</p>
                {batchResult.results && <p className="text-violet-600 mt-1">{batchResult.results.length} Übungen verarbeitet</p>}
              </div>
            )}
            <button onClick={() => setBatchResult(null)} className="text-xs text-violet-500 underline mt-2">Schließen</button>
          </div>
        )}

        {templatePackUrl && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm" data-testid="template-pack-result">
            <p className="font-medium text-emerald-800">Template Pack erstellt</p>
            <a href={templatePackUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline text-xs mt-1 inline-block">Download Template Pack</a>
            <button onClick={() => setTemplatePackUrl(null)} className="text-xs text-emerald-500 underline mt-2 ml-3">Schließen</button>
          </div>
        )}

        {loading && <p className="text-sm text-slate-400">Laden…</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const typeBadge = EXERCISE_TYPE_LABELS[item.exerciseType] || item.exerciseType;
            const statusBadge = QUALITY_STATUS_LABELS[item.qualityStatus] || QUALITY_STATUS_LABELS.draft;
            const isExpanded = expandedId === item.id;
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-white border border-slate-200 rounded-xl overflow-hidden transition-shadow hover:shadow-md ${isExpanded ? "md:col-span-2 lg:col-span-3" : ""}`}
                data-testid={`card-exercise-${item.id}`}
              >
                {isEditing ? (
                  <div className="p-5 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Titel</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        data-testid={`input-edit-title-${item.id}`}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Typ</label>
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        data-testid={`select-edit-type-${item.id}`}
                        className={inputClass}
                      >
                        {EXERCISE_TYPES.map(t => <option key={t} value={t}>{EXERCISE_TYPE_LABELS[t]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Tags</label>
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        data-testid={`input-edit-tags-${item.id}`}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Zielniveaus</label>
                      <div className="flex flex-wrap gap-2">
                        {TARGET_LEVELS.map(level => (
                          <label key={level} className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editLevels.includes(level)}
                              onChange={() => toggleArrayItem(editLevels, level, setEditLevels)}
                              className="rounded border-slate-300"
                            />
                            {level}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Sprachen</label>
                      <div className="flex gap-3">
                        {LANGUAGES.map(lang => (
                          <label key={lang} className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editLanguages.includes(lang)}
                              onChange={() => toggleArrayItem(editLanguages, lang, setEditLanguages)}
                              className="rounded border-slate-300"
                            />
                            {lang}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        data-testid={`select-edit-status-${item.id}`}
                        className={inputClass}
                      >
                        {Object.entries(QUALITY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        disabled={saving}
                        data-testid={`button-save-${item.id}`}
                        className="rounded-lg text-white text-xs font-medium px-4 py-1.5 disabled:opacity-50 transition-colors"
                        style={{ backgroundColor: ACCENT }}
                      >
                        {saving ? "Speichern…" : "Speichern"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-medium px-3 py-1.5"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => handleExpand(item.id)}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={(e) => { e.stopPropagation(); handleSelectItem(item.id); }}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`checkbox-select-${item.id}`}
                          className="mt-1 rounded border-slate-300 shrink-0"
                        />
                        <h3 className="font-semibold text-brand-navy font-serif text-sm leading-tight flex-1">{item.title}</h3>
                        <span
                          className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: ACCENT }}
                        >
                          {typeBadge}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">{tag}</span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.targetLevels.map(level => (
                          <span key={level} className="text-[10px] border border-slate-200 text-slate-500 rounded px-1.5 py-0.5">{level}</span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{item.languagesAvailable.join(", ") || "—"}</span>
                        <span>{item._count?.variants ?? 0} Varianten</span>
                        <span className={`font-medium px-1.5 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 px-5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                          data-testid={`button-edit-${item.id}`}
                          className="text-xs font-medium transition-colors"
                          style={{ color: ACCENT }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleGenerateVariant(item.id); }}
                          disabled={generatingVariantId === item.id}
                          data-testid={`button-generate-variant-${item.id}`}
                          className="text-xs font-medium text-white px-2.5 py-1 rounded-full transition-opacity disabled:opacity-60 flex items-center gap-1.5"
                          style={{ backgroundColor: "#7c3aed" }}
                        >
                          {generatingVariantId === item.id ? (
                            <>
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              Generiert…
                            </>
                          ) : "CD-Variante erstellen"}
                        </button>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        data-testid={`button-delete-${item.id}`}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Löschen
                      </button>
                    </div>

                    {item.originalFileName && (
                      <div className="border-t border-slate-100 px-5 py-2 flex items-center gap-2 text-xs text-slate-400" data-testid={`file-info-${item.id}`}>
                        <FileIcon />
                        <span className="truncate">{item.originalFileName}</span>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50 p-5">
                        {variantSuccess === item.id && generatedVariant && (
                          <div className="mb-4 p-4 bg-violet-50 border border-violet-200 rounded-lg" data-testid={`variant-result-${item.id}`}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: "#7c3aed" }}>CD</span>
                              <span className="text-sm font-semibold text-violet-900" data-testid={`text-variant-success-${item.id}`}>CD-Variante wurde erstellt</span>
                            </div>
                            {generatedVariant.variant?.contentJson?.adaptedTitle && (
                              <p className="text-sm font-medium text-slate-800 mb-2">{generatedVariant.variant.contentJson.adaptedTitle}</p>
                            )}
                            {generatedVariant.variant?.contentJson?.designNotes && (
                              <div className="space-y-1.5 mb-2">
                                {generatedVariant.variant.contentJson.designNotes.colorUsage && (
                                  <p className="text-xs text-slate-600"><span className="font-medium">Farben:</span> {generatedVariant.variant.contentJson.designNotes.colorUsage}</p>
                                )}
                                {generatedVariant.variant.contentJson.designNotes.typographyNotes && (
                                  <p className="text-xs text-slate-600"><span className="font-medium">Typografie:</span> {generatedVariant.variant.contentJson.designNotes.typographyNotes}</p>
                                )}
                                {generatedVariant.variant.contentJson.designNotes.toneAdaptation && (
                                  <p className="text-xs text-slate-600"><span className="font-medium">Tonalität:</span> {generatedVariant.variant.contentJson.designNotes.toneAdaptation}</p>
                                )}
                                {generatedVariant.variant.contentJson.designNotes.brandingElements && (
                                  <p className="text-xs text-slate-600"><span className="font-medium">Branding:</span> {generatedVariant.variant.contentJson.designNotes.brandingElements}</p>
                                )}
                              </div>
                            )}
                            {generatedVariant.changeLog?.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-slate-600 mb-1">Änderungen:</p>
                                <ul className="list-disc list-inside text-xs text-slate-500 space-y-0.5">
                                  {generatedVariant.changeLog.map((c: string, i: number) => <li key={i}>{c}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        <h4 className="text-sm font-semibold text-brand-navy mb-3">Varianten</h4>
                        {loadingDetail ? (
                          <p className="text-xs text-slate-400">Laden…</p>
                        ) : expandedDetail?.variants && expandedDetail.variants.length > 0 ? (
                          <div className="space-y-2">
                            {expandedDetail.variants.map(v => (
                              <div key={v.id} className="flex items-center gap-4 bg-white rounded-lg px-4 py-2.5 border border-slate-200 text-sm" data-testid={`variant-${v.id}`}>
                                <span className={`font-medium ${v.variantType === "cd_adapted" ? "text-violet-700" : "text-slate-700"}`}>{v.variantType === "cd_adapted" ? "CD-Angepasst" : v.variantType}</span>
                                <span className="text-slate-400">{v.language}</span>
                                <span className="text-slate-400">v{v.version}</span>
                                <span className="text-slate-400 ml-auto text-xs">{new Date(v.createdAt).toLocaleDateString("de-DE")}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Keine Varianten vorhanden.</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {items.length === 0 && !loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            Keine Übungen vorhanden.
          </div>
        )}
      </main>

      {selectedItems.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">{selectedItems.size} ausgewählt</span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBatchAdapt}
                disabled={batchProcessing}
                data-testid="button-batch-adapt"
                className="rounded-lg text-white text-sm font-medium px-4 py-2 disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: "#7c3aed" }}
              >
                {batchProcessing && <SpinnerIcon />}
                Alle CD-anpassen
              </button>
              <button
                onClick={handleGenerateTemplatePack}
                disabled={packGenerating}
                data-testid="button-generate-pack"
                className="rounded-lg text-white text-sm font-medium px-4 py-2 disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: ACCENT }}
              >
                {packGenerating && <SpinnerIcon />}
                Template Pack erstellen
              </button>
              <button onClick={() => setSelectedItems(new Set())} className="text-sm text-slate-500 hover:text-slate-700 px-2">✕</button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t py-6 border-slate-200">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
