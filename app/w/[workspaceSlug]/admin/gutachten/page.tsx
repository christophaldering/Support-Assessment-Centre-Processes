"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DocumentOriginBadge } from "@/components/shared/DocumentOriginBadge";
import { resolveOriginForReportTemplate } from "@/lib/document-origin";


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
  useForStyleGuidance: boolean;
  anonymizationConfirmedById: string | null;
  anonymizationConfirmedAt: string | null;
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
  draft: { bg: "bg-[var(--eds-bg-sunken)]", text: "text-[var(--eds-text-secondary)]", label: "Entwurf" },
  uploaded: { bg: "bg-[var(--eds-status-blue-bg)]", text: "text-[var(--eds-status-blue)]", label: "Hochgeladen" },
  anonymized: { bg: "bg-[var(--eds-status-amber-bg)]", text: "text-[var(--eds-status-amber)]", label: "Anonymisiert" },
  analyzed: { bg: "bg-[var(--eds-status-green-bg)]", text: "text-[var(--eds-status-green)]", label: "Analysiert" },
  active: { bg: "bg-[var(--eds-status-green-bg)]", text: "text-[var(--eds-status-green)]", label: "Aktiv" },
};

const ANALYSIS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-[var(--eds-bg-sunken)]", text: "text-[var(--eds-text-tertiary)]", label: "Ausstehend" },
  processing: { bg: "bg-[var(--eds-status-blue-bg)]", text: "text-[var(--eds-status-blue)]", label: "In Bearbeitung" },
  extracting: { bg: "bg-[var(--eds-status-blue-bg)]", text: "text-[var(--eds-status-blue)]", label: "Extrahiere…" },
  completed: { bg: "bg-[var(--eds-status-green-bg)]", text: "text-[var(--eds-status-green)]", label: "Abgeschlossen" },
  analyzed: { bg: "bg-teal-50", text: "text-teal-700", label: "Analysiert ✓" },
  failed: { bg: "bg-[var(--eds-status-red-bg)]", text: "text-[var(--eds-status-red)]", label: "Fehlgeschlagen" },
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
    <div className="py-8 px-6 lg:px-10 space-y-6">
        <PageHeader
          title="Gutachten-Generator"
          description="Gutachten erstellen: One-Pager, Ergebnisberichte und Gesamtauswertungen für Kandidatenvergleiche"
        />
        <div className="mb-8">
          <a
            href={`/w/${workspaceSlug}/admin/prompt-library`}
            className="inline-flex items-center gap-1 text-xs text-[var(--eds-text-disabled)] hover:text-[var(--eds-lagune)] mt-2 transition-colors"
            data-testid="link-prompt-library-gutachten"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            KI-Prompt für Gutachten anpassen
          </a>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] rounded-lg text-sm text-[var(--eds-status-red)]" data-testid="text-error">
            {error}
          </div>
        )}

        <div className="flex gap-1 mb-6 border-b border-[var(--eds-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={tab.testId}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-current"
                  : "border-transparent text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)]"
              }`}
              style={activeTab === tab.key ? { color: "var(--eds-lagune)", borderColor: "var(--eds-lagune)" } : {}}
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
      <div className="bg-white rounded-xl border border-[var(--eds-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--eds-lagune)" }} data-testid={`heading-${reportType}`}>
              {meta.label}
            </h2>
            <p className="text-sm text-[var(--eds-text-tertiary)]">{meta.description}</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            data-testid={`button-upload-${reportType}`}
            className="rounded-lg text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--eds-lagune)" }}
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
        <div className="text-center py-8 text-sm text-[var(--eds-text-disabled)]">Vorlagen werden geladen…</div>
      )}

      {!loading && templates.length === 0 && (
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-8 text-center" data-testid={`empty-${reportType}`}>
          <div className="text-3xl mb-3">📄</div>
          <p className="text-[var(--eds-text-tertiary)] text-sm">
            Noch keine Vorlagen für {meta.label} vorhanden.
          </p>
          <p className="text-[var(--eds-text-disabled)] text-xs mt-1">
            Laden Sie eine PPTX-Beispieldatei hoch, um zu beginnen.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} workspaceSlug={workspaceSlug} onRefresh={fetchTemplates} />
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
    <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-lg border border-[var(--eds-border)]" style={{ backgroundColor: "var(--eds-lagune-light)" }}>
      {error && (
        <div className="mb-3 p-2 bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] rounded text-sm text-[var(--eds-status-red)]" data-testid="text-upload-error">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Vorlagenname *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="input-template-name"
          className="w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ "--tw-ring-color": "var(--eds-lagune)" } as React.CSSProperties}
          placeholder="z.B. Standard One-Pager 2026"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">PPTX-Beispieldatei</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          data-testid="dropzone-file"
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver ? "border-[var(--eds-lagune)] bg-[var(--eds-lagune)]/5" : "border-[var(--eds-border-strong)] hover:border-[var(--eds-lagune)]"
          }`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-medium text-[var(--eds-text-primary)]">{file.name}</span>
              <span className="text-xs text-[var(--eds-text-disabled)]">({formatFileSize(file.size)})</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] ml-2"
                data-testid="button-remove-file"
              >
                Entfernen
              </button>
            </div>
          ) : (
            <div>
              <div className="text-2xl mb-1">📎</div>
              <p className="text-sm text-[var(--eds-text-secondary)]">
                PPTX-Datei hierher ziehen oder <span style={{ color: "var(--eds-lagune)" }} className="font-medium">klicken</span>
              </p>
              <p className="text-xs text-[var(--eds-text-disabled)] mt-1">PowerPoint-Vorlagen (.pptx)</p>
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
          className="rounded-lg border border-[var(--eds-border)] text-[var(--eds-text-secondary)] text-sm font-medium px-4 py-2 hover:bg-[var(--eds-bg-sunken)] transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={uploading}
          data-testid="button-submit-upload"
          className="rounded-lg text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "var(--eds-terracotta)" }}
        >
          {uploading ? "Wird hochgeladen…" : "Vorlage speichern"}
        </button>
      </div>
    </form>
  );
}

const STYLE_PROFILE_LABELS: Record<string, string> = {
  tonality: "Tonalität",
  sentenceLength: "Satzbau",
  hedgingPhrases: "Typische Formulierungen",
  structurePattern: "Aufbau-Bausteine",
  strengthsLanguagePattern: "Stärken-Sprache",
  developmentAreaLanguagePattern: "Entwicklungsfeld-Sprache",
};

function StyleProfileDisplay({ profile }: { profile: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      {Object.entries(profile).map(([key, val]) => (
        <div key={key} className="bg-white rounded-lg border border-[var(--eds-border)] p-3">
          <div className="text-xs font-semibold text-teal-700 mb-1">{STYLE_PROFILE_LABELS[key] ?? key}</div>
          {Array.isArray(val) ? (
            <ul className="list-disc list-inside space-y-0.5">
              {(val as string[]).map((item, i) => (
                <li key={i} className="text-xs text-[var(--eds-text-secondary)]">{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--eds-text-secondary)]">{String(val)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function TemplateCard({ template, workspaceSlug, onRefresh }: { template: ReportTemplate; workspaceSlug: string; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [anonConfirmed, setAnonConfirmed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const statusBadge = STATUS_BADGES[template.status] || STATUS_BADGES.draft;
  const analysisBadge = ANALYSIS_BADGES[template.analysisStatus] || ANALYSIS_BADGES.pending;
  const canAnalyze = !!template.sourceFilePath && ["pending", "failed"].includes(template.analysisStatus) && !analyzing;
  const isExtracting = template.analysisStatus === "extracting" || analyzing;
  const isAnalyzed = template.analysisStatus === "analyzed";

  async function handleAnalyze(e: React.MouseEvent) {
    e.stopPropagation();
    setActionError(null);
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/report-templates/${template.id}/analyze`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      onRefresh();
    } catch (err) {
      setActionError(String(err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleActivate(e: React.MouseEvent) {
    e.stopPropagation();
    if (!anonConfirmed) {
      setActionError("Bitte bestätigen Sie zuerst, dass alle personenbezogenen Daten entfernt wurden.");
      return;
    }
    setActionError(null);
    setActivating(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/report-templates/${template.id}/activate`, { method: "PATCH" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      onRefresh();
    } catch (err) {
      setActionError(String(err));
    } finally {
      setActivating(false);
    }
  }

  async function handleDeactivate(e: React.MouseEvent) {
    e.stopPropagation();
    setActionError(null);
    setDeactivating(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/report-templates/${template.id}/deactivate`, { method: "PATCH" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      onRefresh();
    } catch (err) {
      setActionError(String(err));
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="bg-white border border-[var(--eds-border)] rounded-xl overflow-hidden" data-testid={`card-template-${template.id}`}>
      <div
        className="p-6 flex items-center justify-between cursor-pointer hover:bg-[var(--eds-bg-sunken)]/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h3 className="font-semibold text-[var(--eds-text-primary)] truncate" data-testid={`text-template-name-${template.id}`}>
              {template.name}
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`} data-testid={`badge-status-${template.id}`}>
              {statusBadge.label}
            </span>
            {template.useForStyleGuidance && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-800" data-testid={`badge-style-active-${template.id}`}>
                ✦ Aktiv als Stilreferenz
              </span>
            )}
            {template.isAnonymized && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600" data-testid={`badge-anonymized-${template.id}`}>
                Anonymisierung ✓
              </span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${analysisBadge.bg} ${analysisBadge.text}`} data-testid={`badge-analysis-${template.id}`}>
              {analysisBadge.label}
            </span>
            <DocumentOriginBadge origin={resolveOriginForReportTemplate(template)} />
          </div>
          <div className="flex gap-4 text-xs text-[var(--eds-text-disabled)]">
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
          {canAnalyze && (
            <button
              onClick={handleAnalyze}
              data-testid={`button-analyze-${template.id}`}
              className="rounded-lg text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--eds-lagune)" }}
            >
              Analysieren
            </button>
          )}
          {isExtracting && (
            <span className="text-xs text-[var(--eds-status-blue)] animate-pulse">Extrahiere…</span>
          )}
          <button
            onClick={(e) => e.stopPropagation()}
            data-testid={`button-generate-report-${template.id}`}
            className="rounded-lg text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--eds-terracotta)" }}
          >
            Bericht generieren
          </button>
          <span className="text-[var(--eds-text-disabled)] text-sm">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--eds-border)] p-6" style={{ backgroundColor: "var(--eds-lagune-light)" }}>
          {actionError && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] text-xs text-[var(--eds-status-red)]" data-testid={`error-action-${template.id}`}>
              {actionError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-3">Vorlageninformationen</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--eds-text-tertiary)]">Berichtstyp</dt>
                  <dd className="font-medium text-[var(--eds-text-primary)]">{REPORT_TYPE_META[template.reportType as ReportType]?.label || template.reportType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--eds-text-tertiary)]">Quelldatei</dt>
                  <dd className="font-medium text-[var(--eds-text-primary)]">{template.sourceFileName || "–"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--eds-text-tertiary)]">Dateigröße</dt>
                  <dd className="font-medium text-[var(--eds-text-primary)]">{formatFileSize(template.sourceFileSize)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--eds-text-tertiary)]">Anonymisiert</dt>
                  <dd className="font-medium text-[var(--eds-text-primary)]">{template.isAnonymized ? "Ja ✓" : "Nein"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--eds-text-tertiary)]">Stilreferenz aktiv</dt>
                  <dd className="font-medium text-[var(--eds-text-primary)]">
                    {template.useForStyleGuidance ? (
                      <span className="text-teal-700">Ja ✦</span>
                    ) : (
                      <span className="text-[var(--eds-text-disabled)]">Nein</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--eds-text-tertiary)]">Analyse-Status</dt>
                  <dd>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${analysisBadge.bg} ${analysisBadge.text}`}>
                      {analysisBadge.label}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--eds-text-tertiary)]">Zuletzt aktualisiert</dt>
                  <dd className="font-medium text-[var(--eds-text-primary)]">{formatDate(template.updatedAt)}</dd>
                </div>
              </dl>

              {isAnalyzed && !template.useForStyleGuidance && (
                <div className="mt-5 pt-4 border-t border-[var(--eds-border)] space-y-3" data-testid={`activate-section-${template.id}`}>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anonConfirmed}
                      onChange={(e) => setAnonConfirmed(e.target.checked)}
                      className="mt-0.5 accent-teal-600"
                      data-testid={`checkbox-anon-confirmed-${template.id}`}
                    />
                    <span className="text-xs text-[var(--eds-text-secondary)]">
                      Ich bestätige, dass alle personenbezogenen Daten vollständig entfernt wurden und die Nutzung als Stilreferenz datenschutzkonform ist.
                    </span>
                  </label>
                  <button
                    onClick={handleActivate}
                    disabled={activating || !anonConfirmed}
                    data-testid={`button-activate-style-${template.id}`}
                    className="w-full rounded-lg text-white text-xs font-medium px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: "var(--eds-lagune)" }}
                  >
                    {activating ? "Wird aktiviert…" : "Als Stilreferenz aktivieren"}
                  </button>
                </div>
              )}

              {template.useForStyleGuidance && (
                <div className="mt-5 pt-4 border-t border-[var(--eds-border)]" data-testid={`deactivate-section-${template.id}`}>
                  <button
                    onClick={handleDeactivate}
                    disabled={deactivating}
                    data-testid={`button-deactivate-style-${template.id}`}
                    className="w-full rounded-lg text-xs font-medium px-3 py-2 border border-[var(--eds-border-strong)] text-[var(--eds-text-secondary)] hover:bg-[var(--eds-bg-sunken)] transition-colors disabled:opacity-40"
                  >
                    {deactivating ? "Wird deaktiviert…" : "Stilreferenz deaktivieren"}
                  </button>
                </div>
              )}
            </div>

            <div>
              {isAnalyzed && template.styleRulesJson ? (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-3">Stilprofil</h4>
                  <StyleProfileDisplay profile={template.styleRulesJson} />
                </div>
              ) : (
                <>
                  <h4 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-3">Struktur-Vorschau</h4>
                  {template.structureJson ? (
                    <div className="bg-white rounded-lg border border-[var(--eds-border)] p-3" data-testid={`structure-preview-${template.id}`}>
                      <pre className="text-xs text-[var(--eds-text-secondary)] whitespace-pre-wrap overflow-auto max-h-48">
                        {JSON.stringify(template.structureJson, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-[var(--eds-border)] p-4 text-center text-sm text-[var(--eds-text-disabled)]">
                      {template.sourceFilePath
                        ? "Datei vorhanden — Analyse starten um Stilprofil zu extrahieren."
                        : "Struktur wird nach der Analyse verfügbar."}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
