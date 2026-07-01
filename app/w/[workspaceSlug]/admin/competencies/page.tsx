"use client";

import { DocumentOriginBadge } from "@/components/shared/DocumentOriginBadge";
import { resolveOriginForCompetencyModel } from "@/lib/document-origin";
import { PageHeader } from "@/components/shared/PageHeader";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface CompetencyModel {
  id: string;
  name: string;
  description: string | null;
  companyName: string | null;
  modelYear: number | null;
  status: string;
  version: number;
  sourceType?: string;
  createdAt?: string;
  nodes: CompetencyNode[];
}

interface CompetencyNode {
  id: string;
  name: string;
  nodeType: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  competencyModelId: string;
}

interface ScaleDefinition {
  id: string;
  name: string;
  type: string;
  minValue: number | null;
  maxValue: number | null;
  points: ScalePoint[];
  status: string;
}

interface ScalePoint {
  value: number;
  label: string;
  anchor?: string;
}

interface WeightingProfile {
  id: string;
  name: string;
  targetRole: string | null;
  weights: WeightEntry[];
  version: number;
  status: string;
}

interface WeightEntry {
  nodeId: string;
  weight: number;
}

interface AssessmentRecord {
  id: string;
  name: string;
  status: string;
}

interface ExerciseRecord {
  id: string;
  name: string;
  type: string;
}

interface MappingRecord {
  id: string;
  exerciseId: string;
  competencyNodeId: string;
  weight: number;
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-[var(--eds-bg-sunken)]", text: "text-[var(--eds-text-secondary)]", label: "Entwurf" },
  active: { bg: "bg-[var(--eds-status-green-bg)]", text: "text-[var(--eds-status-green)]", label: "Aktiv" },
  completed: { bg: "bg-[var(--eds-status-blue-bg)]", text: "text-[var(--eds-status-blue)]", label: "Abgeschlossen" },
  archived: { bg: "bg-[var(--eds-status-red-bg)]", text: "text-[var(--eds-status-red)]", label: "Archiviert" },
};

const NODE_TYPE_LABELS: Record<string, string> = {
  domain: "Domäne",
  competency: "Kompetenz",
  sub: "Subkompetenz",
  anchor: "Verhaltensanker",
  custom: "Benutzerdefiniert",
};

const SCALE_TYPE_LABELS: Record<string, string> = {
  numeric: "Numerisch",
  likert: "Likert-Skala",
  custom: "Benutzerdefiniert",
};

const ROLE_LABELS: Record<string, string> = {
  MASTER_ADMIN: "Master-Administrator",
  WORKSPACE_ADMIN: "Workspace-Administrator",
  ADMIN: "Workspace-Administrator",
  MODERATOR: "Moderator",
  OBSERVER: "Beobachter",
  PROJECT_OFFICE: "Projektoffice",
  PROJECT_ASSISTANT: "Projektoffice",
  CLIENT: "Auftraggeber",
  HR_CLIENT: "Auftraggeber",
  CANDIDATE: "Kandidat",
};

const ALL_ROLES = ["MASTER_ADMIN", "WORKSPACE_ADMIN", "MODERATOR", "OBSERVER", "PROJECT_OFFICE", "CLIENT", "CANDIDATE"];
const NODE_TYPES = ["domain", "competency", "sub", "anchor", "custom"];

const inputClass = "w-full rounded-lg border border-[var(--eds-border)] px-3 py-2 text-sm text-[var(--eds-text-primary)] placeholder:text-[var(--eds-text-disabled)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue";
const btnPrimary = "rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark transition-colors";
const btnDanger = "text-xs text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] font-medium";

type TabKey = "models" | "scales" | "weights" | "mapping";

export default function CompetencyManagementPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const [activeTab, setActiveTab] = useState<TabKey>("models");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "models", label: "Kompetenzmodelle" },
    { key: "scales", label: "Skalen" },
    { key: "weights", label: "Gewichtungsprofile" },
    { key: "mapping", label: "MTMM-Matrix" },
  ];

  return (
    <div className="py-8 px-6 lg:px-10 space-y-6">
        <PageHeader
          title="Kompetenzmodelle"
          description="Kompetenzrahmen, Dimensionen, Skalen und MTMM-Matrix verwalten"
        />

        <div className="flex gap-1 mb-6 border-b border-[var(--eds-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-${tab.key}`}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "models" && <ModelsTab workspaceSlug={workspaceSlug} router={router} />}
        {activeTab === "scales" && <ScalesTab workspaceSlug={workspaceSlug} router={router} />}
        {activeTab === "weights" && <WeightsTab workspaceSlug={workspaceSlug} router={router} />}
        {activeTab === "mapping" && <MappingTab workspaceSlug={workspaceSlug} router={router} />}
    </div>
  );
}

const SOURCE_TYPE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  manual: { label: "Manuell erstellt", bg: "bg-[var(--eds-bg-sunken)]", text: "text-[var(--eds-text-secondary)]" },
  uploaded: { label: "Hochgeladen", bg: "bg-[var(--eds-status-green-bg)]", text: "text-[var(--eds-status-green)]" },
  ai_generated: { label: "KI-generiert", bg: "bg-purple-50", text: "text-purple-600" },
  analysis_derived: { label: "Aus Anforderungsanalyse", bg: "bg-[var(--eds-status-amber-bg)]", text: "text-[var(--eds-status-amber)]" },
  client_provided: { label: "Vom Klienten erhalten", bg: "bg-cyan-50", text: "text-cyan-700" },
  co_developed: { label: "Gemeinsam definiert", bg: "bg-indigo-50", text: "text-indigo-600" },
  standard: { label: "Standardmodell", bg: "bg-[var(--eds-bg-sunken)]", text: "text-[var(--eds-text-primary)]" },
};

function ModelsTab({ workspaceSlug, router }: { workspaceSlug: string; router: ReturnType<typeof useRouter> }) {
  const [models, setModels] = useState<CompetencyModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>("");
  const [newSourceType, setNewSourceType] = useState("manual");
  const [newDescription, setNewDescription] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newModelYear, setNewModelYear] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState("");
  const [uploadMode, setUploadMode] = useState<"none" | "uploading" | "analyzing" | "preview">("none");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState("");
  const [accepting, setAccepting] = useState(false);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models`);
      if (res.status === 401) { router.push(`/w/${workspaceSlug}/login`); return; }
      if (res.status === 403) { setError("Keine Berechtigung für die Kompetenzverwaltung."); return; }
      if (!res.ok) throw new Error();
      setModels(await res.json());
    } catch { setError("Fehler beim Laden der Kompetenzmodelle."); }
    finally { setLoading(false); }
  }, [workspaceSlug, router]);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDescription || null, companyName: newCompanyName || null, modelYear: newModelYear || null, sourceType: newSourceType }),
      });
      if (!res.ok) { const d = await res.json(); setCreateError(d.error || "Fehler beim Erstellen."); return; }
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      setNewCompanyName("");
      setNewModelYear("");
      fetchModels();
    } catch { setCreateError("Etwas ist schiefgelaufen."); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/competency-models/${id}`, { method: "DELETE" });
      if (expandedModelId === id) setExpandedModelId(null);
      fetchModels();
    } catch {}
  };

  const handleAiGenerate = async () => {
    setAiMessage("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_model", workspaceSlug }),
      });
      const data = await res.json();
      setAiMessage(data.message || data.error || "Unbekannte Antwort.");
    } catch { setAiMessage("Fehler bei der KI-Anfrage."); }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploadError("");
    setUploadMode("analyzing");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json();
        setUploadError(d.error || "Upload fehlgeschlagen");
        setUploadMode("uploading");
        return;
      }
      const data = await res.json();
      setUploadResult(data);
      setUploadMode("preview");
    } catch (err: any) {
      setUploadError(err?.message === "Failed to fetch" 
        ? "Verbindungsfehler – bitte versuchen Sie es erneut." 
        : "Fehler beim Hochladen");
      setUploadMode("uploading");
    }
  };

  const handleAcceptModel = async () => {
    if (!uploadResult) return;
    setAccepting(true);
    setUploadError("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models/upload/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelName: uploadResult.modelName,
          modelDescription: uploadResult.modelDescription,
          hierarchy: uploadResult.hierarchy,
          assessment: uploadResult.assessment,
          fileName: uploadResult.fileName,
          companyName: uploadResult.companyName || null,
          modelYear: uploadResult.modelYear || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setUploadError(d.error || "Fehler beim Speichern");
        return;
      }
      setUploadMode("none");
      setUploadFile(null);
      setUploadResult(null);
      fetchModels();
    } catch {
      setUploadError("Fehler beim Speichern des Modells");
    } finally {
      setAccepting(false);
    }
  };

  const uniqueCompanies = [...new Set(models.map((m) => m.companyName).filter(Boolean))] as string[];
  const filteredModels = filterCompany
    ? models.filter((m) => m.companyName === filterCompany)
    : models;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-[var(--eds-text-tertiary)]" data-testid="text-model-count">{filteredModels.length} von {models.length} Modelle{filterCompany ? ` (Kunde: ${filterCompany})` : ""}</p>
          {uniqueCompanies.length > 0 && (
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="text-xs border border-[var(--eds-border)] rounded-lg px-2 py-1.5 text-[var(--eds-text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              data-testid="select-filter-company"
            >
              <option value="">Alle Kunden</option>
              {uniqueCompanies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setUploadMode("uploading"); setUploadFile(null); setUploadResult(null); setUploadError(""); }}
            data-testid="button-upload-model" 
            className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700 transition-colors"
          >
            Modell hochladen
          </button>
          <button onClick={handleAiGenerate} data-testid="button-ai-generate-model" className="rounded-lg bg-purple-600 text-white text-sm font-medium px-4 py-2 hover:bg-purple-700 transition-colors">
            KI-Assistent: Modell generieren
          </button>
          <button onClick={() => setShowCreate(!showCreate)} data-testid="button-create-model" className={btnPrimary}>
            {showCreate ? "Abbrechen" : "Neues Modell"}
          </button>
        </div>
      </div>

      {aiMessage && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800" data-testid="text-ai-message">
          {aiMessage}
        </div>
      )}

      {uploadMode !== "none" && (
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6 space-y-6">
          {uploadMode === "uploading" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-brand-navy">Kompetenzmodell hochladen</h2>
                <button onClick={() => { setUploadMode("none"); setUploadFile(null); setUploadError(""); }} className="text-xs text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)]">Abbrechen</button>
              </div>
              <div
                className="border-2 border-dashed border-[var(--eds-border-strong)] rounded-xl p-10 text-center hover:border-brand-blue transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}
                data-testid="dropzone-competency-upload"
              >
                <div className="text-4xl mb-3">📄</div>
                <p className="text-sm text-[var(--eds-text-secondary)] font-medium mb-1">Klicken oder Datei hierher ziehen</p>
                <p className="text-xs text-[var(--eds-text-disabled)]">Unterstützt: DOCX, PDF, TXT (max. 20 MB)</p>
                {uploadFile && (
                  <div className="mt-4 bg-[var(--eds-bg-sunken)] rounded-lg p-3 inline-block">
                    <span className="text-sm font-medium text-[var(--eds-text-primary)]">{uploadFile.name}</span>
                    <span className="text-xs text-[var(--eds-text-disabled)] ml-2">({(uploadFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pdf,.txt,.doc"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  data-testid="input-competency-file"
                />
              </div>
              {uploadError && <p className="text-sm text-[var(--eds-status-red)] mt-3" data-testid="text-upload-error">{uploadError}</p>}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile}
                  data-testid="button-analyze-competency"
                  className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-6 py-2.5 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  KI-Analyse starten
                </button>
              </div>
            </div>
          )}

          {uploadMode === "analyzing" && (
            <div className="text-center py-12">
              <div className="animate-spin text-4xl mb-4">⚙️</div>
              <p className="text-sm font-medium text-[var(--eds-text-primary)] mb-1">Dokument wird analysiert...</p>
              <p className="text-xs text-[var(--eds-text-disabled)]">Die KI extrahiert Kompetenzen, Cluster und Verhaltensanker</p>
            </div>
          )}

          {uploadMode === "preview" && uploadResult && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-brand-navy">Analyse-Ergebnis – Validierung & Anpassung</h2>
                <button onClick={() => { setUploadMode("none"); setUploadFile(null); setUploadResult(null); }} className="text-xs text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)]">Schließen</button>
              </div>

              <div className="bg-[var(--eds-status-blue-bg)] border border-[var(--eds-status-blue-bg)] rounded-xl p-3 mb-5 text-xs text-[var(--eds-status-blue)]">
                Die KI hat das Dokument analysiert. Bitte prüfen, bestätigen oder verändern Sie die Ergebnisse, bevor Sie das Modell übernehmen.
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wider mb-1">Modellname</label>
                  <input
                    type="text"
                    value={uploadResult.modelName || ""}
                    onChange={(e) => setUploadResult({ ...uploadResult, modelName: e.target.value })}
                    className={inputClass}
                    data-testid="input-parsed-model-name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wider mb-1">Unternehmen</label>
                  <input
                    type="text"
                    value={uploadResult.companyName || ""}
                    onChange={(e) => setUploadResult({ ...uploadResult, companyName: e.target.value })}
                    className={inputClass}
                    placeholder="z.B. Siemens AG"
                    data-testid="input-parsed-company-name"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wider mb-1">Beschreibung</label>
                  <textarea
                    value={uploadResult.modelDescription || ""}
                    onChange={(e) => setUploadResult({ ...uploadResult, modelDescription: e.target.value })}
                    rows={2}
                    className={inputClass}
                    data-testid="input-parsed-model-description"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--eds-text-tertiary)] uppercase tracking-wider mb-1">Modelljahr</label>
                  <input
                    type="number"
                    value={uploadResult.modelYear || ""}
                    onChange={(e) => setUploadResult({ ...uploadResult, modelYear: e.target.value ? parseInt(e.target.value) : null })}
                    className={inputClass}
                    placeholder={`z.B. ${new Date().getFullYear()}`}
                    min="1990"
                    max="2099"
                    data-testid="input-parsed-model-year"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[var(--eds-bg-sunken)] rounded-xl p-4">
                <div className="bg-[var(--eds-bg-sunken)] rounded-xl p-4">
                  <span className="text-xs font-medium text-[var(--eds-text-disabled)] uppercase tracking-wider">Qualität</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      (uploadResult.assessment?.qualityScore || 0) >= 7 ? "bg-[var(--eds-status-green-bg)]0" :
                      (uploadResult.assessment?.qualityScore || 0) >= 4 ? "bg-[var(--eds-status-amber-bg)]0" : "bg-[var(--eds-status-red-bg)]0"
                    }`}>
                      {uploadResult.assessment?.qualityScore || "?"}
                    </div>
                    <span className="text-sm text-[var(--eds-text-secondary)]">{uploadResult.assessment?.overallQuality || "k.A."}</span>
                  </div>
                </div>
                <div className="bg-[var(--eds-bg-sunken)] rounded-xl p-4">
                  <span className="text-xs font-medium text-[var(--eds-text-disabled)] uppercase tracking-wider">Struktur</span>
                  <div className="flex gap-3 mt-1">
                    {uploadResult.assessment?.completeness && Object.entries(uploadResult.assessment.completeness).map(([key, val]) => (
                      <span key={key} className={`text-xs px-2 py-0.5 rounded ${val ? "bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)]" : "bg-[var(--eds-border)] text-[var(--eds-text-disabled)]"}`}>
                        {key === "hasClusters" ? "Cluster" : key === "hasCompetencies" ? "Kompetenzen" : key === "hasDefinitions" ? "Definitionen" : key === "hasAnchors" ? "Anker" : key === "hasLevels" ? "Stufen" : key}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {uploadResult.assessment?.usability && (
                <div className="bg-[var(--eds-status-blue-bg)] border border-[var(--eds-status-blue-bg)] rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-semibold text-[var(--eds-status-blue)] mb-1">Empfohlene Verwendung</h3>
                  <p className="text-sm text-[var(--eds-status-blue)]">{uploadResult.assessment.usability}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {uploadResult.assessment?.strengths && uploadResult.assessment.strengths.length > 0 && (
                  <div className="bg-[var(--eds-status-green-bg)] border border-[var(--eds-status-green-bg)] rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-emerald-900 mb-2">Stärken</h3>
                    <ul className="space-y-1">
                      {uploadResult.assessment.strengths.map((s: string, i: number) => (
                        <li key={i} className="text-xs text-emerald-800 flex items-start gap-1.5">
                          <span className="text-emerald-500 mt-0.5">+</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {uploadResult.assessment?.weaknesses && uploadResult.assessment.weaknesses.length > 0 && (
                  <div className="bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-[var(--eds-status-amber)] mb-2">Schwächen / Verbesserungspotenzial</h3>
                    <ul className="space-y-1">
                      {uploadResult.assessment.weaknesses.map((w: string, i: number) => (
                        <li key={i} className="text-xs text-[var(--eds-status-amber)] flex items-start gap-1.5">
                          <span className="text-[var(--eds-status-amber)] mt-0.5">!</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {uploadResult.assessment?.recommendations && uploadResult.assessment.recommendations.length > 0 && (
                <div className="bg-[var(--eds-bg-sunken)] border border-[var(--eds-border)] rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-semibold text-[var(--eds-text-primary)] mb-2">Empfehlungen</h3>
                  <ul className="space-y-1">
                    {uploadResult.assessment.recommendations.map((r: string, i: number) => (
                      <li key={i} className="text-xs text-[var(--eds-text-secondary)] flex items-start gap-1.5">
                        <span className="text-brand-blue mt-0.5">→</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {uploadResult.assessment?.tags && uploadResult.assessment.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {uploadResult.assessment.tags.map((tag: string, i: number) => (
                    <span key={i} className="bg-[var(--eds-bg-sunken)] text-[var(--eds-text-secondary)] text-xs px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              {uploadResult.assessment?.targetGroups && uploadResult.assessment.targetGroups.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-xs text-[var(--eds-text-disabled)] mr-1 self-center">Zielgruppen:</span>
                  {uploadResult.assessment.targetGroups.map((tg: string, i: number) => (
                    <span key={i} className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full border border-purple-200">{tg}</span>
                  ))}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-brand-navy mb-3">Extrahierte Struktur <span className="text-xs font-normal text-[var(--eds-text-disabled)] ml-2">(Klicken zum Bearbeiten)</span></h3>
                <div className="bg-[var(--eds-bg-sunken)] rounded-xl p-4 max-h-[500px] overflow-y-auto">
                  {uploadResult.hierarchy?.map((cluster: any, ci: number) => {
                    const updateCluster = (field: string, value: string) => {
                      const h = [...uploadResult.hierarchy];
                      h[ci] = { ...h[ci], [field]: value };
                      setUploadResult({ ...uploadResult, hierarchy: h });
                    };
                    return (
                      <div key={ci} className="mb-4 last:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-brand-navy text-white text-[10px] font-bold px-2 py-0.5 rounded shrink-0">Cluster</span>
                          <input
                            type="text"
                            value={cluster.name}
                            onChange={(e) => updateCluster("name", e.target.value)}
                            className="text-sm font-semibold text-brand-navy bg-transparent border-b border-transparent hover:border-[var(--eds-border-strong)] focus:border-brand-blue focus:outline-none w-full"
                            data-testid={`input-cluster-name-${ci}`}
                          />
                          <button onClick={() => { const h = uploadResult.hierarchy.filter((_: any, i: number) => i !== ci); setUploadResult({ ...uploadResult, hierarchy: h }); }} className="text-xs text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] shrink-0" data-testid={`button-delete-cluster-${ci}`}>✕</button>
                        </div>
                        <div className="ml-16 mb-2">
                          <input
                            type="text"
                            value={cluster.description || ""}
                            onChange={(e) => updateCluster("description", e.target.value)}
                            placeholder="Beschreibung..."
                            className="text-xs text-[var(--eds-text-tertiary)] bg-transparent border-b border-transparent hover:border-[var(--eds-border-strong)] focus:border-brand-blue focus:outline-none w-full"
                          />
                        </div>
                        {cluster.children?.map((comp: any, coi: number) => {
                          const updateComp = (field: string, value: string) => {
                            const h = [...uploadResult.hierarchy];
                            const ch = [...(h[ci].children || [])];
                            ch[coi] = { ...ch[coi], [field]: value };
                            h[ci] = { ...h[ci], children: ch };
                            setUploadResult({ ...uploadResult, hierarchy: h });
                          };
                          const deleteComp = () => {
                            const h = [...uploadResult.hierarchy];
                            h[ci] = { ...h[ci], children: h[ci].children.filter((_: any, i: number) => i !== coi) };
                            setUploadResult({ ...uploadResult, hierarchy: h });
                          };
                          return (
                            <div key={coi} className="ml-6 mb-2">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)] text-[10px] font-bold px-2 py-0.5 rounded shrink-0">Kompetenz</span>
                                <input
                                  type="text"
                                  value={comp.name}
                                  onChange={(e) => updateComp("name", e.target.value)}
                                  className="text-sm font-medium text-[var(--eds-text-primary)] bg-transparent border-b border-transparent hover:border-[var(--eds-border-strong)] focus:border-brand-blue focus:outline-none w-full"
                                  data-testid={`input-comp-name-${ci}-${coi}`}
                                />
                                <button onClick={deleteComp} className="text-xs text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] shrink-0">✕</button>
                              </div>
                              <div className="ml-20 mb-1">
                                <input
                                  type="text"
                                  value={comp.description || ""}
                                  onChange={(e) => updateComp("description", e.target.value)}
                                  placeholder="Beschreibung..."
                                  className="text-xs text-[var(--eds-text-tertiary)] bg-transparent border-b border-transparent hover:border-[var(--eds-border-strong)] focus:border-brand-blue focus:outline-none w-full"
                                />
                              </div>
                              {comp.children?.map((anchor: any, ai2: number) => {
                                const updateAnchor = (field: string, value: string) => {
                                  const h = [...uploadResult.hierarchy];
                                  const ch = [...(h[ci].children || [])];
                                  const anch = [...(ch[coi].children || [])];
                                  anch[ai2] = { ...anch[ai2], [field]: value };
                                  ch[coi] = { ...ch[coi], children: anch };
                                  h[ci] = { ...h[ci], children: ch };
                                  setUploadResult({ ...uploadResult, hierarchy: h });
                                };
                                const deleteAnchor = () => {
                                  const h = [...uploadResult.hierarchy];
                                  const ch = [...(h[ci].children || [])];
                                  ch[coi] = { ...ch[coi], children: ch[coi].children.filter((_: any, i: number) => i !== ai2) };
                                  h[ci] = { ...h[ci], children: ch };
                                  setUploadResult({ ...uploadResult, hierarchy: h });
                                };
                                return (
                                  <div key={ai2} className="ml-12 flex items-start gap-2 mb-0.5">
                                    <span className="bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)] text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0">Anker</span>
                                    <div className="flex-1 min-w-0">
                                      <input
                                        type="text"
                                        value={anchor.name}
                                        onChange={(e) => updateAnchor("name", e.target.value)}
                                        className="text-xs text-[var(--eds-text-primary)] bg-transparent border-b border-transparent hover:border-[var(--eds-border-strong)] focus:border-brand-blue focus:outline-none w-full"
                                      />
                                      <input
                                        type="text"
                                        value={anchor.description || ""}
                                        onChange={(e) => updateAnchor("description", e.target.value)}
                                        placeholder="Beschreibung..."
                                        className="text-[11px] text-[var(--eds-text-disabled)] bg-transparent border-b border-transparent hover:border-[var(--eds-border-strong)] focus:border-brand-blue focus:outline-none w-full"
                                      />
                                    </div>
                                    <button onClick={deleteAnchor} className="text-xs text-[var(--eds-status-red)] hover:text-[var(--eds-status-red)] shrink-0 mt-0.5">✕</button>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {uploadError && <p className="text-sm text-[var(--eds-status-red)] mb-3">{uploadError}</p>}

              <div className="flex justify-between items-center pt-2 border-t border-[var(--eds-border)]">
                <button
                  onClick={() => { setUploadMode("uploading"); setUploadResult(null); }}
                  className="text-sm text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)]"
                  data-testid="button-back-to-upload"
                >
                  ← Andere Datei
                </button>
                <button
                  onClick={handleAcceptModel}
                  disabled={accepting}
                  data-testid="button-accept-model"
                  className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-8 py-2.5 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {accepting ? "Wird gespeichert..." : "Modell übernehmen"}
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-error">{error}</p>}

      {showCreate && (
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">Neues Kompetenzmodell erstellen</h2>
          <form onSubmit={handleCreate} className="space-y-4" data-testid="form-create-model">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Name *</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required data-testid="input-model-name" className={inputClass} placeholder="z.B. Management-Kompetenzen" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Unternehmen</label>
                <input type="text" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} data-testid="input-model-company" className={inputClass} placeholder="z.B. Siemens AG" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Beschreibung</label>
                <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} data-testid="input-model-description" className={inputClass} placeholder="Optionale Beschreibung" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Modelljahr</label>
                <input type="number" value={newModelYear} onChange={(e) => setNewModelYear(e.target.value)} data-testid="input-model-year" className={inputClass} placeholder={`z.B. ${new Date().getFullYear()}`} min="1990" max="2099" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Herkunft / Quelle</label>
              <select value={newSourceType} onChange={(e) => setNewSourceType(e.target.value)} data-testid="select-model-source-type" className={inputClass}>
                <option value="manual">Manuell erstellt</option>
                <option value="client_provided">Vom Klienten erhalten</option>
                <option value="co_developed">Gemeinsam definiert</option>
                <option value="standard">Standardmodell</option>
                <option value="uploaded">Hochgeladen</option>
                <option value="ai_generated">KI-generiert</option>
                <option value="analysis_derived">Aus Anforderungsanalyse</option>
              </select>
            </div>
            {createError && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-create-error">{createError}</p>}
            <button type="submit" disabled={creating || !newName.trim()} data-testid="button-submit-model" className={`${btnPrimary} px-6 disabled:opacity-50`}>
              {creating ? "Wird erstellt…" : "Modell erstellen"}
            </button>
          </form>
        </div>
      )}

      {loading && <p className="text-sm text-[var(--eds-text-disabled)]">Laden…</p>}

      <div className="space-y-4">
        {filteredModels.map((model) => {
          const badge = STATUS_BADGES[model.status] || STATUS_BADGES.draft;
          const isExpanded = expandedModelId === model.id;
          const sourceBadge = SOURCE_TYPE_LABELS[model.sourceType || "manual"] || SOURCE_TYPE_LABELS.manual;
          return (
            <div key={model.id} className="bg-white border border-[var(--eds-border)] rounded-xl overflow-hidden" data-testid={`card-model-${model.id}`}>
              <div className="p-6 flex items-center justify-between cursor-pointer" onClick={() => setExpandedModelId(isExpanded ? null : model.id)}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-brand-navy">{model.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`} data-testid={`badge-status-${model.id}`}>{badge.label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sourceBadge.bg} ${sourceBadge.text}`} data-testid={`badge-source-${model.id}`}>{sourceBadge.label}</span>
                    {model.modelYear && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)]" data-testid={`badge-year-${model.id}`}>{model.modelYear}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {model.companyName && <span className="text-sm text-[var(--eds-text-secondary)] font-medium" data-testid={`text-company-${model.id}`}>{model.companyName}</span>}
                    {model.companyName && model.description && <span className="text-[var(--eds-text-disabled)]">·</span>}
                    {model.description && <span className="text-sm text-[var(--eds-text-tertiary)]">{model.description}</span>}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-[var(--eds-text-disabled)]">
                    <span>Version {model.version}</span>
                    <span>{model.nodes?.length ?? 0} Knoten</span>
                    {model.modelYear && <span>Stand: {model.modelYear}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(model.id); }} data-testid={`button-delete-model-${model.id}`} className={btnDanger}>Löschen</button>
                  <span className="text-[var(--eds-text-disabled)] text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-[var(--eds-border)] p-6">
                  <ModelDetail workspaceSlug={workspaceSlug} model={model} onRefresh={fetchModels} />
                </div>
              )}
            </div>
          );
        })}
        {filteredModels.length === 0 && !loading && (
          <div className="bg-white border border-[var(--eds-border)] rounded-xl p-8 text-center text-[var(--eds-text-disabled)]">
            {filterCompany ? `Keine Kompetenzmodelle für "${filterCompany}" vorhanden.` : "Keine Kompetenzmodelle vorhanden."}
          </div>
        )}
      </div>
    </div>
  );
}

function ModelDetail({ workspaceSlug, model, onRefresh }: { workspaceSlug: string; model: CompetencyModel; onRefresh: () => void }) {
  const nodes = model.nodes || [];
  const [showAddNode, setShowAddNode] = useState(false);
  const [nodeName, setNodeName] = useState("");
  const [nodeType, setNodeType] = useState("competency");
  const [nodeParentId, setNodeParentId] = useState("");
  const [nodeDescription, setNodeDescription] = useState("");
  const [nodeCreating, setNodeCreating] = useState(false);
  const [nodeError, setNodeError] = useState("");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editNodeName, setEditNodeName] = useState("");
  const [aiNodeMessage, setAiNodeMessage] = useState("");

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setNodeError("");
    setNodeCreating(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models/${model.id}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nodeName, nodeType, parentId: nodeParentId || null, description: nodeDescription || null, sortOrder: nodes.length }),
      });
      if (!res.ok) { const d = await res.json(); setNodeError(d.error || "Fehler beim Erstellen."); return; }
      setShowAddNode(false);
      setNodeName("");
      setNodeType("competency");
      setNodeParentId("");
      setNodeDescription("");
      onRefresh();
    } catch { setNodeError("Etwas ist schiefgelaufen."); }
    finally { setNodeCreating(false); }
  };

  const handleDeleteNode = async (nodeId: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/competency-models/${model.id}/nodes/${nodeId}`, { method: "DELETE" });
      onRefresh();
    } catch {}
  };

  const handleReorder = async (nodeId: string, direction: "up" | "down") => {
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= nodes.length) return;
    const reordered = nodes.map((n, i) => {
      if (i === idx) return { id: n.id, sortOrder: swapIdx };
      if (i === swapIdx) return { id: n.id, sortOrder: idx };
      return { id: n.id, sortOrder: i };
    });
    try {
      await fetch(`/api/w/${workspaceSlug}/competency-models/${model.id}/nodes/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: reordered }),
      });
      onRefresh();
    } catch {}
  };

  const handleEditNode = async (nodeId: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/competency-models/${model.id}/nodes/${nodeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editNodeName }),
      });
      setEditingNodeId(null);
      onRefresh();
    } catch {}
  };

  const handleAiAnchors = async (nodeId: string) => {
    setAiNodeMessage("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "write_anchors", context: { nodeId, modelId: model.id }, workspaceSlug }),
      });
      const data = await res.json();
      setAiNodeMessage(data.message || data.error || "Unbekannte Antwort.");
    } catch { setAiNodeMessage("Fehler bei der KI-Anfrage."); }
  };

  const getDepth = (node: CompetencyNode): number => {
    if (!node.parentId) return 0;
    const parent = nodes.find((n) => n.id === node.parentId);
    return parent ? getDepth(parent) + 1 : 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-brand-navy">Kompetenzknoten ({nodes.length})</h4>
        <button onClick={() => setShowAddNode(!showAddNode)} data-testid="button-add-node" className={`${btnPrimary} text-xs px-3 py-1.5`}>
          {showAddNode ? "Abbrechen" : "Knoten hinzufügen"}
        </button>
      </div>

      {aiNodeMessage && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800" data-testid="text-ai-node-message">
          {aiNodeMessage}
        </div>
      )}

      {showAddNode && (
        <div className="border border-[var(--eds-border)] rounded-lg p-4 bg-[var(--eds-bg-sunken)]">
          <form onSubmit={handleAddNode} className="space-y-3" data-testid="form-add-node">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Name *</label>
                <input type="text" value={nodeName} onChange={(e) => setNodeName(e.target.value)} required data-testid="input-node-name" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Typ</label>
                <select value={nodeType} onChange={(e) => setNodeType(e.target.value)} data-testid="select-node-type" className={inputClass}>
                  {NODE_TYPES.map((t) => <option key={t} value={t}>{NODE_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Übergeordneter Knoten</label>
                <select value={nodeParentId} onChange={(e) => setNodeParentId(e.target.value)} data-testid="select-node-parent" className={inputClass}>
                  <option value="">Kein übergeordneter Knoten</option>
                  {nodes.map((n) => <option key={n.id} value={n.id}>{n.name} ({NODE_TYPE_LABELS[n.nodeType] || n.nodeType})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Beschreibung</label>
                <input type="text" value={nodeDescription} onChange={(e) => setNodeDescription(e.target.value)} data-testid="input-node-description" className={inputClass} />
              </div>
            </div>
            {nodeError && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-node-error">{nodeError}</p>}
            <button type="submit" disabled={nodeCreating || !nodeName.trim()} data-testid="button-submit-node" className={`${btnPrimary} text-xs px-4 py-1.5 disabled:opacity-50`}>
              {nodeCreating ? "Wird erstellt…" : "Knoten erstellen"}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-1">
        {nodes.map((node, idx) => {
          const depth = getDepth(node);
          const typeLabel = NODE_TYPE_LABELS[node.nodeType] || node.nodeType;
          return (
            <div key={node.id} className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-[var(--eds-bg-sunken)] group" style={{ paddingLeft: `${12 + depth * 24}px` }} data-testid={`row-node-${node.id}`}>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--eds-bg-sunken)] text-[var(--eds-text-secondary)] shrink-0">{typeLabel}</span>
              {editingNodeId === node.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="text" value={editNodeName} onChange={(e) => setEditNodeName(e.target.value)} data-testid={`input-edit-node-${node.id}`} className={`${inputClass} text-xs py-1`} autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleEditNode(node.id); if (e.key === "Escape") setEditingNodeId(null); }} />
                  <button onClick={() => handleEditNode(node.id)} data-testid={`button-save-node-${node.id}`} className="text-xs text-brand-blue font-medium">Speichern</button>
                  <button onClick={() => setEditingNodeId(null)} className="text-xs text-[var(--eds-text-disabled)]">Abbrechen</button>
                </div>
              ) : (
                <span className="text-sm text-[var(--eds-text-primary)] cursor-pointer hover:text-brand-blue flex-1" onClick={() => { setEditingNodeId(node.id); setEditNodeName(node.name); }} data-testid={`text-node-name-${node.id}`}>
                  {node.name}
                </span>
              )}
              {node.description && <span className="text-xs text-[var(--eds-text-disabled)] hidden md:inline truncate max-w-[200px]">{node.description}</span>}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => handleAiAnchors(node.id)} data-testid={`button-ai-anchors-${node.id}`} className="text-xs text-purple-600 hover:text-purple-800 font-medium px-1">KI</button>
                <button onClick={() => handleReorder(node.id, "up")} disabled={idx === 0} data-testid={`button-move-up-${node.id}`} className="text-xs text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)] disabled:opacity-30 px-1">▲</button>
                <button onClick={() => handleReorder(node.id, "down")} disabled={idx === nodes.length - 1} data-testid={`button-move-down-${node.id}`} className="text-xs text-[var(--eds-text-disabled)] hover:text-[var(--eds-text-secondary)] disabled:opacity-30 px-1">▼</button>
                <button onClick={() => handleDeleteNode(node.id)} data-testid={`button-delete-node-${node.id}`} className={`${btnDanger} px-1`}>✕</button>
              </div>
            </div>
          );
        })}
        {nodes.length === 0 && <p className="text-sm text-[var(--eds-text-disabled)] py-4 text-center">Keine Knoten vorhanden.</p>}
      </div>
    </div>
  );
}

function ScalesTab({ workspaceSlug, router }: { workspaceSlug: string; router: ReturnType<typeof useRouter> }) {
  const [scales, setScales] = useState<ScaleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("likert");
  const [newMin, setNewMin] = useState("");
  const [newMax, setNewMax] = useState("");
  const [newPoints, setNewPoints] = useState<ScalePoint[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editingScaleId, setEditingScaleId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editMin, setEditMin] = useState("");
  const [editMax, setEditMax] = useState("");
  const [editPoints, setEditPoints] = useState<ScalePoint[]>([]);

  const fetchScales = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/scales`);
      if (res.status === 401) { router.push(`/w/${workspaceSlug}/login`); return; }
      if (res.status === 403) { setError("Keine Berechtigung."); return; }
      if (!res.ok) throw new Error();
      setScales(await res.json());
    } catch { setError("Fehler beim Laden der Skalen."); }
    finally { setLoading(false); }
  }, [workspaceSlug, router]);

  useEffect(() => { fetchScales(); }, [fetchScales]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/scales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          type: newType,
          minValue: newMin ? parseInt(newMin) : null,
          maxValue: newMax ? parseInt(newMax) : null,
          points: newPoints,
        }),
      });
      if (!res.ok) { const d = await res.json(); setCreateError(d.error || "Fehler beim Erstellen."); return; }
      setShowCreate(false);
      setNewName("");
      setNewType("likert");
      setNewMin("");
      setNewMax("");
      setNewPoints([]);
      fetchScales();
    } catch { setCreateError("Etwas ist schiefgelaufen."); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/scales/${id}`, { method: "DELETE" });
      if (editingScaleId === id) setEditingScaleId(null);
      fetchScales();
    } catch {}
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/scales/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          type: editType,
          minValue: editMin ? parseInt(editMin) : null,
          maxValue: editMax ? parseInt(editMax) : null,
          points: editPoints,
        }),
      });
      if (res.ok) { setEditingScaleId(null); fetchScales(); }
    } catch {}
  };

  const startEdit = (s: ScaleDefinition) => {
    setEditingScaleId(s.id);
    setEditName(s.name);
    setEditType(s.type);
    setEditMin(s.minValue?.toString() ?? "");
    setEditMax(s.maxValue?.toString() ?? "");
    setEditPoints(Array.isArray(s.points) ? (s.points as ScalePoint[]) : []);
  };

  const addPoint = (isEdit: boolean) => {
    const point: ScalePoint = { value: 0, label: "", anchor: "" };
    if (isEdit) setEditPoints([...editPoints, point]);
    else setNewPoints([...newPoints, point]);
  };

  const updatePoint = (index: number, field: keyof ScalePoint, value: string | number, isEdit: boolean) => {
    const points = isEdit ? [...editPoints] : [...newPoints];
    (points[index] as Record<string, string | number>)[field] = value;
    if (isEdit) setEditPoints(points);
    else setNewPoints(points);
  };

  const removePoint = (index: number, isEdit: boolean) => {
    if (isEdit) setEditPoints(editPoints.filter((_, i) => i !== index));
    else setNewPoints(newPoints.filter((_, i) => i !== index));
  };

  const renderPointsEditor = (points: ScalePoint[], isEdit: boolean) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--eds-text-primary)]">Skalenpunkte</label>
      {points.map((p, i) => (
        <div key={i} className="flex gap-2 items-center" data-testid={`${isEdit ? "edit-" : ""}point-${i}`}>
          <input type="number" value={p.value} onChange={(e) => updatePoint(i, "value", parseInt(e.target.value) || 0, isEdit)} placeholder="Wert" className={`${inputClass} w-20`} data-testid={`${isEdit ? "edit-" : ""}input-point-value-${i}`} />
          <input type="text" value={p.label} onChange={(e) => updatePoint(i, "label", e.target.value, isEdit)} placeholder="Bezeichnung" className={`${inputClass} flex-1`} data-testid={`${isEdit ? "edit-" : ""}input-point-label-${i}`} />
          <input type="text" value={p.anchor || ""} onChange={(e) => updatePoint(i, "anchor", e.target.value, isEdit)} placeholder="Ankertext (optional)" className={`${inputClass} flex-1`} data-testid={`${isEdit ? "edit-" : ""}input-point-anchor-${i}`} />
          <button onClick={() => removePoint(i, isEdit)} data-testid={`${isEdit ? "edit-" : ""}button-remove-point-${i}`} className={btnDanger}>✕</button>
        </div>
      ))}
      <button onClick={() => addPoint(isEdit)} data-testid={`${isEdit ? "edit-" : ""}button-add-point`} className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium">
        + Punkt hinzufügen
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--eds-text-tertiary)]" data-testid="text-scale-count">{scales.length} Skalen</p>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="button-create-scale" className={btnPrimary}>
          {showCreate ? "Abbrechen" : "Neue Skala"}
        </button>
      </div>

      {error && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-error">{error}</p>}

      {showCreate && (
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">Neue Skala erstellen</h2>
          <form onSubmit={handleCreate} className="space-y-4" data-testid="form-create-scale">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Name *</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required data-testid="input-scale-name" className={inputClass} placeholder="z.B. 5-Punkte-Skala" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Typ</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} data-testid="select-scale-type" className={inputClass}>
                  <option value="numeric">Numerisch</option>
                  <option value="likert">Likert-Skala</option>
                  <option value="custom">Benutzerdefiniert</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Minimalwert</label>
                <input type="number" value={newMin} onChange={(e) => setNewMin(e.target.value)} data-testid="input-scale-min" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Maximalwert</label>
                <input type="number" value={newMax} onChange={(e) => setNewMax(e.target.value)} data-testid="input-scale-max" className={inputClass} />
              </div>
            </div>
            {renderPointsEditor(newPoints, false)}
            {createError && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-create-error">{createError}</p>}
            <button type="submit" disabled={creating || !newName.trim()} data-testid="button-submit-scale" className={`${btnPrimary} px-6 disabled:opacity-50`}>
              {creating ? "Wird erstellt…" : "Skala erstellen"}
            </button>
          </form>
        </div>
      )}

      {loading && <p className="text-sm text-[var(--eds-text-disabled)]">Laden…</p>}

      <div className="bg-white border border-[var(--eds-border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm" data-testid="table-scales">
          <thead>
            <tr className="bg-[var(--eds-bg-sunken)] border-b border-[var(--eds-border)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Name</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Typ</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Punkte</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Status</th>
              <th className="text-right px-4 py-3 font-medium text-[var(--eds-text-secondary)]">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {scales.map((s) => {
              const badge = STATUS_BADGES[s.status] || STATUS_BADGES.draft;
              const pts = Array.isArray(s.points) ? s.points : [];
              if (editingScaleId === s.id) {
                return (
                  <tr key={s.id} className="border-b border-[var(--eds-border)]" data-testid={`row-scale-edit-${s.id}`}>
                    <td colSpan={5} className="px-4 py-4">
                      <div className="space-y-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} data-testid={`input-edit-scale-name-${s.id}`} className={inputClass} />
                          <select value={editType} onChange={(e) => setEditType(e.target.value)} data-testid={`select-edit-scale-type-${s.id}`} className={inputClass}>
                            <option value="numeric">Numerisch</option>
                            <option value="likert">Likert-Skala</option>
                            <option value="custom">Benutzerdefiniert</option>
                          </select>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <input type="number" value={editMin} onChange={(e) => setEditMin(e.target.value)} placeholder="Min" data-testid={`input-edit-scale-min-${s.id}`} className={inputClass} />
                          <input type="number" value={editMax} onChange={(e) => setEditMax(e.target.value)} placeholder="Max" data-testid={`input-edit-scale-max-${s.id}`} className={inputClass} />
                        </div>
                        {renderPointsEditor(editPoints, true)}
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdate(s.id)} data-testid={`button-save-scale-${s.id}`} className={`${btnPrimary} text-xs px-3 py-1.5`}>Speichern</button>
                          <button onClick={() => setEditingScaleId(null)} className="text-xs text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)]">Abbrechen</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={s.id} className="border-b border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)]/50" data-testid={`row-scale-${s.id}`}>
                  <td className="px-4 py-3 font-medium text-[var(--eds-text-primary)]">{s.name}</td>
                  <td className="px-4 py-3 text-[var(--eds-text-tertiary)]">{SCALE_TYPE_LABELS[s.type] || s.type}</td>
                  <td className="px-4 py-3 text-[var(--eds-text-tertiary)]">{pts.length}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(s)} data-testid={`button-edit-scale-${s.id}`} className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium">Bearbeiten</button>
                      <button onClick={() => handleDelete(s.id)} data-testid={`button-delete-scale-${s.id}`} className={btnDanger}>Löschen</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {scales.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--eds-text-disabled)]">Keine Skalen vorhanden.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WeightsTab({ workspaceSlug, router }: { workspaceSlug: string; router: ReturnType<typeof useRouter> }) {
  const [models, setModels] = useState<CompetencyModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [profiles, setProfiles] = useState<WeightingProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newWeights, setNewWeights] = useState<WeightEntry[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editWeights, setEditWeights] = useState<WeightEntry[]>([]);
  const [aiMessage, setAiMessage] = useState("");

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models`);
      if (res.status === 401) { router.push(`/w/${workspaceSlug}/login`); return; }
      if (!res.ok) throw new Error();
      setModels(await res.json());
    } catch {}
  }, [workspaceSlug, router]);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const modelNodes = selectedModel?.nodes || [];

  const fetchProfiles = useCallback(async () => {
    if (!selectedModelId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models/${selectedModelId}/weighting-profiles`);
      if (!res.ok) throw new Error();
      setProfiles(await res.json());
    } catch { setError("Fehler beim Laden der Gewichtungsprofile."); }
    finally { setLoading(false); }
  }, [workspaceSlug, selectedModelId]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  useEffect(() => {
    if (selectedModelId && modelNodes.length > 0) {
      setNewWeights(modelNodes.map((n) => ({ nodeId: n.id, weight: 1 })));
    }
  }, [selectedModelId, modelNodes.length]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models/${selectedModelId}/weighting-profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, targetRole: newRole || null, weights: newWeights }),
      });
      if (!res.ok) { const d = await res.json(); setCreateError(d.error || "Fehler beim Erstellen."); return; }
      setShowCreate(false);
      setNewName("");
      setNewRole("");
      fetchProfiles();
    } catch { setCreateError("Etwas ist schiefgelaufen."); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/competency-models/${selectedModelId}/weighting-profiles/${id}`, { method: "DELETE" });
      if (editingProfileId === id) setEditingProfileId(null);
      fetchProfiles();
    } catch {}
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/competency-models/${selectedModelId}/weighting-profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, targetRole: editRole || null, weights: editWeights }),
      });
      if (res.ok) { setEditingProfileId(null); fetchProfiles(); }
    } catch {}
  };

  const startEdit = (p: WeightingProfile) => {
    setEditingProfileId(p.id);
    setEditName(p.name);
    setEditRole(p.targetRole || "");
    const existingWeights = Array.isArray(p.weights) ? (p.weights as WeightEntry[]) : [];
    const merged = modelNodes.map((n) => {
      const existing = existingWeights.find((w) => w.nodeId === n.id);
      return { nodeId: n.id, weight: existing?.weight ?? 1 };
    });
    setEditWeights(merged);
  };

  const [aiLoading, setAiLoading] = useState(false);

  const handleAiSuggest = async () => {
    setAiMessage("");
    if (modelNodes.length === 0) {
      setAiMessage("Bitte wählen Sie ein Kompetenzmodell mit Knoten aus.");
      return;
    }
    setAiLoading(true);
    try {
      const competencyNames = modelNodes.map((n) => n.name);
      const targetRole = newRole || editRole || undefined;
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suggest_weights",
          competencies: competencyNames,
          targetRole,
          workspaceSlug,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.weights) {
        const aiWeights = data.data.weights as { competency: string; weight: number; rationale: string }[];
        const mappedWeights = modelNodes.map((node) => {
          const match = aiWeights.find((w) =>
            w.competency.toLowerCase() === node.name.toLowerCase() ||
            node.name.toLowerCase().includes(w.competency.toLowerCase()) ||
            w.competency.toLowerCase().includes(node.name.toLowerCase())
          );
          return { nodeId: node.id, weight: match ? Math.round(match.weight * 100) / 100 : 1 };
        });

        if (editingProfileId) {
          setEditWeights(mappedWeights);
        } else {
          setNewWeights(mappedWeights);
          if (!showCreate) setShowCreate(true);
        }

        const rationales = aiWeights
          .filter((w) => w.rationale)
          .map((w) => `${w.competency}: ${w.weight.toFixed(2)} – ${w.rationale}`)
          .join("\n");
        setAiMessage(`KI-Gewichtung angewendet:\n${rationales}`);
      } else {
        setAiMessage(data.error || "KI konnte keine Gewichtung vorschlagen.");
      }
    } catch { setAiMessage("Fehler bei der KI-Anfrage."); }
    finally { setAiLoading(false); }
  };

  const renderWeightsTable = (weights: WeightEntry[], onChange: (idx: number, weight: number) => void, prefix: string) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--eds-text-primary)]">Gewichtungen</label>
      <div className="border border-[var(--eds-border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-[var(--eds-bg-sunken)] border-b border-[var(--eds-border)]">
            <th className="text-left px-3 py-2 font-medium text-[var(--eds-text-secondary)]">Kompetenz</th>
            <th className="text-left px-3 py-2 font-medium text-[var(--eds-text-secondary)] w-24">Gewicht</th>
          </tr></thead>
          <tbody>
            {weights.map((w, i) => {
              const node = modelNodes.find((n) => n.id === w.nodeId);
              return (
                <tr key={w.nodeId} className="border-b border-[var(--eds-border)]">
                  <td className="px-3 py-2 text-[var(--eds-text-primary)]">{node?.name || w.nodeId}</td>
                  <td className="px-3 py-2">
                    <input type="number" value={w.weight} onChange={(e) => onChange(i, parseFloat(e.target.value) || 0)} step="0.1" min="0" className={`${inputClass} w-20 text-xs py-1`} data-testid={`${prefix}input-weight-${i}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
        <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-2">Kompetenzmodell auswählen</label>
        <select value={selectedModelId} onChange={(e) => { setSelectedModelId(e.target.value); setEditingProfileId(null); }} data-testid="select-weight-model" className={inputClass}>
          <option value="">– Bitte wählen –</option>
          {models.map((m) => {
            const src = SOURCE_TYPE_LABELS[m.sourceType || "manual"] || SOURCE_TYPE_LABELS.manual;
            return <option key={m.id} value={m.id}>{m.name} ({src.label}{m.companyName ? ` · ${m.companyName}` : ""})</option>;
          })}
        </select>
      </div>

      {selectedModelId && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--eds-text-tertiary)]" data-testid="text-profile-count">{profiles.length} Profile</p>
            <div className="flex gap-2">
              <button onClick={handleAiSuggest} disabled={aiLoading} data-testid="button-ai-suggest-weights" className="rounded-lg bg-purple-600 text-white text-sm font-medium px-4 py-2 hover:bg-purple-700 transition-colors disabled:opacity-50">
                {aiLoading ? "KI analysiert..." : "KI-Assistent: Gewichtung vorschlagen"}
              </button>
              <button onClick={() => setShowCreate(!showCreate)} data-testid="button-create-profile" className={btnPrimary}>
                {showCreate ? "Abbrechen" : "Neues Profil"}
              </button>
            </div>
          </div>

          {aiMessage && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800 whitespace-pre-line" data-testid="text-ai-weight-message">
              {aiMessage}
            </div>
          )}

          {error && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-error">{error}</p>}

          {showCreate && (
            <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-brand-navy mb-4">Neues Gewichtungsprofil</h2>
              <form onSubmit={handleCreate} className="space-y-4" data-testid="form-create-profile">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Name *</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required data-testid="input-profile-name" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Zielrolle</label>
                    <select value={newRole} onChange={(e) => setNewRole(e.target.value)} data-testid="select-profile-role" className={inputClass}>
                      <option value="">– Keine –</option>
                      {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                </div>
                {renderWeightsTable(newWeights, (i, w) => { const u = [...newWeights]; u[i] = { ...u[i], weight: w }; setNewWeights(u); }, "")}
                {createError && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-create-error">{createError}</p>}
                <button type="submit" disabled={creating || !newName.trim()} data-testid="button-submit-profile" className={`${btnPrimary} px-6 disabled:opacity-50`}>
                  {creating ? "Wird erstellt…" : "Profil erstellen"}
                </button>
              </form>
            </div>
          )}

          {loading && <p className="text-sm text-[var(--eds-text-disabled)]">Laden…</p>}

          <div className="space-y-4">
            {profiles.map((p) => {
              const badge = STATUS_BADGES[p.status] || STATUS_BADGES.draft;
              if (editingProfileId === p.id) {
                return (
                  <div key={p.id} className="bg-white border border-[var(--eds-border)] rounded-xl p-6" data-testid={`card-profile-edit-${p.id}`}>
                    <h3 className="text-sm font-semibold text-brand-navy mb-3">Profil bearbeiten (Version {p.version} → {p.version + 1})</h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Name</label>
                          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} data-testid={`input-edit-profile-name-${p.id}`} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-1">Zielrolle</label>
                          <select value={editRole} onChange={(e) => setEditRole(e.target.value)} data-testid={`select-edit-profile-role-${p.id}`} className={inputClass}>
                            <option value="">– Keine –</option>
                            {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                          </select>
                        </div>
                      </div>
                      {renderWeightsTable(editWeights, (i, w) => { const u = [...editWeights]; u[i] = { ...u[i], weight: w }; setEditWeights(u); }, "edit-")}
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(p.id)} data-testid={`button-save-profile-${p.id}`} className={`${btnPrimary} text-xs px-4 py-1.5`}>Speichern</button>
                        <button onClick={() => setEditingProfileId(null)} className="text-xs text-[var(--eds-text-tertiary)] hover:text-[var(--eds-text-primary)]">Abbrechen</button>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={p.id} className="bg-white border border-[var(--eds-border)] rounded-xl p-6 flex items-center justify-between" data-testid={`card-profile-${p.id}`}>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-brand-navy">{p.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-[var(--eds-text-disabled)]">
                      {p.targetRole && <span>{ROLE_LABELS[p.targetRole] || p.targetRole}</span>}
                      <span>Version {p.version}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p)} data-testid={`button-edit-profile-${p.id}`} className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium">Bearbeiten</button>
                    <button onClick={() => handleDelete(p.id)} data-testid={`button-delete-profile-${p.id}`} className={btnDanger}>Löschen</button>
                  </div>
                </div>
              );
            })}
            {profiles.length === 0 && !loading && selectedModelId && (
              <div className="bg-white border border-[var(--eds-border)] rounded-xl p-8 text-center text-[var(--eds-text-disabled)]">
                Keine Gewichtungsprofile vorhanden.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

type MtmmLevel = "domain" | "competency" | "sub" | "anchor";

const MTMM_LEVEL_OPTIONS: { key: MtmmLevel; label: string; description: string }[] = [
  { key: "domain", label: "Cluster / Domänen", description: "Gröbste Ebene — nur übergeordnete Kompetenzcluster zuordnen" },
  { key: "competency", label: "Kompetenzen", description: "Standard-Ebene — einzelne Kompetenzen den Übungen zuordnen" },
  { key: "sub", label: "Subkompetenzen / Dimensionen", description: "Feinere Ebene — Subkompetenzen und Dimensionen zuordnen" },
  { key: "anchor", label: "Verhaltensanker", description: "Feinste Ebene — jeden einzelnen Verhaltensanker zuordnen" },
];

const MTMM_LEVEL_TYPES: Record<MtmmLevel, string[]> = {
  domain: ["domain"],
  competency: ["domain", "competency"],
  sub: ["domain", "competency", "sub"],
  anchor: ["domain", "competency", "sub", "anchor"],
};

function MappingTab({ workspaceSlug, router }: { workspaceSlug: string; router: ReturnType<typeof useRouter> }) {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [models, setModels] = useState<CompetencyModel[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<MtmmLevel | "">("");
  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [mappings, setMappings] = useState<Record<string, Record<string, { mapped: boolean; weight: number }>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [error, setError] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [savedMappings, setSavedMappings] = useState<{ id: string; exerciseId: string; competencyNodeId: string; weight: number; exercise: { id: string; name: string }; competencyNode: { id: string; name: string; description: string | null; sortOrder: number } }[]>([]);
  const [savedMappingsLoading, setSavedMappingsLoading] = useState(false);

  interface SnapshotRecord {
    id: string;
    assessmentId: string;
    version: number;
    label: string | null;
    status: string;
    lockedAt: string | null;
    lockedReason: string | null;
    createdAt: string;
    _count: { mappings: number };
  }
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [snapshotAction, setSnapshotAction] = useState("");
  const [showActivateWarning, setShowActivateWarning] = useState<SnapshotRecord | null>(null);

  const fetchSnapshots = useCallback(async (assessmentId: string) => {
    if (!assessmentId) { setSnapshots([]); setActiveSnapshotId(null); return; }
    setSnapshotsLoading(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${assessmentId}/mtmm-snapshots`);
      if (res.ok) {
        const data: SnapshotRecord[] = await res.json();
        setSnapshots(data);
        const active = data.find((s) => s.status === "active");
        setActiveSnapshotId(active?.id ?? null);
        setEditingSnapshotId(active?.id ?? (data.length > 0 ? data[0].id : null));
      } else { setSnapshots([]); setActiveSnapshotId(null); }
    } catch { setSnapshots([]); }
    finally { setSnapshotsLoading(false); }
  }, [workspaceSlug]);

  const handleCreateSnapshot = async (fromSnapshotId?: string) => {
    if (!selectedAssessmentId) return;
    setSnapshotAction("creating");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/mtmm-snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromSnapshotId }),
      });
      if (res.ok) {
        const newSnap = await res.json();
        await fetchSnapshots(selectedAssessmentId);
        setEditingSnapshotId(newSnap.id);
      }
    } catch {}
    finally { setSnapshotAction(""); }
  };

  const handleSnapshotAction = async (snapshotId: string, action: string) => {
    if (!selectedAssessmentId) return;
    setSnapshotAction(action);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/mtmm-snapshots/${snapshotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchSnapshots(selectedAssessmentId);
        fetchSavedMappings(selectedAssessmentId);
      } else {
        const d = await res.json();
        alert(d.error || "Aktion fehlgeschlagen.");
      }
    } catch { alert("Netzwerkfehler"); }
    finally { setSnapshotAction(""); setShowActivateWarning(null); }
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    if (!selectedAssessmentId) return;
    if (!confirm("Diesen Entwurf wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/mtmm-snapshots/${snapshotId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchSnapshots(selectedAssessmentId);
        if (editingSnapshotId === snapshotId) setEditingSnapshotId(null);
      } else {
        const d = await res.json();
        alert(d.error || "Löschen fehlgeschlagen.");
      }
    } catch {}
  };

  const currentSnapshot = snapshots.find((s) => s.id === editingSnapshotId);
  const isCurrentLocked = currentSnapshot?.lockedAt != null;

  const fetchSavedMappings = useCallback(async (assessmentId: string) => {
    if (!assessmentId) { setSavedMappings([]); return; }
    setSavedMappingsLoading(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${assessmentId}/exercise-competency-mappings?active=true`);
      if (res.ok) {
        const data = await res.json();
        setSavedMappings(Array.isArray(data) ? data.filter((m: any) => m.exercise && m.competencyNode) : []);
      } else setSavedMappings([]);
    } catch { setSavedMappings([]); }
    finally { setSavedMappingsLoading(false); }
  }, [workspaceSlug]);

  const fetchInit = useCallback(async () => {
    try {
      const [aRes, mRes] = await Promise.all([
        fetch(`/api/w/${workspaceSlug}/assessments`),
        fetch(`/api/w/${workspaceSlug}/competency-models`),
      ]);
      if (aRes.status === 401 || mRes.status === 401) { router.push(`/w/${workspaceSlug}/login`); return; }
      if (aRes.ok) setAssessments(await aRes.json());
      if (mRes.ok) setModels(await mRes.json());
    } catch {}
  }, [workspaceSlug, router]);

  useEffect(() => { fetchInit(); }, [fetchInit]);

  const selectedModel = models.find((m) => m.id === selectedModelId);

  const getNodesForLevel = useCallback((level: MtmmLevel) => {
    if (!selectedModel) return [];
    const allNodes = selectedModel.nodes || [];
    const targetType = level;
    const nodesOfType = allNodes.filter((n) => n.nodeType === targetType);
    if (nodesOfType.length > 0) return nodesOfType;
    const allowedTypes = MTMM_LEVEL_TYPES[level];
    const deepest = [...allowedTypes].reverse().find((t) => allNodes.some((n) => n.nodeType === t));
    return deepest ? allNodes.filter((n) => n.nodeType === deepest) : allNodes.filter((n) => {
      const hasChildren = allNodes.some((c) => c.parentId === n.id);
      return !hasChildren;
    });
  }, [selectedModel]);

  const matrixNodes = selectedLevel ? getNodesForLevel(selectedLevel) : [];

  const fetchMappingData = useCallback(async () => {
    if (!selectedAssessmentId || !selectedModelId || !selectedLevel) return;
    setLoading(true);
    setError("");
    try {
      const snapshotParam = editingSnapshotId ? `?snapshotId=${editingSnapshotId}` : "";
      const [detailRes, mapRes] = await Promise.all([
        fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}`),
        fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/exercise-competency-mappings${snapshotParam}`),
      ]);
      if (!detailRes.ok) throw new Error();
      const detail = await detailRes.json();
      const exList: ExerciseRecord[] = detail.exercises || [];
      setExercises(exList);

      const existingMappings: MappingRecord[] = mapRes.ok ? await mapRes.json() : [];
      const nodes = getNodesForLevel(selectedLevel);
      const grid: Record<string, Record<string, { mapped: boolean; weight: number }>> = {};
      for (const ex of exList) {
        grid[ex.id] = {};
        for (const node of nodes) {
          const existing = existingMappings.find((m) => m.exerciseId === ex.id && m.competencyNodeId === node.id);
          grid[ex.id][node.id] = { mapped: !!existing, weight: existing?.weight ?? 1 };
        }
      }
      setMappings(grid);
    } catch { setError("Fehler beim Laden der Zuordnungsdaten."); }
    finally { setLoading(false); }
  }, [workspaceSlug, selectedAssessmentId, selectedModelId, selectedLevel, editingSnapshotId, getNodesForLevel]);

  useEffect(() => { fetchMappingData(); }, [selectedAssessmentId, selectedModelId, selectedLevel, editingSnapshotId]);

  const toggleMapping = (exerciseId: string, nodeId: string) => {
    setMappings((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [nodeId]: { ...prev[exerciseId][nodeId], mapped: !prev[exerciseId][nodeId].mapped },
      },
    }));
  };

  const updateWeight = (exerciseId: string, nodeId: string, weight: number) => {
    setMappings((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [nodeId]: { ...prev[exerciseId][nodeId], weight },
      },
    }));
  };

  const handleAiSuggest = async () => {
    if (!selectedAssessmentId || !selectedModelId || !selectedLevel) return;
    setAiGenerating(true);
    setAiError("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/mtmm-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competencyModelId: selectedModelId,
          level: selectedLevel,
          exerciseIds: exercises.map((e) => e.id),
          nodeIds: matrixNodes.map((n) => n.id),
          exercises: exercises.map((e) => ({ id: e.id, name: e.name, type: e.type })),
          nodes: matrixNodes.map((n) => ({ id: n.id, name: n.name, nodeType: n.nodeType })),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "KI-Vorschlag fehlgeschlagen");
      }
      const suggestions: { exerciseId: string; nodeId: string; weight: number; rationale?: string }[] = await res.json();
      const newGrid: Record<string, Record<string, { mapped: boolean; weight: number }>> = {};
      for (const ex of exercises) {
        newGrid[ex.id] = {};
        for (const node of matrixNodes) {
          const suggestion = suggestions.find((s) => s.exerciseId === ex.id && s.nodeId === node.id);
          newGrid[ex.id][node.id] = suggestion
            ? { mapped: true, weight: suggestion.weight }
            : { mapped: false, weight: 1 };
        }
      }
      setMappings(newGrid);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "KI-Vorschlag fehlgeschlagen");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSave = async () => {
    if (isCurrentLocked) {
      setSaveMsg("Diese Version ist gesperrt. Bitte erstellen Sie eine neue Version.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      const flatMappings: { exerciseId: string; competencyNodeId: string; weight: number }[] = [];
      for (const exId of Object.keys(mappings)) {
        for (const nodeId of Object.keys(mappings[exId])) {
          const cell = mappings[exId][nodeId];
          if (cell.mapped) {
            flatMappings.push({ exerciseId: exId, competencyNodeId: nodeId, weight: cell.weight });
          }
        }
      }
      const res = await fetch(`/api/w/${workspaceSlug}/assessments/${selectedAssessmentId}/exercise-competency-mappings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: flatMappings, snapshotId: editingSnapshotId }),
      });
      if (res.ok) {
        setSaveMsg("MTMM-Matrix gespeichert.");
        fetchSavedMappings(selectedAssessmentId);
        fetchSnapshots(selectedAssessmentId);
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        const d = await res.json();
        setSaveMsg(d.error || "Fehler beim Speichern.");
      }
    } catch { setSaveMsg("Etwas ist schiefgelaufen."); }
    finally { setSaving(false); }
  };

  const showMatrix = selectedAssessmentId && selectedModelId && selectedLevel && !loading;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-brand-navy mb-1">Generierung MTMM-Matrix</h2>
        <p className="text-sm text-[var(--eds-text-tertiary)] mb-5">Multi-Trait-Multi-Method — Zuordnung von Übungen (Methoden) zu Kompetenzdimensionen (Traits)</p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-2">Assessment auswählen</label>
            <select value={selectedAssessmentId} onChange={(e) => { setSelectedAssessmentId(e.target.value); fetchSavedMappings(e.target.value); fetchSnapshots(e.target.value); }} data-testid="select-mapping-assessment" className={inputClass}>
              <option value="">– Bitte wählen –</option>
              {assessments.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-2">Kompetenzmodell auswählen</label>
            <select value={selectedModelId} onChange={(e) => { setSelectedModelId(e.target.value); setSelectedLevel(""); }} data-testid="select-mapping-model" className={inputClass}>
              <option value="">– Bitte wählen –</option>
              {models.map((m) => {
                const src = SOURCE_TYPE_LABELS[m.sourceType || "manual"] || SOURCE_TYPE_LABELS.manual;
                return <option key={m.id} value={m.id}>{m.name} ({src.label}{m.companyName ? ` · ${m.companyName}` : ""})</option>;
              })}
            </select>
          </div>
        </div>

        {selectedAssessmentId && selectedModelId && (
          <div>
            <label className="block text-sm font-medium text-[var(--eds-text-primary)] mb-3">Zuordnungsebene wählen</label>
            <div className="grid md:grid-cols-2 gap-3" data-testid="section-level-selection">
              {MTMM_LEVEL_OPTIONS.map((opt) => {
                const nodesCount = getNodesForLevel(opt.key).length;
                const isDisabled = nodesCount === 0;
                return (
                  <button
                    key={opt.key}
                    onClick={() => !isDisabled && setSelectedLevel(opt.key)}
                    disabled={isDisabled}
                    data-testid={`button-level-${opt.key}`}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      selectedLevel === opt.key
                        ? "border-brand-blue bg-[var(--eds-status-blue-bg)]/50 ring-1 ring-brand-blue/20"
                        : isDisabled
                        ? "border-[var(--eds-border)] bg-[var(--eds-bg-sunken)] opacity-50 cursor-not-allowed"
                        : "border-[var(--eds-border)] hover:border-[var(--eds-border-strong)] hover:bg-[var(--eds-bg-sunken)] cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${selectedLevel === opt.key ? "text-brand-blue" : "text-brand-navy"}`}>{opt.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${nodesCount > 0 ? "bg-[var(--eds-bg-sunken)] text-[var(--eds-text-secondary)]" : "bg-[var(--eds-status-red-bg)] text-[var(--eds-status-red)]"}`}>
                        {nodesCount} {nodesCount === 1 ? "Element" : "Elemente"}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--eds-text-tertiary)]">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedAssessmentId && (
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6" data-testid="section-saved-mappings">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">Bestehende Zuordnungen</h2>
              <p className="text-xs text-[var(--eds-text-tertiary)] mt-0.5">Bereits gespeicherte MTMM-Zuordnungen für dieses Assessment</p>
            </div>
            {savedMappings.length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)] font-medium" data-testid="text-saved-count">
                {savedMappings.length} Zuordnung{savedMappings.length !== 1 ? "en" : ""}
              </span>
            )}
          </div>

          {savedMappingsLoading ? (
            <p className="text-sm text-[var(--eds-text-disabled)] text-center py-4">Laden…</p>
          ) : savedMappings.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[var(--eds-border)] rounded-lg" data-testid="saved-mappings-empty">
              <svg className="w-8 h-8 text-[var(--eds-text-disabled)] mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
              </svg>
              <p className="text-sm text-[var(--eds-text-tertiary)]">Noch keine Zuordnungen gespeichert</p>
              <p className="text-xs text-[var(--eds-text-disabled)] mt-1">Wählen Sie oben eine Zuordnungsebene, um Übungen Kompetenzen zuzuordnen.</p>
            </div>
          ) : (() => {
            const uniqueExercises = [...new Map(savedMappings.map(m => [m.exercise.id, m.exercise])).values()];
            const uniqueNodes = [...new Map(savedMappings.map(m => [m.competencyNode.id, m.competencyNode])).values()]
              .sort((a, b) => a.sortOrder - b.sortOrder);
            const mappingLookup = new Map(savedMappings.map(m => [`${m.exerciseId}:${m.competencyNodeId}`, m.weight]));
            const totalMapped = savedMappings.length;
            const primaryCount = savedMappings.filter(m => m.weight >= 1.5).length;
            const standardCount = savedMappings.filter(m => m.weight >= 1.0 && m.weight < 1.5).length;
            const secondaryCount = savedMappings.filter(m => m.weight < 1.0).length;

            return (
              <>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-[var(--eds-bg-sunken)] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-brand-navy">{totalMapped}</div>
                    <div className="text-[10px] text-[var(--eds-text-tertiary)] mt-0.5">Gesamt</div>
                  </div>
                  <div className="bg-[var(--eds-status-green-bg)] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[var(--eds-status-green)]">{primaryCount}</div>
                    <div className="text-[10px] text-[var(--eds-status-green)] mt-0.5">Primär (≥1.5)</div>
                  </div>
                  <div className="bg-[var(--eds-status-blue-bg)] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[var(--eds-status-blue)]">{standardCount}</div>
                    <div className="text-[10px] text-[var(--eds-status-blue)] mt-0.5">Standard (1.0–1.4)</div>
                  </div>
                  <div className="bg-[var(--eds-status-amber-bg)] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[var(--eds-status-amber)]">{secondaryCount}</div>
                    <div className="text-[10px] text-[var(--eds-status-amber)] mt-0.5">Sekundär (&lt;1.0)</div>
                  </div>
                </div>

                <div className="overflow-x-auto" data-testid="saved-mappings-table">
                  <table className="text-sm border-collapse w-full">
                    <thead>
                      <tr className="border-b border-[var(--eds-border)]">
                        <th className="text-left py-2 px-3 font-medium text-[var(--eds-text-secondary)] bg-[var(--eds-bg-sunken)] rounded-tl-lg sticky left-0 z-10 min-w-[160px]">Übung</th>
                        {uniqueNodes.map(node => (
                          <th key={node.id} className="text-center py-2 px-2 font-medium text-[var(--eds-text-secondary)] bg-[var(--eds-bg-sunken)] min-w-[100px]" title={node.description || node.name}>
                            <span className="text-xs leading-tight block">{node.name}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueExercises.map(ex => (
                        <tr key={ex.id} className="border-b border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)]/50">
                          <td className="py-2 px-3 font-medium text-[var(--eds-text-primary)] sticky left-0 bg-white z-10">{ex.name}</td>
                          {uniqueNodes.map(node => {
                            const weight = mappingLookup.get(`${ex.id}:${node.id}`);
                            return (
                              <td key={node.id} className="text-center py-2 px-2">
                                {weight !== undefined ? (
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${
                                    weight >= 1.5 ? "bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)]" :
                                    weight >= 1.0 ? "bg-[var(--eds-status-blue-bg)] text-[var(--eds-status-blue)]" :
                                    "bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)]"
                                  }`}>
                                    {weight.toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="text-[var(--eds-border)]">–</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--eds-text-disabled)]">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--eds-status-green-bg)] inline-block"></span> ≥ 1.5 Primär</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--eds-status-blue-bg)] inline-block"></span> 1.0–1.4 Standard</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] inline-block"></span> &lt; 1.0 Sekundär</span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {selectedAssessmentId && (
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6" data-testid="section-mtmm-versions">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">MTMM-Versionen</h2>
              <p className="text-xs text-[var(--eds-text-tertiary)] mt-0.5">Versionsverwaltung und Schutz der MTMM-Matrix</p>
            </div>
            <button
              onClick={() => handleCreateSnapshot(activeSnapshotId || undefined)}
              disabled={!!snapshotAction}
              data-testid="button-create-snapshot"
              className="rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-[var(--eds-status-blue)] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Neue Version erstellen
            </button>
          </div>

          {snapshotsLoading ? (
            <p className="text-sm text-[var(--eds-text-disabled)] text-center py-4">Laden…</p>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[var(--eds-border)] rounded-lg">
              <svg className="w-8 h-8 text-[var(--eds-text-disabled)] mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm text-[var(--eds-text-tertiary)]">Noch keine Versionen vorhanden</p>
              <p className="text-xs text-[var(--eds-text-disabled)] mt-1">Speichern Sie eine Matrix oder erstellen Sie eine neue Version, um den Schutz zu aktivieren.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {snapshots.map((snap) => {
                const isActive = snap.status === "active";
                const isLocked = snap.lockedAt != null;
                const isEditing = editingSnapshotId === snap.id;
                return (
                  <div
                    key={snap.id}
                    data-testid={`row-snapshot-${snap.id}`}
                    className={`border rounded-lg px-4 py-3 transition-all cursor-pointer ${
                      isEditing
                        ? "border-brand-blue bg-[var(--eds-status-blue-bg)]/30 ring-1 ring-brand-blue/20"
                        : "border-[var(--eds-border)] hover:border-[var(--eds-border-strong)]"
                    } ${snap.status === "archived" ? "opacity-60" : ""}`}
                    onClick={() => snap.status !== "archived" && setEditingSnapshotId(snap.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-brand-navy">
                          {snap.label || `Version ${snap.version}`}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isActive
                            ? "bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)]"
                            : snap.status === "draft"
                            ? "bg-[var(--eds-status-amber-bg)] text-[var(--eds-status-amber)]"
                            : "bg-[var(--eds-bg-sunken)] text-[var(--eds-text-tertiary)]"
                        }`}>
                          {isActive ? "Aktiv" : snap.status === "draft" ? "Entwurf" : "Archiviert"}
                        </span>
                        {isLocked && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--eds-status-red-bg)] text-[var(--eds-status-red)] font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                            Gesperrt
                          </span>
                        )}
                        <span className="text-xs text-[var(--eds-text-disabled)]">
                          {snap._count.mappings} Zuordnung{snap._count.mappings !== 1 ? "en" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {snap.status === "draft" && (
                          <>
                            <button
                              onClick={() => {
                                const activeSnap = snapshots.find((s) => s.status === "active");
                                if (activeSnap && activeSnap.lockedAt) {
                                  setShowActivateWarning(snap);
                                } else {
                                  handleSnapshotAction(snap.id, "activate");
                                }
                              }}
                              disabled={!!snapshotAction}
                              data-testid={`button-activate-${snap.id}`}
                              className="text-xs px-2.5 py-1 rounded-lg bg-[var(--eds-status-green-bg)] text-[var(--eds-status-green)] hover:bg-[var(--eds-status-green-bg)] transition-colors font-medium disabled:opacity-50"
                            >
                              Aktivieren
                            </button>
                            <button
                              onClick={() => handleDeleteSnapshot(snap.id)}
                              disabled={!!snapshotAction}
                              className="text-xs px-2 py-1 rounded-lg text-[var(--eds-status-red)] hover:bg-[var(--eds-status-red-bg)] transition-colors"
                            >
                              Löschen
                            </button>
                          </>
                        )}
                        {isActive && !isLocked && (
                          <button
                            onClick={() => handleSnapshotAction(snap.id, "archive")}
                            disabled={!!snapshotAction}
                            className="text-xs px-2.5 py-1 rounded-lg text-[var(--eds-text-tertiary)] hover:bg-[var(--eds-bg-sunken)] transition-colors"
                          >
                            Archivieren
                          </button>
                        )}
                        {isActive && isLocked && (
                          <span className="text-[10px] text-[var(--eds-status-red)] italic">{snap.lockedReason}</span>
                        )}
                        {snap.status !== "archived" && (
                          <button
                            onClick={() => handleCreateSnapshot(snap.id)}
                            disabled={!!snapshotAction}
                            title="Als Basis für neue Version kopieren"
                            className="text-xs px-2 py-1 rounded-lg text-[var(--eds-text-disabled)] hover:bg-[var(--eds-bg-sunken)] hover:text-[var(--eds-text-secondary)] transition-colors"
                          >
                            Kopieren
                          </button>
                        )}
                      </div>
                    </div>
                    {isLocked && isEditing && (
                      <div className="mt-2 p-2.5 bg-[var(--eds-status-amber-bg)] border border-[var(--eds-status-amber-bg)] rounded-lg">
                        <p className="text-xs text-[var(--eds-status-amber)] flex items-center gap-1.5">
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                          Diese Version ist gesperrt, da bereits Bewertungen darauf basieren. Änderungen sind nicht möglich. Erstellen Sie eine neue Version, um Anpassungen vorzunehmen.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showActivateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowActivateWarning(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--eds-status-amber-bg)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--eds-status-amber)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-brand-navy">Version aktivieren?</h3>
                <p className="text-xs text-[var(--eds-text-tertiary)]">Die aktuell aktive Version ist gesperrt</p>
              </div>
            </div>
            <p className="text-sm text-[var(--eds-text-secondary)] mb-4">
              Die aktuell aktive MTMM-Matrix ist gesperrt, da bereits Bewertungen darauf basieren.
              Wenn Sie eine neue Version aktivieren, wird die bisherige aktive Version archiviert.
              Bestehende Bewertungen bleiben erhalten, nutzen aber die neue Matrix-Zuordnung.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowActivateWarning(null)}
                className="rounded-lg px-4 py-2 text-sm text-[var(--eds-text-secondary)] hover:bg-[var(--eds-bg-sunken)] transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleSnapshotAction(showActivateWarning.id, "activate")}
                disabled={!!snapshotAction}
                className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                Trotzdem aktivieren
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[var(--eds-status-red)]" data-testid="text-error">{error}</p>}
      {aiError && (
        <div className="p-3 bg-[var(--eds-status-red-bg)] border border-[var(--eds-status-red-bg)] rounded-lg text-sm text-[var(--eds-status-red)]" data-testid="text-ai-error">
          {aiError}
          <button onClick={() => setAiError("")} className="ml-3 underline text-xs">Schließen</button>
        </div>
      )}

      {loading && <p className="text-sm text-[var(--eds-text-disabled)]">Laden…</p>}

      {showMatrix && exercises.length > 0 && matrixNodes.length > 0 && (
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">MTMM-Matrix</h2>
              <p className="text-xs text-[var(--eds-text-tertiary)]">
                Ebene: {MTMM_LEVEL_OPTIONS.find((o) => o.key === selectedLevel)?.label} · {exercises.length} Methoden × {matrixNodes.length} Traits
                {currentSnapshot && (
                  <span className="ml-2">
                    · Version: <span className="font-medium">{currentSnapshot.label || `V${currentSnapshot.version}`}</span>
                    {currentSnapshot.status === "active" && <span className="text-[var(--eds-status-green)] ml-1">(Aktiv)</span>}
                    {currentSnapshot.status === "draft" && <span className="text-[var(--eds-status-amber)] ml-1">(Entwurf)</span>}
                    {isCurrentLocked && <span className="text-[var(--eds-status-red)] ml-1">(Gesperrt)</span>}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAiSuggest}
                disabled={aiGenerating}
                data-testid="button-ai-suggest-mtmm"
                className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium px-4 py-2 hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {aiGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    KI analysiert…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    KI-Vorschlag generieren
                  </>
                )}
              </button>
              {saveMsg && <span className="text-sm text-[var(--eds-text-tertiary)]" data-testid="text-save-msg">{saveMsg}</span>}
              <button onClick={handleSave} disabled={saving || isCurrentLocked} data-testid="button-save-mappings" className={`${btnPrimary} px-6 disabled:opacity-50`}>
                {isCurrentLocked ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Gesperrt
                  </span>
                ) : saving ? "Wird gespeichert…" : "Matrix speichern"}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse w-full" data-testid="table-mtmm-matrix">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-[var(--eds-text-secondary)] border-b border-[var(--eds-border)] sticky left-0 bg-white min-w-[150px] z-10">Methode / Übung</th>
                  {matrixNodes.map((node) => (
                    <th key={node.id} className="text-center px-2 py-2 font-medium text-[var(--eds-text-secondary)] border-b border-[var(--eds-border)] min-w-[120px]">
                      <div className="text-xs leading-tight">{node.name}</div>
                      <div className="text-[10px] text-[var(--eds-text-disabled)] mt-0.5">{NODE_TYPE_LABELS[node.nodeType] || node.nodeType}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex) => (
                  <tr key={ex.id} className="border-b border-[var(--eds-border)] hover:bg-[var(--eds-bg-sunken)]/50" data-testid={`row-mtmm-${ex.id}`}>
                    <td className="px-3 py-2 font-medium text-[var(--eds-text-primary)] sticky left-0 bg-white z-10">
                      <div>{ex.name}</div>
                      <div className="text-[10px] text-[var(--eds-text-disabled)]">{ex.type}</div>
                    </td>
                    {matrixNodes.map((node) => {
                      const cell = mappings[ex.id]?.[node.id];
                      if (!cell) return <td key={node.id} className="px-2 py-2 text-center" />;
                      return (
                        <td key={node.id} className={`px-2 py-2 text-center ${cell.mapped ? "bg-[var(--eds-status-blue-bg)]/40" : ""}`}>
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="checkbox"
                              checked={cell.mapped}
                              onChange={() => toggleMapping(ex.id, node.id)}
                              data-testid={`checkbox-mtmm-${ex.id}-${node.id}`}
                              className="rounded border-[var(--eds-border-strong)] text-brand-blue focus:ring-brand-blue"
                            />
                            {cell.mapped && (
                              <input
                                type="number"
                                value={cell.weight}
                                onChange={(e) => updateWeight(ex.id, node.id, parseFloat(e.target.value) || 0)}
                                step="0.1"
                                min="0"
                                className="w-16 text-xs text-center rounded border border-[var(--eds-border)] py-0.5"
                                data-testid={`input-mtmm-weight-${ex.id}-${node.id}`}
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showMatrix && exercises.length === 0 && (
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-8 text-center text-[var(--eds-text-disabled)]">
          Keine Übungen im ausgewählten Assessment vorhanden.
        </div>
      )}

      {showMatrix && matrixNodes.length === 0 && exercises.length > 0 && (
        <div className="bg-white border border-[var(--eds-border)] rounded-xl p-8 text-center text-[var(--eds-text-disabled)]">
          Keine Kompetenzen auf der gewählten Ebene vorhanden. Bitte eine andere Ebene wählen.
        </div>
      )}
    </div>
  );
}
