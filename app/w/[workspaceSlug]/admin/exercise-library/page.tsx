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
  exerciseType: string;
  tags: string[];
  targetLevels: string[];
  languagesAvailable: string[];
  qualityStatus: string;
  metadataJson: any;
  createdAt: string;
  _count?: { variants: number };
  variants?: ExerciseVariant[];
}

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

const TARGET_LEVELS = ["C-Level", "Vorstand", "Director", "VP", "Senior Manager", "Manager"];

const LANGUAGES = ["DE", "EN"];

const QUALITY_STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Entwurf", bg: "bg-slate-50", text: "text-slate-600" },
  validated: { label: "Validiert", bg: "bg-emerald-50", text: "text-emerald-600" },
  deprecated: { label: "Veraltet", bg: "bg-red-50", text: "text-red-500" },
};

const ACCENT = "hsl(14, 48%, 44%)";

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]";

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
  const [createType, setCreateType] = useState("presentation");
  const [createTags, setCreateTags] = useState("");
  const [createLevels, setCreateLevels] = useState<string[]>([]);
  const [createLanguages, setCreateLanguages] = useState<string[]>([]);
  const [createMetadata, setCreateMetadata] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<ExerciseLibraryItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editLevels, setEditLevels] = useState<string[]>([]);
  const [editLanguages, setEditLanguages] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
      setCreateType("presentation");
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
            onClick={() => setShowCreate(!showCreate)}
            data-testid="button-create-exercise"
            className="rounded-lg text-white text-sm font-medium px-4 py-2 transition-colors ml-auto"
            style={{ backgroundColor: ACCENT }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {showCreate ? "Abbrechen" : "+ Neue Übung"}
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
                        data-testid={`checkbox-level-${level.toLowerCase().replace(/\s+/g, "-")}`}
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
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-brand-navy font-serif text-sm leading-tight">{item.title}</h3>
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
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        data-testid={`button-delete-${item.id}`}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Löschen
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50 p-5">
                        <h4 className="text-sm font-semibold text-brand-navy mb-3">Varianten</h4>
                        {loadingDetail ? (
                          <p className="text-xs text-slate-400">Laden…</p>
                        ) : expandedDetail?.variants && expandedDetail.variants.length > 0 ? (
                          <div className="space-y-2">
                            {expandedDetail.variants.map(v => (
                              <div key={v.id} className="flex items-center gap-4 bg-white rounded-lg px-4 py-2.5 border border-slate-200 text-sm" data-testid={`variant-${v.id}`}>
                                <span className="font-medium text-slate-700">{v.variantType}</span>
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

      <footer className="border-t py-6 border-slate-200">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
