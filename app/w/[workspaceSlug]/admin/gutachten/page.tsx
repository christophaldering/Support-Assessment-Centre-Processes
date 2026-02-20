"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ReportTemplate {
  id: string;
  name: string;
  reportType: string;
  sourceFileName: string | null;
  sourceFileSize: number | null;
  sourceFilePath: string | null;
  anonymizedFilePath: string | null;
  isAnonymized: boolean;
  structureJson: Record<string, unknown> | null;
  styleRulesJson: Record<string, unknown> | null;
  analysisStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

type ReportType = "one_pager" | "gutachten" | "gesamtauswertung";

const REPORT_TYPE_META: Record<ReportType, { label: string; description: string }> = {
  one_pager: {
    label: "One-Pager",
    description: "Kurzzusammenfassung für den Auftraggeber",
  },
  gutachten: {
    label: "Ergebnisbericht",
    description: "Ausführliches Gutachten für Kandidat und Auftraggeber",
  },
  gesamtauswertung: {
    label: "Gesamtauswertung",
    description: "Kandidatenvergleich und Gesamtanalyse",
  },
};

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-slate-50", text: "text-slate-600", label: "Entwurf" },
  uploaded: { bg: "bg-blue-50", text: "text-blue-600", label: "Hochgeladen" },
  anonymized: { bg: "bg-amber-50", text: "text-amber-700", label: "Anonymisiert" },
  analyzed: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Analysiert" },
  active: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Aktiv" },
};

const ANALYSIS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-slate-50", text: "text-slate-500", label: "Ausstehend" },
  processing: { bg: "bg-blue-50", text: "text-blue-600", label: "In Bearbeitung" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Abgeschlossen" },
  failed: { bg: "bg-red-50", text: "text-red-600", label: "Fehlgeschlagen" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GutachtenGeneratorPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const [activeTab, setActiveTab] = useState<ReportType>("one_pager");
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/report-templates`);
      if (res.status === 401) {
        router.push(`/w/${workspaceSlug}/login`);
        return;
      }
      if (res.status === 403) {
        setError("Keine Berechtigung für den Gutachten-Generator.");
        return;
      }
      if (!res.ok) throw new Error();
      setTemplates(await res.json());
    } catch {
      setError("Fehler beim Laden der Vorlagen.");
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, router]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const tabs: { key: ReportType; label: string; testId: string }[] = [
    { key: "one_pager", label: "One-Pager", testId: "tab-one-pager" },
    { key: "gutachten", label: "Ergebnisbericht", testId: "tab-gutachten" },
    { key: "gesamtauswertung", label: "Gesamtauswertung", testId: "tab-gesamtauswertung" },
  ];

  const filteredTemplates = templates.filter((t) => t.reportType === activeTab);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#EFF4F5", fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif" }}>
      <header style={{ backgroundColor: "#A6473B" }} className="text-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/w/${workspaceSlug}/admin`}
              className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
              data-testid="link-workspace"
            >
              {workspaceSlug}
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-sm text-white/80">Gutachten-Generator</span>
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#A6473B" }} data-testid="heading-title">
            Gutachten-Generator
          </h1>
          <p className="text-sm text-slate-500 mt-1" data-testid="text-subtitle">
            Erstellen Sie professionelle Gutachten in drei Formaten: One-Pager für schnelle Übersichten,
            ausführliche Ergebnisberichte und Gesamtauswertungen für Kandidatenvergleiche.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" data-testid="text-error">
            {error}
          </div>
        )}

        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={tab.testId}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-current"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
              style={activeTab === tab.key ? { color: "#297587", borderColor: "#297587" } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ReportTypeSection
          workspaceSlug={workspaceSlug}
          reportType={activeTab}
          templates={filteredTemplates}
          loading={loading}
          onRefresh={fetchTemplates}
        />
      </main>

      <footer className="border-t py-6" style={{ borderColor: "#B5D6DE" }}>
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}

function ReportTypeSection({
  workspaceSlug,
  reportType,
  templates,
  loading,
  onRefresh,
}: {
  workspaceSlug: string;
  reportType: ReportType;
  templates: ReportTemplate[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [showUpload, setShowUpload] = useState(false);
  const meta = REPORT_TYPE_META[reportType];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#297587" }} data-testid={`heading-${reportType}`}>
              {meta.label}
            </h2>
            <p className="text-sm text-slate-500">{meta.description}</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            data-testid={`button-upload-${reportType}`}
            className="rounded-lg text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#297587" }}
          >
            {showUpload ? "Abbrechen" : "+ Vorlage hochladen"}
          </button>
        </div>

        {showUpload && (
          <UploadForm
            workspaceSlug={workspaceSlug}
            reportType={reportType}
            onUploaded={() => {
              setShowUpload(false);
              onRefresh();
            }}
            onCancel={() => setShowUpload(false)}
          />
        )}
      </div>

      {loading && (
        <div className="text-center py-8 text-sm text-slate-400">Vorlagen werden geladen…</div>
      )}

      {!loading && templates.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center" data-testid={`empty-${reportType}`}>
          <div className="text-3xl mb-3">📄</div>
          <p className="text-slate-500 text-sm">
            Noch keine Vorlagen für {meta.label} vorhanden.
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Laden Sie eine PPTX-Beispieldatei hoch, um zu beginnen.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} workspaceSlug={workspaceSlug} />
        ))}
      </div>
    </div>
  );
}

function UploadForm({
  workspaceSlug,
  reportType,
  onUploaded,
  onCancel,
}: {
  workspaceSlug: string;
  reportType: ReportType;
  onUploaded: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Bitte geben Sie einen Namen ein.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("reportType", reportType);
      if (file) formData.append("file", file);

      const res = await fetch(`/api/w/${workspaceSlug}/report-templates`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Hochladen.");
        return;
      }

      onUploaded();
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-lg border border-slate-200" style={{ backgroundColor: "#EFF4F5" }}>
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600" data-testid="text-upload-error">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Vorlagenname *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="input-template-name"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ "--tw-ring-color": "#297587" } as React.CSSProperties}
          placeholder="z.B. Standard One-Pager 2026"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">PPTX-Beispieldatei</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          data-testid="dropzone-file"
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver ? "border-[#297587] bg-[#297587]/5" : "border-slate-300 hover:border-[#297587]"
          }`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-medium text-slate-700">{file.name}</span>
              <span className="text-xs text-slate-400">({formatFileSize(file.size)})</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-red-500 hover:text-red-700 ml-2"
                data-testid="button-remove-file"
              >
                Entfernen
              </button>
            </div>
          ) : (
            <div>
              <div className="text-2xl mb-1">📎</div>
              <p className="text-sm text-slate-600">
                PPTX-Datei hierher ziehen oder <span style={{ color: "#297587" }} className="font-medium">klicken</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">PowerPoint-Vorlagen (.pptx)</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            data-testid="input-file"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          data-testid="button-cancel-upload"
          className="rounded-lg border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 hover:bg-slate-50 transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={uploading}
          data-testid="button-submit-upload"
          className="rounded-lg text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "#A6473B" }}
        >
          {uploading ? "Wird hochgeladen…" : "Vorlage speichern"}
        </button>
      </div>
    </form>
  );
}

function TemplateCard({ template, workspaceSlug }: { template: ReportTemplate; workspaceSlug: string }) {
  const [expanded, setExpanded] = useState(false);
  const statusBadge = STATUS_BADGES[template.status] || STATUS_BADGES.draft;
  const analysisBadge = ANALYSIS_BADGES[template.analysisStatus] || ANALYSIS_BADGES.pending;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid={`card-template-${template.id}`}>
      <div
        className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-slate-800 truncate" data-testid={`text-template-name-${template.id}`}>
              {template.name}
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`} data-testid={`badge-status-${template.id}`}>
              {statusBadge.label}
            </span>
            {template.isAnonymized && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600" data-testid={`badge-anonymized-${template.id}`}>
                Anonymisierung ✓
              </span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${analysisBadge.bg} ${analysisBadge.text}`} data-testid={`badge-analysis-${template.id}`}>
              {analysisBadge.label}
            </span>
          </div>
          <div className="flex gap-4 text-xs text-slate-400">
            {template.sourceFileName && (
              <span data-testid={`text-filename-${template.id}`}>📄 {template.sourceFileName}</span>
            )}
            {template.sourceFileSize && (
              <span>{formatFileSize(template.sourceFileSize)}</span>
            )}
            <span>Erstellt: {formatDate(template.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            data-testid={`button-generate-report-${template.id}`}
            className="rounded-lg text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#A6473B" }}
          >
            Bericht generieren
          </button>
          <span className="text-slate-400 text-sm">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 p-6" style={{ backgroundColor: "#EFF4F5" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Vorlageninformationen</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Berichtstyp</dt>
                  <dd className="font-medium text-slate-700">{REPORT_TYPE_META[template.reportType as ReportType]?.label || template.reportType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Quelldatei</dt>
                  <dd className="font-medium text-slate-700">{template.sourceFileName || "–"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Dateigröße</dt>
                  <dd className="font-medium text-slate-700">{formatFileSize(template.sourceFileSize)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Anonymisiert</dt>
                  <dd className="font-medium text-slate-700">{template.isAnonymized ? "Ja ✓" : "Nein"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Analyse-Status</dt>
                  <dd>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${analysisBadge.bg} ${analysisBadge.text}`}>
                      {analysisBadge.label}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Zuletzt aktualisiert</dt>
                  <dd className="font-medium text-slate-700">{formatDate(template.updatedAt)}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Struktur-Vorschau</h4>
              {template.structureJson ? (
                <div className="bg-white rounded-lg border border-slate-200 p-3" data-testid={`structure-preview-${template.id}`}>
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap overflow-auto max-h-48">
                    {JSON.stringify(template.structureJson, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center text-sm text-slate-400">
                  Struktur wird nach der Analyse verfügbar.
                </div>
              )}

              {template.styleRulesJson && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Style-Regeln</h4>
                  <div className="bg-white rounded-lg border border-slate-200 p-3" data-testid={`style-preview-${template.id}`}>
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap overflow-auto max-h-48">
                      {JSON.stringify(template.styleRulesJson, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
