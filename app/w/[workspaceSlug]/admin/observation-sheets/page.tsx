"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ObservationSheetTemplate {
  id: string;
  name: string;
  description: string | null;
  type: string;
  content: any;
  structuredData: any;
  ratingScale: string | null;
  exerciseIds: string[];
  competencyModelId: string | null;
  competencyNames: string[];
  tags: string[];
  targetLevels: string[];
  fileName: string | null;
  originalFileName: string | null;
  status: string;
  aiGenerated: boolean;
  createdAt: string;
}

interface ExerciseLibItem {
  id: string;
  title: string;
  exerciseType: string;
}

interface CompetencyModel {
  id: string;
  name: string;
  description: string | null;
}

interface AnalysisResult {
  suggestedType: string;
  suggestedName: string;
  description: string;
  ratingScale: string;
  competencies: string[];
  exerciseContext: string;
  targetLevel: string;
  sections: any[];
  tags: string[];
  qualityNotes: string;
}

type Mode = "list" | "choose" | "upload" | "generate" | "preview" | "detail" | "view";
type UploadStep = "select" | "analyzing" | "review";

const TEMPLATE_TYPES = [
  { value: "verhaltensanker-bogen", label: "Verhaltensanker-Bogen" },
  { value: "kompetenzmatrix", label: "Kompetenzmatrix" },
  { value: "freitext-bogen", label: "Freitext-Bogen" },
  { value: "kombinierter-bogen", label: "Kombinierter Bogen" },
];

const RATING_SCALES = [
  { value: "1-5", label: "1–5 (Standard)" },
  { value: "1-4", label: "1–4" },
  { value: "1-7", label: "1–7" },
  { value: "a-e", label: "A–E" },
];

const TARGET_LEVELS = ["SE-Level / Vorstand", "Director / Bereichsleitung", "Manager", "Expert"];

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  "verhaltensanker-bogen": "Verhaltensanker-Bogen",
  "kompetenzmatrix": "Kompetenzmatrix",
  "freitext-bogen": "Freitext-Bogen",
  "kombinierter-bogen": "Kombinierter Bogen",
  uploaded: "Hochgeladen",
  manual: "Manuell",
};

const ACCENT = "hsl(14, 48%, 44%)";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 focus:border-[hsl(14,48%,44%)]";

const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function ObservationSheetsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const base = `/w/${workspaceSlug}/admin`;

  const [mode, setMode] = useState<Mode>("list");
  const [items, setItems] = useState<ObservationSheetTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [exercises, setExercises] = useState<ExerciseLibItem[]>([]);
  const [competencyModels, setCompetencyModels] = useState<CompetencyModel[]>([]);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<UploadStep>("select");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewDescription, setReviewDescription] = useState("");
  const [reviewType, setReviewType] = useState("verhaltensanker-bogen");
  const [reviewScale, setReviewScale] = useState("1-5");
  const [reviewCompetencies, setReviewCompetencies] = useState("");
  const [reviewTags, setReviewTags] = useState("");
  const [reviewLevels, setReviewLevels] = useState<string[]>([]);
  const [reviewExerciseIds, setReviewExerciseIds] = useState<string[]>([]);
  const [reviewCompModelId, setReviewCompModelId] = useState("");
  const [saving, setSaving] = useState(false);

  const [genName, setGenName] = useState("");
  const [genType, setGenType] = useState("verhaltensanker-bogen");
  const [genScale, setGenScale] = useState("1-5");
  const [genCompetencies, setGenCompetencies] = useState("");
  const [genExerciseIds, setGenExerciseIds] = useState<string[]>([]);
  const [genCompModelId, setGenCompModelId] = useState("");
  const [genTargetLevel, setGenTargetLevel] = useState("");
  const [genHints, setGenHints] = useState("");
  const [generating, setGenerating] = useState(false);

  const [previewData, setPreviewData] = useState<any>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const [detailTemplate, setDetailTemplate] = useState<ObservationSheetTemplate | null>(null);
  const [detailName, setDetailName] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  const [detailType, setDetailType] = useState("");
  const [detailScale, setDetailScale] = useState("");
  const [detailTags, setDetailTags] = useState("");
  const [detailLevels, setDetailLevels] = useState<string[]>([]);
  const [detailExerciseIds, setDetailExerciseIds] = useState<string[]>([]);
  const [detailCompModelId, setDetailCompModelId] = useState("");
  const [detailSaving, setDetailSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchItems = useCallback(async (searchVal?: string) => {
    try {
      const s = searchVal !== undefined ? searchVal : search;
      const qp = new URLSearchParams();
      if (s) qp.set("search", s);
      if (filterType) qp.set("type", filterType);
      const res = await fetch(`/api/w/${workspaceSlug}/observation-sheet-templates?${qp.toString()}`, { credentials: "include" });
      if (res.status === 401) { router.push(`/w/${workspaceSlug}/login`); return; }
      if (res.status === 403) { setError("Keine Berechtigung für die Beobachtungsbögen."); return; }
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch { setError("Fehler beim Laden der Beobachtungsbögen."); }
    finally { setLoading(false); }
  }, [workspaceSlug, router, search, filterType]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [exRes, cmRes] = await Promise.all([
        fetch(`/api/w/${workspaceSlug}/exercise-library`, { credentials: "include" }),
        fetch(`/api/w/${workspaceSlug}/competency-models`, { credentials: "include" }),
      ]);
      if (exRes.ok) setExercises(await exRes.json());
      if (cmRes.ok) setCompetencyModels(await cmRes.json());
    } catch {}
  }, [workspaceSlug]);

  useEffect(() => { fetchItems(); fetchReferenceData(); }, []);
  useEffect(() => { fetchItems(); }, [filterType]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchItems(val); }, 300);
  };

  const resetToList = () => {
    setMode("list");
    setError("");
    setSuccess("");
    setUploadFile(null);
    setUploadStep("select");
    setAnalysisResult(null);
    setPreviewData(null);
    setPreviewTemplateId(null);
    setDetailTemplate(null);
  };

  const handleFileSelect = (file: File) => {
    const allowedExtensions = [".docx", ".pptx", ".pdf"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError("Nur Word (.docx), PowerPoint (.pptx) und PDF (.pdf) Dateien sind erlaubt.");
      return;
    }
    setUploadFile(file);
    setError("");
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

  const handleAnalyze = async () => {
    if (!uploadFile) return;
    setError("");
    setUploadStep("analyzing");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const res = await fetch(`/api/w/${workspaceSlug}/observation-sheet-templates/analyze`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Analyse fehlgeschlagen");
        setUploadStep("select");
        return;
      }

      const result: AnalysisResult = await res.json();
      setAnalysisResult(result);
      setReviewName(result.suggestedName);
      setReviewDescription(result.description);
      setReviewType(result.suggestedType);
      setReviewScale(result.ratingScale || "1-5");
      setReviewCompetencies(result.competencies.join(", "));
      setReviewTags(result.tags.join(", "));
      setReviewLevels(result.targetLevel ? [result.targetLevel] : []);
      setReviewExerciseIds([]);
      setReviewCompModelId("");
      setUploadStep("review");
    } catch {
      setError("Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.");
      setUploadStep("select");
    }
  };

  const handleUploadSave = async () => {
    if (!uploadFile || !reviewName.trim()) return;
    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", reviewName);
      formData.append("description", reviewDescription);
      formData.append("targetLevels", reviewLevels.join(","));

      const uploadRes = await fetch(`/api/w/${workspaceSlug}/observation-sheet-templates/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        setError(data.error || "Upload fehlgeschlagen");
        setSaving(false);
        return;
      }

      const template = await uploadRes.json();

      const patchBody: any = {
        type: reviewType,
        ratingScale: reviewScale,
        competencyNames: reviewCompetencies.split(",").map((c: string) => c.trim()).filter(Boolean),
        tags: reviewTags.split(",").map((t: string) => t.trim()).filter(Boolean),
        targetLevels: reviewLevels,
        exerciseIds: reviewExerciseIds,
        competencyModelId: reviewCompModelId || null,
      };

      if (analysisResult?.sections) {
        patchBody.structuredData = analysisResult.sections;
        patchBody.content = {
          title: reviewName,
          description: reviewDescription,
          sections: analysisResult.sections,
        };
      }

      await fetch(`/api/w/${workspaceSlug}/observation-sheet-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patchBody),
      });

      setSuccess("Beobachtungsbogen erfolgreich hochgeladen und analysiert!");
      resetToList();
      fetchItems();
    } catch {
      setError("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!genName.trim() || !genType) {
      setError("Name und Typ sind Pflichtfelder.");
      return;
    }
    setError("");
    setGenerating(true);

    try {
      const body: any = {
        name: genName,
        type: genType,
        ratingScale: genScale,
        competencies: genCompetencies.split(",").map((c) => c.trim()).filter(Boolean),
        exerciseIds: genExerciseIds,
        competencyModelId: genCompModelId || null,
        targetLevel: genTargetLevel,
        additionalInstructions: genHints,
      };

      if (genExerciseIds.length > 0) {
        body.exerciseNames = genExerciseIds
          .map((id) => exercises.find((e) => e.id === id)?.title)
          .filter(Boolean);
      }

      const res = await fetch(`/api/w/${workspaceSlug}/observation-sheet-templates/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Generierung fehlgeschlagen");
        setGenerating(false);
        return;
      }

      const data = await res.json();
      setPreviewData(data.generatedContent || data.content || data);
      setPreviewTemplateId(data.id);
      setSuccess("Beobachtungsbogen erfolgreich per KI generiert!");
      setMode("preview");
      fetchItems();
    } catch {
      setError("Generierung fehlgeschlagen.");
    } finally {
      setGenerating(false);
    }
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

  const loadTemplate = async (id: string): Promise<ObservationSheetTemplate | null> => {
    setError("");
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/observation-sheet-templates/${id}`, { credentials: "include" });
      if (!res.ok) { setError("Vorlage konnte nicht geladen werden."); return null; }
      return await res.json();
    } catch {
      setError("Fehler beim Laden der Vorlage.");
      return null;
    }
  };

  const openView = async (id: string) => {
    const tmpl = await loadTemplate(id);
    if (!tmpl) return;
    setDetailTemplate(tmpl);
    setMode("view");
  };

  const openDetail = async (id: string) => {
    const tmpl = await loadTemplate(id);
    if (!tmpl) return;
    setDetailTemplate(tmpl);
    setDetailName(tmpl.name);
    setDetailDescription(tmpl.description || "");
    setDetailType(tmpl.type);
    setDetailScale(tmpl.ratingScale || "1-5");
    setDetailTags(tmpl.tags.join(", "));
    setDetailLevels(tmpl.targetLevels);
    setDetailExerciseIds(tmpl.exerciseIds || []);
    setDetailCompModelId(tmpl.competencyModelId || "");
    setMode("detail");
  };

  const getSections = (tmpl: ObservationSheetTemplate): any[] => {
    if (tmpl.structuredData && Array.isArray(tmpl.structuredData) && tmpl.structuredData.length > 0) {
      return tmpl.structuredData;
    }
    if (tmpl.content && typeof tmpl.content === "object" && tmpl.content.sections && Array.isArray(tmpl.content.sections)) {
      return tmpl.content.sections;
    }
    return [];
  };

  const downloadAsHTML = (tmpl: ObservationSheetTemplate) => {
    const typeLabel = TEMPLATE_TYPE_LABELS[tmpl.type] || tmpl.type;
    const sections = getSections(tmpl);
    const scaleLabel = tmpl.ratingScale || "1-5";
    const headerFields = tmpl.content?.headerFields || ["Kandidat/in", "Übung", "Beobachter/in", "Datum"];

    let html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>${tmpl.name}</title>
<style>
body{font-family:'Segoe UI',system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px 24px;color:#1a1a1a;font-size:14px}
h1{font-size:22px;margin-bottom:4px}
h2{font-size:16px;margin:24px 0 8px;border-bottom:2px solid #e2e8f0;padding-bottom:4px}
.meta{color:#64748b;font-size:12px;margin-bottom:24px}
.meta span{margin-right:16px}
.header-fields{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
.header-field{border:1px solid #cbd5e1;border-radius:6px;padding:8px 16px;min-width:160px;font-size:13px}
.header-field label{display:block;font-size:11px;color:#64748b;margin-bottom:2px}
.header-field .line{border-bottom:1px solid #e2e8f0;height:20px}
.section{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px}
.section h3{font-size:14px;margin:0 0 4px}
.comp-badge{display:inline-block;background:#eff6ff;color:#2563eb;font-size:11px;padding:2px 8px;border-radius:12px;margin-bottom:8px}
.item{background:white;border:1px solid #e2e8f0;border-radius:6px;padding:12px;margin-top:8px}
.item-label{font-weight:600;font-size:13px}
.item-help{color:#94a3b8;font-size:12px;margin-top:2px}
.anchors{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.anchor{background:#f1f5f9;border:1px solid #e2e8f0;font-size:11px;padding:2px 8px;border-radius:4px}
.rating-row{display:flex;gap:8px;margin-top:8px;align-items:center}
.rating-box{width:28px;height:28px;border:1px solid #cbd5e1;border-radius:4px;text-align:center;line-height:28px;font-size:11px;color:#94a3b8}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px}
.tags{margin-top:16px}
.tag{display:inline-block;background:#f1f5f9;color:#475569;font-size:11px;padding:2px 8px;border-radius:12px;margin-right:4px}
@media print{body{padding:20px}@page{margin:1.5cm}}
</style></head><body>
<h1>${tmpl.name}</h1>
<div class="meta">
<span>${typeLabel}</span>
<span>Skala: ${scaleLabel}</span>
${tmpl.aiGenerated ? '<span>KI-generiert</span>' : ''}
<span>${new Date(tmpl.createdAt).toLocaleDateString("de-DE")}</span>
</div>
${tmpl.description ? `<p style="color:#475569;margin-bottom:20px">${tmpl.description}</p>` : ''}
<div class="header-fields">
${(Array.isArray(headerFields) ? headerFields : []).map((f: string) => `<div class="header-field"><label>${f}</label><div class="line"></div></div>`).join("")}
</div>`;

    const scaleValues = scaleLabel === "a-e" ? ["A","B","C","D","E"] : Array.from({length: parseInt(scaleLabel.split("-")[1]) || 5}, (_, i) => String(i + 1));

    sections.forEach((section: any, si: number) => {
      html += `<div class="section"><h3>${section.title || `Abschnitt ${si + 1}`}</h3>`;
      if (section.competency) html += `<span class="comp-badge">${section.competency}</span>`;
      if (section.items && Array.isArray(section.items)) {
        section.items.forEach((item: any) => {
          html += `<div class="item"><div class="item-label">${item.label || ""}</div>`;
          if (item.helpText) html += `<div class="item-help">${item.helpText}</div>`;
          if (item.anchors && Array.isArray(item.anchors) && item.anchors.length > 0) {
            html += `<div class="anchors">${item.anchors.map((a: string) => `<span class="anchor">${a}</span>`).join("")}</div>`;
          }
          html += `<div class="rating-row">${scaleValues.map((v: string) => `<div class="rating-box">${v}</div>`).join("")}</div>`;
          html += `</div>`;
        });
      }
      html += `</div>`;
    });

    if (tmpl.content?.footerNote) {
      html += `<div class="footer">${tmpl.content.footerNote}</div>`;
    }
    if (tmpl.tags && tmpl.tags.length > 0) {
      html += `<div class="tags">${tmpl.tags.map((t: string) => `<span class="tag">${t}</span>`).join("")}</div>`;
    }
    html += `</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tmpl.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDetailSave = async () => {
    if (!detailTemplate) return;
    setDetailSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/w/${workspaceSlug}/observation-sheet-templates/${detailTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: detailName,
          description: detailDescription || null,
          type: detailType,
          ratingScale: detailScale,
          tags: detailTags.split(",").map((t) => t.trim()).filter(Boolean),
          targetLevels: detailLevels,
          exerciseIds: detailExerciseIds,
          competencyModelId: detailCompModelId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Speichern fehlgeschlagen");
        setDetailSaving(false);
        return;
      }

      setSuccess("Vorlage erfolgreich aktualisiert!");
      resetToList();
      fetchItems();
    } catch {
      setError("Speichern fehlgeschlagen.");
    } finally {
      setDetailSaving(false);
    }
  };

  const toggleArrayItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  };

  const filteredItems = items.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && item.type !== filterType) return false;
    return true;
  });

  const renderSections = (sections: any[]) => {
    if (!sections || !Array.isArray(sections) || sections.length === 0) return null;
    return (
      <div className="space-y-4">
        {sections.map((section: any, si: number) => (
          <div key={si} className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-semibold text-sm text-slate-800">{section.title || `Abschnitt ${si + 1}`}</h4>
              {section.competency && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{section.competency}</span>
              )}
              {section.type && (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{section.type}</span>
              )}
            </div>
            {section.items && Array.isArray(section.items) && (
              <div className="space-y-2">
                {section.items.map((item: any, ii: number) => (
                  <div key={ii} className="bg-slate-50 rounded-md p-3">
                    <p className="text-sm text-slate-700 font-medium">{item.label}</p>
                    {item.helpText && <p className="text-xs text-slate-400 mt-1">{item.helpText}</p>}
                    {item.anchors && Array.isArray(item.anchors) && item.anchors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.anchors.map((anchor: string, ai: number) => (
                          <span key={ai} className="text-[11px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                            {anchor}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderExerciseMultiSelect = (selectedIds: string[], setSelectedIds: (v: string[]) => void, testIdPrefix: string) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Übungszuordnung</label>
      {exercises.length === 0 ? (
        <p className="text-xs text-slate-400">Keine Übungen verfügbar</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {exercises.map((ex) => (
            <label key={ex.id} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200 hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={selectedIds.includes(ex.id)}
                onChange={() => toggleArrayItem(selectedIds, ex.id, setSelectedIds)}
                className="rounded border-slate-300"
                data-testid={`${testIdPrefix}-exercise-${ex.id}`}
              />
              <span className="text-xs">{ex.title}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  const renderCompModelSelect = (value: string, onChange: (v: string) => void, testId: string) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Kompetenzmodell</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} data-testid={testId}>
        <option value="">— Kein Kompetenzmodell —</option>
        {competencyModels.map((cm) => (
          <option key={cm.id} value={cm.id}>{cm.name}</option>
        ))}
      </select>
    </div>
  );

  const renderTargetLevelCheckboxes = (levels: string[], setLevels: (v: string[]) => void) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Zielniveaus</label>
      <div className="flex flex-wrap gap-3">
        {TARGET_LEVELS.map((level) => (
          <label key={level} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={levels.includes(level)}
              onChange={() => toggleArrayItem(levels, level, setLevels)}
              className="rounded border-slate-300"
            />
            {level}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="text-white sticky top-0 z-50" style={{ backgroundColor: ACCENT }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="link-module-overview"
            >
              Modul-Übersicht
            </a>
            <Link
              href={base}
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="link-back-dashboard"
            >
              ← Dashboard
            </Link>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Beobachtungsbögen-Builder
            </span>
          </div>
          {mode !== "list" && (
            <button
              onClick={resetToList}
              className="text-xs text-white/80 hover:text-white transition-colors"
              data-testid="button-back-to-list"
            >
              ← Zur Übersicht
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4 mb-6" data-testid="text-error">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-4 mb-6" data-testid="text-success">
            {success}
          </div>
        )}

        {mode === "list" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                  data-testid="text-page-title"
                >
                  Beobachtungsbögen
                </h1>
                <p className="text-sm mt-1 text-slate-400">
                  Observation Sheet Toolbox — Beobachtungsbögen erstellen, verwalten und filtern
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setMode("choose"); setError(""); setSuccess(""); }}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                  data-testid="button-new-template"
                >
                  + Neuer Beobachtungsbogen
                </button>
              </div>
            </div>

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
                {TEMPLATE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
                <option value="uploaded">Hochgeladen</option>
                <option value="manual">Manuell</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-20 text-slate-400">Laden...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl" data-testid="text-empty">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Noch keine Beobachtungsbögen</h3>
                <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                  Erstellen Sie Ihren ersten Beobachtungsbogen — per Upload oder KI-Generierung.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => { setMode("upload"); setUploadStep("select"); setUploadFile(null); setError(""); }}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    data-testid="button-mode-upload"
                  >
                    Bestehenden Bogen hochladen
                  </button>
                  <button
                    onClick={() => { setMode("generate"); setError(""); }}
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90"
                    style={{ backgroundColor: ACCENT }}
                    data-testid="button-mode-generate"
                  >
                    Neuen Bogen per KI erstellen
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4" data-testid="template-list">
                {filteredItems.map((item) => {
                  const typeLabel = TEMPLATE_TYPE_LABELS[item.type] || item.type;
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                      data-testid={`card-template-${item.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className="font-semibold text-slate-900 truncate"
                              style={{ fontFamily: "'Playfair Display', serif" }}
                              data-testid={`text-name-${item.id}`}
                            >
                              {item.name}
                            </h3>
                            <span
                              className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                              data-testid={`badge-type-${item.id}`}
                            >
                              {typeLabel}
                            </span>
                            {item.aiGenerated && (
                              <span className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                                KI
                              </span>
                            )}
                            <span
                              className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                                item.status === "active"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-slate-50 text-slate-500"
                              }`}
                            >
                              {item.status === "active" ? "Aktiv" : "Archiviert"}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-slate-500 mb-2">{item.description}</p>
                          )}
                          {item.fileName && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              <span>{item.fileName}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {item.tags.map((tag, i) => (
                              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                            {item.targetLevels.map((level, i) => (
                              <span key={`l-${i}`} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{level}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                            {item.ratingScale && <span>Skala: {item.ratingScale}</span>}
                            <span>{new Date(item.createdAt).toLocaleDateString("de-DE")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => openDetail(item.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                            data-testid={`button-edit-${item.id}`}
                          >
                            Bearbeiten
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
          </>
        )}

        {mode === "choose" && (
          <div className="max-w-3xl mx-auto">
            <h1
              className="text-2xl font-bold tracking-tight mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Neuen Beobachtungsbogen erstellen
            </h1>
            <p className="text-sm text-slate-400 mb-10">
              Wählen Sie, wie Sie den Beobachtungsbogen erstellen möchten
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => { setMode("upload"); setUploadStep("select"); setUploadFile(null); setError(""); }}
                className="rounded-xl border-2 border-slate-200 p-8 text-left hover:border-[hsl(14,48%,44%)] hover:shadow-lg transition-all group"
                data-testid="button-mode-upload"
              >
                <div className="text-4xl mb-4">📄</div>
                <h3
                  className="text-lg font-semibold mb-2 group-hover:text-[hsl(14,48%,44%)]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Bestehenden Bogen hochladen
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Laden Sie einen bestehenden Beobachtungsbogen hoch (Word, PDF, PowerPoint).
                  Die KI analysiert den Inhalt und extrahiert Kompetenzen, Verhaltensanker und Bewertungsskalen.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <span className="bg-slate-100 px-2 py-0.5 rounded">DOCX</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">PDF</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">PPTX</span>
                </div>
              </button>

              <button
                onClick={() => { setMode("generate"); setError(""); }}
                className="rounded-xl border-2 border-slate-200 p-8 text-left hover:border-[hsl(14,48%,44%)] hover:shadow-lg transition-all group"
                data-testid="button-mode-generate"
              >
                <div className="text-4xl mb-4">🤖</div>
                <h3
                  className="text-lg font-semibold mb-2 group-hover:text-[hsl(14,48%,44%)]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Neuen Bogen per KI erstellen
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Definieren Sie Typ, Kompetenzen und Bewertungsskala. Die KI generiert einen vollständigen,
                  professionellen Beobachtungsbogen mit Verhaltensankern.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">KI-gestützt</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">Vollautomatisch</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === "upload" && (
          <div className="max-w-3xl mx-auto">
            <h1
              className="text-2xl font-bold tracking-tight mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Beobachtungsbogen hochladen
            </h1>

            <div className="flex items-center gap-4 mb-8">
              {(["select", "analyzing", "review"] as UploadStep[]).map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      uploadStep === step
                        ? "text-white"
                        : i < (["select", "analyzing", "review"] as UploadStep[]).indexOf(uploadStep)
                        ? "text-white bg-emerald-500"
                        : "bg-slate-100 text-slate-400"
                    }`}
                    style={uploadStep === step ? { backgroundColor: ACCENT } : undefined}
                  >
                    {i < (["select", "analyzing", "review"] as UploadStep[]).indexOf(uploadStep) ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${uploadStep === step ? "text-slate-800" : "text-slate-400"}`}>
                    {step === "select" ? "Datei wählen" : step === "analyzing" ? "KI-Analyse" : "Prüfen & Speichern"}
                  </span>
                  {i < 2 && <div className="w-8 h-px bg-slate-200" />}
                </div>
              ))}
            </div>

            {uploadStep === "select" && (
              <>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-10 text-center transition-colors hover:border-[hsl(14,48%,44%)]/50 cursor-pointer"
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                      e.target.value = "";
                    }}
                  />
                  <svg className="h-12 w-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}>
                    Datei hierher ziehen oder klicken
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unterstützte Formate: Word (.docx), PDF (.pdf), PowerPoint (.pptx) · Max. 50 MB
                  </p>
                </div>

                {uploadFile && (
                  <div className="mt-4 bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{uploadFile.name}</p>
                        <p className="text-xs text-slate-400">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={handleAnalyze}
                      className="px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 flex items-center gap-2"
                      style={{ backgroundColor: ACCENT }}
                      data-testid="button-analyze"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      KI-Analyse starten
                    </button>
                  </div>
                )}
              </>
            )}

            {uploadStep === "analyzing" && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: `${ACCENT}15` }}>
                  <SpinnerIcon />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  KI analysiert den Beobachtungsbogen…
                </h3>
                <p className="text-sm text-slate-400">
                  Kompetenzen, Verhaltensanker und Bewertungsskala werden extrahiert. Dies kann bis zu 60 Sekunden dauern.
                </p>
              </div>
            )}

            {uploadStep === "review" && analysisResult && (
              <div className="space-y-6" data-testid="analysis-results">
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 flex items-start gap-3">
                  <svg className="h-5 w-5 text-violet-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-violet-800">KI-Analyse abgeschlossen</p>
                    <p className="text-xs text-violet-600 mt-1">{analysisResult.qualityNotes}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: ACCENT }}>
                    Vorschläge prüfen und anpassen
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        className={inputClass}
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
                      <select value={reviewType} onChange={(e) => setReviewType(e.target.value)} className={inputClass} data-testid="select-type">
                        {TEMPLATE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                    <textarea
                      value={reviewDescription}
                      onChange={(e) => setReviewDescription(e.target.value)}
                      className={inputClass + " h-20 resize-none"}
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bewertungsskala</label>
                      <select value={reviewScale} onChange={(e) => setReviewScale(e.target.value)} className={inputClass} data-testid="select-scale">
                        {RATING_SCALES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                        <option value="custom">Benutzerdefiniert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Kompetenzen (kommagetrennt)</label>
                      <input
                        type="text"
                        value={reviewCompetencies}
                        onChange={(e) => setReviewCompetencies(e.target.value)}
                        className={inputClass}
                        data-testid="input-competencies"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tags (kommagetrennt)</label>
                    <input
                      type="text"
                      value={reviewTags}
                      onChange={(e) => setReviewTags(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {renderTargetLevelCheckboxes(reviewLevels, setReviewLevels)}
                  {renderExerciseMultiSelect(reviewExerciseIds, setReviewExerciseIds, "review")}
                  {renderCompModelSelect(reviewCompModelId, setReviewCompModelId, "select-competency-model")}

                  {analysisResult.sections && analysisResult.sections.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Erkannte Abschnitte ({analysisResult.sections.length})</h4>
                      {renderSections(analysisResult.sections)}
                    </div>
                  )}

                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <button
                      onClick={resetToList}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleUploadSave}
                      disabled={saving || !reviewName.trim()}
                      className="px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                      style={{ backgroundColor: ACCENT }}
                      data-testid="button-save"
                    >
                      {saving && <SpinnerIcon />}
                      {saving ? "Wird gespeichert…" : "Speichern"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "generate" && (
          <div className="max-w-3xl mx-auto">
            <h1
              className="text-2xl font-bold tracking-tight mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Beobachtungsbogen per KI generieren
            </h1>
            <p className="text-sm text-slate-400 mb-8">
              Definieren Sie die Parameter und lassen Sie die KI einen professionellen Beobachtungsbogen erstellen.
            </p>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={genName}
                    onChange={(e) => setGenName(e.target.value)}
                    placeholder="z.B. Führungskompetenz-Bogen Postkorb"
                    className={inputClass}
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Typ *</label>
                  <select value={genType} onChange={(e) => setGenType(e.target.value)} className={inputClass} data-testid="select-type">
                    {TEMPLATE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bewertungsskala</label>
                  <select value={genScale} onChange={(e) => setGenScale(e.target.value)} className={inputClass} data-testid="select-scale">
                    {RATING_SCALES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                    <option value="custom">Benutzerdefiniert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zielniveau</label>
                  <select value={genTargetLevel} onChange={(e) => setGenTargetLevel(e.target.value)} className={inputClass}>
                    <option value="">— Kein Zielniveau —</option>
                    {TARGET_LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kompetenzen (kommagetrennt oder aus Kompetenzmodell)</label>
                <input
                  type="text"
                  value={genCompetencies}
                  onChange={(e) => setGenCompetencies(e.target.value)}
                  placeholder="z.B. Strategisches Denken, Kommunikation, Entscheidungsfähigkeit"
                  className={inputClass}
                  data-testid="input-competencies"
                />
              </div>

              {renderExerciseMultiSelect(genExerciseIds, setGenExerciseIds, "gen")}
              {renderCompModelSelect(genCompModelId, setGenCompModelId, "select-competency-model")}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Zusätzliche Hinweise</label>
                <textarea
                  value={genHints}
                  onChange={(e) => setGenHints(e.target.value)}
                  placeholder="Optionale Hinweise für die KI-Generierung, z.B. Branchenkontext, spezielle Anforderungen..."
                  className={inputClass + " h-24 resize-none"}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={resetToList}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !genName.trim() || !genType}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: ACCENT }}
                  data-testid="button-generate"
                >
                  {generating && <SpinnerIcon />}
                  {generating ? "Wird generiert…" : "Beobachtungsbogen generieren"}
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === "preview" && previewData && (
          <div className="max-w-3xl mx-auto" data-testid="preview-content">
            <h1
              className="text-2xl font-bold tracking-tight mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Vorschau: {previewData.title || genName}
            </h1>
            {previewData.description && (
              <p className="text-sm text-slate-500 mb-6">{previewData.description}</p>
            )}

            {previewData.headerFields && Array.isArray(previewData.headerFields) && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Kopffelder</h4>
                <div className="flex flex-wrap gap-2">
                  {previewData.headerFields.map((field: string, i: number) => (
                    <span key={i} className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded">{field}</span>
                  ))}
                </div>
              </div>
            )}

            {previewData.sections && renderSections(previewData.sections)}

            {previewData.footerNote && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                <p className="text-xs text-amber-700">{previewData.footerNote}</p>
              </div>
            )}

            {previewData.tags && Array.isArray(previewData.tags) && previewData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-6">
                {previewData.tags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-slate-100">
              <button
                onClick={resetToList}
                className="px-5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Zur Übersicht
              </button>
              {previewTemplateId && (
                <button
                  onClick={() => openDetail(previewTemplateId)}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  Bearbeiten
                </button>
              )}
            </div>
          </div>
        )}

        {mode === "detail" && detailTemplate && (
          <div className="max-w-3xl mx-auto">
            <h1
              className="text-2xl font-bold tracking-tight mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Beobachtungsbogen bearbeiten
            </h1>
            <p className="text-sm text-slate-400 mb-8">
              Metadaten und Zuordnungen anpassen
            </p>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={detailName}
                    onChange={(e) => setDetailName(e.target.value)}
                    className={inputClass}
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
                  <select value={detailType} onChange={(e) => setDetailType(e.target.value)} className={inputClass} data-testid="select-type">
                    {TEMPLATE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                    <option value="uploaded">Hochgeladen</option>
                    <option value="manual">Manuell</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                <textarea
                  value={detailDescription}
                  onChange={(e) => setDetailDescription(e.target.value)}
                  className={inputClass + " h-20 resize-none"}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bewertungsskala</label>
                  <select value={detailScale} onChange={(e) => setDetailScale(e.target.value)} className={inputClass} data-testid="select-scale">
                    {RATING_SCALES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                    <option value="custom">Benutzerdefiniert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tags (kommagetrennt)</label>
                  <input
                    type="text"
                    value={detailTags}
                    onChange={(e) => setDetailTags(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {renderTargetLevelCheckboxes(detailLevels, setDetailLevels)}
              {renderExerciseMultiSelect(detailExerciseIds, setDetailExerciseIds, "detail")}
              {renderCompModelSelect(detailCompModelId, setDetailCompModelId, "select-competency-model")}

              {detailTemplate.structuredData && Array.isArray(detailTemplate.structuredData) && detailTemplate.structuredData.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Strukturierte Inhalte ({detailTemplate.structuredData.length} Abschnitte)</h4>
                  {renderSections(detailTemplate.structuredData)}
                </div>
              )}

              {detailTemplate.content && typeof detailTemplate.content === "object" && detailTemplate.content.sections && !detailTemplate.structuredData && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Generierte Inhalte</h4>
                  {renderSections(detailTemplate.content.sections)}
                </div>
              )}

              {detailTemplate.fileName && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span>Original-Datei: {detailTemplate.fileName}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={resetToList}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDetailSave}
                  disabled={detailSaving || !detailName.trim()}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: ACCENT }}
                  data-testid="button-save"
                >
                  {detailSaving && <SpinnerIcon />}
                  {detailSaving ? "Wird gespeichert…" : "Änderungen speichern"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-100 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs text-slate-400">© Christoph Aldering · Private initiative / concept</p>
        </div>
      </footer>
    </div>
  );
}