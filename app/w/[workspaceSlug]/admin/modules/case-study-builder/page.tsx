"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CaseStudySummary {
  id: string;
  title: string;
  subtitle: string | null;
  companyName: string;
  description: string | null;
  type: string;
  difficulty: string;
  sourceType: string;
  status: string;
  aiGenerated: boolean;
  referenceDate: string | null;
  createdAt: string;
}

type Mode = "list" | "choose" | "upload" | "generate" | "plan" | "preview";

interface GenerateParams {
  industry: string;
  companySize: string;
  strategicSituation: string;
  financialScenario: string;
  keyTensions: string;
  targetLevel: string;
  difficulty: string;
  referenceDate: string;
  candidateTime: string;
  documentCount: string;
}

interface PlannedDocument {
  id: string;
  category: string;
  title: string;
  description: string;
  author: string;
  importance: string;
  selected: boolean;
}

interface DocumentPlan {
  companyName: string;
  companyDescription: string;
  documents: PlannedDocument[];
}

export default function CaseStudyBuilderPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const base = `/w/${workspaceSlug}/admin`;

  const [mode, setMode] = useState<Mode>("list");
  const [caseStudies, setCaseStudies] = useState<CaseStudySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadText, setUploadText] = useState("");
  const [uploadStep, setUploadStep] = useState<"upload" | "review" | "processing">("upload");

  const [genParams, setGenParams] = useState<GenerateParams>({
    industry: "",
    companySize: "Großkonzern (>10.000 MA)",
    strategicSituation: "",
    financialScenario: "",
    keyTensions: "",
    targetLevel: "SE-Level / Vorstand",
    difficulty: "Hoch",
    referenceDate: "",
    candidateTime: "60",
    documentCount: "15",
  });

  const [previewData, setPreviewData] = useState<any>(null);
  const [documentPlan, setDocumentPlan] = useState<DocumentPlan | null>(null);
  const [planning, setPlanning] = useState(false);

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  async function fetchCaseStudies() {
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/case-studies`);
      if (res.ok) {
        const data = await res.json();
        setCaseStudies(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload() {
    if (!uploadFile) return;
    setError("");
    setUploadStep("processing");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch(`/api/w/${workspaceSlug}/case-studies/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload fehlgeschlagen");
        setUploadStep("upload");
        return;
      }

      const data = await res.json();
      setUploadText(data.textContent);
      setUploadStep("review");
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err?.message === "Failed to fetch"
        ? "Verbindungsfehler – die Datei ist möglicherweise zu groß oder die Verbindung wurde unterbrochen. Bitte versuchen Sie es erneut."
        : "Fehler beim Hochladen");
      setUploadStep("upload");
    }
  }

  async function handleUploadParse() {
    setError("");
    setGenerating(true);

    try {
      const res = await fetch(`/api/w/${workspaceSlug}/case-studies/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "upload_parse",
          params: {
            textContent: uploadText,
            fileName: uploadFile?.name,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Verarbeitung fehlgeschlagen");
        setGenerating(false);
        return;
      }

      const data = await res.json();
      setPreviewData(data);
      setSuccess("Fallstudie erfolgreich aus Upload erstellt!");
      setMode("preview");
      fetchCaseStudies();
    } catch {
      setError("Fehler bei der Verarbeitung");
    } finally {
      setGenerating(false);
    }
  }

  async function handlePlanDocuments() {
    if (!genParams.industry || !genParams.strategicSituation) {
      setError("Branche und strategische Situation sind Pflichtfelder");
      return;
    }
    setError("");
    setPlanning(true);

    try {
      const res = await fetch(`/api/w/${workspaceSlug}/case-studies/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genParams),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Planung fehlgeschlagen");
        setPlanning(false);
        return;
      }

      const plan = await res.json();
      setDocumentPlan(plan);
      setMode("plan");
    } catch {
      setError("Fehler bei der Dokumentenplanung");
    } finally {
      setPlanning(false);
    }
  }

  function toggleDocument(docId: string) {
    if (!documentPlan) return;
    setDocumentPlan({
      ...documentPlan,
      documents: documentPlan.documents.map((d) =>
        d.id === docId ? { ...d, selected: !d.selected } : d
      ),
    });
  }

  function updateDocumentField(docId: string, field: keyof PlannedDocument, value: string) {
    if (!documentPlan) return;
    setDocumentPlan({
      ...documentPlan,
      documents: documentPlan.documents.map((d) =>
        d.id === docId ? { ...d, [field]: value } : d
      ),
    });
  }

  async function handleGenerateFromPlan() {
    if (!documentPlan) return;
    setError("");
    setGenerating(true);

    try {
      const res = await fetch(`/api/w/${workspaceSlug}/case-studies/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          params: { ...genParams, documentPlan },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Generierung fehlgeschlagen");
        setGenerating(false);
        return;
      }

      const data = await res.json();
      setPreviewData(data);
      setSuccess("Fallstudie erfolgreich generiert!");
      setMode("preview");
      fetchCaseStudies();
    } catch {
      setError("Fehler bei der Generierung");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateDirect() {
    if (!genParams.industry || !genParams.strategicSituation) {
      setError("Branche und strategische Situation sind Pflichtfelder");
      return;
    }
    setError("");
    setGenerating(true);

    try {
      const res = await fetch(`/api/w/${workspaceSlug}/case-studies/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          params: genParams,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Generierung fehlgeschlagen");
        setGenerating(false);
        return;
      }

      const data = await res.json();
      setPreviewData(data);
      setSuccess("Fallstudie erfolgreich generiert!");
      setMode("preview");
      fetchCaseStudies();
    } catch {
      setError("Fehler bei der Generierung");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Fallstudie wirklich löschen?")) return;
    try {
      await fetch(`/api/w/${workspaceSlug}/case-studies/${id}`, { method: "DELETE" });
      fetchCaseStudies();
    } catch {}
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await fetch(`/api/w/${workspaceSlug}/case-studies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchCaseStudies();
    } catch {}
  }

  const difficultyLabel = (d: string) => {
    const map: Record<string, string> = { low: "Niedrig", medium: "Mittel", high: "Hoch" };
    return map[d] || d;
  };

  const sourceLabel = (s: string) => {
    const map: Record<string, string> = {
      manual: "Manuell",
      upload: "Upload",
      ai_generated: "KI-generiert",
    };
    return map[s] || s;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; color: string }> = {
      draft: { label: "Entwurf", color: "#f59e0b" },
      active: { label: "Aktiv", color: "#16a34a" },
    };
    const info = map[s] || { label: s, color: "#6b7280" };
    return (
      <span
        className="text-[10px] font-bold text-white rounded-full px-2.5 py-1"
        style={{ backgroundColor: info.color }}
      >
        {info.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="text-white sticky top-0 z-50 bg-[hsl(14,48%,44%)]">
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
              href={`${base}/modules`}
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="link-back-modules"
            >
              ← Module
            </Link>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Fallstudien-Builder
            </span>
          </div>
          {mode !== "list" && (
            <button
              onClick={() => { setMode("list"); setError(""); setSuccess(""); }}
              className="text-xs text-white/80 hover:text-white transition-colors"
              data-testid="button-back-list"
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
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }} data-testid="text-page-title">
                  Fallstudien
                </h1>
                <p className="text-sm mt-1 text-slate-400">
                  Erstellen und verwalten Sie Fallstudien für Assessment-Übungen
                </p>
              </div>
              <button
                onClick={() => setMode("choose")}
                className="px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: "hsl(14, 48%, 44%)" }}
                data-testid="button-new-case-study"
              >
                + Neue Fallstudie
              </button>
            </div>

            {loading ? (
              <div className="text-center py-20 text-slate-400">Laden...</div>
            ) : caseStudies.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Noch keine Fallstudien</h3>
                <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                  Erstellen Sie Ihre erste Fallstudie — entweder per Upload einer bestehenden Fallstudie
                  oder lassen Sie eine neue durch KI generieren.
                </p>
                <button
                  onClick={() => setMode("choose")}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90"
                  style={{ backgroundColor: "hsl(14, 48%, 44%)" }}
                  data-testid="button-create-first"
                >
                  Erste Fallstudie erstellen
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {caseStudies.map((cs) => (
                  <div
                    key={cs.id}
                    className="rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                    data-testid={`card-case-study-${cs.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-base" style={{ fontFamily: "'Playfair Display', serif", color: "hsl(14, 48%, 44%)" }}>
                            {cs.companyName}
                          </h3>
                          {statusBadge(cs.status)}
                          {cs.aiGenerated && (
                            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                              KI
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{cs.title}</p>
                        {cs.description && <p className="text-xs text-slate-400 mb-3">{cs.description}</p>}
                        <div className="flex items-center gap-4 text-[11px] text-slate-400">
                          <span>Typ: {cs.type}</span>
                          <span>·</span>
                          <span>Schwierigkeit: {difficultyLabel(cs.difficulty)}</span>
                          <span>·</span>
                          <span>Quelle: {sourceLabel(cs.sourceType)}</span>
                          <span>·</span>
                          <span>{new Date(cs.createdAt).toLocaleDateString("de-DE")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          href={`${base}/modules/case-study/${cs.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 transition-colors"
                          data-testid={`link-view-${cs.id}`}
                        >
                          Ansehen
                        </Link>
                        {cs.status === "draft" && (
                          <button
                            onClick={() => handleStatusChange(cs.id, "active")}
                            className="text-xs px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-colors"
                            style={{ backgroundColor: "#16a34a" }}
                            data-testid={`button-activate-${cs.id}`}
                          >
                            Aktivieren
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(cs.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:text-red-700 hover:border-red-300 transition-colors"
                          data-testid={`button-delete-${cs.id}`}
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {mode === "choose" && (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Neue Fallstudie erstellen
            </h1>
            <p className="text-sm text-slate-400 mb-10">
              Wählen Sie, wie Sie die Fallstudie erstellen möchten
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => { setMode("upload"); setUploadStep("upload"); setUploadFile(null); setUploadText(""); }}
                className="rounded-xl border-2 border-slate-200 p-8 text-left hover:border-[hsl(14,48%,44%)] hover:shadow-lg transition-all group"
                data-testid="button-mode-upload"
              >
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-[hsl(14,48%,44%)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Bestehende Fallstudie hochladen
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Laden Sie ein bestehendes Dokument (Word, PDF, TXT) hoch.
                  Die KI analysiert den Inhalt und überführt ihn automatisch in das strukturierte Datenraum-Format.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <span className="bg-slate-100 px-2 py-0.5 rounded">DOCX</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">PDF</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">TXT</span>
                </div>
              </button>

              <button
                onClick={() => setMode("generate")}
                className="rounded-xl border-2 border-slate-200 p-8 text-left hover:border-[hsl(14,48%,44%)] hover:shadow-lg transition-all group"
                data-testid="button-mode-generate"
              >
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-[hsl(14,48%,44%)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Neue Fallstudie per KI erstellen
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Beantworten Sie Kernfragen zu Branche, Unternehmensgröße, strategischer Situation und Spannungsfeldern.
                  Die KI erstellt eine vollständige, realistische Fallstudie mit Datenraum.
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
            <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Fallstudie hochladen
            </h1>

            <div className="flex items-center gap-4 mb-8">
              {["upload", "review", "processing"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      uploadStep === step
                        ? "text-white"
                        : ["upload", "review", "processing"].indexOf(uploadStep) > i
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                    style={uploadStep === step ? { backgroundColor: "hsl(14, 48%, 44%)" } : {}}
                  >
                    {["upload", "review", "processing"].indexOf(uploadStep) > i ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs ${uploadStep === step ? "font-semibold" : "text-slate-400"}`}>
                    {step === "upload" ? "Datei wählen" : step === "review" ? "Inhalt prüfen" : "KI-Verarbeitung"}
                  </span>
                  {i < 2 && <div className="w-8 h-px bg-slate-200 mx-1" />}
                </div>
              ))}
            </div>

            {uploadStep === "upload" && (
              <div>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-[hsl(14,48%,44%)] transition-colors cursor-pointer"
                  onClick={() => document.getElementById("file-input")?.click()}
                  data-testid="dropzone-upload"
                >
                  <div className="text-4xl mb-4">📁</div>
                  <p className="text-sm text-slate-600 font-medium mb-1">
                    Klicken Sie hier oder ziehen Sie eine Datei hinein
                  </p>
                  <p className="text-xs text-slate-400">Unterstützt: DOCX, PDF, TXT (max. 50 MB)</p>
                  {uploadFile && (
                    <div className="mt-4 bg-slate-50 rounded-lg p-3 inline-block">
                      <span className="text-sm font-medium text-slate-700">{uploadFile.name}</span>
                      <span className="text-xs text-slate-400 ml-2">({(uploadFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                  <input
                    id="file-input"
                    type="file"
                    accept=".docx,.pdf,.txt,.doc"
                    className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    data-testid="input-file"
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleFileUpload}
                    disabled={!uploadFile}
                    className="px-6 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-colors"
                    style={{ backgroundColor: "hsl(14, 48%, 44%)" }}
                    data-testid="button-upload-file"
                  >
                    Datei analysieren →
                  </button>
                </div>
              </div>
            )}

            {uploadStep === "review" && (
              <div>
                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Extrahierter Text</h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Prüfen und bearbeiten Sie den extrahierten Text, bevor die KI ihn in das Datenraum-Format überführt.
                  </p>
                  <textarea
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    rows={15}
                    className="w-full rounded-lg border border-slate-200 p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30 font-mono"
                    data-testid="textarea-extracted-text"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => { setUploadStep("upload"); setUploadText(""); setUploadFile(null); }}
                    className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-slate-300 transition-colors"
                    data-testid="button-back-upload"
                  >
                    ← Zurück
                  </button>
                  <button
                    onClick={handleUploadParse}
                    disabled={!uploadText.trim() || generating}
                    className="px-6 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-colors"
                    style={{ backgroundColor: "hsl(14, 48%, 44%)" }}
                    data-testid="button-parse-with-ai"
                  >
                    {generating ? "KI verarbeitet..." : "In Datenraum überführen →"}
                  </button>
                </div>
              </div>
            )}

            {uploadStep === "processing" && (
              <div className="text-center py-20">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <p className="text-sm text-slate-500">Datei wird analysiert...</p>
              </div>
            )}
          </div>
        )}

        {mode === "generate" && (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Neue Fallstudie generieren
            </h1>
            <p className="text-sm text-slate-400 mb-8">
              Beschreiben Sie die gewünschte Fallstudie und die KI erstellt eine vollständige, realistische Fallstudie mit Datenraum.
            </p>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Branche <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={genParams.industry}
                    onChange={(e) => setGenParams({ ...genParams, industry: e.target.value })}
                    placeholder="z.B. Industriekonglomerat, Pharma, Technologie, Automotive..."
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                    data-testid="input-industry"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Unternehmensgröße</label>
                  <select
                    value={genParams.companySize}
                    onChange={(e) => setGenParams({ ...genParams, companySize: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                    data-testid="select-company-size"
                  >
                    <option>Großkonzern (&gt;10.000 MA)</option>
                    <option>Mittelstand (1.000-10.000 MA)</option>
                    <option>KMU (100-1.000 MA)</option>
                    <option>Startup / Scale-up (&lt;100 MA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Strategische Situation <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={genParams.strategicSituation}
                  onChange={(e) => setGenParams({ ...genParams, strategicSituation: e.target.value })}
                  placeholder="z.B. Turnaround nach Gewinneinbruch, Post-Merger-Integration, Digitale Transformation, Marktexpansion..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                  data-testid="textarea-strategic-situation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Finanzielles Szenario</label>
                <textarea
                  value={genParams.financialScenario}
                  onChange={(e) => setGenParams({ ...genParams, financialScenario: e.target.value })}
                  placeholder="z.B. Sinkende Margen, Covenant-Bruch-Risiko, Hohe Verschuldung, Investitionsstau..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                  data-testid="textarea-financial-scenario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Kernspannungen / Dilemmata</label>
                <textarea
                  value={genParams.keyTensions}
                  onChange={(e) => setGenParams({ ...genParams, keyTensions: e.target.value })}
                  placeholder="z.B. Kurzfristige Renditeziele vs. langfristige Investitionen, Effizienz vs. Innovation, Zentralisierung vs. Autonomie..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                  data-testid="textarea-key-tensions"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Zielgruppe / Level</label>
                  <select
                    value={genParams.targetLevel}
                    onChange={(e) => setGenParams({ ...genParams, targetLevel: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                    data-testid="select-target-level"
                  >
                    <option>SE-Level / Vorstand</option>
                    <option>Director / Bereichsleitung</option>
                    <option>Manager</option>
                    <option>Expert / Fachkraft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Schwierigkeitsgrad</label>
                  <select
                    value={genParams.difficulty}
                    onChange={(e) => setGenParams({ ...genParams, difficulty: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                    data-testid="select-difficulty"
                  >
                    <option value="Hoch">Hoch</option>
                    <option value="Mittel">Mittel</option>
                    <option value="Niedrig">Niedrig</option>
                  </select>
                </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Referenzdatum (Stichtag)
                </label>
                <input
                  type="date"
                  value={genParams.referenceDate}
                  onChange={(e) => setGenParams({ ...genParams, referenceDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                  data-testid="input-reference-date"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Alle Daten, Geschäftsjahre und E-Mails werden konsistent zu diesem Stichtag generiert
                </p>
              </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Bearbeitungszeit (Minuten)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={genParams.candidateTime}
                    onChange={(e) => setGenParams({ ...genParams, candidateTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                    data-testid="input-candidate-time"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Wie viel Zeit hat der Kandidat für die Bearbeitung?
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Anzahl Vorgänge / Dokumente
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="40"
                    value={genParams.documentCount}
                    onChange={(e) => setGenParams({ ...genParams, documentCount: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(14,48%,44%)]/30"
                    data-testid="input-document-count"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Gesamtzahl der E-Mails, Protokolle, News etc.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  onClick={() => setMode("choose")}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-slate-300 transition-colors"
                  data-testid="button-back-choose"
                >
                  ← Zurück
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerateDirect}
                    disabled={generating || planning || !genParams.industry || !genParams.strategicSituation}
                    className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-slate-300 transition-colors disabled:opacity-50"
                    data-testid="button-generate-direct"
                  >
                    {generating ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⚙️</span> Generiert...
                      </span>
                    ) : (
                      "Direkt generieren"
                    )}
                  </button>
                  <button
                    onClick={handlePlanDocuments}
                    disabled={planning || generating || !genParams.industry || !genParams.strategicSituation}
                    className="px-6 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-colors"
                    style={{ backgroundColor: "hsl(14, 48%, 44%)" }}
                    data-testid="button-plan-documents"
                  >
                    {planning ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⚙️</span> Dokumente werden geplant...
                      </span>
                    ) : (
                      "Dokumente planen →"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === "plan" && documentPlan && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Dokumentenplan
            </h1>
            <p className="text-sm text-slate-400 mb-6">
              Die KI hat folgende Dokumente für den Datenraum geplant. Wählen Sie Dokumente ab oder passen Sie Beschreibungen an.
            </p>

            <div className="bg-slate-50 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-base font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "hsl(14, 48%, 44%)" }}>
                  {documentPlan.companyName}
                </h3>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  {documentPlan.documents.filter((d) => d.selected).length} / {documentPlan.documents.length} Dokumente ausgewählt
                </span>
              </div>
              <p className="text-sm text-slate-500">{documentPlan.companyDescription}</p>
            </div>

            {(() => {
              const categories: Record<string, { label: string; icon: string }> = {
                briefing: { label: "Strategisches Briefing", icon: "📋" },
                email: { label: "E-Mails", icon: "📧" },
                protocol: { label: "Sitzungsprotokolle", icon: "📝" },
                news: { label: "Nachrichtenartikel", icon: "📰" },
                report: { label: "Interne Berichte", icon: "📊" },
                financial: { label: "Finanzdaten", icon: "💰" },
                hr: { label: "HR-Dashboard", icon: "👥" },
              };
              const groupedDocs: Record<string, PlannedDocument[]> = {};
              for (const doc of documentPlan.documents) {
                const cat = doc.category || "other";
                if (!groupedDocs[cat]) groupedDocs[cat] = [];
                groupedDocs[cat].push(doc);
              }

              return Object.entries(groupedDocs).map(([cat, docs]) => {
                const catInfo = categories[cat] || { label: cat, icon: "📄" };
                const selectedCount = docs.filter((d) => d.selected).length;
                return (
                  <div key={cat} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span>{catInfo.icon}</span>
                      <h3 className="text-sm font-semibold text-slate-700">{catInfo.label}</h3>
                      <span className="text-xs text-slate-400">({selectedCount}/{docs.length})</span>
                    </div>
                    <div className="space-y-2">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className={`rounded-lg border p-4 transition-all ${
                            doc.selected
                              ? "border-slate-200 bg-white"
                              : "border-slate-100 bg-slate-50 opacity-60"
                          }`}
                          data-testid={`plan-doc-${doc.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={doc.selected}
                              onChange={() => toggleDocument(doc.id)}
                              className="mt-1 rounded border-slate-300 text-[hsl(14,48%,44%)] focus:ring-[hsl(14,48%,44%)]"
                              data-testid={`checkbox-doc-${doc.id}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <input
                                  value={doc.title}
                                  onChange={(e) => updateDocumentField(doc.id, "title", e.target.value)}
                                  className="text-sm font-medium text-slate-800 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-[hsl(14,48%,44%)] focus:ring-0 p-0 w-full transition-colors"
                                  data-testid={`input-doc-title-${doc.id}`}
                                />
                                {doc.importance === "high" && (
                                  <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded shrink-0">Wichtig</span>
                                )}
                              </div>
                              {doc.author && (
                                <p className="text-xs text-slate-400 mb-1">Von: {doc.author}</p>
                              )}
                              <textarea
                                value={doc.description}
                                onChange={(e) => updateDocumentField(doc.id, "description", e.target.value)}
                                rows={1}
                                className="text-xs text-slate-500 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-[hsl(14,48%,44%)] focus:ring-0 p-0 w-full resize-none transition-colors"
                                data-testid={`textarea-doc-desc-${doc.id}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}

            <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => { setMode("generate"); setDocumentPlan(null); }}
                className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-slate-300 transition-colors"
                data-testid="button-back-generate"
              >
                ← Parameter anpassen
              </button>
              <button
                onClick={handleGenerateFromPlan}
                disabled={generating || documentPlan.documents.filter((d) => d.selected).length === 0}
                className="px-6 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-colors"
                style={{ backgroundColor: "hsl(14, 48%, 44%)" }}
                data-testid="button-generate-from-plan"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⚙️</span> KI generiert Fallstudie...
                  </span>
                ) : (
                  `Fallstudie mit ${documentPlan.documents.filter((d) => d.selected).length} Dokumenten generieren →`
                )}
              </button>
            </div>
          </div>
        )}

        {mode === "preview" && previewData && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {previewData.companyName}
                </h1>
                <p className="text-sm text-slate-400 mt-1">{previewData.title}</p>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(previewData.status)}
                <button
                  onClick={() => { setMode("list"); setPreviewData(null); setSuccess(""); }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-slate-300 transition-colors"
                  data-testid="button-done-preview"
                >
                  Fertig
                </button>
              </div>
            </div>

            {(() => {
              const data = previewData.dataJson;
              if (!data) return <p className="text-slate-400">Keine Daten verfügbar</p>;

              return (
                <div className="space-y-8">
                  <section>
                    <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "hsl(14, 48%, 44%)" }}>
                      Übersicht
                    </h2>
                    <p className="text-sm text-slate-600 mb-4">{data.description}</p>
                    {data.metrics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {data.metrics.map((m: any, i: number) => (
                          <div key={i} className="bg-slate-50 rounded-lg p-4">
                            <p className="text-xs text-slate-400 mb-1">{m.label}</p>
                            <p className="text-lg font-bold text-slate-700">{m.value}</p>
                            <span className={`text-xs ${m.trend?.includes("down") ? "text-red-500" : m.trend === "up" ? "text-green-500" : "text-slate-400"}`}>
                              {m.trend === "up" ? "↑" : m.trend?.includes("down") ? "↓" : "→"} {m.trend}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {data.businessUnits && (
                    <section>
                      <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "hsl(14, 48%, 44%)" }}>
                        Geschäftseinheiten ({data.businessUnits.length})
                      </h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        {data.businessUnits.map((bu: any, i: number) => (
                          <div key={i} className="border border-slate-200 rounded-lg p-4">
                            <h4 className="font-semibold text-sm mb-2">{bu.name}</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-2">
                              <span>Umsatz: €{bu.revenue} Mrd</span>
                              <span>EBITDA: €{bu.ebitda} Mrd</span>
                              <span>Marge: {bu.margin}%</span>
                              <span>MA: {bu.employees?.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-slate-400 italic">{bu.tension}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {data.emails && (
                    <section>
                      <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "hsl(14, 48%, 44%)" }}>
                        Kommunikation ({data.emails.length} E-Mails)
                      </h2>
                      <div className="space-y-3">
                        {data.emails.map((email: any, i: number) => (
                          <div key={i} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{email.from}</span>
                              <span className="text-xs text-slate-400">{email.date}</span>
                            </div>
                            <p className="text-sm font-semibold mb-2">{email.subject}</p>
                            <p className="text-xs text-slate-500 line-clamp-3">{email.content?.substring(0, 200)}...</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {previewData.questionsJson && (
                    <section>
                      <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "hsl(14, 48%, 44%)" }}>
                        Bewertungsfragen
                      </h2>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-600 mb-3">Analysefragen</h4>
                          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-500">
                            {previewData.questionsJson.analysis?.map((q: string, i: number) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ol>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-600 mb-3">Schlussfolgerungen</h4>
                          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-500">
                            {previewData.questionsJson.conclusions?.map((q: string, i: number) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-100 py-6">
        <p className="text-center text-xs text-slate-300">
          &copy; Christoph Aldering · Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
