"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface RequirementsAnalysis {
  id: string;
  title: string;
  mode: string;
  status: string;
  inputType: string;
  transcript: string | null;
  proposal: AIProposal | null;
  consentGiven: boolean;
  appliedAssessmentId: string | null;
  createdAt: string;
}

interface AIProposal {
  targetRole: { title: string; level: string; context: string };
  successCriteria: string[];
  competencies: {
    name: string;
    nodeType: string;
    description: string;
    children: {
      name: string;
      nodeType: string;
      description: string;
      anchors?: string[];
    }[];
  }[];
  risks: string[];
  exercises: {
    name: string;
    type: string;
    duration: number;
    instructions: string;
    difficultyLevel: string;
    competencyMappings: string[];
  }[];
  scale: {
    name: string;
    type: string;
    points: { value: number; label: string; description: string }[];
  };
  weightings: { competencyName: string; weight: number }[];
  assessmentName: string;
  assessmentDescription: string;
}

type Mode = "auto" | "co-creation" | "classic";
type Step = "select-mode" | "input" | "processing" | "proposal" | "list";

const MODE_LABELS: Record<Mode, string> = {
  auto: "Auto-Modus",
  "co-creation": "KI Co-Creation",
  classic: "Klassisch",
};

const MODE_DESCRIPTIONS: Record<Mode, string> = {
  auto: "Laden Sie eine Aufnahme oder ein Transkript hoch — die KI erstellt automatisch einen vollständigen Entwurf.",
  "co-creation": "Interaktiver Assistent: Die KI stellt gezielt Fragen und erstellt schrittweise einen Vorschlag.",
  classic: "Manuell: Definieren Sie alle Aspekte selbst ohne KI-Unterstützung.",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Ausstehend",
  processing: "Wird verarbeitet…",
  proposal_ready: "Vorschlag bereit",
  applied: "Angewendet",
  error: "Fehler",
  ready: "Bereit",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  proposal_ready: "bg-green-100 text-green-800",
  applied: "bg-purple-100 text-purple-800",
  error: "bg-red-100 text-red-800",
  ready: "bg-gray-100 text-gray-800",
};

const EXERCISE_TYPES: Record<string, string> = {
  presentation: "Präsentation",
  interview: "Interview",
  group_discussion: "Gruppendiskussion",
  case_study: "Fallstudie",
  role_play: "Rollenspiel",
  in_tray: "Postkorb",
  psychometric: "Psychometrisch",
  other: "Sonstiges",
};

export default function RequirementsAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.workspaceSlug as string;

  const [analyses, setAnalyses] = useState<RequirementsAnalysis[]>([]);
  const [step, setStep] = useState<Step>("list");
  const [mode, setMode] = useState<Mode>("auto");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);

  const [activeAnalysis, setActiveAnalysis] = useState<RequirementsAnalysis | null>(null);
  const [editedProposal, setEditedProposal] = useState<AIProposal | null>(null);
  const [proposalTab, setProposalTab] = useState<string>("overview");
  const [applying, setApplying] = useState(false);

  const [coCreationMessages, setCoCreationMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [coCreationInput, setCoCreationInput] = useState("");
  const [coCreationStep, setCoCreationStep] = useState("target_role");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [matchingAnalysisId, setMatchingAnalysisId] = useState<string | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingResult, setMatchingResult] = useState<any>(null);
  const [matchingError, setMatchingError] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async () => {
    try {
      const res = await fetch(`/api/w/${slug}/requirements-analysis`);
      if (res.ok) {
        const data = await res.json();
        setAnalyses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coCreationMessages]);

  const accentColor = "hsl(14, 48%, 44%)";

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Bitte geben Sie einen Titel ein.");
      return;
    }
    if (mode !== "classic" && !consent) {
      setError("Bitte bestätigen Sie die Einwilligung zur KI-Verarbeitung.");
      return;
    }
    if (mode === "auto" && !audioFile && !transcript.trim()) {
      setError("Bitte laden Sie eine Audiodatei hoch oder geben Sie ein Transkript ein.");
      return;
    }

    setError(null);
    setProcessing(true);

    try {
      const inputType = audioFile ? "audio" : transcript.trim() ? "transcript" : "manual";

      const res = await fetch(`/api/w/${slug}/requirements-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          mode,
          inputType,
          transcript: transcript.trim() || null,
          consentGiven: mode === "classic" ? true : consent,
          fileName: audioFile?.name,
          fileSize: audioFile?.size,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Fehler beim Erstellen");
      }

      const { analysis, uploadUrl } = await res.json();

      if (audioFile && uploadUrl) {
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: audioFile,
          headers: { "Content-Type": audioFile.type },
        });
        if (!uploadRes.ok) throw new Error("Audio-Upload fehlgeschlagen");
      }

      if (mode === "auto" && inputType !== "manual") {
        const processRes = await fetch(`/api/w/${slug}/requirements-analysis/${analysis.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "process" }),
        });

        if (!processRes.ok) {
          const err = await processRes.json();
          throw new Error(err.error || "Verarbeitung fehlgeschlagen");
        }

        const updated = await processRes.json();
        setActiveAnalysis(updated);
        setEditedProposal(updated.proposal);
        setStep("proposal");
      } else if (mode === "co-creation") {
        setActiveAnalysis(analysis);
        setStep("processing");
        const aiRes = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "co_creation_question",
            step: "target_role",
            history: [],
          }),
        });
        if (aiRes.ok) {
          const data = await aiRes.json();
          setCoCreationMessages([{ role: "assistant", content: data.message || "Willkommen! Lassen Sie uns gemeinsam ein Assessment Center planen. Für welche Zielposition soll das Assessment Center entwickelt werden?" }]);
        } else {
          setCoCreationMessages([{ role: "assistant", content: "Willkommen! Lassen Sie uns gemeinsam ein Assessment Center planen. Für welche Zielposition soll das Assessment Center entwickelt werden?" }]);
        }
        setStep("input");
      } else {
        setActiveAnalysis(analysis);
        setStep("proposal");
        setEditedProposal(createEmptyProposal());
      }

      await fetchAnalyses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setProcessing(false);
    }
  };

  const handleCoCreationSend = async () => {
    if (!coCreationInput.trim() || !activeAnalysis) return;

    const newMessages = [
      ...coCreationMessages,
      { role: "user" as const, content: coCreationInput },
    ];
    setCoCreationMessages(newMessages);
    setCoCreationInput("");
    setProcessing(true);

    try {
      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "co_creation_question",
          step: coCreationStep,
          history: newMessages,
        }),
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        setCoCreationMessages([...newMessages, { role: "assistant", content: data.message }]);

        const steps = ["target_role", "competencies", "exercises", "scale", "summary"];
        const currentIdx = steps.indexOf(coCreationStep);
        if (currentIdx < steps.length - 1 && newMessages.length > 3) {
          setCoCreationStep(steps[currentIdx + 1]);
        }
      } else {
        setCoCreationMessages([...newMessages, { role: "assistant", content: "Entschuldigung, ich konnte Ihre Anfrage nicht verarbeiten. Bitte versuchen Sie es erneut." }]);
      }
    } catch {
      setCoCreationMessages([...newMessages, { role: "assistant", content: "Verbindungsfehler. Bitte versuchen Sie es erneut." }]);
    } finally {
      setProcessing(false);
    }
  };

  const handleCoCreationFinalize = async () => {
    if (!activeAnalysis) return;
    setProcessing(true);

    try {
      const fullText = coCreationMessages
        .map((m) => `${m.role === "user" ? "Benutzer" : "Berater"}: ${m.content}`)
        .join("\n\n");

      await fetch(`/api/w/${slug}/requirements-analysis/${activeAnalysis.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "processing", proposal: null }),
      });

      await fetch(`/api/w/${slug}/requirements-analysis/${activeAnalysis.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      });

      const processRes = await fetch(`/api/w/${slug}/requirements-analysis/${activeAnalysis.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process" }),
      });

      if (processRes.ok) {
        const data = await processRes.json();
        setActiveAnalysis(data);
        setEditedProposal(data.proposal);
        setStep("proposal");
      } else {
        throw new Error("Vorschlagserstellung fehlgeschlagen");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!activeAnalysis) return;
    setApplying(true);

    try {
      if (editedProposal) {
        await fetch(`/api/w/${slug}/requirements-analysis/${activeAnalysis.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposal: editedProposal }),
        });
      }

      const res = await fetch(`/api/w/${slug}/requirements-analysis/${activeAnalysis.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Anwendung fehlgeschlagen");
      }

      const data = await res.json();
      router.push(`/w/${slug}/admin/assessments/${data.assessmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setApplying(false);
    }
  };

  const handleFindMatches = async (analysisId: string) => {
    setMatchingAnalysisId(analysisId);
    setMatchingLoading(true);
    setMatchingResult(null);
    setMatchingError(null);

    try {
      const res = await fetch(`/api/w/${slug}/exercise-matching`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementsAnalysisId: analysisId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Suchen");
      }

      const result = await res.json();
      setMatchingResult(result);
    } catch (err) {
      setMatchingError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setMatchingLoading(false);
    }
  };

  const openProposal = (analysis: RequirementsAnalysis) => {
    setActiveAnalysis(analysis);
    setEditedProposal(analysis.proposal);
    setStep("proposal");
  };

  const resetForm = () => {
    setStep("list");
    setTitle("");
    setTranscript("");
    setAudioFile(null);
    setConsent(false);
    setError(null);
    setActiveAnalysis(null);
    setEditedProposal(null);
    setCoCreationMessages([]);
    setCoCreationInput("");
    setCoCreationStep("target_role");
  };

  function createEmptyProposal(): AIProposal {
    return {
      targetRole: { title: "", level: "", context: "" },
      successCriteria: [""],
      competencies: [],
      risks: [""],
      exercises: [],
      scale: {
        name: "Bewertungsskala",
        type: "likert",
        points: [
          { value: 1, label: "Deutlich unter Erwartung", description: "" },
          { value: 2, label: "Unter Erwartung", description: "" },
          { value: 3, label: "Entspricht Erwartung", description: "" },
          { value: 4, label: "Über Erwartung", description: "" },
          { value: 5, label: "Deutlich über Erwartung", description: "" },
        ],
      },
      weightings: [],
      assessmentName: "",
      assessmentDescription: "",
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/w/${slug}/admin`}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Dashboard
            </Link>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "Playfair Display, serif", color: accentColor }}
              data-testid="text-page-title"
            >
              Anforderungsanalyse
            </h1>
          </div>
          {step !== "list" && (
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              data-testid="button-back-to-list"
            >
              Zurück zur Übersicht
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700" data-testid="text-error">
            {error}
            <button onClick={() => setError(null)} className="ml-4 underline text-sm">Schließen</button>
          </div>
        )}

        {step === "list" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Erstellen Sie Assessment-Entwürfe aus Anforderungsanalysen — manuell oder KI-gestützt.
              </p>
              <button
                onClick={() => setStep("select-mode")}
                className="px-6 py-2.5 text-white rounded-lg font-medium shadow-sm hover:opacity-90 transition"
                style={{ backgroundColor: accentColor }}
                data-testid="button-new-analysis"
              >
                + Neue Analyse
              </button>
            </div>

            {analyses.length === 0 ? (
              <div className="text-center py-16 text-gray-400 border border-dashed border-gray-300 rounded-xl">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-lg font-medium">Noch keine Analysen vorhanden</p>
                <p className="text-sm mt-1">Erstellen Sie Ihre erste Anforderungsanalyse</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analyses.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (a.status === "proposal_ready" || a.status === "applied") {
                        openProposal(a);
                      }
                    }}
                    data-testid={`card-analysis-${a.id}`}
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      <p className="text-sm text-gray-500">
                        {MODE_LABELS[a.mode as Mode] || a.mode} · {new Date(a.createdAt).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-600"}`}
                        data-testid={`status-analysis-${a.id}`}
                      >
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                      {(a.status === "proposal_ready" || a.status === "applied") && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleFindMatches(a.id); }}
                          disabled={matchingLoading && matchingAnalysisId === a.id}
                          className="px-3 py-1 text-xs font-medium text-white rounded-full hover:opacity-90 transition disabled:opacity-50"
                          style={{ backgroundColor: "#7c3aed" }}
                          data-testid={`button-match-exercises-${a.id}`}
                        >
                          {matchingLoading && matchingAnalysisId === a.id ? "Suche…" : "Übungen finden"}
                        </button>
                      )}
                      {a.appliedAssessmentId && (
                        <Link
                          href={`/w/${slug}/admin/assessments/${a.appliedAssessmentId}`}
                          className="text-sm underline"
                          style={{ color: accentColor }}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`link-assessment-${a.id}`}
                        >
                          Zum Assessment →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {matchingError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-testid="text-matching-error">
                {matchingError}
                <button onClick={() => setMatchingError(null)} className="ml-3 underline">Schließen</button>
              </div>
            )}

            {matchingResult && (
              <div className="mt-6 space-y-6" data-testid="section-matching-results">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: "Playfair Display, serif", color: "#7c3aed" }}>
                    Übungs-Empfehlungen
                  </h3>
                  <button
                    onClick={() => { setMatchingResult(null); setMatchingAnalysisId(null); }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                    data-testid="button-close-matching"
                  >
                    Schließen
                  </button>
                </div>

                {matchingResult.recommendationsJson?.use_as_is?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                      Direkt einsetzbar ({matchingResult.recommendationsJson.use_as_is.length})
                    </h4>
                    <div className="space-y-2">
                      {matchingResult.recommendationsJson.use_as_is.map((r: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg" data-testid={`match-use-${i}`}>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{r.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{r.rationale}</p>
                          </div>
                          <span className="text-sm font-bold text-emerald-700">{r.fitScore}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchingResult.recommendationsJson?.adapt?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full" />
                      Anpassung empfohlen ({matchingResult.recommendationsJson.adapt.length})
                    </h4>
                    <div className="space-y-2">
                      {matchingResult.recommendationsJson.adapt.map((r: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg" data-testid={`match-adapt-${i}`}>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{r.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{r.rationale}</p>
                            {r.suggestedChanges && <p className="text-xs text-amber-700 mt-0.5">{r.suggestedChanges}</p>}
                          </div>
                          <span className="text-sm font-bold text-amber-700">{r.fitScore}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchingResult.recommendationsJson?.create_new?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      Neu erstellen ({matchingResult.recommendationsJson.create_new.length})
                    </h4>
                    <div className="space-y-2">
                      {matchingResult.recommendationsJson.create_new.map((r: any, i: number) => (
                        <div key={i} className="p-3 bg-blue-50 border border-blue-200 rounded-lg" data-testid={`match-new-${i}`}>
                          <p className="font-medium text-sm text-gray-900">{r.proposedExerciseSpec?.name || "Neue Übung"}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{r.rationale}</p>
                          {r.proposedExerciseSpec?.type && (
                            <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {r.proposedExerciseSpec.type}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!matchingResult.recommendationsJson?.use_as_is?.length && !matchingResult.recommendationsJson?.adapt?.length && !matchingResult.recommendationsJson?.create_new?.length) && (
                  <p className="text-sm text-gray-500 text-center py-8">Keine Empfehlungen verfügbar. Bitte fügen Sie zunächst Übungen zur Bibliothek hinzu.</p>
                )}
              </div>
            )}
          </div>
        )}

        {step === "select-mode" && (
          <div>
            <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
              Modus wählen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["auto", "co-creation", "classic"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setStep("input");
                  }}
                  className={`p-6 border-2 rounded-xl text-left transition hover:shadow-md ${
                    mode === m ? "border-current" : "border-gray-200"
                  }`}
                  style={mode === m ? { borderColor: accentColor } : {}}
                  data-testid={`button-mode-${m}`}
                >
                  <div className="text-2xl mb-3">
                    {m === "auto" ? "🤖" : m === "co-creation" ? "💬" : "✏️"}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{MODE_LABELS[m]}</h3>
                  <p className="text-sm text-gray-500">{MODE_DESCRIPTIONS[m]}</p>
                  {m !== "classic" && (
                    <span className="inline-block mt-3 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                      KI-gestützt
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "input" && mode !== "co-creation" && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
              {mode === "auto" ? "Anforderungsanalyse hochladen" : "Manuell erstellen"}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. CEO-Nachfolge Bewertung"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  style={{ focusRingColor: accentColor } as React.CSSProperties}
                  data-testid="input-title"
                />
              </div>

              {mode === "auto" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Audioaufnahme hochladen
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="audio-upload"
                        data-testid="input-audio-file"
                      />
                      <label htmlFor="audio-upload" className="cursor-pointer">
                        <div className="text-3xl mb-2">🎤</div>
                        {audioFile ? (
                          <p className="text-sm text-green-600 font-medium">{audioFile.name}</p>
                        ) : (
                          <p className="text-sm text-gray-500">Klicken zum Auswählen (MP3, WAV, M4A)</p>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-gray-400">oder</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transkript / Freitext eingeben
                    </label>
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      rows={8}
                      placeholder="Fügen Sie hier das Transkript der Anforderungsanalyse ein…"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none resize-y"
                      data-testid="input-transcript"
                    />
                  </div>
                </>
              )}

              {mode !== "classic" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1"
                      data-testid="input-consent"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Einwilligung zur KI-Verarbeitung</p>
                      <p className="text-amber-700 mt-1">
                        Ich bestätige, dass die eingegebenen Daten durch KI-Modelle (OpenAI) verarbeitet werden dürfen.
                        Die Daten werden zur Erstellung eines Assessment-Vorschlags verwendet und gemäß den
                        Datenschutzrichtlinien behandelt.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreate}
                  disabled={processing}
                  className="px-6 py-2.5 text-white rounded-lg font-medium shadow-sm hover:opacity-90 transition disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                  data-testid="button-submit"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      {mode === "auto" ? "KI analysiert…" : "Erstelle…"}
                    </span>
                  ) : mode === "auto" ? (
                    "Analyse starten"
                  ) : (
                    "Erstellen"
                  )}
                </button>
                <button
                  onClick={() => setStep("select-mode")}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                  data-testid="button-back"
                >
                  Zurück
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "input" && mode === "co-creation" && (
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
              KI Co-Creation
            </h2>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 border-b px-4 py-2 text-sm text-gray-500 flex items-center justify-between">
                <span>Interaktiver Assistent</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">KI-gestützt</span>
              </div>

              <div className="h-96 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
                {coCreationMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "bg-gray-100 text-gray-900"
                          : "text-white"
                      }`}
                      style={msg.role === "assistant" ? { backgroundColor: accentColor } : {}}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {processing && (
                  <div className="flex justify-start">
                    <div className="rounded-xl px-4 py-3 text-white text-sm" style={{ backgroundColor: accentColor }}>
                      <span className="animate-pulse">Denke nach…</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t p-3 flex gap-2">
                <input
                  type="text"
                  value={coCreationInput}
                  onChange={(e) => setCoCreationInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleCoCreationSend()}
                  placeholder="Ihre Antwort…"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  disabled={processing}
                  data-testid="input-co-creation"
                />
                <button
                  onClick={handleCoCreationSend}
                  disabled={processing || !coCreationInput.trim()}
                  className="px-4 py-2 text-white rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                  data-testid="button-send"
                >
                  Senden
                </button>
              </div>
            </div>

            {coCreationMessages.length >= 4 && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleCoCreationFinalize}
                  disabled={processing}
                  className="px-6 py-2.5 text-white rounded-lg font-medium shadow-sm hover:opacity-90 transition disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                  data-testid="button-finalize"
                >
                  {processing ? "Erstelle Vorschlag…" : "Vorschlag generieren"}
                </button>
              </div>
            )}
          </div>
        )}

        {step === "proposal" && editedProposal && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>
                  {activeAnalysis?.mode !== "classic" ? "KI-Vorschlag" : "Entwurf"}: {activeAnalysis?.title}
                </h2>
                {activeAnalysis?.mode !== "classic" && (
                  <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-amber-500 rounded-full" />
                    Alle Inhalte sind KI-generiert — bitte prüfen und anpassen
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                {activeAnalysis?.status !== "applied" && (
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="px-6 py-2.5 text-white rounded-lg font-medium shadow-sm hover:opacity-90 transition disabled:opacity-50"
                    style={{ backgroundColor: accentColor }}
                    data-testid="button-apply"
                  >
                    {applying ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Wird angewendet…
                      </span>
                    ) : (
                      "Assessment erstellen"
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
              {[
                { key: "overview", label: "Übersicht" },
                { key: "competencies", label: "Kompetenzen" },
                { key: "exercises", label: "Übungen" },
                { key: "scale", label: "Skala" },
                { key: "weightings", label: "Gewichtungen" },
                { key: "risks", label: "Risiken" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setProposalTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    proposalTab === tab.key
                      ? "border-current text-current"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  style={proposalTab === tab.key ? { color: accentColor } : {}}
                  data-testid={`tab-${tab.key}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {proposalTab === "overview" && (
              <div className="space-y-6">
                <ProposalSection title="Assessment" aiGenerated={activeAnalysis?.mode !== "classic"}>
                  <EditableField
                    label="Name"
                    value={editedProposal.assessmentName}
                    onChange={(v) => setEditedProposal({ ...editedProposal, assessmentName: v })}
                  />
                  <EditableField
                    label="Beschreibung"
                    value={editedProposal.assessmentDescription}
                    onChange={(v) => setEditedProposal({ ...editedProposal, assessmentDescription: v })}
                    multiline
                  />
                </ProposalSection>

                <ProposalSection title="Zielrolle" aiGenerated={activeAnalysis?.mode !== "classic"}>
                  <EditableField
                    label="Position"
                    value={editedProposal.targetRole.title}
                    onChange={(v) =>
                      setEditedProposal({
                        ...editedProposal,
                        targetRole: { ...editedProposal.targetRole, title: v },
                      })
                    }
                  />
                  <EditableField
                    label="Ebene"
                    value={editedProposal.targetRole.level}
                    onChange={(v) =>
                      setEditedProposal({
                        ...editedProposal,
                        targetRole: { ...editedProposal.targetRole, level: v },
                      })
                    }
                  />
                  <EditableField
                    label="Kontext"
                    value={editedProposal.targetRole.context}
                    onChange={(v) =>
                      setEditedProposal({
                        ...editedProposal,
                        targetRole: { ...editedProposal.targetRole, context: v },
                      })
                    }
                    multiline
                  />
                </ProposalSection>

                <ProposalSection title="Erfolgskriterien" aiGenerated={activeAnalysis?.mode !== "classic"}>
                  <EditableList
                    items={editedProposal.successCriteria}
                    onChange={(items) => setEditedProposal({ ...editedProposal, successCriteria: items })}
                    placeholder="Erfolgskriterium"
                  />
                </ProposalSection>
              </div>
            )}

            {proposalTab === "competencies" && (
              <ProposalSection title="Kompetenzmodell" aiGenerated={activeAnalysis?.mode !== "classic"}>
                {(editedProposal.competencies || []).map((domain, di) => (
                  <div key={di} className="mb-6 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Domäne</span>
                      <input
                        value={domain.name}
                        onChange={(e) => {
                          const updated = [...editedProposal.competencies];
                          updated[di] = { ...updated[di], name: e.target.value };
                          setEditedProposal({ ...editedProposal, competencies: updated });
                        }}
                        className="flex-1 font-semibold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-gray-400 focus:outline-none px-1 py-0.5"
                      />
                      <button
                        onClick={() => {
                          const updated = editedProposal.competencies.filter((_, i) => i !== di);
                          setEditedProposal({ ...editedProposal, competencies: updated });
                        }}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{domain.description}</p>

                    {(domain.children || []).map((child, ci) => (
                      <div key={ci} className="ml-4 mb-3 pl-3 border-l-2 border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Kompetenz</span>
                          <input
                            value={child.name}
                            onChange={(e) => {
                              const updated = [...editedProposal.competencies];
                              const children = [...updated[di].children];
                              children[ci] = { ...children[ci], name: e.target.value };
                              updated[di] = { ...updated[di], children };
                              setEditedProposal({ ...editedProposal, competencies: updated });
                            }}
                            className="flex-1 text-sm font-medium border-b border-transparent hover:border-gray-300 focus:border-gray-400 focus:outline-none px-1 py-0.5"
                          />
                          <button
                            onClick={() => {
                              const updated = [...editedProposal.competencies];
                              updated[di] = {
                                ...updated[di],
                                children: updated[di].children.filter((_, i) => i !== ci),
                              };
                              setEditedProposal({ ...editedProposal, competencies: updated });
                            }}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-1">{child.description}</p>
                        {child.anchors && child.anchors.length > 0 && (
                          <div className="mt-1 ml-1 flex flex-wrap gap-1">
                            {child.anchors.map((a, ai) => (
                              <span key={ai} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const updated = [...editedProposal.competencies];
                        updated[di] = {
                          ...updated[di],
                          children: [
                            ...updated[di].children,
                            { name: "Neue Kompetenz", nodeType: "competency", description: "", anchors: [] },
                          ],
                        };
                        setEditedProposal({ ...editedProposal, competencies: updated });
                      }}
                      className="ml-4 text-xs text-blue-600 hover:underline mt-1"
                    >
                      + Kompetenz hinzufügen
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setEditedProposal({
                      ...editedProposal,
                      competencies: [
                        ...editedProposal.competencies,
                        {
                          name: "Neue Domäne",
                          nodeType: "domain",
                          description: "",
                          children: [],
                        },
                      ],
                    });
                  }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: accentColor }}
                >
                  + Domäne hinzufügen
                </button>
              </ProposalSection>
            )}

            {proposalTab === "exercises" && (
              <ProposalSection title="Übungen" aiGenerated={activeAnalysis?.mode !== "classic"}>
                {(editedProposal.exercises || []).map((ex, ei) => (
                  <div key={ei} className="mb-4 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          value={ex.name}
                          onChange={(e) => {
                            const updated = [...editedProposal.exercises];
                            updated[ei] = { ...updated[ei], name: e.target.value };
                            setEditedProposal({ ...editedProposal, exercises: updated });
                          }}
                          className="font-semibold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-gray-400 focus:outline-none px-1 py-0.5 flex-1"
                        />
                        <select
                          value={ex.type}
                          onChange={(e) => {
                            const updated = [...editedProposal.exercises];
                            updated[ei] = { ...updated[ei], type: e.target.value };
                            setEditedProposal({ ...editedProposal, exercises: updated });
                          }}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          {Object.entries(EXERCISE_TYPES).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          setEditedProposal({
                            ...editedProposal,
                            exercises: editedProposal.exercises.filter((_, i) => i !== ei),
                          });
                        }}
                        className="text-red-400 hover:text-red-600 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="text-xs text-gray-500">Dauer (Min.)</label>
                        <input
                          type="number"
                          value={ex.duration || ""}
                          onChange={(e) => {
                            const updated = [...editedProposal.exercises];
                            updated[ei] = { ...updated[ei], duration: parseInt(e.target.value) || 0 };
                            setEditedProposal({ ...editedProposal, exercises: updated });
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Schwierigkeitsstufe</label>
                        <select
                          value={ex.difficultyLevel || "standard"}
                          onChange={(e) => {
                            const updated = [...editedProposal.exercises];
                            updated[ei] = { ...updated[ei], difficultyLevel: e.target.value };
                            setEditedProposal({ ...editedProposal, exercises: updated });
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="standard">Standard</option>
                          <option value="erhöht">Erhöht</option>
                          <option value="hoch">Hoch</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs text-gray-500">Anweisungen</label>
                      <textarea
                        value={ex.instructions || ""}
                        onChange={(e) => {
                          const updated = [...editedProposal.exercises];
                          updated[ei] = { ...updated[ei], instructions: e.target.value };
                          setEditedProposal({ ...editedProposal, exercises: updated });
                        }}
                        rows={2}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 resize-y"
                      />
                    </div>
                    {ex.competencyMappings && ex.competencyMappings.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-xs text-gray-500">Zugeordnet:</span>
                        {ex.competencyMappings.map((c, ci) => (
                          <span key={ci} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => {
                    setEditedProposal({
                      ...editedProposal,
                      exercises: [
                        ...editedProposal.exercises,
                        {
                          name: "Neue Übung",
                          type: "other",
                          duration: 30,
                          instructions: "",
                          difficultyLevel: "standard",
                          competencyMappings: [],
                        },
                      ],
                    });
                  }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: accentColor }}
                >
                  + Übung hinzufügen
                </button>
              </ProposalSection>
            )}

            {proposalTab === "scale" && (
              <ProposalSection title="Bewertungsskala" aiGenerated={activeAnalysis?.mode !== "classic"}>
                <EditableField
                  label="Name"
                  value={editedProposal.scale?.name || ""}
                  onChange={(v) =>
                    setEditedProposal({
                      ...editedProposal,
                      scale: { ...editedProposal.scale, name: v },
                    })
                  }
                />
                <div className="mt-4 space-y-2">
                  {(editedProposal.scale?.points || []).map((p, pi) => (
                    <div key={pi} className="flex items-center gap-3 text-sm">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full font-bold text-white" style={{ backgroundColor: accentColor }}>
                        {p.value}
                      </span>
                      <input
                        value={p.label}
                        onChange={(e) => {
                          const points = [...(editedProposal.scale?.points || [])];
                          points[pi] = { ...points[pi], label: e.target.value };
                          setEditedProposal({
                            ...editedProposal,
                            scale: { ...editedProposal.scale, points },
                          });
                        }}
                        className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-gray-400 focus:outline-none px-1 py-0.5 font-medium"
                      />
                      <input
                        value={p.description}
                        onChange={(e) => {
                          const points = [...(editedProposal.scale?.points || [])];
                          points[pi] = { ...points[pi], description: e.target.value };
                          setEditedProposal({
                            ...editedProposal,
                            scale: { ...editedProposal.scale, points },
                          });
                        }}
                        className="flex-1 text-gray-500 border-b border-transparent hover:border-gray-300 focus:border-gray-400 focus:outline-none px-1 py-0.5"
                        placeholder="Beschreibung"
                      />
                    </div>
                  ))}
                </div>
              </ProposalSection>
            )}

            {proposalTab === "weightings" && (
              <ProposalSection title="Gewichtungsvorschlag" aiGenerated={activeAnalysis?.mode !== "classic"}>
                {(editedProposal.weightings || []).map((w, wi) => (
                  <div key={wi} className="flex items-center gap-3 mb-2 text-sm">
                    <span className="flex-1 font-medium">{w.competencyName}</span>
                    <input
                      type="number"
                      step="0.05"
                      value={w.weight}
                      onChange={(e) => {
                        const updated = [...editedProposal.weightings];
                        updated[wi] = { ...updated[wi], weight: parseFloat(e.target.value) || 0 };
                        setEditedProposal({ ...editedProposal, weightings: updated });
                      }}
                      className="w-24 border border-gray-300 rounded px-2 py-1"
                    />
                    <button
                      onClick={() => {
                        setEditedProposal({
                          ...editedProposal,
                          weightings: editedProposal.weightings.filter((_, i) => i !== wi),
                        });
                      }}
                      className="text-red-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {editedProposal.weightings.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Keine Gewichtungen definiert</p>
                )}
              </ProposalSection>
            )}

            {proposalTab === "risks" && (
              <ProposalSection title="Risiken & Red Flags" aiGenerated={activeAnalysis?.mode !== "classic"}>
                <EditableList
                  items={editedProposal.risks || []}
                  onChange={(items) => setEditedProposal({ ...editedProposal, risks: items })}
                  placeholder="Risiko / Red Flag"
                />
              </ProposalSection>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 px-6 py-4 text-center text-xs text-gray-400">
        © Christoph Aldering · Private initiative / concept
      </footer>
    </div>
  );
}

function ProposalSection({
  title,
  aiGenerated,
  children,
}: {
  title: string;
  aiGenerated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {aiGenerated && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            KI-generiert
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:outline-none resize-y"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:outline-none"
        />
      )}
    </div>
  );
}

function EditableList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = e.target.value;
              onChange(updated);
            }}
            placeholder={placeholder}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:outline-none"
          />
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="text-red-400 hover:text-red-600 text-sm"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="text-sm text-blue-600 hover:underline"
      >
        + Hinzufügen
      </button>
    </div>
  );
}
