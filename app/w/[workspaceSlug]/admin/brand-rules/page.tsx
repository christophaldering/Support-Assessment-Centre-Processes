"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface BrandRuleSet {
  id: string;
  name: string;
  status: string;
  rulesJson: RulesJson;
  appliesToWorkspaceUi: boolean;
  appliesToDocuments: boolean;
  appliesToPptExports: boolean;
  appliesToExerciseMaterials: boolean;
  createdAt: string;
}

interface RulesJson {
  colors?: { primary?: string; secondary?: string; accent?: string; background?: string };
  typography?: { headingFont?: string; bodyFont?: string; headingSize?: string; bodySize?: string };
  spacing?: { gridUnit?: string; margins?: string };
  logo?: { position?: string; maxHeight?: string };
  tone?: { style?: string; notes?: string };
  document?: { coverPage?: boolean; headerFooter?: string; confidentialityNote?: string; pageNumbers?: boolean; watermark?: string };
  slides?: { titleSlide?: boolean; sectionDividers?: boolean; footer?: string; legalLine?: string };
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-slate-50", text: "text-slate-600", label: "Entwurf" },
  active: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Aktiv" },
  archived: { bg: "bg-red-50", text: "text-red-500", label: "Archiviert" },
};

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue";
const btnPrimary = "rounded-lg bg-brand-blue text-white text-sm font-medium px-4 py-2 hover:bg-brand-blue-dark transition-colors";
const btnDanger = "text-xs text-red-500 hover:text-red-700 font-medium";

const EMPTY_RULES: RulesJson = {
  colors: { primary: "#1a1a2e", secondary: "#16213e", accent: "#e94560", background: "#ffffff" },
  typography: { headingFont: "Playfair Display", bodyFont: "Inter", headingSize: "2rem", bodySize: "1rem" },
  spacing: { gridUnit: "8px", margins: "24px" },
  logo: { position: "top-left", maxHeight: "48px" },
  tone: { style: "formal", notes: "" },
  document: { coverPage: true, headerFooter: "", confidentialityNote: "", pageNumbers: true, watermark: "" },
  slides: { titleSlide: true, sectionDividers: true, footer: "", legalLine: "" },
};

type TabKey = "rulesets" | "preview" | "ai-analysis";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("de-DE");
}

export default function BrandRulesPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const [activeTab, setActiveTab] = useState<TabKey>("rulesets");

  const tabs: { key: TabKey; label: string; testId: string }[] = [
    { key: "rulesets", label: "Brand Rule Sets", testId: "tab-rulesets" },
    { key: "preview", label: "Preview & Apply", testId: "tab-preview" },
    { key: "ai-analysis", label: "KI-Analyse", testId: "tab-ai-analysis" },
  ];

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
            <span className="text-sm text-white/70">Brand & Style</span>
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
          <h1 className="text-2xl font-bold text-brand-navy">Brand & Style</h1>
          <p className="text-sm text-slate-500">Markenregelwerke verwalten und auf das Workspace-Theme anwenden</p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={tab.testId}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "rulesets" && <RuleSetsTab workspaceSlug={workspaceSlug} router={router} />}
        {activeTab === "preview" && <PreviewTab workspaceSlug={workspaceSlug} />}
        {activeTab === "ai-analysis" && <AIAnalysisTab workspaceSlug={workspaceSlug} onSwitchToEdit={() => setActiveTab("rulesets")} />}
      </main>

      <footer className="border-t py-6 border-slate-200">
        <p className="text-center text-xs text-slate-400">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}

function RuleSetsTab({ workspaceSlug, router }: { workspaceSlug: string; router: ReturnType<typeof useRouter> }) {
  const [ruleSets, setRuleSets] = useState<BrandRuleSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchRuleSets = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/brand-rules`);
      if (res.status === 401) { router.push(`/w/${workspaceSlug}/login`); return; }
      if (res.status === 403) { setError("Keine Berechtigung für die Markenverwaltung."); return; }
      if (!res.ok) throw new Error();
      setRuleSets(await res.json());
    } catch { setError("Fehler beim Laden der Regelwerke."); }
    finally { setLoading(false); }
  }, [workspaceSlug, router]);

  useEffect(() => { fetchRuleSets(); }, [fetchRuleSets]);

  const handleActivate = async (id: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/brand-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      fetchRuleSets();
    } catch {}
  };

  const handleArchive = async (id: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/brand-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      fetchRuleSets();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/w/${workspaceSlug}/brand-rules/${id}`, { method: "DELETE" });
      if (expandedId === id) setExpandedId(null);
      setDeleteConfirmId(null);
      fetchRuleSets();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500" data-testid="text-ruleset-count">{ruleSets.length} Regelwerke</p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          data-testid="button-create-ruleset"
          className={btnPrimary}
        >
          {showCreate ? "Abbrechen" : "+ Neues Regelwerk"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500" data-testid="text-error">{error}</p>}

      {showCreate && (
        <CreateRuleSetForm
          workspaceSlug={workspaceSlug}
          onCreated={() => { setShowCreate(false); fetchRuleSets(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {loading && <p className="text-sm text-slate-400">Laden…</p>}

      <div className="space-y-4">
        {ruleSets.map((rs) => {
          const badge = STATUS_BADGES[rs.status] || STATUS_BADGES.draft;
          const isExpanded = expandedId === rs.id;
          const appliesTo: string[] = [];
          if (rs.appliesToWorkspaceUi) appliesTo.push("UI");
          if (rs.appliesToDocuments) appliesTo.push("Dok");
          if (rs.appliesToPptExports) appliesTo.push("PPT");
          if (rs.appliesToExerciseMaterials) appliesTo.push("Übung");

          return (
            <div key={rs.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid={`card-ruleset-${rs.id}`}>
              <div
                className="p-6 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : rs.id)}
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-brand-navy">{rs.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`} data-testid={`badge-status-${rs.id}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-slate-400">
                    <span>Erstellt: {formatDate(rs.createdAt)}</span>
                    {appliesTo.length > 0 && (
                      <span className="flex gap-1">
                        {appliesTo.map((a) => (
                          <span key={a} className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-medium">{a}</span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {rs.status !== "active" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleActivate(rs.id); }}
                      data-testid={`button-activate-${rs.id}`}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Aktivieren
                    </button>
                  )}
                  {rs.status === "active" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleArchive(rs.id); }}
                      data-testid={`button-archive-${rs.id}`}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Archivieren
                    </button>
                  )}
                  {rs.status !== "active" && (
                    <>
                      {deleteConfirmId === rs.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs text-red-500">Sicher?</span>
                          <button onClick={() => handleDelete(rs.id)} className="text-xs text-red-600 font-bold hover:text-red-800">Ja</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-slate-400">Nein</button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(rs.id); }}
                          data-testid={`button-delete-${rs.id}`}
                          className={btnDanger}
                        >
                          Löschen
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : rs.id); }}
                    data-testid={`button-edit-${rs.id}`}
                    className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium"
                  >
                    {isExpanded ? "Schließen" : "Bearbeiten"}
                  </button>
                  <span className="text-slate-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-slate-200 p-6">
                  <EditRuleSetForm
                    workspaceSlug={workspaceSlug}
                    ruleSet={rs}
                    onSaved={fetchRuleSets}
                  />
                </div>
              )}
            </div>
          );
        })}
        {ruleSets.length === 0 && !loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            Keine Regelwerke vorhanden.
          </div>
        )}
      </div>
    </div>
  );
}

function RulesFormFields({
  rules,
  setRules,
  name,
  setName,
  appliesToWorkspaceUi,
  setAppliesToWorkspaceUi,
  appliesToDocuments,
  setAppliesToDocuments,
  appliesToPptExports,
  setAppliesToPptExports,
  appliesToExerciseMaterials,
  setAppliesToExerciseMaterials,
}: {
  rules: RulesJson;
  setRules: (r: RulesJson) => void;
  name: string;
  setName: (n: string) => void;
  appliesToWorkspaceUi: boolean;
  setAppliesToWorkspaceUi: (v: boolean) => void;
  appliesToDocuments: boolean;
  setAppliesToDocuments: (v: boolean) => void;
  appliesToPptExports: boolean;
  setAppliesToPptExports: (v: boolean) => void;
  appliesToExerciseMaterials: boolean;
  setAppliesToExerciseMaterials: (v: boolean) => void;
}) {
  const updateColors = (field: string, value: string) => {
    setRules({ ...rules, colors: { ...rules.colors, [field]: value } });
  };
  const updateTypography = (field: string, value: string) => {
    setRules({ ...rules, typography: { ...rules.typography, [field]: value } });
  };
  const updateSpacing = (field: string, value: string) => {
    setRules({ ...rules, spacing: { ...rules.spacing, [field]: value } });
  };
  const updateLogo = (field: string, value: string) => {
    setRules({ ...rules, logo: { ...rules.logo, [field]: value } });
  };
  const updateTone = (field: string, value: string) => {
    setRules({ ...rules, tone: { ...rules.tone, [field]: value } });
  };
  const updateDocument = (field: string, value: string | boolean) => {
    setRules({ ...rules, document: { ...rules.document, [field]: value } });
  };
  const updateSlides = (field: string, value: string | boolean) => {
    setRules({ ...rules, slides: { ...rules.slides, [field]: value } });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          data-testid="input-name"
          className={inputClass}
          placeholder="z.B. Corporate Brand Guidelines"
        />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-brand-navy mb-3">Farben (Colors)</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <ColorField label="Primary" value={rules.colors?.primary || "#1a1a2e"} onChange={(v) => updateColors("primary", v)} testId="input-color-primary" />
          <ColorField label="Secondary" value={rules.colors?.secondary || "#16213e"} onChange={(v) => updateColors("secondary", v)} testId="input-color-secondary" />
          <ColorField label="Accent" value={rules.colors?.accent || "#e94560"} onChange={(v) => updateColors("accent", v)} testId="input-color-accent" />
          <ColorField label="Background" value={rules.colors?.background || "#ffffff"} onChange={(v) => updateColors("background", v)} testId="input-color-background" />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-brand-navy mb-3">Typografie (Typography)</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Heading Font</label>
            <input type="text" value={rules.typography?.headingFont || ""} onChange={(e) => updateTypography("headingFont", e.target.value)} data-testid="input-heading-font" className={inputClass} placeholder="Playfair Display" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Body Font</label>
            <input type="text" value={rules.typography?.bodyFont || ""} onChange={(e) => updateTypography("bodyFont", e.target.value)} data-testid="input-body-font" className={inputClass} placeholder="Inter" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Heading Size</label>
            <input type="text" value={rules.typography?.headingSize || ""} onChange={(e) => updateTypography("headingSize", e.target.value)} data-testid="input-heading-size" className={inputClass} placeholder="2rem" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Body Size</label>
            <input type="text" value={rules.typography?.bodySize || ""} onChange={(e) => updateTypography("bodySize", e.target.value)} data-testid="input-body-size" className={inputClass} placeholder="1rem" />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-brand-navy mb-3">Abstand & Layout (Spacing)</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Grid Unit</label>
            <input type="text" value={rules.spacing?.gridUnit || ""} onChange={(e) => updateSpacing("gridUnit", e.target.value)} data-testid="input-grid-unit" className={inputClass} placeholder="8px" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Margins</label>
            <input type="text" value={rules.spacing?.margins || ""} onChange={(e) => updateSpacing("margins", e.target.value)} data-testid="input-margins" className={inputClass} placeholder="24px" />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-brand-navy mb-3">Logo-Platzierung</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Position</label>
            <select value={rules.logo?.position || "top-left"} onChange={(e) => updateLogo("position", e.target.value)} data-testid="select-logo-position" className={inputClass}>
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Max Height</label>
            <input type="text" value={rules.logo?.maxHeight || ""} onChange={(e) => updateLogo("maxHeight", e.target.value)} data-testid="input-logo-max-height" className={inputClass} placeholder="48px" />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-brand-navy mb-3">Tonalität (Tone of Voice)</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Style</label>
            <select value={rules.tone?.style || "formal"} onChange={(e) => updateTone("style", e.target.value)} data-testid="select-tone-style" className={inputClass}>
              <option value="formal">Formal</option>
              <option value="informal">Informal</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea value={rules.tone?.notes || ""} onChange={(e) => updateTone("notes", e.target.value)} data-testid="input-tone-notes" className={inputClass} rows={2} placeholder="Hinweise zur Tonalität" />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-brand-navy mb-3">Dokument-Regeln</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={rules.document?.coverPage ?? false} onChange={(e) => updateDocument("coverPage", e.target.checked)} data-testid="input-cover-page" className="rounded border-slate-300" />
            Deckblatt (Cover Page)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={rules.document?.pageNumbers ?? false} onChange={(e) => updateDocument("pageNumbers", e.target.checked)} data-testid="input-page-numbers" className="rounded border-slate-300" />
            Seitenzahlen
          </label>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Header / Footer</label>
            <input type="text" value={rules.document?.headerFooter || ""} onChange={(e) => updateDocument("headerFooter", e.target.value)} data-testid="input-header-footer" className={inputClass} placeholder="Kopf-/Fußzeile" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Vertraulichkeitsvermerk</label>
            <input type="text" value={rules.document?.confidentialityNote || ""} onChange={(e) => updateDocument("confidentialityNote", e.target.value)} data-testid="input-confidentiality-note" className={inputClass} placeholder="Vertraulich" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Wasserzeichen</label>
            <input type="text" value={rules.document?.watermark || ""} onChange={(e) => updateDocument("watermark", e.target.value)} data-testid="input-watermark" className={inputClass} placeholder="z.B. ENTWURF" />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-brand-navy mb-3">Folien-Regeln (Slide Rules)</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={rules.slides?.titleSlide ?? false} onChange={(e) => updateSlides("titleSlide", e.target.checked)} data-testid="input-title-slide" className="rounded border-slate-300" />
            Titelfolie
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={rules.slides?.sectionDividers ?? false} onChange={(e) => updateSlides("sectionDividers", e.target.checked)} data-testid="input-section-dividers" className="rounded border-slate-300" />
            Abschnittstrennfolien
          </label>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Footer</label>
            <input type="text" value={rules.slides?.footer || ""} onChange={(e) => updateSlides("footer", e.target.value)} data-testid="input-slides-footer" className={inputClass} placeholder="Folien-Fußzeile" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Legal Line</label>
            <input type="text" value={rules.slides?.legalLine || ""} onChange={(e) => updateSlides("legalLine", e.target.value)} data-testid="input-legal-line" className={inputClass} placeholder="Rechtshinweis" />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-brand-navy mb-3">Anwendungsbereiche (Applies To)</h4>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={appliesToWorkspaceUi} onChange={(e) => setAppliesToWorkspaceUi(e.target.checked)} data-testid="input-applies-workspace-ui" className="rounded border-slate-300" />
            Workspace UI
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={appliesToDocuments} onChange={(e) => setAppliesToDocuments(e.target.checked)} data-testid="input-applies-documents" className="rounded border-slate-300" />
            Dokumente
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={appliesToPptExports} onChange={(e) => setAppliesToPptExports(e.target.checked)} data-testid="input-applies-ppt" className="rounded border-slate-300" />
            PowerPoint-Exporte
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={appliesToExerciseMaterials} onChange={(e) => setAppliesToExerciseMaterials(e.target.checked)} data-testid="input-applies-exercises" className="rounded border-slate-300" />
            Übungsmaterialien
          </label>
        </div>
      </div>
    </div>
  );
}

function CreateRuleSetForm({ workspaceSlug, onCreated, onCancel }: { workspaceSlug: string; onCreated: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [rules, setRules] = useState<RulesJson>({ ...EMPTY_RULES });
  const [appliesToWorkspaceUi, setAppliesToWorkspaceUi] = useState(false);
  const [appliesToDocuments, setAppliesToDocuments] = useState(false);
  const [appliesToPptExports, setAppliesToPptExports] = useState(false);
  const [appliesToExerciseMaterials, setAppliesToExerciseMaterials] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/brand-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rulesJson: rules,
          appliesToWorkspaceUi,
          appliesToDocuments,
          appliesToPptExports,
          appliesToExerciseMaterials,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Fehler beim Erstellen."); return; }
      onCreated();
    } catch { setError("Etwas ist schiefgelaufen."); }
    finally { setCreating(false); }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-brand-navy mb-4">Neues Regelwerk erstellen</h2>
      <form onSubmit={handleSubmit} data-testid="form-create-ruleset">
        <RulesFormFields
          rules={rules} setRules={setRules}
          name={name} setName={setName}
          appliesToWorkspaceUi={appliesToWorkspaceUi} setAppliesToWorkspaceUi={setAppliesToWorkspaceUi}
          appliesToDocuments={appliesToDocuments} setAppliesToDocuments={setAppliesToDocuments}
          appliesToPptExports={appliesToPptExports} setAppliesToPptExports={setAppliesToPptExports}
          appliesToExerciseMaterials={appliesToExerciseMaterials} setAppliesToExerciseMaterials={setAppliesToExerciseMaterials}
        />
        {error && <p className="text-sm text-red-500 mt-4" data-testid="text-create-error">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={creating || !name.trim()} data-testid="button-submit-ruleset" className={`${btnPrimary} px-6 disabled:opacity-50`}>
            {creating ? "Wird erstellt…" : "Regelwerk erstellen"}
          </button>
          <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700">Abbrechen</button>
        </div>
      </form>
    </div>
  );
}

function EditRuleSetForm({ workspaceSlug, ruleSet, onSaved }: { workspaceSlug: string; ruleSet: BrandRuleSet; onSaved: () => void }) {
  const parsed = (typeof ruleSet.rulesJson === "object" && ruleSet.rulesJson !== null) ? ruleSet.rulesJson : EMPTY_RULES;
  const [name, setName] = useState(ruleSet.name);
  const [rules, setRules] = useState<RulesJson>({ ...EMPTY_RULES, ...parsed });
  const [appliesToWorkspaceUi, setAppliesToWorkspaceUi] = useState(ruleSet.appliesToWorkspaceUi);
  const [appliesToDocuments, setAppliesToDocuments] = useState(ruleSet.appliesToDocuments);
  const [appliesToPptExports, setAppliesToPptExports] = useState(ruleSet.appliesToPptExports);
  const [appliesToExerciseMaterials, setAppliesToExerciseMaterials] = useState(ruleSet.appliesToExerciseMaterials);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/brand-rules/${ruleSet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rulesJson: rules,
          appliesToWorkspaceUi,
          appliesToDocuments,
          appliesToPptExports,
          appliesToExerciseMaterials,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Fehler beim Speichern."); return; }
      setMessage("Regelwerk gespeichert.");
      onSaved();
    } catch { setError("Etwas ist schiefgelaufen."); }
    finally { setSaving(false); }
  };

  return (
    <div data-testid={`form-edit-${ruleSet.id}`}>
      <RulesFormFields
        rules={rules} setRules={setRules}
        name={name} setName={setName}
        appliesToWorkspaceUi={appliesToWorkspaceUi} setAppliesToWorkspaceUi={setAppliesToWorkspaceUi}
        appliesToDocuments={appliesToDocuments} setAppliesToDocuments={setAppliesToDocuments}
        appliesToPptExports={appliesToPptExports} setAppliesToPptExports={setAppliesToPptExports}
        appliesToExerciseMaterials={appliesToExerciseMaterials} setAppliesToExerciseMaterials={setAppliesToExerciseMaterials}
      />
      {message && <p className="text-sm text-emerald-600 mt-4" data-testid="text-save-success">{message}</p>}
      {error && <p className="text-sm text-red-500 mt-4" data-testid="text-save-error">{error}</p>}
      <div className="mt-6">
        <button onClick={handleSave} disabled={saving || !name.trim()} data-testid={`button-save-${ruleSet.id}`} className={`${btnPrimary} px-6 disabled:opacity-50`}>
          {saving ? "Wird gespeichert…" : "Änderungen speichern"}
        </button>
      </div>
    </div>
  );
}

function PreviewTab({ workspaceSlug }: { workspaceSlug: string }) {
  const [ruleSets, setRuleSets] = useState<BrandRuleSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchRuleSets = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/brand-rules`);
      if (res.ok) setRuleSets(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [workspaceSlug]);

  useEffect(() => { fetchRuleSets(); }, [fetchRuleSets]);

  const activeRuleSet = ruleSets.find((rs) => rs.status === "active");

  const handleApplyTheme = async () => {
    if (!activeRuleSet) return;
    setApplying(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/brand-rules/${activeRuleSet.id}/apply-theme`, {
        method: "POST",
      });
      if (res.ok) {
        setMessage("Theme wurde erfolgreich aktualisiert.");
      } else {
        const d = await res.json();
        setError(d.error || "Fehler beim Anwenden.");
      }
    } catch { setError("Etwas ist schiefgelaufen."); }
    finally { setApplying(false); }
  };

  if (loading) return <p className="text-sm text-slate-400">Laden…</p>;

  if (!activeRuleSet) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-slate-500 mb-2">Kein aktives Regelwerk vorhanden.</p>
        <p className="text-xs text-slate-400">Aktivieren Sie ein Regelwerk im Tab „Brand Rule Sets", um eine Vorschau zu sehen.</p>
      </div>
    );
  }

  const rules = (typeof activeRuleSet.rulesJson === "object" && activeRuleSet.rulesJson !== null) ? activeRuleSet.rulesJson : EMPTY_RULES;
  const colors = rules.colors || {};
  const typography = rules.typography || {};
  const tone = rules.tone || {};
  const logo = rules.logo || {};
  const doc = rules.document || {};
  const slides = rules.slides || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-navy">{activeRuleSet.name}</h2>
          <p className="text-xs text-slate-400">Aktives Regelwerk · Erstellt: {formatDate(activeRuleSet.createdAt)}</p>
        </div>
        <button
          onClick={handleApplyTheme}
          disabled={applying}
          data-testid="button-apply-theme"
          className={`${btnPrimary} px-6 disabled:opacity-50`}
        >
          {applying ? "Wird angewendet…" : "Auf Workspace-Theme anwenden"}
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800" data-testid="text-apply-success">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800" data-testid="text-apply-error">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-brand-navy mb-4">Farben</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Primary", color: colors.primary },
              { label: "Secondary", color: colors.secondary },
              { label: "Accent", color: colors.accent },
              { label: "Background", color: colors.background },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-3" data-testid={`preview-color-${c.label.toLowerCase()}`}>
                <div className="w-10 h-10 rounded-lg border border-slate-200 shrink-0" style={{ backgroundColor: c.color || "#ccc" }} />
                <div>
                  <p className="text-xs font-medium text-slate-700">{c.label}</p>
                  <p className="text-xs text-slate-400 font-mono">{c.color || "–"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-brand-navy mb-4">Typografie</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">Heading Font</p>
              <p className="text-sm font-medium text-slate-900" style={{ fontFamily: `'${typography.headingFont || "sans-serif"}', serif` }} data-testid="preview-heading-font">
                {typography.headingFont || "–"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Body Font</p>
              <p className="text-sm font-medium text-slate-900" style={{ fontFamily: `'${typography.bodyFont || "sans-serif"}', sans-serif` }} data-testid="preview-body-font">
                {typography.bodyFont || "–"}
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-slate-400">Heading Size</p>
                <p className="text-sm text-slate-700">{typography.headingSize || "–"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Body Size</p>
                <p className="text-sm text-slate-700">{typography.bodySize || "–"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-brand-navy mb-4">Tonalität & Logo</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">Tone Style</p>
              <p className="text-sm text-slate-700 capitalize">{tone.style || "–"}</p>
            </div>
            {tone.notes && (
              <div>
                <p className="text-xs text-slate-400">Notes</p>
                <p className="text-sm text-slate-700">{tone.notes}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400">Logo Position</p>
              <p className="text-sm text-slate-700">{logo.position || "–"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Logo Max Height</p>
              <p className="text-sm text-slate-700">{logo.maxHeight || "–"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-brand-navy mb-4">Dokument- & Folien-Regeln</h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-4 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${doc.coverPage ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                Deckblatt {doc.coverPage ? "✓" : "✗"}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${doc.pageNumbers ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                Seitenzahlen {doc.pageNumbers ? "✓" : "✗"}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${slides.titleSlide ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                Titelfolie {slides.titleSlide ? "✓" : "✗"}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${slides.sectionDividers ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                Trennfolien {slides.sectionDividers ? "✓" : "✗"}
              </span>
            </div>
            {doc.headerFooter && <p className="text-xs text-slate-500">Header/Footer: {doc.headerFooter}</p>}
            {doc.confidentialityNote && <p className="text-xs text-slate-500">Vertraulichkeit: {doc.confidentialityNote}</p>}
            {doc.watermark && <p className="text-xs text-slate-500">Wasserzeichen: {doc.watermark}</p>}
            {slides.footer && <p className="text-xs text-slate-500">Folien-Footer: {slides.footer}</p>}
            {slides.legalLine && <p className="text-xs text-slate-500">Legal: {slides.legalLine}</p>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-brand-navy mb-4">Live-Vorschau</h3>
        <div className="border border-slate-200 rounded-xl overflow-hidden" data-testid="preview-panel">
          <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: colors.primary || "#1a1a2e" }}>
            <span className="text-sm font-bold text-white" style={{ fontFamily: `'${typography.headingFont || "sans-serif"}', serif` }}>
              Workspace Preview
            </span>
            <div className="flex gap-3 text-xs text-white/70">
              <span>Navigation</span>
              <span>Menü</span>
            </div>
          </div>
          <div className="p-6 space-y-4" style={{ backgroundColor: colors.background || "#ffffff" }}>
            <h4 className="text-xl font-bold" style={{ fontFamily: `'${typography.headingFont || "sans-serif"}', serif`, color: colors.primary || "#1a1a2e" }}>
              Überschrift Beispiel
            </h4>
            <p className="text-sm leading-relaxed text-slate-700" style={{ fontFamily: `'${typography.bodyFont || "sans-serif"}', sans-serif` }}>
              Dies ist ein Beispieltext, der zeigt, wie das Branding mit den definierten Farben und Schriftarten aussehen wird.
            </p>
            <div className="flex gap-3">
              <span className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: colors.primary || "#1a1a2e" }}>Primary</span>
              <span className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: colors.secondary || "#16213e" }}>Secondary</span>
              <span className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: colors.accent || "#e94560" }}>Accent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AIParseResult {
  brandRuleSet: BrandRuleSet;
  extractedText: string;
  confidence: "high" | "medium" | "low";
}

function AIAnalysisTab({ workspaceSlug, onSwitchToEdit }: { workspaceSlug: string; onSwitchToEdit: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AIParseResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const validExtensions = [".pdf", ".docx"];
    const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf("."));

    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(ext)) {
      setError("Nur .pdf und .docx Dateien werden unterstützt.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Datei ist zu groß. Maximale Größe: 10 MB.");
      return;
    }
    setFile(selectedFile);
    setError("");
    setResult(null);
    setSaved(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError("");
    setResult(null);
    setSaved(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (name.trim()) formData.append("name", name.trim());

      const res = await fetch(`/api/w/${workspaceSlug}/brand-rules/parse-styleguide`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Fehler bei der Analyse.");
        return;
      }

      const data: AIParseResult = await res.json();
      setResult(data);
    } catch {
      setError("Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.");
    } finally {
      setAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const confidenceLabels: Record<string, { label: string; color: string }> = {
    high: { label: "Hoch", color: "text-emerald-600 bg-emerald-50" },
    medium: { label: "Mittel", color: "text-amber-600 bg-amber-50" },
    low: { label: "Niedrig", color: "text-red-500 bg-red-50" },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-brand-navy mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          Style Guide analysieren
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Laden Sie einen Style Guide hoch und lassen Sie die KI automatisch Markenregeln extrahieren.
        </p>

        <div
          data-testid="dropzone-styleguide"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".pdf,.docx";
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) handleFileSelect(f);
            };
            input.click();
          }}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-[hsl(14,48%,44%)] bg-[hsl(14,48%,44%)]/5"
              : file
              ? "border-emerald-300 bg-emerald-50/50"
              : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
          }`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">{file.name}</p>
                <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setSaved(false); }}
                className="ml-4 text-xs text-slate-400 hover:text-red-500"
              >
                Entfernen
              </button>
            </div>
          ) : (
            <div>
              <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-slate-500 mb-1">
                Style Guide hierher ziehen oder <span className="text-[hsl(14,48%,44%)] font-medium">Datei auswählen</span>
              </p>
              <p className="text-xs text-slate-400">.pdf oder .docx · Max. 10 MB</p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Name des Regelwerks (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="input-styleguide-name"
            className={inputClass}
            placeholder="z.B. Corporate Brand Guidelines 2026"
          />
        </div>

        {error && <p className="text-sm text-red-500 mt-4" data-testid="text-ai-error">{error}</p>}

        <div className="mt-6">
          <button
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            data-testid="button-analyze-styleguide"
            className="rounded-lg text-white text-sm font-medium px-6 py-2.5 transition-colors disabled:opacity-50"
            style={{ backgroundColor: analyzing ? "#94a3b8" : "hsl(14, 48%, 44%)" }}
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                KI analysiert Style Guide…
              </span>
            ) : (
              "Style Guide analysieren"
            )}
          </button>
        </div>
      </div>

      {result && (
        <div data-testid="section-ai-results" className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-brand-navy" style={{ fontFamily: "'Playfair Display', serif" }}>
                Analyseergebnis
              </h3>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${confidenceLabels[result.confidence]?.color || ""}`}>
                Konfidenz: {confidenceLabels[result.confidence]?.label || result.confidence}
              </span>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-brand-navy mb-3">Farben</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Primary", color: (result.brandRuleSet.rulesJson as RulesJson)?.colors?.primary },
                    { label: "Secondary", color: (result.brandRuleSet.rulesJson as RulesJson)?.colors?.secondary },
                    { label: "Accent", color: (result.brandRuleSet.rulesJson as RulesJson)?.colors?.accent },
                    { label: "Background", color: (result.brandRuleSet.rulesJson as RulesJson)?.colors?.background },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg border border-slate-200 shrink-0"
                        style={{ backgroundColor: c.color || "#e2e8f0" }}
                      />
                      <div>
                        <p className="text-xs font-medium text-slate-600">{c.label}</p>
                        <p className="text-xs text-slate-400 font-mono">{c.color || "–"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-brand-navy mb-3">Typografie</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Heading Font</span>
                    <span className="text-slate-700 font-medium">{(result.brandRuleSet.rulesJson as RulesJson)?.typography?.headingFont || "–"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Body Font</span>
                    <span className="text-slate-700 font-medium">{(result.brandRuleSet.rulesJson as RulesJson)?.typography?.bodyFont || "–"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Heading Size</span>
                    <span className="text-slate-700">{(result.brandRuleSet.rulesJson as RulesJson)?.typography?.headingSize || "–"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Body Size</span>
                    <span className="text-slate-700">{(result.brandRuleSet.rulesJson as RulesJson)?.typography?.bodySize || "–"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-brand-navy mb-3">Tonalität</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Stil</span>
                    <span className="text-slate-700 capitalize">{(result.brandRuleSet.rulesJson as RulesJson)?.tone?.style || "–"}</span>
                  </div>
                  {(result.brandRuleSet.rulesJson as RulesJson)?.tone?.notes && (
                    <p className="text-xs text-slate-500 mt-1">{(result.brandRuleSet.rulesJson as RulesJson)?.tone?.notes}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-brand-navy mb-3">Dokument- & Folien-Regeln</h4>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: "Deckblatt", val: (result.brandRuleSet.rulesJson as RulesJson)?.document?.coverPage },
                    { label: "Seitenzahlen", val: (result.brandRuleSet.rulesJson as RulesJson)?.document?.pageNumbers },
                    { label: "Titelfolie", val: (result.brandRuleSet.rulesJson as RulesJson)?.slides?.titleSlide },
                    { label: "Trennfolien", val: (result.brandRuleSet.rulesJson as RulesJson)?.slides?.sectionDividers },
                  ].map((r) => (
                    <span
                      key={r.label}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${r.val ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}
                    >
                      {r.label} {r.val ? "✓" : "✗"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSaved(true)}
              data-testid="button-save-parsed"
              className="rounded-lg text-white text-sm font-medium px-6 py-2.5 transition-colors"
              style={{ backgroundColor: saved ? "#059669" : "hsl(14, 48%, 44%)" }}
            >
              {saved ? "✓ Gespeichert" : "Als Regelwerk speichern"}
            </button>
            <button
              onClick={onSwitchToEdit}
              data-testid="button-edit-parsed"
              className="rounded-lg border border-slate-200 text-slate-700 text-sm font-medium px-6 py-2.5 hover:bg-slate-50 transition-colors"
            >
              Zur Bearbeitung
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ColorField({ label, value, onChange, testId }: { label: string; value: string; onChange: (v: string) => void; testId: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value.startsWith("#") ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
          data-testid={`${testId}-picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          data-testid={testId}
        />
      </div>
    </div>
  );
}
