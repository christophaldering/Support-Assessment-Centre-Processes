"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const ACCENT = "hsl(14, 48%, 44%)";

const CATEGORIES = [
  { value: "audio_recording", label: "Audioaufnahme" },
  { value: "ai_processing", label: "KI-Verarbeitung" },
  { value: "hr_sharing", label: "HR-Weitergabe" },
  { value: "data_export", label: "Datenexport" },
  { value: "transcription", label: "Transkription" },
  { value: "general", label: "Allgemein" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

interface ConsentTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  content: string;
  version: number;
  status: string;
  createdAt: string;
}

interface ConsentRecord {
  id: string;
  userId: string;
  feature: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  template?: { name: string };
}

type TabKey = "templates" | "records";

export default function ConsentManagementPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const [activeTab, setActiveTab] = useState<TabKey>("templates");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "templates", label: "Vorlagen" },
    { key: "records", label: "Einwilligungen" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-navy text-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/w/${workspaceSlug}/admin`}
              className="font-serif text-lg font-bold hover:opacity-80 transition-opacity"
              data-testid="link-workspace"
            >
              {workspaceSlug}
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-sm text-white/70">Einwilligungsverwaltung</span>
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
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}
            data-testid="heading-consents"
          >
            Einwilligungsverwaltung
          </h1>
          <p className="text-sm text-slate-500">
            Einwilligungsvorlagen und -aufzeichnungen verwalten
          </p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-${tab.key}`}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "text-[hsl(14,48%,44%)]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
              style={activeTab === tab.key ? { borderBottomColor: ACCENT } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "templates" && <TemplatesTab workspaceSlug={workspaceSlug} />}
        {activeTab === "records" && <RecordsTab workspaceSlug={workspaceSlug} />}
      </main>

      <footer className="border-t border-slate-100 py-6">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}

function TemplatesTab({ workspaceSlug }: { workspaceSlug: string }) {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formLanguage, setFormLanguage] = useState("de");
  const [formCategory, setFormCategory] = useState("general");
  const [formContent, setFormContent] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/consent-templates`);
      if (!res.ok) throw new Error();
      setTemplates(await res.json());
    } catch {
      setError("Fehler beim Laden der Vorlagen.");
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const resetForm = () => {
    setFormName("");
    setFormLanguage("de");
    setFormCategory("general");
    setFormContent("");
    setFormError("");
    setShowCreate(false);
    setEditingId(null);
  };

  const startEdit = (t: ConsentTemplate) => {
    setEditingId(t.id);
    setFormName(t.name);
    setFormLanguage(t.language);
    setFormCategory(t.category);
    setFormContent(t.content);
    setShowCreate(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    setFormError("");

    try {
      const body = { name: formName, language: formLanguage, category: formCategory, content: formContent };
      const url = editingId
        ? `/api/w/${workspaceSlug}/consent-templates/${editingId}`
        : `/api/w/${workspaceSlug}/consent-templates`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Fehler beim Speichern.");
        return;
      }

      resetForm();
      fetchTemplates();
    } catch {
      setFormError("Etwas ist schiefgelaufen.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/consent-templates/${id}`, { method: "DELETE" });
      fetchTemplates();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500" data-testid="text-template-count">
          {templates.length} Vorlagen
        </p>
        <button
          onClick={() => {
            if (showCreate) resetForm();
            else setShowCreate(true);
          }}
          className="rounded-lg text-white text-sm font-medium px-4 py-2 transition-colors"
          style={{ backgroundColor: ACCENT }}
          data-testid="button-create-template"
        >
          {showCreate ? "Abbrechen" : "Neue Vorlage"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500" data-testid="text-error">{error}</p>
      )}

      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}
          >
            {editingId ? "Vorlage bearbeiten" : "Neue Einwilligungsvorlage"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-template">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                data-testid="input-template-name"
                placeholder="z.B. Audioaufnahme-Einwilligung"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sprache</label>
                <select
                  value={formLanguage}
                  onChange={(e) => setFormLanguage(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                  data-testid="select-template-language"
                >
                  <option value="de">Deutsch</option>
                  <option value="en">Englisch</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                  data-testid="select-template-category"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Inhalt *</label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                required
                rows={5}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                data-testid="input-template-content"
                placeholder="Einwilligungstext eingeben…"
              />
            </div>
            {formError && (
              <p className="text-sm text-red-500" data-testid="text-form-error">{formError}</p>
            )}
            <button
              type="submit"
              disabled={formSaving || !formName.trim() || !formContent.trim()}
              className="rounded-lg text-white text-sm font-medium px-6 py-2 transition-colors disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
              data-testid="button-submit-template"
            >
              {formSaving ? "Wird gespeichert…" : editingId ? "Änderungen speichern" : "Vorlage erstellen"}
            </button>
          </form>
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Laden…</p>}

      <div className="space-y-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between"
            data-testid={`card-template-${t.id}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-slate-900">{t.name}</h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {CATEGORY_LABELS[t.category] || t.category}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  {t.language === "de" ? "Deutsch" : "Englisch"}
                </span>
                <span className="text-xs text-slate-400">v{t.version}</span>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">{t.content}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <button
                onClick={() => startEdit(t)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                data-testid={`button-edit-template-${t.id}`}
              >
                Bearbeiten
              </button>
              <button
                onClick={() => handleArchive(t.id)}
                className="text-xs font-medium text-red-500 hover:text-red-700"
                data-testid={`button-archive-template-${t.id}`}
              >
                Archivieren
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && !loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            Keine Einwilligungsvorlagen vorhanden.
          </div>
        )}
      </div>
    </div>
  );
}

function RecordsTab({ workspaceSlug }: { workspaceSlug: string }) {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterFeature, setFilterFeature] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      const url = filterFeature
        ? `/api/w/${workspaceSlug}/consents?feature=${encodeURIComponent(filterFeature)}`
        : `/api/w/${workspaceSlug}/consents`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setRecords(await res.json());
    } catch {
      setError("Fehler beim Laden der Einwilligungen.");
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, filterFeature]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const features = [...new Set(records.map((r) => r.feature))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500" data-testid="text-record-count">
          {records.length} Einwilligungen
        </p>
        <div>
          <select
            value={filterFeature}
            onChange={(e) => {
              setFilterFeature(e.target.value);
              setLoading(true);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
            data-testid="select-filter-feature"
          >
            <option value="">Alle Features</option>
            {features.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500" data-testid="text-error">{error}</p>
      )}

      {loading && <p className="text-sm text-slate-400">Laden…</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm" data-testid="table-records">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Benutzer-ID</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Feature</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Vorlage</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Datum</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`row-record-${r.id}`}>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.userId.substring(0, 8)}…</td>
                <td className="px-4 py-3">{r.feature}</td>
                <td className="px-4 py-3 text-slate-500">{r.template?.name || "–"}</td>
                <td className="px-4 py-3">
                  {r.granted ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                      Erteilt
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                      Verweigert
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(r.createdAt).toLocaleDateString("de-DE")}
                </td>
              </tr>
            ))}
            {records.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Keine Einwilligungen vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
