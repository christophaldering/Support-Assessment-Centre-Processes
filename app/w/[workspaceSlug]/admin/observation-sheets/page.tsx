"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ObservationSheetTemplate {
  id: string;
  name: string;
  description: string | null;
  type: string;
  tags: string[];
  targetLevels: string[];
  fileName: string | null;
  originalFileName: string | null;
  status: string;
  aiGenerated: boolean;
  createdAt: string;
}

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  "verhaltensanker-bogen": "Verhaltensanker-Bogen",
  "kompetenzmatrix": "Kompetenzmatrix",
  "freitext-bogen": "Freitext-Bogen",
  "kombinierter-bogen": "Kombinierter Bogen",
  uploaded: "Hochgeladen",
  manual: "Manuell",
};

const TEMPLATE_TYPES = [
  { value: "verhaltensanker-bogen", label: "Verhaltensanker-Bogen" },
  { value: "kompetenzmatrix", label: "Kompetenzmatrix" },
  { value: "freitext-bogen", label: "Freitext-Bogen" },
  { value: "kombinierter-bogen", label: "Kombinierter Bogen" },
];

const TARGET_LEVELS = ["SE-Level / Vorstand", "Director / Bereichsleitung", "Manager", "Expert"];

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "Aktiv", bg: "bg-emerald-50", text: "text-emerald-600" },
  archived: { label: "Archiviert", bg: "bg-slate-50", text: "text-slate-500" },
};

const ACCENT = "hsl(14, 48%, 44%)";

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]";

export default function ObservationSheetsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;

  const [items, setItems] = useState<ObservationSheetTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createType, setCreateType] = useState("verhaltensanker-bogen");
  const [createTags, setCreateTags] = useState("");
  const [createLevels, setCreateLevels] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadLevels, setUploadLevels] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchItems = useCallback(async (searchVal?: string) => {
    try {
      const s = searchVal !== undefined ? searchVal : search;
      const qp = new URLSearchParams();
      if (s) qp.set("search", s);
      if (filterType) qp.set("type", filterType);

      const res = await fetch(`/api/w/${workspaceSlug}/observation-sheet-templates?${qp.toString()}`, {
        credentials: "include",
      });
      if (res.status === 401) { router.push(`/w/${workspaceSlug}/login`); return; }
      if (res.status === 403) { setError("Keine Berechtigung für die Beobachtungsbögen."); return; }
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch { setError("Fehler beim Laden der Beobachtungsbögen."); }
    finally { setLoading(false); }
  }, [workspaceSlug, router, search, filterType]);

  useEffect(() => { fetchItems(); }, [filterType]);
  useEffect(() => { fetchItems(); }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchItems(val); }, 300);
  };

  const toggleArrayItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const tags = createTags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch(`/api/w/${workspaceSlug}/observation-sheet-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: createName,
          description: createDescription || null,
          type: createType,
          tags,
          targetLevels: createLevels,
        }),
      });
      if (!res.ok) { const d = await res.json(); setCreateError(d.error || "Fehler beim Erstellen."); return; }
      setShowCreate(false);
      setCreateName("");
      setCreateDescription("");
      setCreateType("verhaltensanker-bogen");
      setCreateTags("");
      setCreateLevels([]);
      fetchItems();
    } catch { setCreateError("Ungültige Eingabe."); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Beobachtungsbogen-Vorlage wirklich löschen?")) return;
    try {
      await fetch(`/api/w/${workspaceSlug}/observation-sheet-templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchItems();
    } catch {}
  };

  const handleFileSelect = (file: File) => {
    const allowedExtensions = [".docx", ".pptx", ".pdf"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setUploadError("Nur Word (.docx), PowerPoint (.pptx) und PDF (.pdf) Dateien sind erlaubt.");
      return;
    }
    setUploadFile(file);
    setUploadError("");
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    setUploadName(nameWithoutExt);
    setShowUploadForm(true);
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) return;
    setUploading(true);
    setUploadError("");
    setUploadProgress(10);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", uploadName);
      formData.append("description", uploadDescription);
      formData.append("targetLevels", uploadLevels.join(","));
      setUploadProgress(40);

      const res = await fetch(`/api/w/${workspaceSlug}/observation-sheet-templates/upload`, {
        method: "POST",
        credentials: "include",
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
      setUploadName("");
      setUploadDescription("");
      setUploadTags("");
      setUploadLevels([]);
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

  const handleCDAdapt = () => {
    alert("Coming soon");
  };

  const filteredItems = items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && item.type !== filterType) return false;
    return true;
  });

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
            <Link href="/" className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors" data-testid="link-module-overview">Modul-Übersicht</Link>
            <Link
              href={`/w/${workspaceSlug}/admin`}
              className="font-serif text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              {workspaceSlug}
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-sm text-white/70">Beobachtungsbögen Toolbox</span>
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
            Beobachtungsbögen
          </h1>
          <p className="text-sm text-slate-500">Observation Sheet Toolbox — Beobachtungsbögen erstellen, verwalten und filtern</p>
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
            <h3 className="text-sm font-semibold font-serif" style={{ color: ACCENT }} data-testid="text-upload-label">Beobachtungsbogen hochladen</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Laden Sie bestehende Beobachtungsbögen hoch. Das Original wird gespeichert und kann an das Corporate Design angepasst werden.
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    required
                    placeholder="Name des Beobachtungsbogens"
                    data-testid="input-upload-name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                  <input
                    type="text"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Optionale Beschreibung"
                    data-testid="input-upload-description"
                    className={inputClass}
                  />
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
              <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-lg">
                <svg className="h-4 w-4 text-violet-500 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>
                <span className="text-xs text-violet-700">Tags werden automatisch per KI generiert</span>
              </div>
              {uploadError && <p className="text-sm text-red-600" data-testid="text-upload-error">{uploadError}</p>}
              {uploadProgress > 0 && (
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, backgroundColor: ACCENT }} data-testid="upload-progress" />
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowUploadForm(false); setUploadFile(null); setUploadError(""); }}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg"
                  data-testid="button-upload-cancel"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !uploadName.trim()}
                  className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: ACCENT }}
                  data-testid="button-upload-submit"
                >
                  {uploading && <SpinnerIcon />}
                  {uploading ? "Wird hochgeladen..." : "Hochladen"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Beobachtungsbögen suchen..."
              data-testid="input-search"
              className={inputClass}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            data-testid="select-filter-type"
            className={inputClass + " sm:w-48"}
          >
            <option value="">Alle Typen</option>
            {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            <option value="uploaded">Hochgeladen</option>
            <option value="manual">Manuell</option>
          </select>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 text-sm text-white rounded-lg font-medium"
            style={{ backgroundColor: ACCENT }}
            data-testid="button-create-template"
          >
            + Vorlage erstellen
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-testid="text-error">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <SpinnerIcon />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20" data-testid="text-empty">
            <p className="text-slate-400 text-sm">Keine Beobachtungsbögen gefunden.</p>
          </div>
        ) : (
          <div className="grid gap-4" data-testid="template-list">
            {filteredItems.map(item => {
              const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.active;
              const typeLabel = TEMPLATE_TYPE_LABELS[item.type] || item.type;
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow" data-testid={`card-template-${item.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate" data-testid={`text-name-${item.id}`}>{item.name}</h3>
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }} data-testid={`badge-type-${item.id}`}>
                          {typeLabel}
                        </span>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.bg} ${statusInfo.text}`} data-testid={`badge-status-${item.id}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-slate-500 mb-2" data-testid={`text-description-${item.id}`}>{item.description}</p>
                      )}
                      {item.fileName && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                          <FileIcon />
                          <span data-testid={`text-filename-${item.id}`}>{item.fileName}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {item.tags.length > 0 && (
                          <svg className="h-3 w-3 text-violet-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>
                        )}
                        {item.tags.map((tag, i) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full" data-testid={`tag-${item.id}-${i}`}>{tag}</span>
                        ))}
                        {item.targetLevels.map((level, i) => (
                          <span key={`l-${i}`} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full" data-testid={`level-${item.id}-${i}`}>{level}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => alert("Bearbeiten-Funktion wird in Kürze verfügbar sein.")}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        data-testid={`button-edit-${item.id}`}
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={handleCDAdapt}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                        style={{ backgroundColor: ACCENT }}
                        data-testid={`button-cd-adapt-${item.id}`}
                      >
                        CD-Anpassung
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                        data-testid={`button-delete-${item.id}`}
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" data-testid="modal-create">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold font-serif mb-4" style={{ color: ACCENT }}>Beobachtungsbogen-Vorlage erstellen</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  placeholder="Name der Vorlage"
                  data-testid="input-create-name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Optionale Beschreibung"
                  data-testid="input-create-description"
                  className={inputClass + " min-h-[80px]"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Typ *</label>
                <select
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value)}
                  data-testid="select-create-type"
                  className={inputClass}
                >
                  {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (kommagetrennt)</label>
                <input
                  type="text"
                  value={createTags}
                  onChange={(e) => setCreateTags(e.target.value)}
                  placeholder="z.B. Führung, Strategie"
                  data-testid="input-create-tags"
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
                        data-testid={`checkbox-create-level-${level.toLowerCase().replace(/[\s/]+/g, "-")}`}
                        className="rounded border-slate-300"
                      />
                      {level}
                    </label>
                  ))}
                </div>
              </div>
              {createError && <p className="text-sm text-red-600" data-testid="text-create-error">{createError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateError(""); }}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg"
                  data-testid="button-create-cancel"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={creating || !createName.trim()}
                  className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: ACCENT }}
                  data-testid="button-create-submit"
                >
                  {creating && <SpinnerIcon />}
                  {creating ? "Wird erstellt..." : "Erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 text-center">
          <p className="text-xs text-slate-400" data-testid="text-footer">© Christoph Aldering · Private initiative / concept</p>
        </div>
      </footer>
    </div>
  );
}